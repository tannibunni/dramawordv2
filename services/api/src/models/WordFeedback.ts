import mongoose, { Schema, Document } from 'mongoose';

export interface IWordFeedback extends Document {
  userId: string;
  word: string;
  feedback: 'positive' | 'negative';
  createdAt: Date;
  updatedAt: Date;
}

const WordFeedbackSchema = new Schema<IWordFeedback>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  word: {
    type: String,
    required: true,
    index: true,
  },
  feedback: {
    type: String,
    enum: ['positive', 'negative'],
    required: true,
  },
}, {
  timestamps: true,
});

// 复合索引，确保每个用户对每个单词只能有一个反馈
WordFeedbackSchema.index({ userId: 1, word: 1 }, { unique: true });

export const WordFeedback = mongoose.model<IWordFeedback>('WordFeedback', WordFeedbackSchema); 