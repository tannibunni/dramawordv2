import mongoose, { Document, Schema } from 'mongoose';

export interface IShowWordPreview extends Document {
  showId: string;
  showName: string;
  originalTitle?: string;
  language: string;
  genre: string[];
  year?: number;
  
  // 单词统计
  wordStats: {
    totalUniqueWords: number;
    totalAssociations: number;
    userCount: number;
    lastUpdated: Date;
    wordCategories: {
      nouns: number;
      verbs: number;
      adjectives: number;
      adverbs: number;
    };
    difficultyLevel: string;
    estimatedLearningTime: number;
  };
  
  // 热门单词
  popularWords: Array<{
    word: string;
    frequency: number;
    definitions: string[];
    difficulty: string;
  }>;
  
  // 剧集信息
  showInfo: {
    posterUrl?: string;
    description?: string;
    totalEpisodes?: number;
    averageEpisodeLength?: number;
    rating?: number;
  };
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastWordAdded: Date;
}

const ShowWordPreviewSchema = new Schema<IShowWordPreview>({
  showId: { type: String, required: true, unique: true },
  showName: { type: String, required: true },
  originalTitle: { type: String },
  language: { type: String, required: true },
  genre: [{ type: String }],
  year: { type: Number },
  
  wordStats: {
    totalUniqueWords: { type: Number, default: 0 },
    totalAssociations: { type: Number, default: 0 },
    userCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    wordCategories: {
      nouns: { type: Number, default: 0 },
      verbs: { type: Number, default: 0 },
      adjectives: { type: Number, default: 0 },
      adverbs: { type: Number, default: 0 }
    },
    difficultyLevel: { type: String, default: 'beginner' },
    estimatedLearningTime: { type: Number, default: 0 }
  },
  
  popularWords: [{
    word: { type: String, required: true },
    frequency: { type: Number, required: true },
    definitions: [{ type: String }],
    difficulty: { type: String, default: 'beginner' }
  }],
  
  showInfo: {
    posterUrl: { type: String },
    description: { type: String },
    totalEpisodes: { type: Number },
    averageEpisodeLength: { type: Number },
    rating: { type: Number }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  lastWordAdded: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 创建索引
ShowWordPreviewSchema.index({ showId: 1 });
ShowWordPreviewSchema.index({ showName: 'text' });
ShowWordPreviewSchema.index({ language: 1 });
ShowWordPreviewSchema.index({ 'wordStats.totalUniqueWords': -1 });
ShowWordPreviewSchema.index({ isActive: 1 });

export const ShowWordPreview = mongoose.model<IShowWordPreview>('ShowWordPreview', ShowWordPreviewSchema);
