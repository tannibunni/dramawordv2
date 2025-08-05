import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProgress extends Document {
  userId: mongoose.Types.ObjectId;
  language: string;
  level: number;
  experience: number;
  totalWordsLearned: number;
  totalReviews: number;
  currentStreak: number;
  longestStreak: number;
  averageAccuracy: number;
  totalStudyTime: number;
  lastStudyDate?: Date;
  dailyGoal: number;
  dailyProgress: number;
  weeklyProgress: number;
  monthlyProgress: number;
  yearlyProgress: number;
  achievements: mongoose.Types.ObjectId[];
  badges: mongoose.Types.ObjectId[];
  learningStats: {
    wordsLearnedToday: number;
    reviewsCompletedToday: number;
    studyTimeToday: number;
    accuracyToday: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserProgressSchema = new Schema<IUserProgress>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  language: {
    type: String,
    required: true,
    default: 'en',
    index: true
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWordsLearned: {
    type: Number,
    default: 0,
    min: 0
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  averageAccuracy: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalStudyTime: {
    type: Number,
    default: 0,
    min: 0
  },
  lastStudyDate: {
    type: Date,
    default: null
  },
  dailyGoal: {
    type: Number,
    default: 20,
    min: 5,
    max: 100
  },
  dailyProgress: {
    type: Number,
    default: 0,
    min: 0
  },
  weeklyProgress: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyProgress: {
    type: Number,
    default: 0,
    min: 0
  },
  yearlyProgress: {
    type: Number,
    default: 0,
    min: 0
  },
  achievements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }],
  badges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge'
  }],
  learningStats: {
    wordsLearnedToday: {
      type: Number,
      default: 0,
      min: 0
    },
    reviewsCompletedToday: {
      type: Number,
      default: 0,
      min: 0
    },
    studyTimeToday: {
      type: Number,
      default: 0,
      min: 0
    },
    accuracyToday: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// 创建复合索引确保用户和语言的唯一性
UserProgressSchema.index({ userId: 1, language: 1 }, { unique: true });

// 创建索引以提高查询性能
UserProgressSchema.index({ userId: 1, level: -1 });
UserProgressSchema.index({ userId: 1, experience: -1 });
UserProgressSchema.index({ userId: 1, currentStreak: -1 });

export const UserProgress = mongoose.model<IUserProgress>('UserProgress', UserProgressSchema); 