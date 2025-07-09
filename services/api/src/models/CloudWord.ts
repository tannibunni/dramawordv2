import mongoose, { Schema, Document } from 'mongoose';

export interface ICloudWord extends Document {
  word: string;
  phonetic?: string;
  definitions: Array<{
    partOfSpeech: string;
    definition: string;
    examples?: Array<{
      english: string;
      chinese: string;
    }>;
  }>;
  audioUrl?: string;
  searchCount: number;
  lastSearched: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CloudWordSchema = new Schema<ICloudWord>({
  word: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phonetic: {
    type: String,
    default: ''
  },
  definitions: [{
    partOfSpeech: {
      type: String,
      required: true
    },
    definition: {
      type: String,
      required: true
    },
    examples: [{
      english: {
        type: String,
        required: true
      },
      chinese: {
        type: String,
        required: true
      }
    }]
  }],
  audioUrl: {
    type: String,
    default: ''
  },
  searchCount: {
    type: Number,
    default: 1
  },
  lastSearched: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 创建索引以提高查询性能
CloudWordSchema.index({ word: 1 });
CloudWordSchema.index({ searchCount: -1 });
CloudWordSchema.index({ lastSearched: -1 });

export default mongoose.model<ICloudWord>('CloudWord', CloudWordSchema); 