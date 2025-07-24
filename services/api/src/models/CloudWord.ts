import mongoose, { Document, Schema } from 'mongoose';

export interface ICloudWord extends Document {
  word: string;
  language: string; // 新增：语言代码 (en, ko, ja)
  uiLanguage: string; // 新增：界面语言（如 'en', 'zh-CN'）
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
  slangMeaning: string | null;
  phraseExplanation: string | null;
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
    enum: ['en', 'ko', 'ja', 'zh'], // 支持中文查词
    default: 'en',
    index: true,
  },
  uiLanguage: {
    type: String,
    required: true,
    default: 'zh-CN',
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
  slangMeaning: {
    type: String,
    default: null,
  },
  phraseExplanation: {
    type: String,
    default: null,
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

// 复合唯一索引：word + language + uiLanguage 确保唯一性
CloudWordSchema.index({ word: 1, language: 1, uiLanguage: 1 }, { unique: true });

// 索引：按语言和搜索次数排序
CloudWordSchema.index({ language: 1, searchCount: -1, lastSearched: -1 });

export const CloudWord = mongoose.model<ICloudWord>('CloudWord', CloudWordSchema); 