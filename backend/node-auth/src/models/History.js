import mongoose from 'mongoose';

const { Schema } = mongoose;

const historySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    inputType: { type: String, enum: ['text', 'file'], default: 'text' },
    text: { type: String, required: true },
    wordCount: { type: Number, default: 0 },
    title: { type: String, trim: true },
    status: { type: String, enum: ['completed', 'failed'], default: 'completed' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

historySchema.virtual('report', {
  ref: 'Report',
  localField: '_id',
  foreignField: 'history',
  justOne: true,
});

const History = mongoose.model('History', historySchema);
export default History;
