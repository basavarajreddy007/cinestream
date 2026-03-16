import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  genre: [{ type: String }],
  type: { type: String, enum: ['movie', 'show', 'episode'], default: 'movie' },
  thumbnail: { type: String, required: true },
  videoUrl: { type: String, required: true },
  cloudinaryId: { type: String },
  duration: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rating: { type: Number, default: 0, min: 0, max: 10 },
  ratingCount: { type: Number, default: 0 },
  cast: [{ type: String }],
  director: { type: String },
  releaseYear: { type: Number },
  language: { type: String, default: 'English' },
  subtitles: [{ language: String, url: String }],
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comments: [commentSchema],
  tags: [{ type: String }],
}, { timestamps: true });

videoSchema.index({ title: 'text', description: 'text', genre: 'text', tags: 'text' });

export default mongoose.model('Video', videoSchema);
