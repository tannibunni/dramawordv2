import mongoose, { Schema, Document } from 'mongoose';

// 学习记录接口
export interface ILearningRecord {
  word: string;
  mastery: number; // 0-100 掌握度
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewDate: Date;
  nextReviewDate: Date;
  interval: number; // 下次复习间隔（小时）
  easeFactor: number; // 难度因子
  consecutiveCorrect: number; // 连续正确次数
  consecutiveIncorrect: number; // 连续错误次数
  totalStudyTime: number; // 总学习时间（秒）
  averageResponseTime: number; // 平均响应时间（秒）
  confidence: number; // 用户自信度 1-5
  notes?: string; // 用户笔记
  tags: string[]; // 用户标签
}

// 学习记录文档接口
export interface IUserLearningRecord extends Document {
  userId: string;
  records: ILearningRecord[];
  totalWords: number;
  totalReviews: number;
  averageMastery: number;
  lastStudyDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 学习记录模式
const UserLearningRecordSchema = new Schema<IUserLearningRecord>({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  records: [{
    word: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    mastery: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    correctCount: {
      type: Number,
      default: 0,
      min: 0
    },
    incorrectCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastReviewDate: {
      type: Date,
      default: Date.now
    },
    nextReviewDate: {
      type: Date,
      required: true
    },
    interval: {
      type: Number,
      default: 24, // 24小时
      min: 1
    },
    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
      max: 5.0
    },
    consecutiveCorrect: {
      type: Number,
      default: 0,
      min: 0
    },
    consecutiveIncorrect: {
      type: Number,
      default: 0,
      min: 0
    },
    totalStudyTime: {
      type: Number,
      default: 0,
      min: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0,
      min: 0
    },
    confidence: {
      type: Number,
      default: 3,
      min: 1,
      max: 5
    },
    notes: {
      type: String,
      maxlength: 500
    },
    tags: [{
      type: String,
      trim: true
    }]
  }],
  totalWords: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  averageMastery: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastStudyDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 创建索引
UserLearningRecordSchema.index({ userId: 1 });
UserLearningRecordSchema.index({ 'records.word': 1 });
UserLearningRecordSchema.index({ 'records.nextReviewDate': 1 });
UserLearningRecordSchema.index({ 'records.mastery': -1 });
UserLearningRecordSchema.index({ lastStudyDate: -1 });

// 虚拟字段：需要复习的单词数量
UserLearningRecordSchema.virtual('wordsToReview').get(function() {
  const now = new Date();
  return this.records.filter(record => record.nextReviewDate <= now).length;
});

// 虚拟字段：已掌握的单词数量（掌握度 >= 80）
UserLearningRecordSchema.virtual('masteredWords').get(function() {
  return this.records.filter(record => record.mastery >= 80).length;
});

// 虚拟字段：学习中的单词数量（掌握度 20-79）
UserLearningRecordSchema.virtual('learningWords').get(function() {
  return this.records.filter(record => record.mastery >= 20 && record.mastery < 80).length;
});

// 虚拟字段：新单词数量（掌握度 < 20）
UserLearningRecordSchema.virtual('newWords').get(function() {
  return this.records.filter(record => record.mastery < 20).length;
});

// 方法：添加或更新单词记录
UserLearningRecordSchema.methods.addOrUpdateWord = function(word: string, initialData?: Partial<ILearningRecord>) {
  const existingRecord = this.records.find((record: ILearningRecord) => record.word === word.toLowerCase());
  
  if (existingRecord) {
    // 更新现有记录
    Object.assign(existingRecord, initialData);
  } else {
    // 添加新记录
    const newRecord: ILearningRecord = {
      word: word.toLowerCase(),
      mastery: 0,
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      lastReviewDate: new Date(),
      nextReviewDate: new Date(), // 立即可以复习
      interval: 24,
      easeFactor: 2.5,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      totalStudyTime: 0,
      averageResponseTime: 0,
      confidence: 3,
      tags: [],
      ...initialData
    };
    
    this.records.push(newRecord);
    this.totalWords += 1;
  }
  
  this.updateAverageMastery();
  // 使用 findOneAndUpdate 避免并行保存冲突
  return UserLearningRecord.findByIdAndUpdate(
    this._id,
    { 
      $set: { 
        records: this.records,
        totalWords: this.totalWords,
        averageMastery: this.averageMastery
      }
    },
    { new: true }
  );
};

// 方法：更新复习结果
UserLearningRecordSchema.methods.updateReviewResult = function(
  word: string, 
  isCorrect: boolean, 
  responseTime: number,
  confidence: number
) {
  const record = this.records.find((r: ILearningRecord) => r.word === word.toLowerCase());
  
  if (!record) {
    throw new Error(`Word ${word} not found in learning records`);
  }
  
  // 更新基础统计
  record.reviewCount += 1;
  record.lastReviewDate = new Date();
  record.totalStudyTime += responseTime;
  record.averageResponseTime = (record.averageResponseTime * (record.reviewCount - 1) + responseTime) / record.reviewCount;
  record.confidence = confidence;
  
  if (isCorrect) {
    record.correctCount += 1;
    record.consecutiveCorrect += 1;
    record.consecutiveIncorrect = 0;
    
    // 更新掌握度（基于艾宾浩斯遗忘曲线）
    const masteryIncrease = Math.min(20, 10 + record.consecutiveCorrect * 2);
    record.mastery = Math.min(100, record.mastery + masteryIncrease);
    
    // 更新间隔和难度因子
    if (record.consecutiveCorrect >= 3) {
      record.interval = Math.min(168, record.interval * record.easeFactor); // 最大7天
      record.easeFactor = Math.min(5.0, record.easeFactor + 0.1);
    }
  } else {
    record.incorrectCount += 1;
    record.consecutiveIncorrect += 1;
    record.consecutiveCorrect = 0;
    
    // 降低掌握度
    const masteryDecrease = Math.min(record.mastery, 15 + record.consecutiveIncorrect * 5);
    record.mastery = Math.max(0, record.mastery - masteryDecrease);
    
    // 重置间隔和调整难度因子
    record.interval = Math.max(1, record.interval / 2);
    record.easeFactor = Math.max(1.3, record.easeFactor - 0.2);
  }
  
  // 计算下次复习时间
  record.nextReviewDate = new Date(Date.now() + record.interval * 60 * 60 * 1000);
  
  // 更新总体统计
  this.totalReviews += 1;
  this.lastStudyDate = new Date();
  this.updateAverageMastery();
  
  // 使用 findOneAndUpdate 避免并行保存冲突
  return UserLearningRecord.findByIdAndUpdate(
    this._id,
    { 
      $set: { 
        records: this.records,
        totalReviews: this.totalReviews,
        lastStudyDate: this.lastStudyDate,
        averageMastery: this.averageMastery
      }
    },
    { new: true }
  );
};

// 方法：更新平均掌握度
UserLearningRecordSchema.methods.updateAverageMastery = function() {
  if (this.records.length > 0) {
    const totalMastery = this.records.reduce((sum: number, record: ILearningRecord) => sum + record.mastery, 0);
    this.averageMastery = Math.round(totalMastery / this.records.length);
  } else {
    this.averageMastery = 0;
  }
};

// 方法：获取需要复习的单词
UserLearningRecordSchema.methods.getWordsToReview = function(limit?: number) {
  const now = new Date();
  const wordsToReview = this.records
    .filter((record: ILearningRecord) => record.nextReviewDate <= now)
    .sort((a: ILearningRecord, b: ILearningRecord) => {
      // 按紧急程度排序：超期时间 > 掌握度 > 复习次数
      const aOverdue = now.getTime() - a.nextReviewDate.getTime();
      const bOverdue = now.getTime() - b.nextReviewDate.getTime();
      
      if (aOverdue !== bOverdue) {
        return bOverdue - aOverdue; // 超期时间长的优先
      }
      
      if (a.mastery !== b.mastery) {
        return a.mastery - b.mastery; // 掌握度低的优先
      }
      
      return a.reviewCount - b.reviewCount; // 复习次数少的优先
    });
  
  return limit ? wordsToReview.slice(0, limit) : wordsToReview;
};

// 方法：获取学习建议
UserLearningRecordSchema.methods.getLearningSuggestions = function() {
  const suggestions = [];
  
  // 基于掌握度的建议
  const lowMasteryWords = this.records.filter((r: ILearningRecord) => r.mastery < 30);
  if (lowMasteryWords.length > 0) {
    suggestions.push({
      type: 'mastery',
      message: `有 ${lowMasteryWords.length} 个单词掌握度较低，建议重点复习`,
      priority: 'high'
    });
  }
  
  // 基于连续错误的建议
  const consecutiveIncorrectWords = this.records.filter((r: ILearningRecord) => r.consecutiveIncorrect >= 3);
  if (consecutiveIncorrectWords.length > 0) {
    suggestions.push({
      type: 'consecutive_incorrect',
      message: `有 ${consecutiveIncorrectWords.length} 个单词连续错误，需要重新学习`,
      priority: 'high'
    });
  }
  
  // 基于学习进度的建议
  if (this.wordsToReview > 0) {
    suggestions.push({
      type: 'review',
      message: `有 ${this.wordsToReview} 个单词需要复习`,
      priority: 'medium'
    });
  }
  
  // 基于学习时间的建议
  const lastStudy = this.lastStudyDate;
  const daysSinceLastStudy = Math.floor((Date.now() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceLastStudy > 3) {
    suggestions.push({
      type: 'consistency',
      message: `已经 ${daysSinceLastStudy} 天没有学习，建议保持学习习惯`,
      priority: 'medium'
    });
  }
  
  return suggestions;
};

// 静态方法：获取用户学习统计
UserLearningRecordSchema.statics.getUserStats = function(userId: string) {
  return this.findOne({ userId }).then((record: IUserLearningRecord | null) => {
    if (!record) return null;
    
    // 计算虚拟字段
    const now = new Date();
    const wordsToReview = record.records.filter((r: ILearningRecord) => r.nextReviewDate <= now).length;
    const masteredWords = record.records.filter((r: ILearningRecord) => r.mastery >= 80).length;
    const learningWords = record.records.filter((r: ILearningRecord) => r.mastery >= 20 && r.mastery < 80).length;
    const newWords = record.records.filter((r: ILearningRecord) => r.mastery < 20).length;
    
    return {
      totalWords: record.totalWords,
      totalReviews: record.totalReviews,
      averageMastery: record.averageMastery,
      wordsToReview,
      masteredWords,
      learningWords,
      newWords,
      lastStudyDate: record.lastStudyDate
    };
  });
};

export const UserLearningRecord = mongoose.model<IUserLearningRecord>('UserLearningRecord', UserLearningRecordSchema); 