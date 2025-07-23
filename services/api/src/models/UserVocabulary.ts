import mongoose, { Schema, Document } from 'mongoose';

// 来源剧集信息接口
export interface ISourceShow {
  id: number;
  name: string;
  status: string; // watching/completed/plan_to_watch
}

// 用户单词记录接口
export interface IUserVocabulary extends Document {
  userId: string;
  wordId: mongoose.Types.ObjectId; // 关联到 cloud_words._id
  word: string; // 冗余字段，便于查询
  language: string; // 新增
  
  // 用户个性化数据
  mastery: number; // 0-100 掌握度
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewDate: Date;
  nextReviewDate: Date;
  interval: number; // 复习间隔（小时）
  easeFactor: number; // 难度因子
  consecutiveCorrect: number; // 连续正确次数
  consecutiveIncorrect: number; // 连续错误次数
  totalStudyTime: number; // 总学习时间（秒）
  averageResponseTime: number; // 平均响应时间（秒）
  confidence: number; // 用户自信度 1-5
  notes?: string; // 用户笔记
  tags: string[]; // 用户标签
  
  // 来源信息
  sourceShow?: ISourceShow; // 来源剧集信息
  collectedAt: Date; // 收藏时间
  
  createdAt: Date;
  updatedAt: Date;
}

const UserVocabularySchema = new Schema<IUserVocabulary>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  wordId: {
    type: Schema.Types.ObjectId,
    ref: 'CloudWord',
    required: true
  },
  word: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  language: {
    type: String,
    required: true,
    enum: ['en', 'ko', 'ja'],
    default: 'en',
    index: true,
  },
  
  // 用户个性化数据
  mastery: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  correctCount: {
    type: Number,
    default: 0
  },
  incorrectCount: {
    type: Number,
    default: 0
  },
  lastReviewDate: {
    type: Date,
    default: Date.now
  },
  nextReviewDate: {
    type: Date,
    default: Date.now
  },
  interval: {
    type: Number,
    default: 24 // 默认24小时
  },
  easeFactor: {
    type: Number,
    default: 2.5,
    min: 1.3,
    max: 2.5
  },
  consecutiveCorrect: {
    type: Number,
    default: 0
  },
  consecutiveIncorrect: {
    type: Number,
    default: 0
  },
  totalStudyTime: {
    type: Number,
    default: 0
  },
  averageResponseTime: {
    type: Number,
    default: 0
  },
  confidence: {
    type: Number,
    default: 3,
    min: 1,
    max: 5
  },
  notes: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // 来源信息
  sourceShow: {
    id: Number,
    name: String,
    status: String
  },
  collectedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 创建复合索引
UserVocabularySchema.index({ userId: 1, wordId: 1 }, { unique: true });
UserVocabularySchema.index({ userId: 1, word: 1 });
UserVocabularySchema.index({ userId: 1, nextReviewDate: 1 });
UserVocabularySchema.index({ userId: 1, mastery: -1 });
UserVocabularySchema.index({ userId: 1, language: 1 }); // 新增语言索引

// 实例方法：更新学习进度
UserVocabularySchema.methods.updateLearningProgress = function(
  isCorrect: boolean,
  responseTime: number,
  confidence?: number
) {
  this.reviewCount++;
  this.totalStudyTime += responseTime;
  this.averageResponseTime = (this.averageResponseTime * (this.reviewCount - 1) + responseTime) / this.reviewCount;
  
  if (confidence !== undefined) {
    this.confidence = confidence;
  }
  
  if (isCorrect) {
    this.correctCount++;
    this.consecutiveCorrect++;
    this.consecutiveIncorrect = 0;
    
    // 更新掌握度
    this.mastery = Math.min(100, this.mastery + 10);
    
    // 更新间隔（简化版间隔重复算法）
    if (this.consecutiveCorrect >= 3) {
      this.interval = Math.min(this.interval * 1.5, 168); // 最大7天
    }
  } else {
    this.incorrectCount++;
    this.consecutiveIncorrect++;
    this.consecutiveCorrect = 0;
    
    // 更新掌握度
    this.mastery = Math.max(0, this.mastery - 5);
    
    // 重置间隔
    this.interval = Math.max(1, this.interval * 0.5);
  }
  
  this.lastReviewDate = new Date();
  this.nextReviewDate = new Date(Date.now() + this.interval * 60 * 60 * 1000);
};

export default mongoose.model<IUserVocabulary>('UserVocabulary', UserVocabularySchema); 