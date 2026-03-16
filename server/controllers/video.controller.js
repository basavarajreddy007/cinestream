import Video from '../models/Video.model.js';
import User from '../models/User.model.js';

export const uploadVideo = async (req, res) => {
  try {
    const { title, description, genre, type, duration, cast, director, releaseYear, language, isFeatured, isTrending, tags } = req.body;
    const files = req.files;

    if (!files?.video?.[0] || !files?.thumbnail?.[0]) {
      return res.status(400).json({ success: false, message: 'Video and thumbnail are required' });
    }

    const video = await Video.create({
      title,
      description,
      genre: genre ? JSON.parse(genre) : [],
      type: type || 'movie',
      thumbnail: files.thumbnail[0].path,
      videoUrl: files.video[0].path,
      cloudinaryId: files.video[0].filename,
      duration: parseInt(duration) || 0,
      cast: cast ? JSON.parse(cast) : [],
      director,
      releaseYear: parseInt(releaseYear),
      language: language || 'English',
      isFeatured: isFeatured === 'true',
      isTrending: isTrending === 'true',
      tags: tags ? JSON.parse(tags) : [],
      uploadedBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Video uploaded successfully', video });
  } catch (err) {
    console.error('uploadVideo error:', err);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

export const getVideos = async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, type, search, sort = '-createdAt', featured, trending } = req.query;
    const query = {};

    if (genre) query.genre = { $in: [genre] };
    if (type) query.type = type;
    if (featured === 'true') query.isFeatured = true;
    if (trending === 'true') query.isTrending = true;
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [videos, total] = await Promise.all([
      Video.find(query).sort(sort).skip(skip).limit(parseInt(limit)).populate('uploadedBy', 'name avatar'),
      Video.countDocuments(query),
    ]);

    res.json({ success: true, videos, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploadedBy', 'name avatar')
      .populate('comments.user', 'name avatar');

    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch video' });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    await video.deleteOne();
    res.json({ success: true, message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

export const likeVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    const userId = req.user._id;
    const isLiked = video.likes.includes(userId);

    if (isLiked) {
      video.likes.pull(userId);
      await User.findByIdAndUpdate(userId, { $pull: { likedVideos: video._id } });
    } else {
      video.likes.push(userId);
      await User.findByIdAndUpdate(userId, { $addToSet: { likedVideos: video._id } });
    }

    await video.save();
    res.json({ success: true, liked: !isLiked, likesCount: video.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to like video' });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    video.comments.push({ user: req.user._id, text });
    await video.save();
    await video.populate('comments.user', 'name avatar');

    const newComment = video.comments[video.comments.length - 1];
    res.status(201).json({ success: true, comment: newComment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

export const rateVideo = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 10' });
    }

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    const newRating = ((video.rating * video.ratingCount) + rating) / (video.ratingCount + 1);
    video.rating = Math.round(newRating * 10) / 10;
    video.ratingCount += 1;
    await video.save();

    res.json({ success: true, rating: video.rating, ratingCount: video.ratingCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to rate video' });
  }
};

export const saveProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const videoId = req.params.id;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const historyEntry = user.watchHistory.find(h => h.video?.toString() === videoId);

    if (historyEntry) {
      historyEntry.progress = progress;
      historyEntry.watchedAt = new Date();
    } else {
      user.watchHistory.unshift({ video: videoId, progress, watchedAt: new Date() });
      if (user.watchHistory.length > 50) user.watchHistory = user.watchHistory.slice(0, 50);
    }

    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save progress' });
  }
};
