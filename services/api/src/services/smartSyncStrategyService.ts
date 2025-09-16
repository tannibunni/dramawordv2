import { userActivityAnalysisService, UserActivityData, ActivityLevel } from './userActivityAnalysisService';
import { logger } from '../utils/logger';

export interface SyncStrategy {
  syncInterval: number;          // 同步间隔 (毫秒)
  batchSize: number;             // 批量大小
  maxRetries: number;            // 最大重试次数
  enableRealTimeSync: boolean;   // 是否启用实时同步
  enableCompression: boolean;    // 是否启用压缩
  enableDeduplication: boolean;  // 是否启用去重
  priority: 'high' | 'medium' | 'low';
  networkOptimization: boolean;  // 是否启用网络优化
  batteryOptimization: boolean;  // 是否启用电池优化
  offlineFirst: boolean;         // 是否离线优先
}

export interface SyncStrategyConfig {
  high: SyncStrategy;
  medium: SyncStrategy;
  low: SyncStrategy;
  inactive: SyncStrategy;
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

export class SmartSyncStrategyService {
  private static instance: SmartSyncStrategyService;
  private strategyCache: Map<string, SyncStrategy> = new Map();
  private userContexts: Map<string, UserSyncContext> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15分钟缓存

  private constructor() {
    this.initializeDefaultStrategies();
  }

  public static getInstance(): SmartSyncStrategyService {
    if (!SmartSyncStrategyService.instance) {
      SmartSyncStrategyService.instance = new SmartSyncStrategyService();
    }
    return SmartSyncStrategyService.instance;
  }

  // 初始化默认策略
  private initializeDefaultStrategies(): void {
    logger.info('🚀 初始化智能同步策略');
  }

  // 获取用户同步策略
  public async getUserSyncStrategy(
    userId: string, 
    activityData: UserActivityData,
    context: Partial<UserSyncContext> = {}
  ): Promise<SyncStrategy> {
    try {
      // 检查缓存
      const cached = this.getCachedStrategy(userId);
      if (cached) {
        return cached;
      }

      logger.info(`🧠 生成智能同步策略: ${userId}`);

      // 分析用户活跃度
      const activityLevel = await userActivityAnalysisService.analyzeUserActivity(userId, activityData);
      
      // 创建用户上下文
      const userContext: UserSyncContext = {
        userId,
        activityLevel,
        networkType: context.networkType || 'wifi',
        batteryLevel: context.batteryLevel || 100,
        timeOfDay: context.timeOfDay || new Date().getHours(),
        timezone: context.timezone || 'UTC',
        deviceType: context.deviceType || 'mobile',
        ...context
      };

      this.userContexts.set(userId, userContext);

      // 生成个性化策略
      const strategy = this.generatePersonalizedStrategy(userContext);
      
      // 缓存策略
      this.cacheStrategy(userId, strategy);
      
      logger.info(`✅ 智能同步策略生成完成: ${userId}, 等级: ${activityLevel.level}`);
      
      return strategy;
    } catch (error) {
      logger.error(`❌ 生成同步策略失败: ${userId}`, error);
      return this.getDefaultStrategy('medium');
    }
  }

  // 生成个性化策略
  private generatePersonalizedStrategy(context: UserSyncContext): SyncStrategy {
    const { activityLevel, networkType, batteryLevel, timeOfDay, deviceType } = context;
    
    // 基础策略
    let strategy = this.getBaseStrategy(activityLevel.level);
    
    // 网络优化
    strategy = this.applyNetworkOptimization(strategy, networkType);
    
    // 电池优化
    strategy = this.applyBatteryOptimization(strategy, batteryLevel);
    
    // 时间优化
    strategy = this.applyTimeOptimization(strategy, timeOfDay, activityLevel);
    
    // 设备优化
    strategy = this.applyDeviceOptimization(strategy, deviceType);
    
    // 活跃度微调
    strategy = this.applyActivityFineTuning(strategy, activityLevel);
    
    return strategy;
  }

  // 获取基础策略
  private getBaseStrategy(level: string): SyncStrategy {
    const baseStrategies: Record<string, SyncStrategy> = {
      high: {
        syncInterval: 2 * 60 * 1000,      // 2分钟
        batchSize: 100,                   // 小批量
        maxRetries: 5,                    // 高重试
        enableRealTimeSync: true,         // 实时同步
        enableCompression: false,         // 不压缩
        enableDeduplication: true,        // 去重
        priority: 'high',
        networkOptimization: true,        // 网络优化
        batteryOptimization: false,       // 不省电
        offlineFirst: false               // 在线优先
      },
      medium: {
        syncInterval: 5 * 60 * 1000,      // 5分钟
        batchSize: 200,                   // 中批量
        maxRetries: 3,                    // 中重试
        enableRealTimeSync: false,        // 非实时
        enableCompression: true,          // 压缩
        enableDeduplication: true,        // 去重
        priority: 'medium',
        networkOptimization: true,        // 网络优化
        batteryOptimization: true,        // 省电
        offlineFirst: true                // 离线优先
      },
      low: {
        syncInterval: 15 * 60 * 1000,     // 15分钟
        batchSize: 500,                   // 大批量
        maxRetries: 2,                    // 低重试
        enableRealTimeSync: false,        // 非实时
        enableCompression: true,          // 压缩
        enableDeduplication: true,        // 去重
        priority: 'low',
        networkOptimization: true,        // 网络优化
        batteryOptimization: true,        // 省电
        offlineFirst: true                // 离线优先
      },
      inactive: {
        syncInterval: 60 * 60 * 1000,     // 1小时
        batchSize: 1000,                  // 超大批量
        maxRetries: 1,                    // 最低重试
        enableRealTimeSync: false,        // 非实时
        enableCompression: true,          // 压缩
        enableDeduplication: true,        // 去重
        priority: 'low',
        networkOptimization: true,        // 网络优化
        batteryOptimization: true,        // 省电
        offlineFirst: true                // 离线优先
      }
    };

    return { ...baseStrategies[level] };
  }

  // 应用网络优化
  private applyNetworkOptimization(strategy: SyncStrategy, networkType: string): SyncStrategy {
    switch (networkType) {
      case 'wifi':
        // WiFi优化：更频繁同步，更大批量
        strategy.syncInterval = Math.max(strategy.syncInterval * 0.5, 30 * 1000);
        strategy.batchSize = Math.min(strategy.batchSize * 1.5, 2000);
        strategy.enableCompression = false;
        break;
      case 'cellular':
        // 移动网络优化：减少频率，启用压缩
        strategy.syncInterval = Math.min(strategy.syncInterval * 2, 60 * 60 * 1000);
        strategy.batchSize = Math.max(strategy.batchSize * 0.7, 50);
        strategy.enableCompression = true;
        break;
      case 'offline':
        // 离线模式：最大延迟，最大批量
        strategy.syncInterval = 2 * 60 * 60 * 1000; // 2小时
        strategy.batchSize = 5000;
        strategy.enableCompression = true;
        strategy.offlineFirst = true;
        break;
    }
    return strategy;
  }

  // 应用电池优化
  private applyBatteryOptimization(strategy: SyncStrategy, batteryLevel: number): SyncStrategy {
    if (batteryLevel < 20) {
      // 低电量：大幅减少同步频率
      strategy.syncInterval = Math.min(strategy.syncInterval * 3, 2 * 60 * 60 * 1000);
      strategy.batchSize = Math.max(strategy.batchSize * 2, 1000);
      strategy.batteryOptimization = true;
      strategy.enableRealTimeSync = false;
    } else if (batteryLevel < 50) {
      // 中电量：适度减少频率
      strategy.syncInterval = Math.min(strategy.syncInterval * 1.5, 30 * 60 * 1000);
      strategy.batchSize = Math.max(strategy.batchSize * 1.2, 200);
    }
    return strategy;
  }

  // 应用时间优化
  private applyTimeOptimization(strategy: SyncStrategy, timeOfDay: number, activityLevel: ActivityLevel): SyncStrategy {
    const isActiveHour = this.isActiveHour(timeOfDay, activityLevel);
    
    if (isActiveHour) {
      // 活跃时段：增加同步频率
      strategy.syncInterval = Math.max(strategy.syncInterval * 0.7, 30 * 1000);
      strategy.enableRealTimeSync = activityLevel.level === 'high';
    } else {
      // 非活跃时段：减少同步频率
      strategy.syncInterval = Math.min(strategy.syncInterval * 2, 2 * 60 * 60 * 1000);
      strategy.enableRealTimeSync = false;
    }
    
    return strategy;
  }

  // 判断是否为活跃时段
  private isActiveHour(timeOfDay: number, activityLevel: ActivityLevel): boolean {
    // 根据活跃度等级调整活跃时段
    switch (activityLevel.level) {
      case 'high':
        // 高活跃用户：全天活跃
        return true;
      case 'medium':
        // 中活跃用户：工作时间 + 晚上
        return (timeOfDay >= 9 && timeOfDay <= 17) || (timeOfDay >= 19 && timeOfDay <= 23);
      case 'low':
        // 低活跃用户：仅晚上
        return timeOfDay >= 19 && timeOfDay <= 23;
      case 'inactive':
        // 非活跃用户：仅特定时段
        return timeOfDay >= 20 && timeOfDay <= 22;
      default:
        return false;
    }
  }

  // 应用设备优化
  private applyDeviceOptimization(strategy: SyncStrategy, deviceType: string): SyncStrategy {
    switch (deviceType) {
      case 'mobile':
        // 移动设备：优化电池和网络
        strategy.batteryOptimization = true;
        strategy.networkOptimization = true;
        break;
      case 'tablet':
        // 平板：平衡性能和电池
        strategy.batchSize = Math.min(strategy.batchSize * 1.2, 1500);
        strategy.batteryOptimization = true;
        break;
      case 'desktop':
        // 桌面：优先性能
        strategy.syncInterval = Math.max(strategy.syncInterval * 0.5, 10 * 1000);
        strategy.batchSize = Math.min(strategy.batchSize * 2, 5000);
        strategy.batteryOptimization = false;
        break;
    }
    return strategy;
  }

  // 应用活跃度微调
  private applyActivityFineTuning(strategy: SyncStrategy, activityLevel: ActivityLevel): SyncStrategy {
    // 根据置信度调整策略
    if (activityLevel.confidence < 0.7) {
      // 低置信度：使用保守策略
      strategy.syncInterval = Math.min(strategy.syncInterval * 1.5, 30 * 60 * 1000);
      strategy.maxRetries = Math.max(strategy.maxRetries - 1, 1);
    }

    // 根据影响因素调整
    if (activityLevel.factors.includes('高频登录')) {
      strategy.syncInterval = Math.max(strategy.syncInterval * 0.8, 30 * 1000);
    }
    if (activityLevel.factors.includes('多设备使用')) {
      strategy.enableDeduplication = true;
      strategy.batchSize = Math.min(strategy.batchSize * 1.3, 2000);
    }
    if (activityLevel.factors.includes('非活跃时段使用')) {
      strategy.syncInterval = Math.min(strategy.syncInterval * 2, 2 * 60 * 60 * 1000);
    }

    return strategy;
  }

  // 获取默认策略
  private getDefaultStrategy(level: string): SyncStrategy {
    return this.getBaseStrategy(level);
  }

  // 获取缓存的策略
  private getCachedStrategy(userId: string): SyncStrategy | null {
    const cached = this.strategyCache.get(userId);
    if (cached) {
      return cached;
    }
    return null;
  }

  // 缓存策略
  private cacheStrategy(userId: string, strategy: SyncStrategy): void {
    this.strategyCache.set(userId, strategy);
    
    // 设置过期时间
    setTimeout(() => {
      this.strategyCache.delete(userId);
    }, this.CACHE_DURATION);
  }

  // 更新用户上下文
  public updateUserContext(userId: string, context: Partial<UserSyncContext>): void {
    const existing = this.userContexts.get(userId);
    if (existing) {
      this.userContexts.set(userId, { ...existing, ...context });
    }
  }

  // 获取用户上下文
  public getUserContext(userId: string): UserSyncContext | null {
    return this.userContexts.get(userId) || null;
  }

  // 获取策略统计
  public getStrategyStats(): {
    totalUsers: number;
    highActivityUsers: number;
    mediumActivityUsers: number;
    lowActivityUsers: number;
    inactiveUsers: number;
    averageSyncInterval: number;
    averageBatchSize: number;
  } {
    const contexts = Array.from(this.userContexts.values());
    const totalUsers = contexts.length;
    
    const highActivityUsers = contexts.filter(c => c.activityLevel.level === 'high').length;
    const mediumActivityUsers = contexts.filter(c => c.activityLevel.level === 'medium').length;
    const lowActivityUsers = contexts.filter(c => c.activityLevel.level === 'low').length;
    const inactiveUsers = contexts.filter(c => c.activityLevel.level === 'inactive').length;
    
    const strategies = Array.from(this.strategyCache.values());
    const averageSyncInterval = strategies.length > 0 
      ? strategies.reduce((sum, s) => sum + s.syncInterval, 0) / strategies.length 
      : 0;
    const averageBatchSize = strategies.length > 0 
      ? strategies.reduce((sum, s) => sum + s.batchSize, 0) / strategies.length 
      : 0;

    return {
      totalUsers,
      highActivityUsers,
      mediumActivityUsers,
      lowActivityUsers,
      inactiveUsers,
      averageSyncInterval: Math.round(averageSyncInterval),
      averageBatchSize: Math.round(averageBatchSize)
    };
  }

  // 清空缓存
  public clearCache(): void {
    this.strategyCache.clear();
    this.userContexts.clear();
    logger.info('🗑️ 智能同步策略缓存已清空');
  }
}

export const smartSyncStrategyService = SmartSyncStrategyService.getInstance();
