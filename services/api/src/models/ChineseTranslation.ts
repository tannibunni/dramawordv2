import mongoose, { Schema, Document } from 'mongoose';

// 中译英映射接口
export interface IChineseTranslation extends Document {
  chineseWord: string;
  englishCandidates: string[];
  searchCount: number;
  lastSearched: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 中译英映射模式
const ChineseTranslationSchema = new Schema<IChineseTranslation>({
  chineseWord: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  englishCandidates: [{
    type: String,
    required: true,
    trim: true
  }],
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

// 创建索引
ChineseTranslationSchema.index({ chineseWord: 1 });
ChineseTranslationSchema.index({ searchCount: -1 });
ChineseTranslationSchema.index({ lastSearched: -1 });

export const ChineseTranslation = mongoose.model<IChineseTranslation>('ChineseTranslation', ChineseTranslationSchema); 