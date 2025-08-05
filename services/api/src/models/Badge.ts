import mongoose, { Schema, Document } from 'mongoose';

export interface IBadge extends Document {
  userId: mongoose.Types.ObjectId;
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
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

const BadgeSchema = new Schema<IBadge>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  badgeId: {
    type: String,
    required: true,
    index: true
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
    required: true,
    index: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common',
    index: true
  },
  isUnlocked: {
    type: Boolean,
    default: false,
    index: true
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

// 创建复合索引确保用户和徽章ID的唯一性
BadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

// 创建索引以提高查询性能
BadgeSchema.index({ userId: 1, isUnlocked: 1 });
BadgeSchema.index({ userId: 1, category: 1 });
BadgeSchema.index({ userId: 1, rarity: 1 });

export const Badge = mongoose.model<IBadge>('Badge', BadgeSchema); 