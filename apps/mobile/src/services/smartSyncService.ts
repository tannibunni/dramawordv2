import { API_BASE_URL } from '../constants/config';
import { logger } from '../utils/logger';

export interface UserActivityData {
  userId: string;
  lastLoginAt: Date;
  loginCount: number;
  totalSessionTime: number;
  averageSessionTime: number;
  actionsPerDay: number;
  dataSyncFrequency: number;
  lastSyncAt: Date;
  deviceCount: number;
  timezone: string;
  language: string;
}

export interface SyncStrategy {
  syncInterval: number;
  batchSize: number;
  maxRetries: number;
  enableRealTimeSync: boolean;
  enableCompression: boolean;
  enableDeduplication: boolean;
  priority: 'high' | 'medium' | 'low';
  networkOptimization: boolean;
  batteryOptimization: boolean;
  offlineFirst: boolean;
}

export interface ActivityLevel {
  level: 'high' | 'medium' | 'low' | 'inactive';
  score: number;
  confidence: number;
  factors: string[];
  recommendations: string[];
}

export interface UserSyncContext {
  userId: string;
  activityLevel: ActivityLevel;
  networkType: 'wifi' | 'cellular' | 'offline';
  batteryLevel: number;
  timeOfDay: number;
  timezone: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export class SmartSyncService {
  private static instance: SmartSyncService;
  private currentStrategy: SyncStrategy | null = null;
  private userContext: UserSyncContext | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): SmartSyncService {
    if (!SmartSyncService.instance) {
      SmartSyncService.instance = new SmartSyncService();
    }
    return SmartSyncService.instance;
  }

  // 初始化服务
  private async initializeService(): Promise<void> {
    try {
      console.log('🚀 初始化智能同步服务...');
      
      // 获取用户ID
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.log('👤 未登录用户，跳过智能同步初始化');
        return;
      }

      // 获取智能同步策略
      await this.loadUserSyncStrategy(userId);
      
      this.isInitialized = true;
      console.log('✅ 智能同步服务初始化完成');
    } catch (error) {
      console.error('❌ 智能同步服务初始化失败:', error);
    }
  }

  // 获取当前用户ID
  private async getCurrentUserId(): Promise<string | null> {
    try {
      // 这里应该从用户认证服务获取用户ID
      // 目前使用模拟数据
      const userData = await this.getStoredUserData();
      return userData?.userId || null;
    } catch (error) {
      console.error('❌ 获取用户ID失败:', error);
      return null;
    }
  }

  // 获取存储的用户数据
  private async getStoredUserData(): Promise<any> {
    try {
      // 这里应该从AsyncStorage获取用户数据
      // 目前返回模拟数据
      return {
        userId: 'test_user_123',
        lastLoginAt: new Date(),
        loginCount: 10,
        totalSessionTime: 3600000, // 1小时
        averageSessionTime: 300000, // 5分钟
        actionsPerDay: 50,
        dataSyncFrequency: 20,
        lastSyncAt: new Date(),
        deviceCount: 1,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'zh-CN'
      };
    } catch (error) {
      console.error('❌ 获取存储用户数据失败:', error);
      return null;
    }
  }

  // 加载用户同步策略
  public async loadUserSyncStrategy(userId: string): Promise<SyncStrategy | null> {
    try {
      console.log(`🧠 加载用户同步策略: ${userId}`);

      const response = await fetch(`${API_BASE_URL}/api/smart-sync/strategy/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Network-Type': await this.getNetworkType(),
          'X-Battery-Level': await this.getBatteryLevel(),
          'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        this.currentStrategy = result.data.strategy;
        this.userContext = result.data.context;
        
        console.log(`✅ 用户同步策略加载成功: ${userId}`);
        console.log(`📊 活跃度等级: ${result.data.context.activityLevel.level}`);
        console.log(`⚙️ 同步间隔: ${result.data.strategy.syncInterval}ms`);
        console.log(`📦 批量大小: ${result.data.strategy.batchSize}`);
        
        // 应用新的同步策略
        this.applySyncStrategy();
        
        return this.currentStrategy;
      } else {
        throw new Error(result.message || '获取同步策略失败');
      }
    } catch (error) {
      console.error('❌ 加载用户同步策略失败:', error);
      return null;
    }
  }

  // 更新用户上下文
  public async updateUserContext(context: Partial<UserSyncContext>): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ 未登录用户，无法更新上下文');
        return false;
      }

      console.log('🔄 更新用户同步上下文...');

      const response = await fetch(`${API_BASE_URL}/api/smart-sync/context`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(context)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 用户同步上下文更新成功');
        
        // 重新加载同步策略
        await this.loadUserSyncStrategy(userId);
        
        return true;
      } else {
        throw new Error(result.message || '更新上下文失败');
      }
    } catch (error) {
      console.error('❌ 更新用户同步上下文失败:', error);
      return false;
    }
  }

  // 获取用户活跃度分析
  public async getUserActivityAnalysis(userId: string): Promise<ActivityLevel | null> {
    try {
      console.log(`📊 获取用户活跃度分析: ${userId}`);

      const response = await fetch(`${API_BASE_URL}/api/smart-sync/activity/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ 用户活跃度分析获取成功: ${userId}`);
        console.log(`📊 活跃度等级: ${result.data.activityLevel.level}`);
        console.log(`📈 活跃度分数: ${result.data.activityLevel.score}`);
        
        return result.data.activityLevel;
      } else {
        throw new Error(result.message || '获取活跃度分析失败');
      }
    } catch (error) {
      console.error('❌ 获取用户活跃度分析失败:', error);
      return null;
    }
  }

  // 获取智能同步统计
  public async getSmartSyncStats(): Promise<any> {
    try {
      console.log('📊 获取智能同步统计...');

      const response = await fetch(`${API_BASE_URL}/api/smart-sync/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ 智能同步统计获取成功');
        return result.data;
      } else {
        throw new Error(result.message || '获取统计失败');
      }
    } catch (error) {
      console.error('❌ 获取智能同步统计失败:', error);
      return null;
    }
  }

  // 应用同步策略
  private applySyncStrategy(): void {
    if (!this.currentStrategy) {
      console.warn('⚠️ 没有可用的同步策略');
      return;
    }

    console.log('⚙️ 应用智能同步策略...');

    // 停止现有的同步定时器
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // 根据策略设置新的同步定时器
    if (this.currentStrategy.enableRealTimeSync) {
      console.log('🔄 启用实时同步模式');
      // 实时同步不需要定时器，由事件触发
    } else {
      console.log(`⏰ 设置同步定时器: ${this.currentStrategy.syncInterval}ms`);
      this.syncTimer = setInterval(() => {
        this.performSmartSync();
      }, this.currentStrategy.syncInterval);
    }

    console.log('✅ 智能同步策略应用完成');
  }

  // 执行智能同步
  private async performSmartSync(): Promise<void> {
    try {
      console.log('🔄 执行智能同步...');
      
      // 这里应该调用实际的同步逻辑
      // 例如：调用unifiedSyncService.syncPendingData()
      
      console.log('✅ 智能同步完成');
    } catch (error) {
      console.error('❌ 智能同步失败:', error);
    }
  }

  // 获取网络类型
  private async getNetworkType(): Promise<string> {
    try {
      // 这里应该使用实际的网络检测
      // 目前返回模拟数据
      return 'wifi';
    } catch (error) {
      console.error('❌ 获取网络类型失败:', error);
      return 'unknown';
    }
  }

  // 获取电池电量
  private async getBatteryLevel(): Promise<number> {
    try {
      // 这里应该使用实际的电池检测
      // 目前返回模拟数据
      return 80;
    } catch (error) {
      console.error('❌ 获取电池电量失败:', error);
      return 100;
    }
  }

  // 获取当前策略
  public getCurrentStrategy(): SyncStrategy | null {
    return this.currentStrategy;
  }

  // 获取用户上下文
  public getUserContext(): UserSyncContext | null {
    return this.userContext;
  }

  // 检查是否已初始化
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // 重置服务
  public async resetService(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ 未登录用户，无法重置服务');
        return;
      }

      console.log('🔄 重置智能同步服务...');

      const response = await fetch(`${API_BASE_URL}/api/smart-sync/reset/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // 清空本地状态
        this.currentStrategy = null;
        this.userContext = null;
        this.isInitialized = false;
        
        if (this.syncTimer) {
          clearInterval(this.syncTimer);
          this.syncTimer = null;
        }
        
        console.log('✅ 智能同步服务重置成功');
        
        // 重新初始化
        await this.initializeService();
      } else {
        throw new Error(result.message || '重置服务失败');
      }
    } catch (error) {
      console.error('❌ 重置智能同步服务失败:', error);
    }
  }

  // 销毁服务
  public destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    this.currentStrategy = null;
    this.userContext = null;
    this.isInitialized = false;
    
    console.log('🗑️ 智能同步服务已销毁');
  }
}

export const smartSyncService = SmartSyncService.getInstance();
