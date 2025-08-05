import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageService';
import { guestModeService } from './guestModeService';

export interface GuestDataAdapter {
  // 词汇相关
  getVocabulary(): Promise<any[]>;
  setVocabulary(vocabulary: any[]): Promise<void>;
  
  // 学习记录
  getLearningRecords(): Promise<any[]>;
  setLearningRecords(records: any[]): Promise<void>;
  
  // 用户统计
  getUserStats(): Promise<any>;
  setUserStats(stats: any): Promise<void>;
  
  // 搜索历史
  getSearchHistory(): Promise<any[]>;
  setSearchHistory(history: any[]): Promise<void>;
  
  // 剧集数据
  getShows(): Promise<any[]>;
  setShows(shows: any[]): Promise<void>;
  
  // 经验值相关
  getExperienceGain(): Promise<number>;
  setExperienceGain(gain: number): Promise<void>;
  getExperienceEvents(): Promise<any[]>;
  setExperienceEvents(events: any[]): Promise<void>;
  
  // 词书数据
  getWordbooks(): Promise<any[]>;
  setWordbooks(wordbooks: any[]): Promise<void>;
  
  // 徽章数据
  getBadges(): Promise<any[]>;
  setBadges(badges: any[]): Promise<void>;
  
  // 用户设置
  getUserSettings(): Promise<any>;
  setUserSettings(settings: any): Promise<void>;
}

export class GuestDataAdapterImpl implements GuestDataAdapter {
  private static instance: GuestDataAdapterImpl;

  private constructor() {}

  public static getInstance(): GuestDataAdapterImpl {
    if (!GuestDataAdapterImpl.instance) {
      GuestDataAdapterImpl.instance = new GuestDataAdapterImpl();
    }
    return GuestDataAdapterImpl.instance;
  }

  /**
   * 通用获取数据方法
   */
  private async getData<T>(key: string, defaultValue: T): Promise<T> {
    const isGuestMode = await guestModeService.isGuestMode();
    
    if (isGuestMode) {
      try {
        const data = await guestModeService.getGuestData<T>(key);
        return data !== null ? data : defaultValue;
      } catch (error) {
        console.error(`获取游客数据失败 [${key}]:`, error);
        return defaultValue;
      }
    } else {
      try {
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
      } catch (error) {
        console.error(`获取标准数据失败 [${key}]:`, error);
        return defaultValue;
      }
    }
  }

  /**
   * 通用设置数据方法
   */
  private async setData<T>(key: string, data: T): Promise<void> {
    const isGuestMode = await guestModeService.isGuestMode();
    
    if (isGuestMode) {
      try {
        await guestModeService.setGuestData(key, data);
      } catch (error) {
        console.error(`设置游客数据失败 [${key}]:`, error);
        throw error;
      }
    } else {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error(`设置标准数据失败 [${key}]:`, error);
        throw error;
      }
    }
  }

  // 词汇相关
  async getVocabulary(): Promise<any[]> {
    return this.getData(STORAGE_KEYS.VOCABULARY, []);
  }

  async setVocabulary(vocabulary: any[]): Promise<void> {
    await this.setData(STORAGE_KEYS.VOCABULARY, vocabulary);
  }

  // 学习记录
  async getLearningRecords(): Promise<any[]> {
    return this.getData(STORAGE_KEYS.LEARNING_RECORDS, []);
  }

  async setLearningRecords(records: any[]): Promise<void> {
    await this.setData(STORAGE_KEYS.LEARNING_RECORDS, records);
  }

  // 用户统计
  async getUserStats(): Promise<any> {
    return this.getData(STORAGE_KEYS.USER_STATS, {});
  }

  async setUserStats(stats: any): Promise<void> {
    await this.setData(STORAGE_KEYS.USER_STATS, stats);
  }

  // 搜索历史
  async getSearchHistory(): Promise<any[]> {
    return this.getData(STORAGE_KEYS.SEARCH_HISTORY, []);
  }

  async setSearchHistory(history: any[]): Promise<void> {
    await this.setData(STORAGE_KEYS.SEARCH_HISTORY, history);
  }

  // 剧集数据
  async getShows(): Promise<any[]> {
    return this.getData('user_shows', []);
  }

  async setShows(shows: any[]): Promise<void> {
    await this.setData('user_shows', shows);
  }

  // 经验值相关
  async getExperienceGain(): Promise<number> {
    return this.getData(STORAGE_KEYS.EXPERIENCE_GAIN, 0);
  }

  async setExperienceGain(gain: number): Promise<void> {
    await this.setData(STORAGE_KEYS.EXPERIENCE_GAIN, gain);
  }

  async getExperienceEvents(): Promise<any[]> {
    return this.getData(STORAGE_KEYS.EXPERIENCE_EVENTS, []);
  }

  async setExperienceEvents(events: any[]): Promise<void> {
    await this.setData(STORAGE_KEYS.EXPERIENCE_EVENTS, events);
  }

  // 词书数据
  async getWordbooks(): Promise<any[]> {
    return this.getData('user_wordbooks', []);
  }

  async setWordbooks(wordbooks: any[]): Promise<void> {
    await this.setData('user_wordbooks', wordbooks);
  }

  // 徽章数据
  async getBadges(): Promise<any[]> {
    return this.getData('user_badges', []);
  }

  async setBadges(badges: any[]): Promise<void> {
    await this.setData('user_badges', badges);
  }

  // 用户设置
  async getUserSettings(): Promise<any> {
    return this.getData('user_settings', {});
  }

  async setUserSettings(settings: any): Promise<void> {
    await this.setData('user_settings', settings);
  }

  /**
   * 获取数据存储模式信息
   */
  async getStorageModeInfo(): Promise<{
    isGuestMode: boolean;
    storageType: 'local' | 'cloud';
    dataIsolation: boolean;
    guestId?: string;
  }> {
    const isGuestMode = await guestModeService.isGuestMode();
    
    if (isGuestMode) {
      const guestData = await guestModeService.getGuestInfo();
      return {
        isGuestMode: true,
        storageType: 'local',
        dataIsolation: true,
        guestId: guestData?.id
      };
    } else {
      return {
        isGuestMode: false,
        storageType: 'cloud',
        dataIsolation: false
      };
    }
  }

  /**
   * 备份游客数据
   */
  async backupGuestData(): Promise<{
    success: boolean;
    backupSize: number;
    dataTypes: string[];
    timestamp: number;
  }> {
    const isGuestMode = await guestModeService.isGuestMode();
    if (!isGuestMode) {
      throw new Error('非游客模式，无法备份');
    }

    try {
      const stats = await guestModeService.getGuestDataStats();
      const backupData = {
        timestamp: Date.now(),
        guestId: (await guestModeService.getGuestInfo())?.id,
        data: {
          vocabulary: await this.getVocabulary(),
          learningRecords: await this.getLearningRecords(),
          userStats: await this.getUserStats(),
          searchHistory: await this.getSearchHistory(),
          shows: await this.getShows(),
          experienceGain: await this.getExperienceGain(),
          experienceEvents: await this.getExperienceEvents(),
          wordbooks: await this.getWordbooks(),
          badges: await this.getBadges(),
          userSettings: await this.getUserSettings()
        }
      };

      const backupKey = `guest_backup_${backupData.guestId}_${backupData.timestamp}`;
      await AsyncStorage.setItem(backupKey, JSON.stringify(backupData));

      return {
        success: true,
        backupSize: JSON.stringify(backupData).length,
        dataTypes: stats.dataTypes,
        timestamp: backupData.timestamp
      };
    } catch (error) {
      console.error('备份游客数据失败:', error);
      throw error;
    }
  }

  /**
   * 恢复游客数据
   */
  async restoreGuestData(backupKey: string): Promise<{
    success: boolean;
    restoredTypes: string[];
    timestamp: number;
  }> {
    const isGuestMode = await guestModeService.isGuestMode();
    if (!isGuestMode) {
      throw new Error('非游客模式，无法恢复');
    }

    try {
      const backupData = await AsyncStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error('备份数据不存在');
      }

      const parsed = JSON.parse(backupData);
      const restoredTypes: string[] = [];

      // 恢复各种数据类型
      if (parsed.data.vocabulary) {
        await this.setVocabulary(parsed.data.vocabulary);
        restoredTypes.push('vocabulary');
      }

      if (parsed.data.learningRecords) {
        await this.setLearningRecords(parsed.data.learningRecords);
        restoredTypes.push('learningRecords');
      }

      if (parsed.data.userStats) {
        await this.setUserStats(parsed.data.userStats);
        restoredTypes.push('userStats');
      }

      if (parsed.data.searchHistory) {
        await this.setSearchHistory(parsed.data.searchHistory);
        restoredTypes.push('searchHistory');
      }

      if (parsed.data.shows) {
        await this.setShows(parsed.data.shows);
        restoredTypes.push('shows');
      }

      if (parsed.data.experienceGain !== undefined) {
        await this.setExperienceGain(parsed.data.experienceGain);
        restoredTypes.push('experienceGain');
      }

      if (parsed.data.experienceEvents) {
        await this.setExperienceEvents(parsed.data.experienceEvents);
        restoredTypes.push('experienceEvents');
      }

      if (parsed.data.wordbooks) {
        await this.setWordbooks(parsed.data.wordbooks);
        restoredTypes.push('wordbooks');
      }

      if (parsed.data.badges) {
        await this.setBadges(parsed.data.badges);
        restoredTypes.push('badges');
      }

      if (parsed.data.userSettings) {
        await this.setUserSettings(parsed.data.userSettings);
        restoredTypes.push('userSettings');
      }

      return {
        success: true,
        restoredTypes,
        timestamp: parsed.timestamp
      };
    } catch (error) {
      console.error('恢复游客数据失败:', error);
      throw error;
    }
  }
}

export const guestDataAdapter = GuestDataAdapterImpl.getInstance(); 