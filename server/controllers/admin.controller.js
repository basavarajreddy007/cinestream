import User from '../models/User.model.js';
import Video from '../models/Video.model.js';
import ScriptAnalysis from '../models/ScriptAnalysis.model.js';

export const getAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalVideos, totalViews, recentUsers, topVideos, scriptSubmissions] = await Promise.all([
      User.countDocuments(),
      Video.countDocuments(),
      Video.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      User.find().sort('-createdAt').limit(5).select('name email avatar createdAt role'),
      Video.find().sort('-views').limit(5).select('title thumbnail views likes rating'),
      ScriptAnalysis.countDocuments(),
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalVideos,
        totalViews: totalViews[0]?.total || 0,
        scriptSubmissions,
        recentUsers,
        topVideos,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find().sort('-createdAt').skip(skip).limit(parseInt(limit)).select('-otp -otpExpiry'),
      User.countDocuments(),
    ]);
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-otp -otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};

export const getScriptSubmissions = async (req, res) => {
  try {
    const scripts = await ScriptAnalysis.find().sort('-createdAt').limit(50).populate('user', 'name email');
    res.json({ success: true, scripts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch scripts' });
  }
};
