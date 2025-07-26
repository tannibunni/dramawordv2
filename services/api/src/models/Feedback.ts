import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  rating: number;
  feedback: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    required: false,
    default: '',
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema); 