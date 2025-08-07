import AsyncStorage from '@react-native-async-storage/async-storage';

// 存储键常量
export const STORAGE_KEYS = {
  // 用户相关
  USER_DATA: 'userData',
  LOGIN_TYPE: 'loginType',
  AUTH_TOKEN: 'authToken',
  USER_STATS: 'userStats',
  
  // 语言相关
  SELECTED_LANGUAGE: 'selectedLanguage',
  LANGUAGE_PROGRESS: 'languageProgress',
  LEARNING_LANGUAGES: 'learningLanguages',
  INITIAL_LANGUAGE_SETUP: 'initialLanguageSetup',
  
  // 经验值相关
  EXPERIENCE_GAIN: 'experienceGain',
  EXPERIENCE_GAIN_APPLIED: 'experienceGainApplied',
  EXPERIENCE_EVENTS: 'experienceEvents',
  
  // 学习数据相关
  VOCABULARY: 'vocabulary',
  LEARNING_RECORDS: 'learningRecords',
  REVIEW_SESSIONS: 'reviewSessions',
  SEARCH_HISTORY: 'searchHistory',
  
  // 同步相关
  UNIFIED_SYNC_QUEUE: 'unifiedSyncQueue',
  UNIFIED_LOCAL_DATA_VERSIONS: 'unifiedLocalDataVersions',
  SYNC_QUEUE: 'syncQueue',
  LOCAL_DATA_VERSIONS: 'localDataVersions',
  
  // 导航相关
  NAVIGATION_PARAMS: 'navigationParams',
  REFRESH_VOCABULARY: 'refreshVocabulary',
  
  // 其他
  WRONG_WORDS_COLLECTION: 'wrong_words_collection',
  NOTIFICATION_PREFERENCES: 'notificationPreferences',
} as const;

// 存储操作结果类型
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 存储服务类
export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * 安全地获取存储项
   */
  async getItem<T = any>(key: string): Promise<StorageResult<T>> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return { success: true, data: undefined };
      }
      
      const parsedValue = JSON.parse(value);
      return { success: true, data: parsedValue };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ 获取存储项失败 [${key}]:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 安全地设置存储项
   */
  async setItem<T = any>(key: string, value: T): Promise<StorageResult<void>> {
    try {
      const serializedValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, serializedValue);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ 设置存储项失败 [${key}]:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 安全地删除存储项
   */
  async removeItem(key: string): Promise<StorageResult<void>> {
    try {
      await AsyncStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ 删除存储项失败 [${key}]:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 批量删除存储项
   */
  async multiRemove(keys: string[]): Promise<StorageResult<void>> {
    try {
      await AsyncStorage.multiRemove(keys);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ 批量删除存储项失败:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 获取所有存储键
   */
  async getAllKeys(): Promise<StorageResult<string[]>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return { success: true, data: [...keys] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ 获取所有存储键失败:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 清除所有存储
   */
  async clear(): Promise<StorageResult<void>> {
    try {
      await AsyncStorage.clear();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ 清除所有存储失败:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 用户数据相关方法
   */
  async getUserData(): Promise<StorageResult<any>> {
    return this.getItem(STORAGE_KEYS.USER_DATA);
  }

  async setUserData(userData: any): Promise<StorageResult<void>> {
    return this.setItem(STORAGE_KEYS.USER_DATA, userData);
  }

  async getLoginType(): Promise<StorageResult<string>> {
    return this.getItem(STORAGE_KEYS.LOGIN_TYPE);
  }

  async setLoginType(loginType: string): Promise<StorageResult<void>> {
    return this.setItem(STORAGE_KEYS.LOGIN_TYPE, loginType);
  }

  async getAuthToken(): Promise<StorageResult<string>> {
    const result = await this.getItem(STORAGE_KEYS.AUTH_TOKEN);
    console.log('🔍 [StorageService] getAuthToken结果:', {
      success: result.success,
      hasData: !!result.data,
      dataLength: result.data ? result.data.length : 0,
      dataPreview: result.data ? result.data.substring(0, 50) + '...' : 'null'
    });
    return result;
  }

  async setAuthToken(token: string): Promise<StorageResult<void>> {
    console.log('🔍 [StorageService] setAuthToken:', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...'
    });
    const result = await this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    console.log('🔍 [StorageService] setAuthToken结果:', result.success ? '成功' : '失败');
    return result;
  }

  async getUserStats(): Promise<StorageResult<any>> {
    return this.getItem(STORAGE_KEYS.USER_STATS);
  }

  async setUserStats(stats: any): Promise<StorageResult<void>> {
    return this.setItem(STORAGE_KEYS.USER_STATS, stats);
  }

  /**
   * 经验值相关方法
   */
  async getExperienceGain(): Promise<StorageResult<number>> {
    return this.getItem(STORAGE_KEYS.EXPERIENCE_GAIN);
  }

  async setExperienceGain(gain: number): Promise<StorageResult<void>> {
    return this.setItem(STORAGE_KEYS.EXPERIENCE_GAIN, gain);
  }

  async getExperienceGainApplied(): Promise<StorageResult<string>> {
    return this.getItem(STORAGE_KEYS.EXPERIENCE_GAIN_APPLIED);
  }

  async setExperienceGainApplied(timestamp: string): Promise<StorageResult<void>> {
    return this.setItem(STORAGE_KEYS.EXPERIENCE_GAIN_APPLIED, timestamp);
  }

  async getExperienceEvents(): Promise<StorageResult<any[]>> {
    return this.getItem(STORAGE_KEYS.EXPERIENCE_EVENTS);
  }

  async setExperienceEvents(events: any[]): Promise<StorageResult<void>> {
    return this.setItem(STORAGE_KEYS.EXPERIENCE_EVENTS, events);
  }

  /**
   * 清除用户相关数据
   */
  async clearUserData(): Promise<StorageResult<void>> {
    const keysToRemove = [
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.LOGIN_TYPE,
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_STATS
    ];
    return this.multiRemove(keysToRemove);
  }

  /**
   * 清除经验值相关数据
   */
  async clearExperienceData(): Promise<StorageResult<void>> {
    const keysToRemove = [
      STORAGE_KEYS.EXPERIENCE_GAIN,
      STORAGE_KEYS.EXPERIENCE_GAIN_APPLIED,
      STORAGE_KEYS.EXPERIENCE_EVENTS
    ];
    return this.multiRemove(keysToRemove);
  }
}

// 导出单例实例
export const storageService = StorageService.getInstance(); 