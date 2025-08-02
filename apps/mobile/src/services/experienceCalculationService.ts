// 经验值计算服务 - 专门处理经验值相关的计算逻辑

// 经验值配置接口
export interface ExperienceConfig {
  baseXP: number;
  levelMultiplier: number;
  dailyLimits: {
    review: number;
    smartChallenge: number;
    wrongWordChallenge: number;
    newWord: number;
    contribution: number;
    dailyCheckin: number;
    dailyCards: number;
    studyTime: number;
  };
  xpRewards: {
    review: {
      correct: number;
      incorrect: number;
    };
    smartChallenge: number;
    wrongWordChallenge: number;
    newWord: number;
    contribution: number;
    dailyCheckin: number;
    dailyCards: number;
    studyTime: number;
  };
}

// 等级信息接口
export interface LevelInfo {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  progressPercentage: number;
  totalExperience: number;
  levelName: string;
  levelColor: string;
}

// 经验值增益结果接口
export interface ExperienceGainResult {
  success: boolean;
  xpGained: number;
  newLevel: number;
  leveledUp: boolean;
  message: string;
  oldLevel: number;
  oldExperience: number;
  newExperience: number;
  progressChange: number;
}

// 每日限制检查结果接口
export interface DailyLimitCheck {
  canGain: boolean;
  remaining: number;
  limit: number;
  used: number;
}

// 经验值计算服务类
export class ExperienceCalculationService {
  private static instance: ExperienceCalculationService;
  private config: ExperienceConfig;

  private constructor() {
    this.config = {
      baseXP: 50,
      levelMultiplier: 2,
      dailyLimits: {
        review: 100,
        smartChallenge: 50,
        wrongWordChallenge: 30,
        newWord: 200,
        contribution: 10,
        dailyCheckin: 1,
        dailyCards: 1,
        studyTime: 1000, // 分钟
      },
      xpRewards: {
        review: {
          correct: 2,
          incorrect: 1,
        },
        smartChallenge: 5,
        wrongWordChallenge: 3,
        newWord: 5,
        contribution: 10,
        dailyCheckin: 20,
        dailyCards: 15,
        studyTime: 1, // 每分钟1经验值
      },
    };
  }

  public static getInstance(): ExperienceCalculationService {
    if (!ExperienceCalculationService.instance) {
      ExperienceCalculationService.instance = new ExperienceCalculationService();
    }
    return ExperienceCalculationService.instance;
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<ExperienceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  public getConfig(): ExperienceConfig {
    return { ...this.config };
  }

  /**
   * 计算等级所需经验值
   * 公式: baseXP * (level + 1)^levelMultiplier
   * 与后端保持一致
   */
  public calculateLevelRequiredExp(level: number): number {
    return this.config.baseXP * Math.pow(level + 1, this.config.levelMultiplier);
  }

  /**
   * 计算当前等级
   */
  public calculateLevel(experience: number): number {
    if (experience <= 0) return 1;

    let level = 1;
    while (this.calculateLevelRequiredExp(level) <= experience) {
      level++;
    }
    return level;
  }

  /**
   * 计算升级所需经验值
   */
  public calculateExpToNextLevel(experience: number): number {
    const currentLevel = this.calculateLevel(experience);
    const requiredExp = this.calculateLevelRequiredExp(currentLevel);
    return Math.max(0, requiredExp - experience);
  }

  /**
   * 计算进度百分比
   */
  public calculateProgressPercentage(experience: number): number {
    if (experience <= 0) return 0;

    const currentLevel = this.calculateLevel(experience);
    const levelStartExp = currentLevel > 1 ? this.calculateLevelRequiredExp(currentLevel - 1) : 0;
    const levelEndExp = this.calculateLevelRequiredExp(currentLevel);
    const expInCurrentLevel = experience - levelStartExp;
    const expNeededForLevel = levelEndExp - levelStartExp;

    const percentage = (expInCurrentLevel / expNeededForLevel) * 100;
    return Math.min(100, Math.max(0, percentage));
  }

  /**
   * 计算完整等级信息
   */
  public calculateLevelInfo(experience: number): LevelInfo {
    const level = this.calculateLevel(experience);
    const experienceToNextLevel = this.calculateExpToNextLevel(experience);
    const progressPercentage = this.calculateProgressPercentage(experience);
    const totalExperience = experience;

    return {
      level,
      experience,
      experienceToNextLevel,
      progressPercentage,
      totalExperience,
      levelName: this.getLevelName(level),
      levelColor: this.getLevelColor(level),
    };
  }

  /**
   * 检查是否升级
   */
  public checkLevelUp(oldExperience: number, newExperience: number): {
    leveledUp: boolean;
    oldLevel: number;
    newLevel: number;
    levelsGained: number;
  } {
    const oldLevel = this.calculateLevel(oldExperience);
    const newLevel = this.calculateLevel(newExperience);
    const leveledUp = newLevel > oldLevel;
    const levelsGained = newLevel - oldLevel;

    return {
      leveledUp,
      oldLevel,
      newLevel,
      levelsGained,
    };
  }

  /**
   * 计算经验值增益
   * 与后端ExperienceGainResult保持一致
   */
  public calculateExperienceGain(
    currentExperience: number,
    xpToGain: number,
    reason: string = '未知'
  ): ExperienceGainResult {
    const oldLevel = this.calculateLevel(currentExperience);
    const newExperience = currentExperience + xpToGain;
    const newLevel = this.calculateLevel(newExperience);
    const leveledUp = newLevel > oldLevel;
    const oldProgress = this.calculateProgressPercentage(currentExperience);
    const newProgress = this.calculateProgressPercentage(newExperience);

    return {
      success: true,
      xpGained: xpToGain,
      newLevel,
      leveledUp,
      message: `${reason} +${xpToGain}经验值`,
      oldLevel,
      oldExperience: currentExperience,
      newExperience,
      progressChange: newProgress - oldProgress,
    };
  }

  /**
   * 计算复习经验值
   */
  public calculateReviewExperience(isCorrect: boolean): number {
    return isCorrect
      ? this.config.xpRewards.review.correct
      : this.config.xpRewards.review.incorrect;
  }

  /**
   * 计算学习时间经验值
   */
  public calculateStudyTimeExperience(minutes: number): number {
    return Math.floor(minutes * this.config.xpRewards.studyTime);
  }

  /**
   * 检查每日限制
   */
  public checkDailyLimit(
    currentUsage: number,
    limitType: keyof ExperienceConfig['dailyLimits']
  ): DailyLimitCheck {
    const limit = this.config.dailyLimits[limitType];
    const used = currentUsage;
    const remaining = Math.max(0, limit - used);
    const canGain = used < limit;

    return {
      canGain,
      remaining,
      limit,
      used,
    };
  }

  /**
   * 获取等级名称
   */
  public getLevelName(level: number): string {
    const levelNames = [
      '初学者',
      '学习者',
      '探索者',
      '实践者',
      '熟练者',
      '专家',
      '大师',
      '传奇',
      '神话',
      '传说',
    ];

    if (level <= levelNames.length) {
      return levelNames[level - 1];
    }

    // 超过预设等级，使用数字
    return `等级 ${level}`;
  }

  /**
   * 获取等级颜色
   */
  public getLevelColor(level: number): string {
    const colors = [
      '#6B7280', // 灰色 - 初学者
      '#3B82F6', // 蓝色 - 学习者
      '#10B981', // 绿色 - 探索者
      '#F59E0B', // 黄色 - 实践者
      '#EF4444', // 红色 - 熟练者
      '#8B5CF6', // 紫色 - 专家
      '#EC4899', // 粉色 - 大师
      '#F97316', // 橙色 - 传奇
      '#06B6D4', // 青色 - 神话
      '#84CC16', // 青绿色 - 传说
    ];

    if (level <= colors.length) {
      return colors[level - 1];
    }

    // 超过预设等级，使用彩虹色
    const hue = ((level - 1) * 137.5) % 360; // 黄金角度
    return `hsl(${hue}, 70%, 50%)`;
  }

  /**
   * 格式化经验值显示
   */
  public formatExperience(exp: number): string {
    if (exp < 1000) {
      return exp.toString();
    } else if (exp < 1000000) {
      return `${(exp / 1000).toFixed(1)}K`;
    } else {
      return `${(exp / 1000000).toFixed(1)}M`;
    }
  }

  /**
   * 验证经验值数据
   */
  public validateExperienceData(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (typeof data.experience !== 'number' || data.experience < 0) {
      errors.push('经验值必须是大于等于0的数字');
    }

    if (typeof data.level !== 'number' || data.level < 1) {
      errors.push('等级必须是大于等于1的数字');
    }

    // 检查等级和经验值的一致性
    if (data.experience !== undefined && data.level !== undefined) {
      const calculatedLevel = this.calculateLevel(data.experience);
      if (calculatedLevel !== data.level) {
        errors.push(`等级不一致：计算得出${calculatedLevel}，实际${data.level}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 计算经验值统计信息
   */
  public calculateExperienceStats(events: Array<{ xpGained: number; type: string; timestamp: number }>): {
    totalXP: number;
    byType: Record<string, number>;
    byDay: Record<string, number>;
    averageXPPerEvent: number;
    mostProductiveDay: string;
    mostProductiveType: string;
  } {
    if (events.length === 0) {
      return {
        totalXP: 0,
        byType: {},
        byDay: {},
        averageXPPerEvent: 0,
        mostProductiveDay: '',
        mostProductiveType: '',
      };
    }

    const byType: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    let totalXP = 0;

    events.forEach((event) => {
      totalXP += event.xpGained;
      
      // 按类型统计
      byType[event.type] = (byType[event.type] || 0) + event.xpGained;
      
      // 按天统计
      const day = new Date(event.timestamp).toDateString();
      byDay[day] = (byDay[day] || 0) + event.xpGained;
    });

    const averageXPPerEvent = totalXP / events.length;
    
    // 找出最有效率的一天
    const mostProductiveDay = Object.entries(byDay).reduce((a, b) => 
      byDay[a[0]] > byDay[b[0]] ? a : b
    )[0];

    // 找出最有效率的类型
    const mostProductiveType = Object.entries(byType).reduce((a, b) => 
      byType[a[0]] > byType[b[0]] ? a : b
    )[0];

    return {
      totalXP,
      byType,
      byDay,
      averageXPPerEvent,
      mostProductiveDay,
      mostProductiveType,
    };
  }
}

// 导出单例实例
export const experienceCalculationService = ExperienceCalculationService.getInstance(); 