import mongoose from 'mongoose';

const upcomingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  genre: [{ type: String }],
  type: { type: String, enum: ['movie', 'show', 'episode'], default: 'movie' },
  thumbnail: { type: String, required: true },
  trailerUrl: { type: String },
  releaseDate: { type: Date, required: true },
  director: { type: String },
  cast: [{ type: String }],
  language: { type: String, default: 'English' },
  interestedCount: { type: Number, default: 0 },
  interestedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Upcoming', upcomingSchema);
