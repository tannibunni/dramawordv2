import mongoose, { Document, Schema } from 'mongoose';

export interface IShowWordPackage extends Document {
  packageId: string;
  showId: string;
  showName: string;
  userId: mongoose.Types.ObjectId;
  
  // 单词包内容
  words: Array<{
    wordId: mongoose.Types.ObjectId;
    word: string;
    definitions: string[];
    phonetic?: string;
    examples: Array<{
      english: string;
      chinese: string;
      context?: string;
    }>;
    difficulty: string;
    tags: string[];
  }>;
  
  // 包信息
  packageInfo: {
    name: string;
    description: string;
    wordCount: number;
    estimatedStudyTime: number;
    difficulty: string;
    tags: string[];
  };
  
  // 下载和进度
  downloadInfo: {
    downloadedAt: Date;
    lastAccessed: Date;
    studyProgress: number; // 0-1
    completedWords: number;
    totalWords: number;
  };
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const ShowWordPackageSchema = new Schema<IShowWordPackage>({
  packageId: { type: String, required: true, unique: true },
  showId: { type: String, required: true },
  showName: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  words: [{
    wordId: { type: Schema.Types.ObjectId, ref: 'CloudWord', required: true },
    word: { type: String, required: true },
    definitions: [{ type: String, required: true }],
    phonetic: { type: String },
    examples: [{
      english: { type: String, required: true },
      chinese: { type: String, required: true },
      context: { type: String }
    }],
    difficulty: { type: String, default: 'beginner' },
    tags: [{ type: String }]
  }],
  
  packageInfo: {
    name: { type: String, required: true },
    description: { type: String, required: true },
    wordCount: { type: Number, required: true },
    estimatedStudyTime: { type: Number, required: true },
    difficulty: { type: String, required: true },
    tags: [{ type: String }]
  },
  
  downloadInfo: {
    downloadedAt: { type: Date, default: Date.now },
    lastAccessed: { type: Date, default: Date.now },
    studyProgress: { type: Number, default: 0, min: 0, max: 1 },
    completedWords: { type: Number, default: 0 },
    totalWords: { type: Number, required: true }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// 创建索引
ShowWordPackageSchema.index({ packageId: 1 });
ShowWordPackageSchema.index({ showId: 1 });
ShowWordPackageSchema.index({ userId: 1 });
ShowWordPackageSchema.index({ 'packageInfo.difficulty': 1 });
ShowWordPackageSchema.index({ createdAt: -1 });

export const ShowWordPackage = mongoose.model<IShowWordPackage>('ShowWordPackage', ShowWordPackageSchema);
