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
  // 新增经验值相关字段
  dailyReviewXP: number; // 当日通过复习获得的XP
  dailyStudyTimeXP: number; // 当日通过学习时长获得的XP
  lastDailyReset: Date; // 上次每日重置时间
  completedDailyCards: boolean; // 是否完成今日词卡任务
  lastDailyCardsDate: Date; // 上次完成每日词卡的日期
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
  appleEmail?: string;
  appleFullName?: {
    givenName?: string;
    familyName?: string;
  };
  guestId?: string;
  lastLoginAt: Date;
  isActive: boolean;
}

// 用户订阅信息接口
export interface IUserSubscription {
  type: 'monthly' | 'yearly' | 'lifetime';
  isActive: boolean;
  startDate: Date;
  expiryDate: Date;
  autoRenew: boolean;
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
  subscription?: IUserSubscription;
  createdAt: Date;
  updatedAt: Date;
  // === 实例方法声明 ===
  updateStudyStreak: () => Promise<any>;
  addContinuousLearningReward: () => Promise<any>;
  checkContinuousLearningStatus: () => any;
  addExperienceForNewWord: (...args: any[]) => Promise<any>;
  addExperienceForReview: (...args: any[]) => Promise<any>;
  addExperienceForDailyCheckin: () => Promise<any>;
  addExperienceForDailyCards: () => Promise<any>;
  addExperienceForStudyTime: (minutes: number) => Promise<any>;
  addExperienceForContribution: () => Promise<any>;
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
    appleEmail: {
      type: String,
      required: false
    },
    appleFullName: {
      givenName: {
        type: String,
        required: false
      },
      familyName: {
        type: String,
        required: false
      }
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
    },
    dailyReviewXP: {
      type: Number,
      default: 0
    },
    dailyStudyTimeXP: {
      type: Number,
      default: 0
    },
    lastDailyReset: {
      type: Date,
      default: Date.now
    },
    completedDailyCards: {
      type: Boolean,
      default: false
    },
    lastDailyCardsDate: {
      type: Date,
      default: null
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
  },
  subscription: {
    type: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    autoRenew: {
      type: Boolean,
      default: true
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
  const nextLevelExp = 50 * Math.pow(currentLevel + 1, 2); // 平方增长公式
  const totalExpForNextLevel = nextLevelExp;
  const totalExpForCurrentLevel = 50 * Math.pow(currentLevel, 2);
  const expNeededForCurrentLevel = totalExpForNextLevel - totalExpForCurrentLevel;
  return Math.max(0, expNeededForCurrentLevel - currentExp);
});

// 虚拟字段：当前等级所需总经验
UserSchema.virtual('totalExperienceForCurrentLevel').get(function() {
  const currentLevel = this.learningStats.level;
  return 50 * Math.pow(currentLevel, 2);
});

// 虚拟字段：下一等级所需总经验
UserSchema.virtual('totalExperienceForNextLevel').get(function() {
  const currentLevel = this.learningStats.level;
  return 50 * Math.pow(currentLevel + 1, 2);
});

// 方法：检查并重置每日限制
UserSchema.methods.checkAndResetDailyLimits = function() {
  const today = new Date();
  const lastReset = this.learningStats.lastDailyReset;
  
  if (!lastReset || !this.isSameDay(today, lastReset)) {
    // 新的一天，重置每日限制
    this.learningStats.dailyReviewXP = 0;
    this.learningStats.dailyStudyTimeXP = 0;
    this.learningStats.lastDailyReset = today;
    
    // 检查每日词卡任务重置
    if (!this.learningStats.lastDailyCardsDate || !this.isSameDay(today, this.learningStats.lastDailyCardsDate)) {
      this.learningStats.completedDailyCards = false;
    }
    
    return true; // 表示已重置
  }
  return false; // 表示未重置
};

// 辅助方法：检查是否为同一天
UserSchema.methods.isSameDay = function(date1: Date, date2: Date) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// 方法：增加经验值（新版本）
UserSchema.methods.addExperience = function(exp: number, reason: string = '') {
  // 检查并重置每日限制
  this.checkAndResetDailyLimits();
  
  // 添加经验值
  this.learningStats.experience += exp;
  
  // 检查是否升级
  const currentLevel = this.learningStats.level;
  const totalExpForNextLevel = 50 * Math.pow(currentLevel + 1, 2);
  const totalExpForCurrentLevel = 50 * Math.pow(currentLevel, 2);
  const expNeededForCurrentLevel = totalExpForNextLevel - totalExpForCurrentLevel;
  
  if (this.learningStats.experience >= expNeededForCurrentLevel) {
    // 升级
    this.learningStats.level += 1;
    this.learningStats.experience -= expNeededForCurrentLevel;
    
    console.log(`🎉 用户升级！新等级: ${this.learningStats.level}, 原因: ${reason}`);
  }
  
  return this.save();
};

// 方法：收集新单词获得经验值
UserSchema.methods.addExperienceForNewWord = function() {
  return this.addExperience(5, '收集新单词');
};

// 方法：复习单词获得经验值（记得+2，不记得+1）
UserSchema.methods.addExperienceForReview = function(isCorrect = true) {
  // 检查每日复习XP限制
  const dailyLimit = 90; // 每日上限90点，允许更多复习
  if (this.learningStats.dailyReviewXP >= dailyLimit) {
    console.log('⚠️ 今日复习XP已达上限90点');
    return this.save();
  }
  
  // 根据是否正确给予不同经验值
  const xpToAdd = isCorrect ? 2 : 1;
  const actualXpToAdd = Math.min(xpToAdd, dailyLimit - this.learningStats.dailyReviewXP);
  this.learningStats.dailyReviewXP += actualXpToAdd;
  
  const message = isCorrect ? '成功复习单词' : '复习单词';
  return this.addExperience(actualXpToAdd, message);
};

// 方法：连续学习打卡获得经验值
UserSchema.methods.addExperienceForDailyCheckin = function() {
  // 检查并重置每日限制
  this.checkAndResetDailyLimits();
  
  // 基础XP
  let baseXP = 5;
  
  // 连续学习奖励（最多7天）
  const streakBonus = Math.min(this.learningStats.currentStreak, 7);
  
  const totalXP = baseXP + streakBonus;
  
  return this.addExperience(totalXP, `连续学习打卡 (连续${this.learningStats.currentStreak}天)`);
};

// 方法：完成每日词卡任务获得经验值
UserSchema.methods.addExperienceForDailyCards = function() {
  // 检查并重置每日限制
  this.checkAndResetDailyLimits();
  
  // 检查是否已完成今日任务
  if (this.learningStats.completedDailyCards) {
    console.log('⚠️ 今日词卡任务已完成');
    return this.save();
  }
  
  this.learningStats.completedDailyCards = true;
  this.learningStats.lastDailyCardsDate = new Date();
  
  return this.addExperience(5, '完成每日词卡任务');
};

// 方法：学习时长奖励
UserSchema.methods.addExperienceForStudyTime = function(minutes: number) {
  // 检查并重置每日限制
  this.checkAndResetDailyLimits();
  
  // 每10分钟获得3点XP，每日上限30分钟
  const maxMinutes = 30;
  const minutesToAdd = Math.min(minutes, maxMinutes - (this.learningStats.totalStudyTime % maxMinutes));
  
  if (minutesToAdd <= 0) {
    console.log('⚠️ 今日学习时长XP已达上限');
    return this.save();
  }
  
  const xpToAdd = Math.floor(minutesToAdd / 10) * 3;
  this.learningStats.dailyStudyTimeXP += xpToAdd;
  this.learningStats.totalStudyTime += minutesToAdd;
  
  if (xpToAdd > 0) {
    return this.addExperience(xpToAdd, `学习时长奖励 (${minutesToAdd}分钟)`);
  }
  
  return this.save();
};

// 方法：贡献新词获得经验值
UserSchema.methods.addExperienceForContribution = function() {
  this.contributedWords += 1;
  return this.addExperience(8, '贡献新词');
};

// 方法：更新学习统计
UserSchema.methods.updateLearningStats = function(stats: Partial<IUserLearningStats>) {
  Object.assign(this.learningStats, stats);
  return this.save();
};

// 方法：更新学习天数
UserSchema.methods.updateStudyStreak = function() {
  const today = new Date();
  const lastStudy = this.learningStats.lastStudyDate;
  
  if (!lastStudy) {
    // 第一次学习
    this.learningStats.currentStreak = 1;
    this.learningStats.lastStudyDate = today;
    console.log('🎯 用户首次学习，开始连续学习记录');
  } else {
    const daysDiff = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // 同一天学习，不更新连续天数
      console.log('🎯 同一天学习，保持连续天数不变');
    } else if (daysDiff === 1) {
      // 连续学习（昨天学习过）
      this.learningStats.currentStreak += 1;
      this.learningStats.lastStudyDate = today;
      console.log(`🎯 连续学习！当前连续天数: ${this.learningStats.currentStreak}`);
    } else if (daysDiff > 1) {
      // 中断学习，重置连续天数
      this.learningStats.currentStreak = 1;
      this.learningStats.lastStudyDate = today;
      console.log(`🎯 学习中断${daysDiff}天，重置连续天数为1`);
    }
  }
  
  // 更新最长连续天数
  if (this.learningStats.currentStreak > this.learningStats.longestStreak) {
    this.learningStats.longestStreak = this.learningStats.currentStreak;
    console.log(`🏆 新的最长连续记录！${this.learningStats.longestStreak}天`);
  }
  
  return this.save();
};

// 方法：连续学习奖励
UserSchema.methods.addContinuousLearningReward = function() {
  const currentStreak = this.learningStats.currentStreak;
  
  // 连续学习奖励规则
  let rewardXP = 0;
  let rewardMessage = '';
  
  if (currentStreak >= 7) {
    // 连续7天：额外10XP
    rewardXP = 10;
    rewardMessage = `连续学习${currentStreak}天奖励！`;
  } else if (currentStreak >= 3) {
    // 连续3天：额外5XP
    rewardXP = 5;
    rewardMessage = `连续学习${currentStreak}天奖励！`;
  } else if (currentStreak >= 1) {
    // 连续1天：额外2XP
    rewardXP = 2;
    rewardMessage = `连续学习${currentStreak}天奖励！`;
  }
  
  if (rewardXP > 0) {
    this.addExperience(rewardXP, rewardMessage);
    console.log(`🎁 连续学习奖励: +${rewardXP}XP (${rewardMessage})`);
  }
  
  // 使用 findOneAndUpdate 避免并行保存冲突
  return User.findByIdAndUpdate(
    this._id,
    { 
      $set: { 
        'learningStats.experience': this.learningStats.experience,
        'learningStats.level': this.learningStats.level,
        'learningStats.currentStreak': this.learningStats.currentStreak,
        'learningStats.longestStreak': this.learningStats.longestStreak,
        'learningStats.lastStudyDate': this.learningStats.lastStudyDate
      }
    },
    { new: true }
  );
};

// 方法：检查连续学习状态
UserSchema.methods.checkContinuousLearningStatus = function() {
  const today = new Date();
  const lastStudy = this.learningStats.lastStudyDate;
  
  if (!lastStudy) {
    return {
      status: 'new',
      message: '开始你的学习之旅吧！',
      daysUntilReset: null
    };
  }
  
  const daysDiff = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    return {
      status: 'today',
      message: '今天已经学习过了，继续保持！',
      daysUntilReset: 1
    };
  } else if (daysDiff === 1) {
    return {
      status: 'yesterday',
      message: '昨天学习过，今天继续加油！',
      daysUntilReset: 1
    };
  } else if (daysDiff > 1) {
    return {
      status: 'broken',
      message: `学习中断${daysDiff}天，重新开始连续学习吧！`,
      daysUntilReset: null
    };
  }
  
  return {
    status: 'unknown',
    message: '学习状态未知',
    daysUntilReset: null
  };
};

export const User = mongoose.model<IUser>('User', UserSchema); 