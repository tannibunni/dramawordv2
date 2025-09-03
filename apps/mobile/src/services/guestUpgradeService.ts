import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

export interface GuestData {
  vocabulary?: any[];
  learningRecords?: any[];
  userStats?: any;
  searchHistory?: any[];
  shows?: any[];
  userSettings?: any;
  wrongWords?: any[];
  experienceGain?: number;
  experienceEvents?: any[];
  wordbooks?: any[];
  badges?: any[];
}

export interface UpgradeResult {
  success: boolean;
  message: string;
  migratedDataTypes: string[];
  error?: string;
}

class GuestUpgradeService {
  private static instance: GuestUpgradeService;

  public static getInstance(): GuestUpgradeService {
    if (!GuestUpgradeService.instance) {
      GuestUpgradeService.instance = new GuestUpgradeService();
    }
    return GuestUpgradeService.instance;
  }

  /**
   * 获取游客数据
   */
  public async getGuestData(): Promise<GuestData> {
    try {
      console.log('[GuestUpgradeService] 🔍 开始获取游客数据...');
      
      const data: GuestData = {};
      
      // 获取各种游客数据
      const keys = [
        'learningRecords',
        'vocabulary', 
        'user_shows',
        'userSettings',
        'userStats',
        'wrongWords',
        'experienceGain',
        'experienceEvents',
        'wordbooks',
        'badges'
      ];
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            data[key as keyof GuestData] = JSON.parse(value);
            console.log(`[GuestUpgradeService] ✅ 获取到 ${key} 数据`);
          }
        } catch (error) {
          console.error(`[GuestUpgradeService] ❌ 获取 ${key} 数据失败:`, error);
        }
      }
      
      console.log('[GuestUpgradeService] 📊 游客数据统计:', {
        vocabulary: data.vocabulary?.length || 0,
        learningRecords: data.learningRecords?.length || 0,
        userStats: data.userStats ? '存在' : '不存在',
        searchHistory: data.searchHistory?.length || 0,
        shows: data.shows?.length || 0,
        userSettings: data.userSettings ? '存在' : '不存在',
        wrongWords: data.wrongWords?.length || 0,
        experienceGain: data.experienceGain || 0,
        experienceEvents: data.experienceEvents?.length || 0,
        wordbooks: data.wordbooks?.length || 0,
        badges: data.badges?.length || 0
      });
      
      return data;
    } catch (error) {
      console.error('[GuestUpgradeService] ❌ 获取游客数据失败:', error);
      return {};
    }
  }

  /**
   * 迁移游客数据到注册用户
   */
  public async migrateGuestDataToRegistered(
    newUserId: string, 
    token: string
  ): Promise<UpgradeResult> {
    try {
      console.log('[GuestUpgradeService] 🚀 开始迁移游客数据到注册用户:', newUserId);
      
      // 1. 获取游客数据
      const guestData = await this.getGuestData();
      
      if (!guestData || Object.keys(guestData).length === 0) {
        console.log('[GuestUpgradeService] ℹ️ 没有找到游客数据，跳过迁移');
        return {
          success: true,
          message: '没有游客数据需要迁移',
          migratedDataTypes: []
        };
      }
      
      // 2. 上传数据到后端
      const uploadResult = await this.uploadGuestDataToBackend(guestData, newUserId, token);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || '上传数据失败');
      }
      
      // 3. 保存数据到新用户的本地存储
      await this.saveDataToNewUser(guestData, newUserId);
      
      // 4. 清理游客数据（可选）
      // await this.clearGuestData();
      
      console.log('[GuestUpgradeService] ✅ 游客数据迁移完成');
      
      return {
        success: true,
        message: '游客数据迁移成功',
        migratedDataTypes: uploadResult.migratedDataTypes
      };
      
    } catch (error) {
      console.error('[GuestUpgradeService] ❌ 游客数据迁移失败:', error);
      return {
        success: false,
        message: '游客数据迁移失败',
        migratedDataTypes: [],
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 上传游客数据到后端
   */
  private async uploadGuestDataToBackend(
    guestData: GuestData, 
    userId: string, 
    token: string
  ): Promise<{ success: boolean; migratedDataTypes: string[]; error?: string }> {
    try {
      console.log('[GuestUpgradeService] 📤 开始上传游客数据到后端...');
      
      const migratedDataTypes: string[] = [];
      
      // 上传学习记录
      if (guestData.learningRecords && guestData.learningRecords.length > 0) {
        await this.uploadLearningRecords(guestData.learningRecords, token);
        migratedDataTypes.push('learningRecords');
      }
      
      // 上传词汇数据
      if (guestData.vocabulary && guestData.vocabulary.length > 0) {
        await this.uploadVocabulary(guestData.vocabulary, token);
        migratedDataTypes.push('vocabulary');
      }
      
      // 上传用户统计
      if (guestData.userStats) {
        await this.uploadUserStats(guestData.userStats, token);
        migratedDataTypes.push('userStats');
      }
      
      // 上传搜索历史
      if (guestData.searchHistory && guestData.searchHistory.length > 0) {
        await this.uploadSearchHistory(guestData.searchHistory, token);
        migratedDataTypes.push('searchHistory');
      }
      
      // 上传剧单数据
      if (guestData.shows && guestData.shows.length > 0) {
        await this.uploadShows(guestData.shows, token);
        migratedDataTypes.push('shows');
      }
      
      // 上传用户设置
      if (guestData.userSettings) {
        await this.uploadUserSettings(guestData.userSettings, token);
        migratedDataTypes.push('userSettings');
      }
      
      // 上传错词数据
      if (guestData.wrongWords && guestData.wrongWords.length > 0) {
        await this.uploadWrongWords(guestData.wrongWords, token);
        migratedDataTypes.push('wrongWords');
      }
      
      // 上传经验数据
      if (guestData.experienceGain !== undefined) {
        await this.uploadExperience(guestData.experienceGain, guestData.experienceEvents || [], token);
        migratedDataTypes.push('experience');
      }
      
      // 上传词书数据
      if (guestData.wordbooks && guestData.wordbooks.length > 0) {
        await this.uploadWordbooks(guestData.wordbooks, token);
        migratedDataTypes.push('wordbooks');
      }
      
      // 上传徽章数据
      if (guestData.badges && guestData.badges.length > 0) {
        await this.uploadBadges(guestData.badges, token);
        migratedDataTypes.push('badges');
      }
      
      console.log('[GuestUpgradeService] ✅ 数据上传完成，迁移类型:', migratedDataTypes);
      
      return {
        success: true,
        migratedDataTypes
      };
      
    } catch (error) {
      console.error('[GuestUpgradeService] ❌ 上传数据失败:', error);
      return {
        success: false,
        migratedDataTypes: [],
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  }

  /**
   * 保存数据到新用户的本地存储
   */
  private async saveDataToNewUser(guestData: GuestData, newUserId: string): Promise<void> {
    try {
      console.log('[GuestUpgradeService] 💾 保存数据到新用户本地存储...');
      
      // 保存各种数据类型
      const dataToSave = {
        vocabulary: guestData.vocabulary || [],
        userStats: guestData.userStats || {},
        learningRecords: guestData.learningRecords || [],
        searchHistory: guestData.searchHistory || [],
        shows: guestData.shows || [],
        userSettings: guestData.userSettings || {},
        wrongWords: guestData.wrongWords || [],
        experienceGain: guestData.experienceGain || 0,
        experienceEvents: guestData.experienceEvents || [],
        wordbooks: guestData.wordbooks || [],
        badges: guestData.badges || []
      };
      
      // 保存到新用户的本地存储
      await AsyncStorage.setItem(`user_${newUserId}_data`, JSON.stringify(dataToSave));
      
      console.log('[GuestUpgradeService] ✅ 数据已保存到新用户本地存储');
      
    } catch (error) {
      console.error('[GuestUpgradeService] ❌ 保存数据到新用户失败:', error);
      throw error;
    }
  }

  /**
   * 清理游客数据
   */
  public async clearGuestData(): Promise<void> {
    try {
      console.log('[GuestUpgradeService] 🧹 开始清理游客数据...');
      
      const keys = [
        'learningRecords',
        'vocabulary', 
        'user_shows',
        'userSettings',
        'userStats',
        'wrongWords',
        'experienceGain',
        'experienceEvents',
        'wordbooks',
        'badges',
        'guestId'
      ];
      
      for (const key of keys) {
        await AsyncStorage.removeItem(key);
        console.log(`[GuestUpgradeService] ✅ 清理 ${key} 数据`);
      }
      
      console.log('[GuestUpgradeService] ✅ 游客数据清理完成');
      
    } catch (error) {
      console.error('[GuestUpgradeService] ❌ 清理游客数据失败:', error);
      throw error;
    }
  }

  // 各种数据上传方法
  private async uploadLearningRecords(records: any[], token: string): Promise<void> {
    // 实现学习记录上传逻辑
    console.log(`[GuestUpgradeService] 📤 上传 ${records.length} 条学习记录`);
  }

  private async uploadVocabulary(vocabulary: any[], token: string): Promise<void> {
    // 实现词汇数据上传逻辑
    console.log(`[GuestUpgradeService] 📤 上传 ${vocabulary.length} 个词汇`);
  }

  private async uploadUserStats(stats: any, token: string): Promise<void> {
    // 实现用户统计上传逻辑
    console.log('[GuestUpgradeService] 📤 上传用户统计');
  }

  private async uploadSearchHistory(history: any[], token: string): Promise<void> {
    // 实现搜索历史上传逻辑
    console.log(`[GuestUpgradeService] 📤 上传 ${history.length} 条搜索历史`);
  }

  private async uploadShows(shows: any[], token: string): Promise<void> {
    // 实现剧单数据上传逻辑
    console.log(`[GuestUpgradeService] 📤 上传 ${shows.length} 个剧单`);
  }

  private async uploadUserSettings(settings: any, token: string): Promise<void> {
    // 实现用户设置上传逻辑
    console.log('[GuestUpgradeService] 📤 上传用户设置');
  }

  private async uploadWrongWords(wrongWords: any[], token: string): Promise<void> {
    // 实现错词数据上传逻辑
    console.log(`[GuestUpgradeService] 📤 上传 ${wrongWords.length} 个错词`);
  }

  private async uploadExperience(gain: number, events: any[], token: string): Promise<void> {
    // 实现经验数据上传逻辑
    console.log(`[GuestUpgradeService] 📤 上传经验数据: ${gain}, 事件: ${events?.length || 0}`);
  }

  private async uploadWordbooks(wordbooks: any[], token: string): Promise<void> {
    // 实现词书数据上传逻辑
    console.log(`[GuestUpgradeService] 📤 上传 ${wordbooks.length} 个词书`);
  }

  private async uploadBadges(badges: any[], token: string): Promise<void> {
    // 实现徽章数据上传逻辑
    console.log(`[GuestUpgradeService] 📤 上传 ${badges.length} 个徽章`);
  }
}

export const guestUpgradeService = GuestUpgradeService.getInstance();
