import { BadgeDefinition, UserBadgeProgress } from '../types/badge';
import { BadgeRuleEngine, UserBehaviorData } from './badgeRuleEngine';
import { BadgeEventService } from './badgeEventService';
import { BadgeDataService } from './badgeDataService';

// 模拟徽章数据（实际应该从服务端获取）
const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'collector_10',
    name: '初级收藏家',
    description: '收集10个单词',
    icon: 'badge_collect_10.png',
    metric: 'words_collected_total',
    target: 10
  },
  {
    id: 'collector_50',
    name: '中级收藏家',
    description: '收集50个单词',
    icon: 'badge_collect_50.png',
    metric: 'words_collected_total',
    target: 50
  },
  {
    id: 'collector_100',
    name: '高级收藏家',
    description: '收集100个单词',
    icon: 'badge_collect_100.png',
    metric: 'words_collected_total',
    target: 100
  },
  {
    id: 'reviewer_10',
    name: '复习达人',
    description: '完成10次复习',
    icon: 'badge_review_10.png',
    metric: 'review_sessions_completed',
    target: 10
  },
  {
    id: 'streak_7',
    name: '坚持一周',
    description: '连续学习7天',
    icon: 'badge_streak_7.png',
    metric: 'daily_checkin_streak',
    target: 7
  },
  {
    id: 'streak_30',
    name: '月度达人',
    description: '连续学习30天',
    icon: 'badge_streak_30.png',
    metric: 'daily_checkin_streak',
    target: 30
  },
  {
    id: 'contributor_5',
    name: '贡献者',
    description: '贡献5个词条',
    icon: 'badge_contributor_5.png',
    metric: 'words_contributed',
    target: 5
  },
  {
    id: 'showlist_3',
    name: '剧集收藏家',
    description: '创建3个剧单',
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
  async getBadgeDefinitions(): Promise<BadgeDefinition[]> {
    try {
      // 首先尝试从本地存储获取
      let definitions = await this.badgeDataService.getBadgeDefinitions();
      
      if (definitions.length === 0) {
        // 如果本地没有，使用默认定义
        definitions = BADGE_DEFINITIONS;
        // 保存到本地存储
        await this.badgeDataService.saveBadgeDefinitions(definitions);
      }
      
      return definitions;
    } catch (error) {
      console.error('[BadgeService] 获取徽章定义失败:', error);
      return BADGE_DEFINITIONS;
    }
  }

  // 获取用户徽章进度（基于规则引擎计算）
  async getUserBadgeProgress(userId: string): Promise<UserBadgeProgress[]> {
    try {
      // 获取用户行为数据
      let userBehavior = await this.badgeDataService.getUserBehavior(userId);
      
      if (!userBehavior) {
        // 如果用户行为数据不存在，创建默认数据
        userBehavior = {
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
        await this.badgeDataService.saveUserBehavior(userId, userBehavior);
      }
      
      // 使用规则引擎评估徽章状态
      const unlockResults = await this.badgeRuleEngine.evaluateUserBadges(userId, userBehavior);
      
      // 转换为UserBadgeProgress格式
      const progress: UserBadgeProgress[] = unlockResults.map(result => ({
        userId,
        badgeId: result.badgeId,
        unlocked: result.unlocked,
        progress: result.progress,
        target: result.target,
        unlockedAt: result.unlockDate
      }));
      
      // 保存进度到本地存储
      await this.badgeDataService.batchUpdateBadgeProgress(userId, unlockResults);
      
      return progress;
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
