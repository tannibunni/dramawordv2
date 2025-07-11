import mongoose, { Schema, Document } from 'mongoose';

// 单词定义接口
export interface IWordDefinition {
  partOfSpeech: string;
  definition: string;
  examples: Array<{
    english: string;
    chinese: string;
  }>;
}

// 单词文档接口
export interface IWord extends Document {
  word: string;
  phonetic: string;
  definitions: IWordDefinition[];
  searchCount: number;
  lastSearched: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 单词模式
const WordSchema = new Schema<IWord>({
  word: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phonetic: {
    type: String,
    required: true
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
// 注意：word 字段的 unique: true 已经创建了唯一索引，不需要重复添加
WordSchema.index({ searchCount: -1 });
WordSchema.index({ lastSearched: -1 });

export const Word = mongoose.model<IWord>('Word', WordSchema); 