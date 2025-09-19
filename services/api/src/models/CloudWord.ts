import mongoose, { Document, Schema } from 'mongoose';

export interface ICloudWord extends Document {
  word: string;
  language: string; // 新增：语言代码 (en, ko, ja)
  uiLanguage: string; // 新增：界面语言（如 'en', 'zh-CN'）
  phonetic: string;
  pinyin?: string; // 新增：标准拼音字段
  candidates?: string[]; // 新增：候选词数组
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
  translation?: string; // 新增：翻译结果字段
  kana?: string; // 新增：假名字段
  romaji?: string; // 新增：罗马音字段
  createdAt: Date;
  updatedAt: Date;
}

const CloudWordSchema = new Schema<ICloudWord>({
  word: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['en', 'ko', 'ja', 'zh', 'fr', 'es'], // 支持中、英、日、韩、法、西班牙语查词
    default: 'en'
  },
  uiLanguage: {
    type: String,
    required: true,
    default: 'zh-CN'
  },
  phonetic: {
    type: String,
    default: '',
  },
  pinyin: {
    type: String,
    default: '',
  },
  candidates: [{
    type: String,
    default: [],
  }],
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
      english: { type: String, default: '' },
      chinese: { type: String, default: '' },
      japanese: { type: String, default: '' },
      korean: { type: String, default: '' },
      french: { type: String, default: '' },
      spanish: { type: String, default: '' },
      romaji: { type: String, default: '' },
      hangul: { type: String, default: '' },
      pinyin: { type: String, default: '' },
      // 允许未来扩展更多语言
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
  translation: {
    type: String,
    default: ''
  },
  kana: {
    type: String,
    default: ''
  },
  romaji: {
    type: String,
    default: ''
  },
}, {
  timestamps: true,
});

// 复合唯一索引：word + language + uiLanguage 确保唯一性
CloudWordSchema.index({ word: 1, language: 1, uiLanguage: 1 }, { unique: true });

// 索引：按语言和搜索次数排序
CloudWordSchema.index({ language: 1, searchCount: -1, lastSearched: -1 });

export const CloudWord = mongoose.model<ICloudWord>('CloudWord', CloudWordSchema); 