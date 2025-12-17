import mongoose from 'mongoose';

const { Schema } = mongoose;

const topMatchSchema = new Schema(
  {
    doc_id: String,
    title: String,
    url: String,
    score: Number,
    num_chunks: Number,
  },
  { _id: false }
);

const reportSchema = new Schema(
  {
    history: { type: Schema.Types.ObjectId, ref: 'History', required: true, unique: true, index: true },
    isPlagiarism: { type: Boolean, required: true },
    confidence: { type: Number, required: true },
    threshold: { type: Number },
    bestMatch: { type: Schema.Types.Mixed },
    topMatches: [topMatchSchema],
    sentenceAnalysis: { type: [Schema.Types.Mixed], default: [] },
    stats: { type: Schema.Types.Mixed },
    fullResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);
export default Report;
