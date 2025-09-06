import { BadgeDefinition, UserBadgeProgress } from '../types/badge';
import { BadgeRuleEngine, UserBehaviorData } from './badgeRuleEngine';
import { BadgeEventService } from './badgeEventService';
import { BadgeDataService } from './badgeDataService';
import { t } from '../../../constants/translations';
import { AppLanguage } from '../../../constants/translations';

// 获取徽章定义（支持多语言）
const getBadgeDefinitions = (appLanguage: AppLanguage): BadgeDefinition[] => [
  {
    id: 'collector_10',
    name: t('badge_collector_10', appLanguage),
    description: t('badge_collect_words', appLanguage, { count: 10 }),
    icon: 'badge_collect_10.png',
    metric: 'words_collected_total',
    target: 10
  },
  {
    id: 'collector_50',
    name: t('badge_collector_50', appLanguage),
    description: t('badge_collect_words', appLanguage, { count: 50 }),
    icon: 'badge_collect_50.png',
    metric: 'words_collected_total',
    target: 50
  },
  {
    id: 'collector_100',
    name: t('badge_collector_100', appLanguage),
    description: t('badge_collect_words', appLanguage, { count: 100 }),
    icon: 'badge_collect_100.png',
    metric: 'words_collected_total',
    target: 100
  },
  {
    id: 'reviewer_10',
    name: t('badge_reviewer_10', appLanguage),
    description: t('badge_complete_reviews', appLanguage, { count: 10 }),
    icon: 'badge_review_10.png',
    metric: 'review_sessions_completed',
    target: 10
  },
  {
    id: 'streak_7',
    name: t('badge_streak_7', appLanguage),
    description: t('badge_streak_days', appLanguage, { count: 7 }),
    icon: 'badge_streak_7.png',
    metric: 'daily_checkin_streak',
    target: 7
  },
  {
    id: 'streak_30',
    name: t('badge_streak_30', appLanguage),
    description: t('badge_streak_days', appLanguage, { count: 30 }),
    icon: 'badge_streak_30.png',
    metric: 'daily_checkin_streak',
    target: 30
  },
  {
    id: 'contributor_5',
    name: t('badge_contributor_5', appLanguage),
    description: t('badge_contribute_words', appLanguage, { count: 5 }),
    icon: 'badge_contributor_5.png',
    metric: 'words_contributed',
    target: 5
  },
  {
    id: 'showlist_3',
    name: t('badge_showlist_3', appLanguage),
    description: t('badge_create_showlists', appLanguage, { count: 3 }),
    icon: 'badge_showlist_3.png',
    metric: 'showlist_created',
    target: 3
  }
];

export class BadgeService {
  private badgeRuleEngine: BadgeRuleEngine;
  private badgeEventService: BadgeEventService;
  private badgeDataService: BadgeDataService;

  constructor() {
    this.badgeRuleEngine = BadgeRuleEngine.getInstance();
    this.badgeEventService = BadgeEventService.getInstance();
    this.badgeDataService = BadgeDataService.getInstance();
  }

  // 获取所有徽章定义
  async getBadgeDefinitions(appLanguage: AppLanguage = 'zh-CN'): Promise<BadgeDefinition[]> {
    try {
      // 每次都根据当前语言重新生成徽章定义，确保翻译正确
      const definitions = getBadgeDefinitions(appLanguage);
      
      // 保存到本地存储（用于其他用途，但不会影响翻译）
      await this.badgeDataService.saveBadgeDefinitions(definitions);
      
      return definitions;
    } catch (error) {
      console.error('[BadgeService] 获取徽章定义失败:', error);
      return getBadgeDefinitions(appLanguage);
    }
  }

  // 获取用户徽章进度（基于规则引擎计算）
  async getUserBadgeProgress(userId: string): Promise<UserBadgeProgress[]> {
    try {
      // 获取所有徽章定义
      const badgeDefinitions = await this.getBadgeDefinitions();
      
      // 首先检查是否有手动设置的调试状态
      const debugProgress = await this.badgeDataService.getUserBadgeProgress(userId);
      if (debugProgress && debugProgress.length > 0) {
        console.log('[BadgeService] 使用调试状态数据，跳过规则引擎计算');
        console.log('[BadgeService] 调试状态数据:', debugProgress.map(p => ({ 
          badgeId: p.badgeId, 
          status: p.status, 
          unlocked: p.unlocked, 
          progress: p.progress 
        })));
        return debugProgress;
      }
      
      // 获取用户行为数据
      let userBehavior = await this.badgeDataService.getUserBehavior(userId);
      
      if (!userBehavior) {
        // 如果用户行为数据不存在，从实际数据源计算
        const badgeEventService = (await import('./badgeEventService')).default;
        userBehavior = await (badgeEventService as any).calculateUserBehaviorFromActualData(userId);
        if (userBehavior) {
          await this.badgeDataService.saveUserBehavior(userId, userBehavior);
          console.log(`[BadgeService] 初始化用户行为数据: ${userId}`, {
            wordsCollected: userBehavior.wordsCollected,
            reviewSessionsCompleted: userBehavior.reviewSessionsCompleted
          });
        }
      }
      
      // 使用规则引擎评估徽章状态
      if (userBehavior) {
        const unlockResults = await this.badgeRuleEngine.evaluateUserBadges(userId, userBehavior);
      
        // 确保所有徽章都有进度记录，支持中间态
        const progress: UserBadgeProgress[] = badgeDefinitions.map(badge => {
        const existingProgress = unlockResults.find(result => result.badgeId === badge.id);
        
        if (existingProgress) {
          // 计算徽章状态
          const isUnlocked = existingProgress.unlocked;
          const isReadyToUnlock = !isUnlocked && existingProgress.progress >= existingProgress.target;
          const status = isUnlocked ? 'unlocked' : (isReadyToUnlock ? 'ready_to_unlock' : 'locked');
          
          return {
            userId,
            badgeId: existingProgress.badgeId,
            unlocked: existingProgress.unlocked,
            progress: existingProgress.progress,
            target: existingProgress.target,
            unlockedAt: existingProgress.unlockDate,
            status,
            hasBeenOpened: isUnlocked // 已解锁的徽章视为已打开过
          };
        } else {
          // 如果规则引擎没有返回这个徽章的结果，创建默认的锁定状态
          return {
            userId,
            badgeId: badge.id,
            unlocked: false,
            progress: 0,
            target: badge.target,
            unlockedAt: undefined,
            status: 'locked' as const,
            hasBeenOpened: false
          };
        }
        });
        
        // 保存进度到本地存储
        await this.badgeDataService.batchUpdateBadgeProgress(userId, unlockResults);
        
        return progress;
      } else {
        // 如果无法获取用户行为数据，返回默认的锁定状态
        return badgeDefinitions.map(badge => ({
          userId,
          badgeId: badge.id,
          unlocked: false,
          progress: 0,
          target: badge.target,
          unlockedAt: undefined,
          status: 'locked' as const,
          hasBeenOpened: false
        }));
      }
    } catch (error) {
      console.error('[BadgeService] 获取用户徽章进度失败:', error);
      // 返回空数组作为fallback
      return [];
    }
  }

  // 获取徽章定义（根据ID）
  async getBadgeDefinition(badgeId: string): Promise<BadgeDefinition | null> {
    const badges = await this.getBadgeDefinitions();
    return badges.find(badge => badge.id === badgeId) || null;
  }

  // 获取用户特定徽章进度
  async getUserBadgeProgressById(userId: string, badgeId: string): Promise<UserBadgeProgress | null> {
    const allProgress = await this.getUserBadgeProgress(userId);
    return allProgress.find(progress => progress.badgeId === badgeId) || null;
  }

  // 触发徽章事件
  async triggerBadgeEvent(eventType: string, userId: string, data: any = {}) {
    try {
      const event = {
        type: eventType as any,
        userId,
        timestamp: new Date(),
        data
      };
      
      await this.badgeEventService.triggerEvent(event);
      console.log(`[BadgeService] 徽章事件触发成功: ${eventType}`, event);
    } catch (error) {
      console.error(`[BadgeService] 徽章事件触发失败: ${eventType}`, error);
    }
  }

  // 手动检查徽章解锁
  async checkBadgeUnlocks(userId: string) {
    try {
      await this.badgeEventService.manualBadgeCheck(userId);
      console.log(`[BadgeService] 手动徽章检查完成: ${userId}`);
    } catch (error) {
      console.error(`[BadgeService] 手动徽章检查失败: ${userId}`, error);
    }
  }

  // 获取用户徽章统计
  async getUserBadgeStats(userId: string) {
    try {
      return await this.badgeDataService.getUserBadgeStats(userId);
    } catch (error) {
      console.error(`[BadgeService] 获取用户徽章统计失败: ${userId}`, error);
      return {
        totalBadges: 0,
        unlockedBadges: 0,
        progressPercentage: 0,
        recentUnlocks: []
      };
    }
  }

  // 打开宝箱（将 ready_to_unlock 状态改为 unlocked）
  async openBadgeChest(userId: string, badgeId: string): Promise<boolean> {
    try {
      const progress = await this.getUserBadgeProgressById(userId, badgeId);
      
      if (!progress || progress.status !== 'ready_to_unlock') {
        console.warn(`[BadgeService] 徽章 ${badgeId} 不处于可打开状态`);
        return false;
      }
      
      // 更新徽章状态为已解锁
      const updatedProgress: UserBadgeProgress = {
        ...progress,
        unlocked: true,
        status: 'unlocked',
        hasBeenOpened: true,
        unlockedAt: new Date()
      };
      
      // 保存到本地存储
      await this.badgeDataService.updateBadgeProgress(userId, badgeId, updatedProgress);
      
      console.log(`[BadgeService] 成功打开宝箱: ${badgeId}`);
      return true;
    } catch (error) {
      console.error(`[BadgeService] 打开宝箱失败: ${badgeId}`, error);
      return false;
    }
  }

  // 清除用户徽章数据
  async clearUserBadgeData(userId: string) {
    try {
      await this.badgeDataService.clearUserBadgeData(userId);
      console.log(`[BadgeService] 清除用户徽章数据成功: ${userId}`);
    } catch (error) {
      console.error(`[BadgeService] 清除用户徽章数据失败: ${userId}`, error);
      throw error;
    }
  }
}

export default new BadgeService();
