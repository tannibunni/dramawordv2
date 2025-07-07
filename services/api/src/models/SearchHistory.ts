import mongoose, { Schema, Document } from 'mongoose';

// 搜索历史文档接口
export interface ISearchHistory extends Document {
  word: string;
  definition: string;
  timestamp: Date;
  userId?: string; // 可选，为将来用户系统预留
}

// 搜索历史模式
const SearchHistorySchema = new Schema<ISearchHistory>({
  word: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  definition: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// 创建索引
SearchHistorySchema.index({ word: 1 });
SearchHistorySchema.index({ timestamp: -1 });
SearchHistorySchema.index({ userId: 1, timestamp: -1 });

export const SearchHistory = mongoose.model<ISearchHistory>('SearchHistory', SearchHistorySchema); 