import mongoose from 'mongoose';

const scriptAnalysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scriptText: { type: String, required: true },
  analysis: {
    genre: [String],
    storyQualityScore: Number,
    dialogueQualityScore: Number,
    characterDepthScore: Number,
    plotConsistency: Number,
    estimatedAudienceInterest: Number,
    overallScore: Number,
    improvements: [String],
    strengths: [String],
    summary: String,
  },
  type: { type: String, enum: ['analyze', 'write'], default: 'analyze' },
  generatedScript: { type: Object },
}, { timestamps: true });

export default mongoose.model('ScriptAnalysis', scriptAnalysisSchema);
