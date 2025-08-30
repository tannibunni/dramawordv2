import { BadgeRuleEngine, UserBehaviorData, BadgeUnlockResult } from './badgeRuleEngine';
import { BadgeMetric } from '../types/badge';

// 徽章事件类型
export type BadgeEventType = 
  | 'word_collected'
  | 'review_completed'
  | 'daily_checkin'
  | 'word_contributed'
  | 'showlist_created'
  | 'learning_time_updated';

// 徽章事件数据
export interface BadgeEvent {
  type: BadgeEventType;
  userId: string;
  timestamp: Date;
  data: {
    [key: string]: any;
  };
}

// 徽章解锁通知
export interface BadgeUnlockNotification {
  badgeId: string;
  badgeName: string;
  description: string;
  unlockDate: Date;
  userId: string;
}

export class BadgeEventService {
  private static instance: BadgeEventService;
  private eventListeners: Map<BadgeEventType, Function[]> = new Map();
  private badgeRuleEngine: BadgeRuleEngine;
  private userBehaviorCache: Map<string, UserBehaviorData> = new Map();

  private constructor() {
    this.badgeRuleEngine = BadgeRuleEngine.getInstance();
    this.initializeEventListeners();
  }

  static getInstance(): BadgeEventService {
    if (!BadgeEventService.instance) {
      BadgeEventService.instance = new BadgeEventService();
    }
    return BadgeEventService.instance;
  }

  // 初始化事件监听器
  private initializeEventListeners() {
    // 监听单词收藏事件
    this.addEventListener('word_collected', async (event: BadgeEvent) => {
      await this.handleWordCollected(event);
    });

    // 监听复习完成事件
    this.addEventListener('review_completed', async (event: BadgeEvent) => {
      await this.handleReviewCompleted(event);
    });

    // 监听每日签到事件
    this.addEventListener('daily_checkin', async (event: BadgeEvent) => {
      await this.handleDailyCheckin(event);
    });

    // 监听词条贡献事件
    this.addEventListener('word_contributed', async (event: BadgeEvent) => {
      await this.handleWordContributed(event);
    });

    // 监听剧单创建事件
    this.addEventListener('showlist_created', async (event: BadgeEvent) => {
      await this.handleShowlistCreated(event);
    });

    // 监听学习时间更新事件
    this.addEventListener('learning_time_updated', async (event: BadgeEvent) => {
      await this.handleLearningTimeUpdated(event);
    });
  }

  // 添加事件监听器
  addEventListener(eventType: BadgeEventType, listener: Function) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  // 移除事件监听器
  removeEventListener(eventType: BadgeEventType, listener: Function) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 触发事件
  async triggerEvent(event: BadgeEvent) {
    console.log(`[BadgeEventService] 触发徽章事件: ${event.type}`, event);
    
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          await listener(event);
        } catch (error) {
          console.error(`[BadgeEventService] 事件监听器执行失败:`, error);
        }
      }
    }
  }

  // 处理单词收藏事件
  private async handleWordCollected(event: BadgeEvent) {
    const { userId, data } = event;
    const behavior = await this.getUserBehavior(userId);
    
    // 更新单词收藏数量
    behavior.wordsCollected += 1;
    behavior.lastActivityDate = new Date();
    
    // 更新每日统计
    this.updateDailyStats(behavior, 'wordsCollected', 1);
    
    // 检查徽章解锁
    await this.checkBadgeUnlocks(userId, behavior);
  }

  // 处理复习完成事件
  private async handleReviewCompleted(event: BadgeEvent) {
    const { userId, data } = event;
    const behavior = await this.getUserBehavior(userId);
    
    // 更新复习次数
    behavior.reviewSessionsCompleted += 1;
    behavior.lastActivityDate = new Date();
    
    // 更新每日统计
    this.updateDailyStats(behavior, 'reviewsCompleted', 1);
    
    // 检查徽章解锁
    await this.checkBadgeUnlocks(userId, behavior);
  }

  // 处理每日签到事件
  private async handleDailyCheckin(event: BadgeEvent) {
    const { userId, data } = event;
    const behavior = await this.getUserBehavior(userId);
    
    // 更新连续签到天数
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    if (this.isConsecutiveDay(behavior.lastActivityDate, yesterday)) {
      behavior.dailyCheckinStreak += 1;
    } else {
      behavior.dailyCheckinStreak = 1;
    }
    
    behavior.lastActivityDate = new Date();
    
    // 更新连续行为数据
    this.updateStreakData(behavior, 'daily_checkin', behavior.dailyCheckinStreak);
    
    // 检查徽章解锁
    await this.checkBadgeUnlocks(userId, behavior);
  }

  // 处理词条贡献事件
  private async handleWordContributed(event: BadgeEvent) {
    const { userId, data } = event;
    const behavior = await this.getUserBehavior(userId);
    
    behavior.wordsContributed += 1;
    behavior.lastActivityDate = new Date();
    
    await this.checkBadgeUnlocks(userId, behavior);
  }

  // 处理剧单创建事件
  private async handleShowlistCreated(event: BadgeEvent) {
    const { userId, data } = event;
    const behavior = await this.getUserBehavior(userId);
    
    behavior.showlistCreated += 1;
    behavior.lastActivityDate = new Date();
    
    await this.checkBadgeUnlocks(userId, behavior);
  }

  // 处理学习时间更新事件
  private async handleLearningTimeUpdated(event: BadgeEvent) {
    const { userId, data } = event;
    const behavior = await this.getUserBehavior(userId);
    
    const additionalHours = data.hours || 0;
    behavior.learningTimeHours += additionalHours;
    behavior.lastActivityDate = new Date();
    
    // 更新每日统计
    this.updateDailyStats(behavior, 'learningTime', additionalHours);
    
    await this.checkBadgeUnlocks(userId, behavior);
  }

  // 获取用户行为数据
  private async getUserBehavior(userId: string): Promise<UserBehaviorData> {
    // 检查缓存
    if (this.userBehaviorCache.has(userId)) {
      return this.userBehaviorCache.get(userId)!;
    }

    // 从BadgeDataService获取用户行为数据
    const badgeDataService = (await import('./badgeDataService')).default;
    let behavior = await badgeDataService.getUserBehavior(userId);
    
    if (!behavior) {
      // 如果用户行为数据不存在，从实际数据源计算
      behavior = await this.calculateUserBehaviorFromActualData(userId);
      // 保存计算出的行为数据
      await badgeDataService.saveUserBehavior(userId, behavior);
    }

    // 缓存数据
    this.userBehaviorCache.set(userId, behavior);
    return behavior;
  }

  // 从实际数据源计算用户行为数据
  private async calculateUserBehaviorFromActualData(userId: string): Promise<UserBehaviorData> {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    
    try {
      // 从词汇表数据计算收藏的单词数量
      const vocabularyData = await AsyncStorage.getItem('user_vocabulary');
      let wordsCollected = 0;
      
      if (vocabularyData) {
        const vocabulary = JSON.parse(vocabularyData);
        wordsCollected = vocabulary.length;
      }

      // 从学习数据计算复习次数
      const learningData = await AsyncStorage.getItem('learning_records');
      let reviewSessionsCompleted = 0;
      
      if (learningData) {
        const records = JSON.parse(learningData);
        // 计算不同日期的复习会话数
        const uniqueDates = new Set(records.map((r: any) => r.date));
        reviewSessionsCompleted = uniqueDates.size;
      }

      const behavior: UserBehaviorData = {
        userId,
        wordsCollected,
        reviewSessionsCompleted,
        dailyCheckinStreak: 0, // 需要从签到数据计算
        wordsContributed: 0, // 需要从贡献数据计算
        learningTimeHours: 0, // 需要从学习时间数据计算
        showlistCreated: 0, // 需要从剧单数据计算
        lastActivityDate: new Date(),
        dailyStats: [],
        streakData: []
      };

      console.log(`[BadgeEventService] 计算用户行为数据: ${userId}`, {
        wordsCollected,
        reviewSessionsCompleted
      });

      return behavior;
    } catch (error) {
      console.error(`[BadgeEventService] 计算用户行为数据失败:`, error);
      
      // 返回默认数据
      return {
        userId,
        wordsCollected: 0,
        reviewSessionsCompleted: 0,
        dailyCheckinStreak: 0,
        wordsContributed: 0,
        learningTimeHours: 0,
        showlistCreated: 0,
        lastActivityDate: new Date(),
        dailyStats: [],
        streakData: []
      };
    }
  }

  // 更新每日统计
  private updateDailyStats(behavior: UserBehaviorData, metric: string, value: number) {
    const today = new Date().toDateString();
    let dailyStat = behavior.dailyStats.find(s => s.date === today);
    
    if (!dailyStat) {
      dailyStat = {
        date: today,
        wordsCollected: 0,
        reviewsCompleted: 0,
        learningTime: 0
      };
      behavior.dailyStats.push(dailyStat);
    }
    
    switch (metric) {
      case 'wordsCollected':
        dailyStat.wordsCollected += value;
        break;
      case 'reviewsCompleted':
        dailyStat.reviewsCompleted += value;
        break;
      case 'learningTime':
        dailyStat.learningTime += value;
        break;
    }
  }

  // 更新连续行为数据
  private updateStreakData(behavior: UserBehaviorData, type: string, currentStreak: number) {
    let streakInfo = behavior.streakData.find(s => s.type === type as any);
    
    if (!streakInfo) {
      streakInfo = {
        type: type as any,
        currentStreak: 0,
        longestStreak: 0,
        lastBreakDate: new Date()
      };
      behavior.streakData.push(streakInfo);
    }
    
    streakInfo.currentStreak = currentStreak;
    if (currentStreak > streakInfo.longestStreak) {
      streakInfo.longestStreak = currentStreak;
    }
  }

  // 检查是否为连续日期
  private isConsecutiveDay(lastDate: Date, expectedDate: string): boolean {
    return lastDate.toDateString() === expectedDate;
  }

  // 检查徽章解锁
  private async checkBadgeUnlocks(userId: string, behavior: UserBehaviorData) {
    try {
      // 获取当前徽章状态
      const currentResults = await this.badgeRuleEngine.evaluateUserBadges(userId, behavior);
      
      // 获取之前的徽章状态（这里应该从数据库获取）
      const previousResults: BadgeUnlockResult[] = [];
      
      // 检查新解锁的徽章
      const newUnlocks = await this.badgeRuleEngine.checkNewUnlocks(
        userId, 
        previousResults, 
        currentResults
      );
      
      // 处理新解锁的徽章
      for (const unlock of newUnlocks) {
        await this.handleBadgeUnlock(userId, unlock);
      }
      
      // 保存用户行为数据
      await this.saveUserBehavior(userId, behavior);
      
    } catch (error) {
      console.error(`[BadgeEventService] 检查徽章解锁失败:`, error);
    }
  }

  // 处理徽章解锁
  private async handleBadgeUnlock(userId: string, unlock: BadgeUnlockResult) {
    console.log(`🎉 [BadgeEventService] 用户 ${userId} 解锁徽章: ${unlock.badgeId}`);
    
    // 发送解锁通知
    const notification: BadgeUnlockNotification = {
      badgeId: unlock.badgeId,
      badgeName: unlock.badgeId, // 这里应该获取徽章名称
      description: unlock.reason || '恭喜解锁新徽章！',
      unlockDate: unlock.unlockDate || new Date(),
      userId
    };
    
    // 这里应该实现通知发送逻辑
    await this.sendBadgeUnlockNotification(notification);
    
    // 更新徽章进度
    await this.updateBadgeProgress(userId, unlock);
  }

  // 发送徽章解锁通知
  private async sendBadgeUnlockNotification(notification: BadgeUnlockNotification) {
    // 这里应该实现通知发送逻辑
    // 可以是本地通知、推送通知等
    console.log(`📢 [BadgeEventService] 发送徽章解锁通知:`, notification);
  }

  // 更新徽章进度
  private async updateBadgeProgress(userId: string, unlock: BadgeUnlockResult) {
    // 这里应该实现徽章进度更新逻辑
    // 保存到数据库或本地存储
    console.log(`💾 [BadgeEventService] 更新徽章进度:`, { userId, unlock });
  }

  // 保存用户行为数据
  private async saveUserBehavior(userId: string, behavior: UserBehaviorData) {
    try {
      const badgeDataService = (await import('./badgeDataService')).default;
      await badgeDataService.saveUserBehavior(userId, behavior);
      console.log(`💾 [BadgeEventService] 保存用户行为数据成功:`, { userId, wordsCollected: behavior.wordsCollected });
    } catch (error) {
      console.error(`💾 [BadgeEventService] 保存用户行为数据失败:`, error);
    }
  }

  // 手动触发徽章检查（用于测试或手动同步）
  async manualBadgeCheck(userId: string) {
    const behavior = await this.getUserBehavior(userId);
    await this.checkBadgeUnlocks(userId, behavior);
  }

  // 获取用户徽章摘要
  async getUserBadgeSummary(userId: string) {
    return await this.badgeRuleEngine.getUserBadgeSummary(userId);
  }
}

export default BadgeEventService.getInstance();
