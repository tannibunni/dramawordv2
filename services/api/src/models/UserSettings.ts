import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  notifications: {
    dailyReminder: boolean;
    reviewReminder: boolean;
    achievementNotification: boolean;
    streakReminder: boolean;
    weeklyReport: boolean;
  };
  learning: {
    dailyGoal: number;
    reviewInterval: number;
    autoPlayAudio: boolean;
    showPhonetic: boolean;
    enableSpacedRepetition: boolean;
    enableAdaptiveLearning: boolean;
  };
  privacy: {
    shareProgress: boolean;
    showInLeaderboard: boolean;
    allowDataSync: boolean;
    allowAnalytics: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  studyLanguage: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  notifications: {
    dailyReminder: {
      type: Boolean,
      default: true
    },
    reviewReminder: {
      type: Boolean,
      default: true
    },
    achievementNotification: {
      type: Boolean,
      default: true
    },
    streakReminder: {
      type: Boolean,
      default: true
    },
    weeklyReport: {
      type: Boolean,
      default: true
    }
  },
  learning: {
    dailyGoal: {
      type: Number,
      default: 20,
      min: 5,
      max: 100
    },
    reviewInterval: {
      type: Number,
      default: 24,
      min: 1,
      max: 168
    },
    autoPlayAudio: {
      type: Boolean,
      default: true
    },
    showPhonetic: {
      type: Boolean,
      default: true
    },
    enableSpacedRepetition: {
      type: Boolean,
      default: true
    },
    enableAdaptiveLearning: {
      type: Boolean,
      default: true
    }
  },
  privacy: {
    shareProgress: {
      type: Boolean,
      default: false
    },
    showInLeaderboard: {
      type: Boolean,
      default: true
    },
    allowDataSync: {
      type: Boolean,
      default: true
    },
    allowAnalytics: {
      type: Boolean,
      default: true
    }
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'auto'
  },
  language: {
    type: String,
    enum: ['zh-CN', 'en-US'],
    default: 'zh-CN'
  },
  studyLanguage: {
    type: String,
    default: 'en'
  },
  timezone: {
    type: String,
    default: 'UTC'
  }
}, {
  timestamps: true
});

// 创建索引以提高查询性能
UserSettingsSchema.index({ userId: 1 });

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema); 