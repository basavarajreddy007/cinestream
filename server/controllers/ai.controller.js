import { analyzeScript, writeScript, getAIRecommendations } from '../services/ai.service.js';
import ScriptAnalysis from '../models/ScriptAnalysis.model.js';
import User from '../models/User.model.js';
import Video from '../models/Video.model.js';

const recommendCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

const VIDEO_FIELDS = '_id title thumbnail rating genre description type views duration';

export const scriptAnalyze = async (req, res) => {
  try {
    const { scriptText } = req.body;
    if (!scriptText || scriptText.length < 100) {
      return res.status(400).json({ success: false, message: 'Script must be at least 100 characters' });
    }

    const analysis = await analyzeScript(scriptText);

    const record = await ScriptAnalysis.create({
      user: req.user?._id,
      scriptText: scriptText.substring(0, 500),
      analysis,
      type: 'analyze',
    });

    res.json({ success: true, analysis, id: record._id });
  } catch (err) {
    console.error('scriptAnalyze error:', err);
    res.status(500).json({ success: false, message: 'Analysis failed. Check your OpenAI API key.' });
  }
};

export const scriptWriter = async (req, res) => {
  try {
    const { genre, theme, characters, setting, storyLength, tone } = req.body;
    if (!genre || !theme) {
      return res.status(400).json({ success: false, message: 'Genre and theme are required' });
    }

    const generatedScript = await writeScript({ genre, theme, characters, setting, storyLength, tone });

    const record = await ScriptAnalysis.create({
      user: req.user?._id,
      scriptText: `Genre: ${genre}, Theme: ${theme}`,
      generatedScript,
      type: 'write',
    });

    res.json({ success: true, script: generatedScript, id: record._id });
  } catch (err) {
    console.error('scriptWriter error:', err);
    res.status(500).json({ success: false, message: 'Script generation failed. Check your OpenAI API key.' });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || 'guest';

    const cached = recommendCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ success: true, videos: cached.data, cached: true });
    }

    let genres = [];
    let watchedTitles = [];
    let likedTitles = [];

    if (req.user) {
      const user = await User.findById(req.user._id)
        .populate('watchHistory.video', 'genre title')
        .populate('likedVideos', 'genre title')
        .lean();

      if (user.watchHistory?.length > 0) {
        genres.push(...user.watchHistory.flatMap(h => h.video?.genre || []));
        watchedTitles = user.watchHistory
          .filter(h => h.video?.title)
          .map(h => h.video.title);
      }

      if (user.likedVideos?.length > 0) {
        genres.push(...user.likedVideos.flatMap(v => v.genre || []));
        likedTitles = user.likedVideos
          .filter(v => v.title)
          .map(v => v.title);
      }

      genres = [...new Set(genres)];
    }

    if (genres.length === 0) {
      genres = ['Action', 'Drama', 'Thriller', 'Sci-Fi', 'Comedy'];
    }

    const aiTitles = await getAIRecommendations({ genres, watchedTitles, likedTitles });

    let matched = [];
    for (const title of aiTitles) {
      const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const found = await Video.findOne({ title: new RegExp(escaped, 'i') })
        .select(VIDEO_FIELDS)
        .lean();
      if (found) matched.push(found);
    }

    if (matched.length < 8) {
      const matchedIds = matched.map(v => v._id);
      const genreFill = await Video.find({
        _id: { $nin: matchedIds },
        genre: { $in: genres },
      })
        .sort({ rating: -1, views: -1 })
        .limit(8 - matched.length)
        .select(VIDEO_FIELDS)
        .lean();
      matched = [...matched, ...genreFill];
    }

    if (matched.length < 6) {
      const existingIds = matched.map(v => v._id);
      const trendingFill = await Video.find({ _id: { $nin: existingIds } })
        .sort({ views: -1 })
        .limit(8 - matched.length)
        .select(VIDEO_FIELDS)
        .lean();
      matched = [...matched, ...trendingFill];
    }

    const result = matched.slice(0, 10);
    recommendCache.set(userId, { data: result, expiresAt: Date.now() + CACHE_TTL });

    res.json({ success: true, videos: result });
  } catch (err) {
    console.error('getRecommendations error:', err);

    try {
      const fallback = await Video.find({})
        .sort({ views: -1 })
        .limit(8)
        .select(VIDEO_FIELDS)
        .lean();
      res.json({ success: true, videos: fallback, fallback: true });
    } catch {
      res.status(500).json({ success: false, message: 'Recommendations failed' });
    }
  }
};
