import User from '../models/User.model.js';
import { sendOTPEmail } from '../services/email.service.js';
import { generateToken } from '../utils/generateToken.js';
import crypto from 'crypto';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await User.findOneAndUpdate(
      { email },
      { otp, otpExpiry },
      { upsert: true, new: true }
    );

    await sendOTPEmail(email, otp);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('sendOTP error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, name } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.otpExpiry < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    if (name && !user.name) user.name = name;
    await user.save();

    const token = generateToken(user._id, res);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
    });
  } catch (err) {
    console.error('verifyOTP error:', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-otp -otpExpiry')
      .populate('watchlist', 'title thumbnail duration')
      .populate('watchHistory.video', 'title thumbnail duration');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('jwt');
  res.json({ success: true, message: 'Logged out successfully' });
};
