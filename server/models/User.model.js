import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema({
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  watchedAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 },
});

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  avatar: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  watchHistory: [watchHistorySchema],
  watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  likedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  subscriptions: [{ type: String }],
  role: { type: String, enum: ['user', 'admin', 'creator'], default: 'user' },
  otp: { type: String },
  otpExpiry: { type: Date },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
