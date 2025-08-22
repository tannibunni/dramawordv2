import { BadgeMetric, BadgeDefinition } from '../types/badge';

// 徽章解锁规则接口
export interface BadgeRule {
  id: string;
  metric: BadgeMetric;
  condition: 'threshold' | 'streak' | 'time_based' | 'combo';
  threshold?: number;
  streakDays?: number;
  timeFrame?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  comboActions?: string[];
  description: string;
  priority: number; // 优先级，用于规则执行顺序
}

// 用户行为数据接口
export interface UserBehaviorData {
  userId: string;
  wordsCollected: number;
  reviewSessionsCompleted: number;
  dailyCheckinStreak: number;
  wordsContributed: number;
  learningTimeHours: number;
  showlistCreated: number;
  lastActivityDate: Date;
  // 时间序列数据
  dailyStats: {
    date: string;
    wordsCollected: number;
    reviewsCompleted: number;
    learningTime: number;
  }[];
  // 连续行为数据
  streakData: {
    type: 'daily_checkin' | 'learning' | 'review';
    currentStreak: number;
    longestStreak: number;
    lastBreakDate: Date;
  }[];
}

// 徽章解锁结果
export interface BadgeUnlockResult {
  badgeId: string;
  unlocked: boolean;
  progress: number;
  target: number;
  unlockDate?: Date;
  reason?: string;
}

export class BadgeRuleEngine {
  private static instance: BadgeRuleEngine;
  
  // 徽章解锁规则定义
  private badgeRules: BadgeRule[] = [
    // 收藏家系列
    {
      id: 'collector_10',
      metric: 'words_collected_total',
      condition: 'threshold',
      threshold: 10,
      description: '收集10个单词',
      priority: 1
    },
    {
      id: 'collector_50',
      metric: 'words_collected_total',
      condition: 'threshold',
      threshold: 50,
      description: '收集50个单词',
      priority: 2
    },
    {
      id: 'collector_100',
      metric: 'words_collected_total',
      condition: 'threshold',
      threshold: 100,
      description: '收集100个单词',
      priority: 3
    },
    
    // 复习达人系列
    {
      id: 'reviewer_10',
      metric: 'review_sessions_completed',
      condition: 'threshold',
      threshold: 10,
      description: '完成10次复习',
      priority: 1
    },
    {
      id: 'reviewer_50',
      metric: 'review_sessions_completed',
      condition: 'threshold',
      threshold: 50,
      description: '完成50次复习',
      priority: 2
    },
    
    // 坚持系列
    {
      id: 'streak_7',
      metric: 'daily_checkin_streak',
      condition: 'streak',
      streakDays: 7,
      description: '连续学习7天',
      priority: 1
    },
    {
      id: 'streak_30',
      metric: 'daily_checkin_streak',
      condition: 'streak',
      streakDays: 30,
      description: '连续学习30天',
      priority: 2
    },
    {
      id: 'streak_100',
      metric: 'daily_checkin_streak',
      condition: 'streak',
      streakDays: 100,
      description: '连续学习100天',
      priority: 3
    },
    
    // 贡献者系列
    {
      id: 'contributor_5',
      metric: 'words_contributed',
      condition: 'threshold',
      threshold: 5,
      description: '贡献5个词条',
      priority: 1
    },
    
    // 剧集收藏家
    {
      id: 'showlist_3',
      metric: 'showlist_created',
      condition: 'threshold',
      threshold: 3,
      description: '创建3个剧单',
      priority: 1
    },
    
    // 学习时间系列
    {
      id: 'learner_10h',
      metric: 'learning_time_hours',
      condition: 'threshold',
      threshold: 10,
      description: '累计学习10小时',
      priority: 1
    },
    {
      id: 'learner_50h',
      metric: 'learning_time_hours',
      condition: 'threshold',
      threshold: 50,
      description: '累计学习50小时',
      priority: 2
    },
    
    // 组合成就
    {
      id: 'dedicated_learner',
      metric: 'words_collected_total',
      condition: 'combo',
      comboActions: ['words_collected_total', 'review_sessions_completed', 'daily_checkin_streak'],
      description: '同时达到：收集50词 + 完成20次复习 + 连续学习15天',
      priority: 3
    }
  ];

  private constructor() {}

  static getInstance(): BadgeRuleEngine {
    if (!BadgeRuleEngine.instance) {
      BadgeRuleEngine.instance = new BadgeRuleEngine();
    }
    return BadgeRuleEngine.instance;
  }

  // 获取所有徽章规则
  getBadgeRules(): BadgeRule[] {
    return this.badgeRules.sort((a, b) => a.priority - b.priority);
  }

  // 根据ID获取徽章规则
  getBadgeRule(badgeId: string): BadgeRule | undefined {
    return this.badgeRules.find(rule => rule.id === badgeId);
  }

  // 评估用户徽章解锁状态
  async evaluateUserBadges(
    userId: string, 
    userBehavior: UserBehaviorData
  ): Promise<BadgeUnlockResult[]> {
    const results: BadgeUnlockResult[] = [];
    
    for (const rule of this.badgeRules) {
      const result = await this.evaluateSingleRule(rule, userBehavior);
      results.push(result);
    }
    
    return results;
  }

  // 评估单个徽章规则
  private async evaluateSingleRule(
    rule: BadgeRule, 
    userBehavior: UserBehaviorData
  ): Promise<BadgeUnlockResult> {
    let unlocked = false;
    let progress = 0;
    let target = 0;
    let reason = '';

    switch (rule.condition) {
      case 'threshold':
        unlocked = this.evaluateThresholdRule(rule, userBehavior);
        progress = this.getMetricValue(rule.metric, userBehavior);
        target = rule.threshold || 0;
        reason = unlocked ? '达到解锁条件' : '未达到解锁条件';
        break;
        
      case 'streak':
        unlocked = this.evaluateStreakRule(rule, userBehavior);
        progress = this.getStreakValue(rule.metric, userBehavior);
        target = rule.streakDays || 0;
        reason = unlocked ? '连续行为达到要求' : '连续行为未达到要求';
        break;
        
      case 'combo':
        unlocked = this.evaluateComboRule(rule, userBehavior);
        progress = this.calculateComboProgress(rule, userBehavior);
        target = 100; // 组合规则使用百分比
        reason = unlocked ? '组合条件全部满足' : '组合条件未全部满足';
        break;
        
      default:
        unlocked = false;
        progress = 0;
        target = 0;
        reason = '未知规则类型';
    }

    return {
      badgeId: rule.id,
      unlocked,
      progress,
      target,
      unlockDate: unlocked ? new Date() : undefined,
      reason
    };
  }

  // 评估阈值规则
  private evaluateThresholdRule(rule: BadgeRule, userBehavior: UserBehaviorData): boolean {
    const currentValue = this.getMetricValue(rule.metric, userBehavior);
    return currentValue >= (rule.threshold || 0);
  }

  // 评估连续行为规则
  private evaluateStreakRule(rule: BadgeRule, userBehavior: UserBehaviorData): boolean {
    const currentStreak = this.getStreakValue(rule.metric, userBehavior);
    return currentStreak >= (rule.streakDays || 0);
  }

  // 评估组合规则
  private evaluateComboRule(rule: BadgeRule, userBehavior: UserBehaviorData): boolean {
    if (!rule.comboActions) return false;
    
    // 这里实现复杂的组合逻辑
    // 例如：dedicated_learner 需要同时满足多个条件
    if (rule.id === 'dedicated_learner') {
      const wordsCollected = userBehavior.wordsCollected;
      const reviewsCompleted = userBehavior.reviewSessionsCompleted;
      const currentStreak = userBehavior.dailyCheckinStreak;
      
      return wordsCollected >= 50 && reviewsCompleted >= 20 && currentStreak >= 15;
    }
    
    return false;
  }

  // 获取指标值
  private getMetricValue(metric: BadgeMetric, userBehavior: UserBehaviorData): number {
    switch (metric) {
      case 'words_collected_total':
        return userBehavior.wordsCollected;
      case 'review_sessions_completed':
        return userBehavior.reviewSessionsCompleted;
      case 'daily_checkin_streak':
        return userBehavior.dailyCheckinStreak;
      case 'words_contributed':
        return userBehavior.wordsContributed;
      case 'learning_time_hours':
        return userBehavior.learningTimeHours;
      case 'showlist_created':
        return userBehavior.showlistCreated;
      default:
        return 0;
    }
  }

  // 获取连续行为值
  private getStreakValue(metric: BadgeMetric, userBehavior: UserBehaviorData): number {
    if (metric === 'daily_checkin_streak') {
      return userBehavior.dailyCheckinStreak;
    }
    
    // 从streakData中查找对应的连续行为
    const streakInfo = userBehavior.streakData.find(s => {
      switch (metric) {
        case 'words_collected_total':
          return s.type === 'learning';
        case 'review_sessions_completed':
          return s.type === 'review';
        default:
          return false;
      }
    });
    
    return streakInfo?.currentStreak || 0;
  }

  // 计算组合规则进度
  private calculateComboProgress(rule: BadgeRule, userBehavior: UserBehaviorData): number {
    if (rule.id === 'dedicated_learner') {
      const wordsProgress = Math.min(userBehavior.wordsCollected / 50, 1);
      const reviewsProgress = Math.min(userBehavior.reviewSessionsCompleted / 20, 1);
      const streakProgress = Math.min(userBehavior.dailyCheckinStreak / 15, 1);
      
      return Math.round((wordsProgress + reviewsProgress + streakProgress) / 3 * 100);
    }
    
    return 0;
  }

  // 检查新解锁的徽章
  async checkNewUnlocks(
    userId: string,
    previousResults: BadgeUnlockResult[],
    currentResults: BadgeUnlockResult[]
  ): Promise<BadgeUnlockResult[]> {
    const newUnlocks: BadgeUnlockResult[] = [];
    
    for (const current of currentResults) {
      const previous = previousResults.find(p => p.badgeId === current.badgeId);
      
      if (current.unlocked && (!previous || !previous.unlocked)) {
        newUnlocks.push(current);
      }
    }
    
    return newUnlocks;
  }

  // 获取用户徽章进度摘要
  async getUserBadgeSummary(userId: string): Promise<{
    totalBadges: number;
    unlockedBadges: number;
    progressPercentage: number;
    nextBadge?: BadgeUnlockResult;
  }> {
    // 这里应该从数据库获取用户行为数据
    // 暂时返回模拟数据
    return {
      totalBadges: this.badgeRules.length,
      unlockedBadges: 0,
      progressPercentage: 0,
      nextBadge: undefined
    };
  }
}

export default BadgeRuleEngine.getInstance();
