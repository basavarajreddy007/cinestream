import User from '../models/User.model.js';
import Video from '../models/Video.model.js';

export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (req.file) updates.avatar = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-otp -otpExpiry');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

export const toggleWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const videoId = req.params.id;
    const isInList = user.watchlist.includes(videoId);

    if (isInList) {
      user.watchlist.pull(videoId);
    } else {
      user.watchlist.push(videoId);
    }

    await user.save();
    res.json({ success: true, inWatchlist: !isInList });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update watchlist' });
  }
};

export const getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('watchlist', 'title thumbnail duration genre rating views');
    res.json({ success: true, watchlist: user.watchlist });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch watchlist' });
  }
};

export const getWatchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('watchHistory.video', 'title thumbnail duration genre');
    res.json({ success: true, watchHistory: user.watchHistory });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch watch history' });
  }
};

export const getCreators = async (req, res) => {
  try {
    const creators = await User.find({ role: 'creator' })
      .select('name email avatar createdAt')
      .sort('-createdAt')
      .lean();

    const creatorsWithStats = await Promise.all(
      creators.map(async (creator) => {
        const videoCount = await Video.countDocuments({ uploadedBy: creator._id });
        const viewsAgg = await Video.aggregate([
          { $match: { uploadedBy: creator._id } },
          { $group: { _id: null, totalViews: { $sum: '$views' }, avgRating: { $avg: '$rating' } } },
        ]);
        const stats = viewsAgg[0] || { totalViews: 0, avgRating: 0 };
        return { ...creator, videoCount, totalViews: stats.totalViews, avgRating: Math.round((stats.avgRating || 0) * 10) / 10 };
      })
    );

    res.json({ success: true, creators: creatorsWithStats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch creators' });
  }
};

export const getCreatorById = async (req, res) => {
  try {
    const creator = await User.findOne({ _id: req.params.id, role: 'creator' })
      .select('name email avatar createdAt')
      .lean();

    if (!creator) return res.status(404).json({ success: false, message: 'Creator not found' });

    const videos = await Video.find({ uploadedBy: creator._id })
      .sort('-createdAt')
      .select('title thumbnail duration genre rating views type createdAt')
      .lean();

    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
    const avgRating = videos.length > 0
      ? Math.round((videos.reduce((sum, v) => sum + (v.rating || 0), 0) / videos.length) * 10) / 10
      : 0;

    res.json({ success: true, creator: { ...creator, videos, videoCount: videos.length, totalViews, avgRating } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch creator' });
  }
};
