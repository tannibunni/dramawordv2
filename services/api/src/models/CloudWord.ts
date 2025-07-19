import mongoose, { Document, Schema } from 'mongoose';

export interface ICloudWord extends Document {
  word: string;
  language: string; // 新增：语言代码 (en, ko, ja)
  phonetic: string;
  definitions: Array<{
    partOfSpeech: string;
    definition: string;
    examples: Array<{
      english: string;
      chinese: string;
    }>;
  }>;
  audioUrl: string;
  correctedWord: string;
  searchCount: number;
  lastSearched: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CloudWordSchema = new Schema<ICloudWord>({
  word: {
    type: String,
    required: true,
    index: true,
  },
  language: {
    type: String,
    required: true,
    enum: ['en', 'ko', 'ja'],
    default: 'en',
    index: true,
  },
  phonetic: {
    type: String,
    default: '',
  },
  definitions: [{
    partOfSpeech: {
      type: String,
      default: 'n.',
    },
    definition: {
      type: String,
      required: true,
    },
    examples: [{
      english: {
        type: String,
        default: '',
      },
      chinese: {
        type: String,
        default: '',
      },
    }],
  }],
  audioUrl: {
    type: String,
    default: '',
  },
  correctedWord: {
    type: String,
    required: true,
  },
  searchCount: {
    type: Number,
    default: 0,
  },
  lastSearched: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// 复合索引：word + language 确保唯一性
CloudWordSchema.index({ word: 1, language: 1 }, { unique: true });

// 索引：按语言和搜索次数排序
CloudWordSchema.index({ language: 1, searchCount: -1, lastSearched: -1 });

export const CloudWord = mongoose.model<ICloudWord>('CloudWord', CloudWordSchema); 