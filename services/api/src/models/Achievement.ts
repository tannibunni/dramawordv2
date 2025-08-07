import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  requirements: Array<{
    type: string;
    value: number;
    description: string;
  }>;
  rewards: {
    experience: number;
    title: string;
    specialFeature: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  unlockedAt: {
    type: Date,
    default: null
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  maxProgress: {
    type: Number,
    default: 100
  },
  requirements: [{
    type: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  rewards: {
    experience: {
      type: Number,
      default: 0
    },
    title: {
      type: String,
      default: ''
    },
    specialFeature: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

// 创建复合索引确保用户和成就ID的唯一性
AchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

// 创建索引以提高查询性能
AchievementSchema.index({ userId: 1, isUnlocked: 1 });
AchievementSchema.index({ userId: 1, category: 1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema); 