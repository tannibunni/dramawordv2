import mongoose, { Schema, Document } from 'mongoose';

export interface ICloudWord extends Document {
  word: string;
  phonetic?: string;
  definitions: Array<{
    partOfSpeech: string;
    definition: string;
    examples?: string[]; // 改为字符串数组，兼容 OpenAI 返回格式
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
      type: String, // 改为字符串类型，支持 OpenAI 返回的字符串数组
      default: []
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