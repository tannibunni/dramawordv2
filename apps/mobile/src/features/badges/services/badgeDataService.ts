import AsyncStorage from '@react-native-async-storage/async-storage';
import { BadgeDefinition, UserBadgeProgress } from '../types/badge';
import { BadgeUnlockResult, UserBehaviorData } from './badgeRuleEngine';

// 存储键名
const STORAGE_KEYS = {
  USER_BADGE_PROGRESS: 'badge_user_progress_',
  USER_BEHAVIOR: 'badge_user_behavior_',
  BADGE_DEFINITIONS: 'badge_definitions',
  BADGE_UNLOCK_HISTORY: 'badge_unlock_history_',
  LAST_SYNC_TIME: 'badge_last_sync_',
};

export class BadgeDataService {
  private static instance: BadgeDataService;

  private constructor() {}

  static getInstance(): BadgeDataService {
    if (!BadgeDataService.instance) {
      BadgeDataService.instance = new BadgeDataService();
    }
    return BadgeDataService.instance;
  }

  // 保存用户徽章进度
  async saveUserBadgeProgress(userId: string, progress: UserBadgeProgress[]): Promise<void> {
    try {
      const key = STORAGE_KEYS.USER_BADGE_PROGRESS + userId;
      await AsyncStorage.setItem(key, JSON.stringify(progress));
      console.log(`[BadgeDataService] 保存用户徽章进度成功: ${userId}`);
    } catch (error) {
      console.error(`[BadgeDataService] 保存用户徽章进度失败:`, error);
      throw error;
    }
  }

  // 获取用户徽章进度
  async getUserBadgeProgress(userId: string): Promise<UserBadgeProgress[]> {
    try {
      const key = STORAGE_KEYS.USER_BADGE_PROGRESS + userId;
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        const progress = JSON.parse(data);
        // 转换日期字符串为Date对象
        return progress.map((item: any) => ({
          ...item,
          unlockedAt: item.unlockedAt ? new Date(item.unlockedAt) : undefined
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`[BadgeDataService] 获取用户徽章进度失败:`, error);
      return [];
    }
  }

  // 保存用户行为数据
  async saveUserBehavior(userId: string, behavior: UserBehaviorData): Promise<void> {
    try {
      const key = STORAGE_KEYS.USER_BEHAVIOR + userId;
      await AsyncStorage.setItem(key, JSON.stringify(behavior));
      console.log(`[BadgeDataService] 保存用户行为数据成功: ${userId}`);
    } catch (error) {
      console.error(`[BadgeDataService] 保存用户行为数据失败:`, error);
      throw error;
    }
  }

  // 获取用户行为数据
  async getUserBehavior(userId: string): Promise<UserBehaviorData | null> {
    try {
      const key = STORAGE_KEYS.USER_BEHAVIOR + userId;
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        const behavior = JSON.parse(data);
        // 转换日期字符串为Date对象
        return {
          ...behavior,
          lastActivityDate: new Date(behavior.lastActivityDate),
          dailyStats: behavior.dailyStats || [],
          streakData: (behavior.streakData || []).map((item: any) => ({
            ...item,
            lastBreakDate: new Date(item.lastBreakDate)
          }))
        };
      }
      
      return null;
    } catch (error) {
      console.error(`[BadgeDataService] 获取用户行为数据失败:`, error);
      return null;
    }
  }

  // 保存徽章定义
  async saveBadgeDefinitions(definitions: BadgeDefinition[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BADGE_DEFINITIONS, JSON.stringify(definitions));
      console.log(`[BadgeDataService] 保存徽章定义成功: ${definitions.length} 个`);
    } catch (error) {
      console.error(`[BadgeDataService] 保存徽章定义失败:`, error);
      throw error;
    }
  }

  // 获取徽章定义
  async getBadgeDefinitions(): Promise<BadgeDefinition[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BADGE_DEFINITIONS);
      
      if (data) {
        return JSON.parse(data);
      }
      
      return [];
    } catch (error) {
      console.error(`[BadgeDataService] 获取徽章定义失败:`, error);
      return [];
    }
  }

  // 保存徽章解锁历史
  async saveBadgeUnlockHistory(userId: string, unlock: BadgeUnlockResult): Promise<void> {
    try {
      const key = STORAGE_KEYS.BADGE_UNLOCK_HISTORY + userId;
      const existingData = await AsyncStorage.getItem(key);
      let history: BadgeUnlockResult[] = [];
      
      if (existingData) {
        history = JSON.parse(existingData);
      }
      
      // 添加新的解锁记录
      history.push({
        ...unlock,
        unlockDate: new Date()
      });
      
      // 只保留最近100条记录
      if (history.length > 100) {
        history = history.slice(-100);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(history));
      console.log(`[BadgeDataService] 保存徽章解锁历史成功: ${userId} - ${unlock.badgeId}`);
    } catch (error) {
      console.error(`[BadgeDataService] 保存徽章解锁历史失败:`, error);
      throw error;
    }
  }

  // 获取徽章解锁历史
  async getBadgeUnlockHistory(userId: string): Promise<BadgeUnlockResult[]> {
    try {
      const key = STORAGE_KEYS.BADGE_UNLOCK_HISTORY + userId;
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        const history = JSON.parse(data);
        // 转换日期字符串为Date对象
        return history.map((item: any) => ({
          ...item,
          unlockDate: new Date(item.unlockDate)
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`[BadgeDataService] 获取徽章解锁历史失败:`, error);
      return [];
    }
  }

  // 更新单个徽章进度
  async updateBadgeProgress(userId: string, badgeId: string, progress: Partial<UserBadgeProgress>): Promise<void> {
    try {
      const currentProgress = await this.getUserBadgeProgress(userId);
      const existingIndex = currentProgress.findIndex(p => p.badgeId === badgeId);
      
      if (existingIndex >= 0) {
        // 更新现有进度
        currentProgress[existingIndex] = {
          ...currentProgress[existingIndex],
          ...progress
        };
      } else {
        // 创建新进度记录
        const newProgress: UserBadgeProgress = {
          userId,
          badgeId,
          unlocked: progress.unlocked || false,
          progress: progress.progress || 0,
          target: progress.target || 0,
          unlockedAt: progress.unlockedAt,
          status: progress.status || 'locked',
          hasBeenOpened: progress.hasBeenOpened || false
        };
        currentProgress.push(newProgress);
      }
      
      await this.saveUserBadgeProgress(userId, currentProgress);
      console.log(`[BadgeDataService] 更新徽章进度成功: ${userId} - ${badgeId}`);
    } catch (error) {
      console.error(`[BadgeDataService] 更新徽章进度失败:`, error);
      throw error;
    }
  }

  // 批量更新徽章进度
  async batchUpdateBadgeProgress(userId: string, progressUpdates: BadgeUnlockResult[]): Promise<void> {
    try {
      const currentProgress = await this.getUserBadgeProgress(userId);
      
      for (const update of progressUpdates) {
        const existingIndex = currentProgress.findIndex(p => p.badgeId === update.badgeId);
        
        if (existingIndex >= 0) {
          currentProgress[existingIndex] = {
            ...currentProgress[existingIndex],
            unlocked: update.unlocked,
            progress: update.progress,
            target: update.target,
            unlockedAt: update.unlockDate
          };
        } else {
          const newProgress: UserBadgeProgress = {
            userId,
            badgeId: update.badgeId,
            unlocked: update.unlocked,
            progress: update.progress,
            target: update.target,
            unlockedAt: update.unlockDate,
            status: update.unlocked ? 'unlocked' : 'locked',
            hasBeenOpened: update.unlocked
          };
          currentProgress.push(newProgress);
        }
      }
      
      await this.saveUserBadgeProgress(userId, currentProgress);
      console.log(`[BadgeDataService] 批量更新徽章进度成功: ${userId} - ${progressUpdates.length} 个`);
    } catch (error) {
      console.error(`[BadgeDataService] 批量更新徽章进度失败:`, error);
      throw error;
    }
  }

  // 获取用户徽章统计
  async getUserBadgeStats(userId: string): Promise<{
    totalBadges: number;
    unlockedBadges: number;
    progressPercentage: number;
    recentUnlocks: BadgeUnlockResult[];
  }> {
    try {
      const progress = await this.getUserBadgeProgress(userId);
      const history = await this.getBadgeUnlockHistory(userId);
      
      const unlockedBadges = progress.filter(p => p.unlocked).length;
      const totalBadges = progress.length;
      const progressPercentage = totalBadges > 0 ? Math.round((unlockedBadges / totalBadges) * 100) : 0;
      
      // 获取最近5个解锁的徽章
      const recentUnlocks = history
        .filter(unlock => unlock.unlocked && unlock.unlockDate)
        .sort((a, b) => (b.unlockDate?.getTime() || 0) - (a.unlockDate?.getTime() || 0))
        .slice(0, 5);
      
      return {
        totalBadges,
        unlockedBadges,
        progressPercentage,
        recentUnlocks
      };
    } catch (error) {
      console.error(`[BadgeDataService] 获取用户徽章统计失败:`, error);
      return {
        totalBadges: 0,
        unlockedBadges: 0,
        progressPercentage: 0,
        recentUnlocks: []
      };
    }
  }

  // 清除用户徽章数据
  async clearUserBadgeData(userId: string): Promise<void> {
    try {
      const keys = [
        STORAGE_KEYS.USER_BADGE_PROGRESS + userId,
        STORAGE_KEYS.USER_BEHAVIOR + userId,
        STORAGE_KEYS.BADGE_UNLOCK_HISTORY + userId
      ];
      
      await AsyncStorage.multiRemove(keys);
      console.log(`[BadgeDataService] 清除用户徽章数据成功: ${userId}`);
    } catch (error) {
      console.error(`[BadgeDataService] 清除用户徽章数据失败:`, error);
      throw error;
    }
  }

  // 设置最后同步时间
  async setLastSyncTime(userId: string): Promise<void> {
    try {
      const key = STORAGE_KEYS.LAST_SYNC_TIME + userId;
      await AsyncStorage.setItem(key, Date.now().toString());
    } catch (error) {
      console.error(`[BadgeDataService] 设置最后同步时间失败:`, error);
    }
  }

  // 获取最后同步时间
  async getLastSyncTime(userId: string): Promise<number | null> {
    try {
      const key = STORAGE_KEYS.LAST_SYNC_TIME + userId;
      const data = await AsyncStorage.getItem(key);
      return data ? parseInt(data) : null;
    } catch (error) {
      console.error(`[BadgeDataService] 获取最后同步时间失败:`, error);
      return null;
    }
  }

  // 检查是否需要同步
  async shouldSync(userId: string, syncInterval: number = 5 * 60 * 1000): Promise<boolean> {
    try {
      const lastSync = await this.getLastSyncTime(userId);
      if (!lastSync) return true;
      
      const timeSinceLastSync = Date.now() - lastSync;
      return timeSinceLastSync > syncInterval;
    } catch (error) {
      console.error(`[BadgeDataService] 检查同步状态失败:`, error);
      return true;
    }
  }

  // 导出用户徽章数据（用于备份）
  async exportUserBadgeData(userId: string): Promise<string> {
    try {
      const [progress, behavior, history] = await Promise.all([
        this.getUserBadgeProgress(userId),
        this.getUserBehavior(userId),
        this.getBadgeUnlockHistory(userId)
      ]);
      
      const exportData = {
        userId,
        exportDate: new Date().toISOString(),
        progress,
        behavior,
        history
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error(`[BadgeDataService] 导出用户徽章数据失败:`, error);
      throw error;
    }
  }

  // 导入用户徽章数据（用于恢复）
  async importUserBadgeData(userId: string, data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);
      
      if (importData.userId !== userId) {
        throw new Error('导入数据用户ID不匹配');
      }
      
      await Promise.all([
        this.saveUserBadgeProgress(userId, importData.progress || []),
        this.saveUserBehavior(userId, importData.behavior),
        ...(importData.history || []).map((unlock: any) => this.saveBadgeUnlockHistory(userId, unlock))
      ]);
      
      console.log(`[BadgeDataService] 导入用户徽章数据成功: ${userId}`);
    } catch (error) {
      console.error(`[BadgeDataService] 导入用户徽章数据失败:`, error);
      throw error;
    }
  }
}

export default BadgeDataService.getInstance();
