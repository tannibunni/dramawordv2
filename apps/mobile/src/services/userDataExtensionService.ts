import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationService } from './locationService';
import { ErrorHandlingAndRetryService } from './errorHandlingAndRetryService';
import { sharingBehaviorService } from './sharingBehaviorService';

// 用户数据扩展服务
class UserDataExtensionService {
  private static instance: UserDataExtensionService;
  private isInitialized = false;

  public static getInstance(): UserDataExtensionService {
    if (!UserDataExtensionService.instance) {
      UserDataExtensionService.instance = new UserDataExtensionService();
    }
    return UserDataExtensionService.instance;
  }

  /**
   * 初始化所有用户数据扩展服务
   */
  public async initialize(): Promise<void> {
    try {
      console.log('[UserDataExtensionService] 初始化用户数据扩展服务...');

      // 检查用户是否已登录
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        console.log('[UserDataExtensionService] 用户未登录，跳过初始化');
        return;
      }

      const { id: userId, token } = JSON.parse(userData);
      if (!userId || !token) {
        console.log('[UserDataExtensionService] 用户数据不完整，跳过初始化');
        return;
      }

      // 并行初始化所有服务
      await Promise.all([
        locationService.initialize(),
        ErrorHandlingAndRetryService.getInstance().initializeErrorTracking(),
        sharingBehaviorService.initialize()
      ]);

      // 上传初始数据到后端
      await this.uploadInitialData(userId, token);

      this.isInitialized = true;
      console.log('[UserDataExtensionService] 用户数据扩展服务初始化完成');
    } catch (error) {
      console.error('[UserDataExtensionService] 初始化失败:', error);
    }
  }

  /**
   * 上传初始数据到后端
   */
  private async uploadInitialData(userId: string, token: string): Promise<void> {
    try {
      console.log('[UserDataExtensionService] 开始上传初始数据...');

      // 上传地理位置信息
      const locationUploaded = await locationService.uploadLocationInfo(userId, token);
      if (locationUploaded) {
        console.log('[UserDataExtensionService] 地理位置信息上传成功');
      }

      // 错误追踪和性能监控会自动上传，无需手动调用

      console.log('[UserDataExtensionService] 初始数据上传完成');
    } catch (error) {
      console.error('[UserDataExtensionService] 上传初始数据失败:', error);
    }
  }

  /**
   * 记录分享行为（便捷方法）
   */
  public async recordShare(
    type: 'vocabulary' | 'progress' | 'achievements' | 'shows' | 'wordbook',
    channel: 'wechat' | 'weibo' | 'qq' | 'copyLink' | 'other',
    content: string,
    success: boolean
  ): Promise<void> {
    try {
      await sharingBehaviorService.recordShare(type, channel, content, success);
    } catch (error) {
      console.error('[UserDataExtensionService] 记录分享行为失败:', error);
    }
  }

  /**
   * 记录错误（便捷方法）
   */
  public async recordError(error: Error, context?: string): Promise<void> {
    try {
      const errorService = ErrorHandlingAndRetryService.getInstance();
      await errorService.recordError(error, 'unknown', 'medium', { service: 'user_data_extension' });
    } catch (error) {
      console.error('[UserDataExtensionService] 记录错误失败:', error);
    }
  }

  /**
   * 记录性能问题（便捷方法）
   */
  public async recordPerformanceIssue(
    issueType: 'slow_load' | 'memory_high' | 'battery_drain' | 'network_slow',
    severity: 'low' | 'medium' | 'high',
    details: string,
    metrics: {
      loadTime?: number;
      memoryUsage?: number;
      batteryLevel?: number;
      networkSpeed?: number;
    }
  ): Promise<void> {
    try {
      const errorService = ErrorHandlingAndRetryService.getInstance();
      await errorService.recordPerformanceIssue(issueType, severity, details, metrics);
    } catch (error) {
      console.error('[UserDataExtensionService] 记录性能问题失败:', error);
    }
  }

  /**
   * 开始页面加载时间监控（便捷方法）
   */
  public startLoadTimeMonitoring(pageName: string): () => void {
    // 简单的加载时间监控实现
    console.log(`[UserDataExtensionService] 开始监控页面加载时间: ${pageName}`);
    return () => {
      console.log(`[UserDataExtensionService] 结束监控页面加载时间: ${pageName}`);
    };
  }

  /**
   * 分享词汇（便捷方法）
   */
  public async shareVocabulary(
    word: string, 
    definition: string, 
    channel: 'wechat' | 'weibo' | 'qq' | 'copyLink' | 'other'
  ): Promise<boolean> {
    try {
      return await sharingBehaviorService.shareVocabulary(word, definition, channel);
    } catch (error) {
      console.error('[UserDataExtensionService] 分享词汇失败:', error);
      return false;
    }
  }

  /**
   * 分享学习进度（便捷方法）
   */
  public async shareProgress(
    level: number, 
    wordsLearned: number, 
    streak: number, 
    channel: 'wechat' | 'weibo' | 'qq' | 'copyLink' | 'other'
  ): Promise<boolean> {
    try {
      return await sharingBehaviorService.shareProgress(level, wordsLearned, streak, channel);
    } catch (error) {
      console.error('[UserDataExtensionService] 分享学习进度失败:', error);
      return false;
    }
  }

  /**
   * 分享成就（便捷方法）
   */
  public async shareAchievement(
    achievementName: string, 
    description: string, 
    channel: 'wechat' | 'weibo' | 'qq' | 'copyLink' | 'other'
  ): Promise<boolean> {
    try {
      return await sharingBehaviorService.shareAchievement(achievementName, description, channel);
    } catch (error) {
      console.error('[UserDataExtensionService] 分享成就失败:', error);
      return false;
    }
  }

  /**
   * 获取用户扩展数据统计
   */
  public async getUserExtensionStats(): Promise<{
    location: any;
    errorTracking: any;
    sharingBehavior: any;
  }> {
    try {
      return {
        location: await locationService.getStoredLocationInfo(),
        errorTracking: await ErrorHandlingAndRetryService.getInstance().getErrorTrackingInfo(),
        sharingBehavior: sharingBehaviorService.getSharingBehaviorInfo()
      };
    } catch (error) {
      console.error('[UserDataExtensionService] 获取用户扩展数据统计失败:', error);
      return {
        location: null,
        errorTracking: null,
        sharingBehavior: null
      };
    }
  }

  /**
   * 清除所有扩展数据
   */
  public async clearAllExtensionData(): Promise<void> {
    try {
      console.log('[UserDataExtensionService] 清除所有扩展数据...');

      await Promise.all([
        ErrorHandlingAndRetryService.getInstance().clearErrorTrackingData(),
        sharingBehaviorService.clearSharingBehavior()
      ]);

      // 清除地理位置信息
      await AsyncStorage.removeItem('userLocationInfo');

      console.log('[UserDataExtensionService] 所有扩展数据已清除');
    } catch (error) {
      console.error('[UserDataExtensionService] 清除扩展数据失败:', error);
    }
  }

  /**
   * 检查服务是否已初始化
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 重新初始化服务（用于用户重新登录）
   */
  public async reinitialize(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }
}

export const userDataExtensionService = UserDataExtensionService.getInstance();
export default userDataExtensionService;
