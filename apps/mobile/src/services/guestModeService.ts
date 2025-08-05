import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageService';

export interface GuestModeConfig {
  isGuestMode: boolean;
  guestId: string;
  localDataOnly: boolean;
  noCloudSync: boolean;
  isolatedStorage: boolean;
}

export interface GuestData {
  id: string;
  nickname: string;
  createdAt: number;
  lastActiveAt: number;
  localDataVersion: number;
}

export class GuestModeService {
  private static instance: GuestModeService;
  private guestConfig: GuestModeConfig | null = null;
  private guestData: GuestData | null = null;

  private constructor() {}

  public static getInstance(): GuestModeService {
    if (!GuestModeService.instance) {
      GuestModeService.instance = new GuestModeService();
    }
    return GuestModeService.instance;
  }

  /**
   * 检查当前是否为游客模式
   */
  async isGuestMode(): Promise<boolean> {
    if (this.guestConfig) {
      return this.guestConfig.isGuestMode;
    }

    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!userData) return false;

      const parsed = JSON.parse(userData);
      const isGuest = parsed.loginType === 'guest' && !parsed.token;
      
      if (isGuest) {
        this.guestConfig = {
          isGuestMode: true,
          guestId: parsed.id || parsed.guestId,
          localDataOnly: true,
          noCloudSync: true,
          isolatedStorage: true
        };
      }

      return isGuest;
    } catch (error) {
      console.error('检查游客模式失败:', error);
      return false;
    }
  }

  /**
   * 获取游客配置
   */
  async getGuestConfig(): Promise<GuestModeConfig | null> {
    if (await this.isGuestMode()) {
      return this.guestConfig;
    }
    return null;
  }

  /**
   * 获取游客基本信息
   */
  async getGuestInfo(): Promise<GuestData | null> {
    if (!(await this.isGuestMode())) {
      return null;
    }

    if (this.guestData) {
      return this.guestData;
    }

    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!userData) return null;

      const parsed = JSON.parse(userData);
      this.guestData = {
        id: parsed.id || parsed.guestId,
        nickname: parsed.nickname || `游客${parsed.id?.slice(-4) || '用户'}`,
        createdAt: parsed.createdAt || Date.now(),
        lastActiveAt: Date.now(),
        localDataVersion: parsed.localDataVersion || 1
      };

      // 更新最后活跃时间
      await this.updateGuestActivity();

      return this.guestData;
    } catch (error) {
      console.error('获取游客数据失败:', error);
      return null;
    }
  }

  /**
   * 更新游客活跃时间
   */
  async updateGuestActivity(): Promise<void> {
    if (!(await this.isGuestMode()) || !this.guestData) return;

    this.guestData.lastActiveAt = Date.now();
    
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.lastActiveAt = this.guestData.lastActiveAt;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('更新游客活跃时间失败:', error);
    }
  }

  /**
   * 获取游客专用的存储键
   */
  getGuestStorageKey(baseKey: string): string {
    if (!this.guestConfig?.guestId) {
      return baseKey;
    }
    return `guest_${this.guestConfig.guestId}_${baseKey}`;
  }

  /**
   * 游客模式下的数据存储（完全本地化）
   */
  async setGuestData<T>(key: string, data: T): Promise<void> {
    if (!(await this.isGuestMode())) {
      throw new Error('非游客模式，请使用标准存储方法');
    }

    const guestKey = this.getGuestStorageKey(key);
    try {
      await AsyncStorage.setItem(guestKey, JSON.stringify({
        data,
        timestamp: Date.now(),
        guestId: this.guestConfig?.guestId,
        version: this.guestData?.localDataVersion || 1
      }));
    } catch (error) {
      console.error(`游客数据存储失败 [${guestKey}]:`, error);
      throw error;
    }
  }

  /**
   * 游客模式下的数据获取（完全本地化）
   */
  async getGuestData<T>(key: string): Promise<T | null> {
    if (!(await this.isGuestMode())) {
      throw new Error('非游客模式，请使用标准存储方法');
    }

    const guestKey = this.getGuestStorageKey(key);
    try {
      const stored = await AsyncStorage.getItem(guestKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed.data;
    } catch (error) {
      console.error(`游客数据获取失败 [${guestKey}]:`, error);
      return null;
    }
  }

  /**
   * 清除游客数据
   */
  async clearGuestData(): Promise<void> {
    if (!(await this.isGuestMode())) return;

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const guestKeys = allKeys.filter(key => 
        key.startsWith(`guest_${this.guestConfig?.guestId}_`)
      );
      
      if (guestKeys.length > 0) {
        await AsyncStorage.multiRemove(guestKeys);
        console.log(`🧹 已清除 ${guestKeys.length} 个游客数据项`);
      }
    } catch (error) {
      console.error('清除游客数据失败:', error);
    }
  }

  /**
   * 获取游客数据统计
   */
  async getGuestDataStats(): Promise<{
    totalKeys: number;
    totalSize: number;
    lastActiveAt: number;
    dataTypes: string[];
  }> {
    if (!(await this.isGuestMode())) {
      throw new Error('非游客模式');
    }

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const guestKeys = allKeys.filter(key => 
        key.startsWith(`guest_${this.guestConfig?.guestId}_`)
      );

      let totalSize = 0;
      const dataTypes = new Set<string>();

      for (const key of guestKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          const dataType = key.replace(`guest_${this.guestConfig?.guestId}_`, '');
          dataTypes.add(dataType);
        }
      }

      return {
        totalKeys: guestKeys.length,
        totalSize,
        lastActiveAt: this.guestData?.lastActiveAt || Date.now(),
        dataTypes: Array.from(dataTypes)
      };
    } catch (error) {
      console.error('获取游客数据统计失败:', error);
      throw error;
    }
  }

  /**
   * 检查游客数据完整性
   */
  async validateGuestData(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    if (!(await this.isGuestMode())) {
      return { isValid: true, issues: [], recommendations: [] };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 检查基本用户数据
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!userData) {
        issues.push('缺少用户数据');
        recommendations.push('重新初始化游客模式');
      }

      // 检查关键数据项
      const criticalKeys = [
        STORAGE_KEYS.VOCABULARY,
        STORAGE_KEYS.USER_STATS,
        STORAGE_KEYS.LEARNING_RECORDS
      ];

      for (const key of criticalKeys) {
        const guestKey = this.getGuestStorageKey(key);
        const data = await AsyncStorage.getItem(guestKey);
        if (!data) {
          issues.push(`缺少关键数据: ${key}`);
        }
      }

      // 检查数据版本
      if (this.guestData && this.guestData.localDataVersion < 1) {
        issues.push('数据版本过低');
        recommendations.push('更新数据格式');
      }

    } catch (error) {
      issues.push(`数据验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * 重置游客模式
   */
  async resetGuestMode(): Promise<void> {
    try {
      await this.clearGuestData();
      
      // 清除用户数据
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TYPE);
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      
      // 重置配置
      this.guestConfig = null;
      this.guestData = null;
      
      console.log('🔄 游客模式已重置');
    } catch (error) {
      console.error('重置游客模式失败:', error);
      throw error;
    }
  }
}

export const guestModeService = GuestModeService.getInstance(); 