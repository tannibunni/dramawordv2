import mongoose, { Schema, Document } from 'mongoose';

// 用户学习统计接口
export interface IUserLearningStats {
  totalWordsLearned: number;
  totalReviews: number;
  currentStreak: number;
  longestStreak: number;
  averageAccuracy: number;
  totalStudyTime: number; // 分钟
  lastStudyDate: Date;
  level: number;
  experience: number;
}

// 用户设置接口
export interface IUserSettings {
  notifications: {
    dailyReminder: boolean;
    reviewReminder: boolean;
    achievementNotification: boolean;
  };
  learning: {
    dailyGoal: number;
    reviewInterval: number; // 小时
    autoPlayAudio: boolean;
    showPhonetic: boolean;
  };
  privacy: {
    shareProgress: boolean;
    showInLeaderboard: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
}

// 用户认证信息接口
export interface IUserAuth {
  loginType: 'phone' | 'wechat' | 'apple' | 'guest';
  phoneNumber?: string;
  wechatId?: string;
  wechatOpenId?: string;
  wechatUnionId?: string;
  wechatNickname?: string;
  wechatAvatar?: string;
  wechatAccessToken?: string;
  wechatRefreshToken?: string;
  wechatTokenExpiresAt?: Date;
  appleId?: string;
  guestId?: string;
  lastLoginAt: Date;
  isActive: boolean;
}

// 用户文档接口
export interface IUser extends Document {
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  auth: IUserAuth;
  learningStats: IUserLearningStats;
  contributedWords: number;
  settings: IUserSettings;
  createdAt: Date;
  updatedAt: Date;
}

// 用户模式
const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  avatar: {
    type: String,
    default: null
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  auth: {
    loginType: {
      type: String,
      enum: ['phone', 'wechat', 'apple', 'guest'],
      required: true
    },
    phoneNumber: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    wechatId: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    wechatOpenId: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    wechatUnionId: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    wechatNickname: {
      type: String,
      required: false
    },
    wechatAvatar: {
      type: String,
      required: false
    },
    wechatAccessToken: {
      type: String,
      required: false
    },
    wechatRefreshToken: {
      type: String,
      required: false
    },
    wechatTokenExpiresAt: {
      type: Date,
      required: false
    },
    appleId: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    guestId: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  learningStats: {
    totalWordsLearned: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    averageAccuracy: {
      type: Number,
      default: 0
    },
    totalStudyTime: {
      type: Number,
      default: 0
    },
    lastStudyDate: {
      type: Date,
      default: null
    },
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    }
  },
  contributedWords: {
    type: Number,
    default: 0
  },
  settings: {
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
    }
  }
}, {
  timestamps: true
});

// 创建索引
// 注意：username 字段的 unique: true 已经创建了唯一索引，不需要重复添加
// 注意：auth 中的各个字段的 unique: true 已经创建了唯一索引，不需要重复添加
UserSchema.index({ 'learningStats.level': -1 });
UserSchema.index({ 'learningStats.experience': -1 });
UserSchema.index({ 'learningStats.currentStreak': -1 });

// 虚拟字段：用户等级名称
UserSchema.virtual('levelName').get(function() {
  const levels = [
    '初学者', '入门者', '学习者', '进阶者', '熟练者',
    '专家', '大师', '传奇', '神话', '传说'
  ];
  return levels[Math.min(this.learningStats.level - 1, levels.length - 1)];
});

// 虚拟字段：距离下一等级的经验
UserSchema.virtual('experienceToNextLevel').get(function() {
  const currentLevel = this.learningStats.level;
  const currentExp = this.learningStats.experience;
  const nextLevelExp = currentLevel * 100; // 每级需要 level * 100 经验
  return Math.max(0, nextLevelExp - currentExp);
});

// 方法：更新学习统计
UserSchema.methods.updateLearningStats = function(stats: Partial<IUserLearningStats>) {
  Object.assign(this.learningStats, stats);
  return this.save();
};

// 方法：增加经验值
UserSchema.methods.addExperience = function(exp: number) {
  this.learningStats.experience += exp;
  
  // 检查是否升级
  const currentLevel = this.learningStats.level;
  const requiredExp = currentLevel * 100;
  
  if (this.learningStats.experience >= requiredExp) {
    this.learningStats.level += 1;
    this.learningStats.experience -= requiredExp;
  }
  
  return this.save();
};

// 方法：更新学习天数
UserSchema.methods.updateStudyStreak = function() {
  const today = new Date();
  const lastStudy = this.learningStats.lastStudyDate;
  
  if (!lastStudy) {
    // 第一次学习
    this.learningStats.currentStreak = 1;
  } else {
    const daysDiff = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // 连续学习
      this.learningStats.currentStreak += 1;
    } else if (daysDiff > 1) {
      // 中断学习，重置连续天数
      this.learningStats.currentStreak = 1;
    }
    // daysDiff === 0 表示同一天，不更新连续天数
  }
  
  // 更新最长连续天数
  if (this.learningStats.currentStreak > this.learningStats.longestStreak) {
    this.learningStats.longestStreak = this.learningStats.currentStreak;
  }
  
  this.learningStats.lastStudyDate = today;
  return this.save();
};

export const User = mongoose.model<IUser>('User', UserSchema); 