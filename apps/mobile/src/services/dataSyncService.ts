import AsyncStorage from '@react-native-async-storage/async-storage';
import { LearningStatsService } from './learningStatsService';
import { UserService } from './userService';
import { wordService } from './wordService';

// 数据同步服务
export class DataSyncService {
  private static instance: DataSyncService;
  private learningStatsService = LearningStatsService.getInstance();
  private userService = UserService.getInstance();
  private wordService = wordService;

  private readonly SYNC_KEYS = {
    LAST_SYNC_TIME: 'last_sync_time',
    USER_STATS: 'user_stats_cache',
    USER_VOCABULARY: 'user_vocabulary_cache',
    BADGES: 'badges_cache',
  };

  private constructor() {}

  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  // 同步所有数据
  async syncAllData(): Promise<boolean> {
    try {
      console.log('🔄 开始同步所有数据...');
      
      const userLoginInfo = await this.userService.getUserLoginInfo();
      if (!userLoginInfo) {
        console.log('🔍 用户未登录，使用游客模式同步数据');
        // 游客模式下仍然可以同步本地数据
      }

      // 并行同步各种数据
      const results = await Promise.allSettled([
        this.syncUserStats(),
        this.syncBadges(),
      ]);

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      console.log(`✅ 数据同步完成: ${successCount}/${results.length} 成功`);

      // 更新同步时间
      await AsyncStorage.setItem(this.SYNC_KEYS.LAST_SYNC_TIME, Date.now().toString());

      return successCount > 0;
    } catch (error) {
      console.error('❌ 数据同步失败:', error);
      return false;
    }
  }

  // 同步用户统计
  async syncUserStats(): Promise<void> {
    try {
      console.log('📊 同步用户统计...');
      const stats = await this.learningStatsService.getLearningStats();
      await AsyncStorage.setItem(this.SYNC_KEYS.USER_STATS, JSON.stringify(stats));
      console.log('✅ 用户统计同步完成');
    } catch (error) {
      console.error('❌ 用户统计同步失败:', error);
      throw error;
    }
  }



  // 同步奖章数据
  async syncBadges(): Promise<void> {
    try {
      console.log('🏅 同步奖章数据...');
      const badges = await this.learningStatsService.getBadges();
      await AsyncStorage.setItem(this.SYNC_KEYS.BADGES, JSON.stringify(badges));
      console.log('✅ 奖章数据同步完成');
    } catch (error) {
      console.error('❌ 奖章数据同步失败:', error);
      throw error;
    }
  }

  // 获取缓存的用户统计
  async getCachedUserStats(): Promise<any> {
    try {
      const cached = await AsyncStorage.getItem(this.SYNC_KEYS.USER_STATS);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('❌ 获取缓存用户统计失败:', error);
      return null;
    }
  }

  // 获取缓存的用户词汇
  async getCachedUserVocabulary(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(this.SYNC_KEYS.USER_VOCABULARY);
      if (cached) {
        return JSON.parse(cached);
      }
      return [];
    } catch (error) {
      console.error('❌ 获取缓存用户词汇失败:', error);
      return [];
    }
  }

  // 获取缓存的奖章数据
  async getCachedBadges(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(this.SYNC_KEYS.BADGES);
      if (cached) {
        return JSON.parse(cached);
      }
      return [];
    } catch (error) {
      console.error('❌ 获取缓存奖章数据失败:', error);
      return [];
    }
  }

  // 检查是否需要同步
  async shouldSync(): Promise<boolean> {
    try {
      const lastSyncTime = await AsyncStorage.getItem(this.SYNC_KEYS.LAST_SYNC_TIME);
      if (!lastSyncTime) {
        return true; // 从未同步过
      }

      const timeDiff = Date.now() - parseInt(lastSyncTime);
      const syncInterval = 5 * 60 * 1000; // 5分钟

      return timeDiff > syncInterval;
    } catch (error) {
      console.error('❌ 检查同步状态失败:', error);
      return true; // 出错时默认需要同步
    }
  }

  // 强制同步
  async forceSync(): Promise<boolean> {
    try {
      console.log('🔄 强制同步数据...');
      return await this.syncAllData();
    } catch (error) {
      console.error('❌ 强制同步失败:', error);
      return false;
    }
  }

  // 清除所有缓存
  async clearAllCache(): Promise<void> {
    try {
      console.log('🗑️ 清除所有缓存...');
      await Promise.all([
        AsyncStorage.removeItem(this.SYNC_KEYS.LAST_SYNC_TIME),
        AsyncStorage.removeItem(this.SYNC_KEYS.USER_STATS),
        AsyncStorage.removeItem(this.SYNC_KEYS.USER_VOCABULARY),
        AsyncStorage.removeItem(this.SYNC_KEYS.BADGES),
      ]);
      console.log('✅ 缓存清除完成');
    } catch (error) {
      console.error('❌ 清除缓存失败:', error);
    }
  }

  // 清除搜索历史
  async clearSearchHistory(): Promise<void> {
    try {
      console.log('🗑️ 开始清除搜索历史...');
      
      // 调用后端 API 清除数据库中的搜索历史
      const apiUrl = 'https://dramawordv2.onrender.com/api/words/clear-user-history';
      console.log('📡 调用 API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 API 响应状态:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 清除搜索历史 API 调用失败:', response.status, errorText);
        throw new Error(`API 调用失败: ${response.status} - ${errorText}`);
      } else {
        const result = await response.json();
        console.log('✅ 后端搜索历史清除完成:', result);
      }
      
      // 同时清除前端的缓存
      await AsyncStorage.removeItem('search_history');
      console.log('✅ 前端搜索历史缓存清除完成');
      
      console.log('✅ 搜索历史清除全部完成');
    } catch (error) {
      console.error('❌ 清除搜索历史失败:', error);
      // 即使 API 调用失败，也要清除前端缓存
      try {
        await AsyncStorage.removeItem('search_history');
        console.log('✅ 前端搜索历史缓存清除完成（API 失败后的备用清除）');
      } catch (localError) {
        console.error('❌ 清除前端缓存也失败:', localError);
      }
    }
  }

  // 清除新建的单词本数据
  async clearNewWordbook(): Promise<void> {
    try {
      console.log('🗑️ 清除新建的单词本数据...');
      await AsyncStorage.removeItem('new_wordbook');
      console.log('✅ 新建单词本数据清除完成');
    } catch (error) {
      console.error('❌ 清除新建单词本数据失败:', error);
    }
  }

  // 同步本地搜索历史到云端
  async syncLocalSearchHistoryToCloud(): Promise<void> {
    try {
      const local = await AsyncStorage.getItem('search_history');
      if (!local) return;
      const history = JSON.parse(local);
      if (!Array.isArray(history) || history.length === 0) return;
      let successCount = 0;
      for (const item of history) {
        // 逐条上传到云端
        const ok = await wordService.saveSearchHistory(item.word, item.translation);
        if (ok) successCount++;
      }
      // 上传成功后清空本地历史
      if (successCount > 0) {
        await AsyncStorage.removeItem('search_history');
        console.log(`✅ 本地历史已同步到云端并清空（共${successCount}条）`);
      }
    } catch (e) {
      console.error('❌ 同步本地历史到云端失败:', e);
    }
  }

  // 获取同步状态
  async getSyncStatus(): Promise<{
    lastSyncTime: number | null;
    shouldSync: boolean;
    hasCachedData: boolean;
  }> {
    try {
      const lastSyncTime = await AsyncStorage.getItem(this.SYNC_KEYS.LAST_SYNC_TIME);
      const shouldSync = await this.shouldSync();
      const hasCachedData = !!(await this.getCachedUserStats());

      return {
        lastSyncTime: lastSyncTime ? parseInt(lastSyncTime) : null,
        shouldSync,
        hasCachedData,
      };
    } catch (error) {
      console.error('❌ 获取同步状态失败:', error);
      return {
        lastSyncTime: null,
        shouldSync: true,
        hasCachedData: false,
      };
    }
  }
} 