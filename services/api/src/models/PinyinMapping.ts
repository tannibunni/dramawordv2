import mongoose, { Document, Schema } from 'mongoose';

export interface IPinyinMapping extends Document {
  pinyin: string;           // 拼音，如 "bing", "jiao lian"
  candidates: Array<{
    chinese: string;        // 中文字符
    english: string;        // 英文释义
    frequency: number;      // 使用频率，用于排序
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PinyinMappingSchema = new Schema<IPinyinMapping>({
  pinyin: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  candidates: [{
    chinese: {
      type: String,
      required: true
    },
    english: {
      type: String,
      required: true
    },
    frequency: {
      type: Number,
      default: 1
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时自动设置 updatedAt
PinyinMappingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const PinyinMapping = mongoose.model<IPinyinMapping>('PinyinMapping', PinyinMappingSchema);
