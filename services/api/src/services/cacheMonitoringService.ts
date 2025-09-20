/**
 * 缓存监控服务 - 监控Redis缓存性能和健康状态
 */

import RedisCacheService from './redisCacheService';
import { logger } from '../utils/logger';

export interface CacheHealthMetrics {
  isHealthy: boolean;
  isConnected: boolean;
  hitRate: number;
  totalOperations: number;
  cacheFailureRate: number;
  memoryUsage: number;
  connectionCount: number;
  lastCheckTime: number;
}

export interface CacheAlert {
  type: 'performance' | 'connection' | 'memory' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metrics: CacheHealthMetrics;
  recommendations: string[];
}

export class CacheMonitoringService {
  private static instance: CacheMonitoringService;
  private cacheService: RedisCacheService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private alerts: CacheAlert[] = [];
  private metricsHistory: CacheHealthMetrics[] = [];

  // 告警阈值
  private thresholds = {
    hitRate: 0.7,           // 命中率低于70%告警
    cacheFailureRate: 0.05,        // 缓存失败率高于5%告警
    memoryUsage: 0.8,       // 内存使用率高于80%告警
    connectionCount: 100,   // 连接数高于100告警
    maxAlerts: 100          // 最大告警数量
  };

  private constructor() {
    this.cacheService = RedisCacheService.getInstance();
  }

  public static getInstance(): CacheMonitoringService {
    if (!CacheMonitoringService.instance) {
      CacheMonitoringService.instance = new CacheMonitoringService();
    }
    return CacheMonitoringService.instance;
  }

  // 开始监控
  public startMonitoring(): void {
    if (this.isMonitoring) {
      logger.warn('📊 缓存监控已在运行中');
      return;
    }

    // 检查是否有Redis配置
    const hasRedisConfig = process.env.REDIS_HOST || process.env.REDIS_URL;
    if (!hasRedisConfig) {
      logger.info('📊 Redis未配置，跳过缓存监控服务');
      return;
    }

    this.isMonitoring = true;
    logger.info('📊 启动缓存监控服务');

    // 每30秒检查一次缓存健康状态
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkCacheHealth();
      } catch (error) {
        logger.error('📊 缓存健康检查失败:', error);
      }
    }, 30000);

    // 每小时清理旧数据
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }

  // 停止监控
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('📊 缓存监控服务已停止');
  }

  // 检查缓存健康状态
  private async checkCacheHealth(): Promise<void> {
    try {
      const healthCheck = await this.cacheService.healthCheck();
      const stats = this.cacheService.getStats();

      const metrics: CacheHealthMetrics = {
        isHealthy: healthCheck.isHealthy,
        isConnected: healthCheck.isConnected,
        hitRate: stats.hitRate,
        totalOperations: stats.totalOperations,
        cacheFailureRate: stats.errors / Math.max(stats.totalOperations, 1),
        memoryUsage: 0, // 需要从Redis信息中获取
        connectionCount: 0, // 需要从Redis信息中获取
        lastCheckTime: Date.now()
      };

      // 获取Redis详细信息
      if (healthCheck.redisInfo) {
        try {
          const info = healthCheck.redisInfo;
          if (info.includes('used_memory:')) {
            const memoryMatch = info.match(/used_memory:(\d+)/);
            const maxMemoryMatch = info.match(/maxmemory:(\d+)/);
            if (memoryMatch && maxMemoryMatch) {
              const usedMemory = parseInt(memoryMatch[1]);
              const maxMemory = parseInt(maxMemoryMatch[1]);
              if (maxMemory > 0) {
                metrics.memoryUsage = usedMemory / maxMemory;
              }
            }
          }
          if (info.includes('connected_clients:')) {
            const clientsMatch = info.match(/connected_clients:(\d+)/);
            if (clientsMatch) {
              metrics.connectionCount = parseInt(clientsMatch[1]);
            }
          }
        } catch (error) {
          logger.warn('📊 解析Redis信息失败:', error);
        }
      }

      // 保存指标历史
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > 100) {
        this.metricsHistory = this.metricsHistory.slice(-100);
      }

      // 检查告警条件
      await this.checkAlerts(metrics);

      logger.debug('📊 缓存健康检查完成:', {
        isHealthy: metrics.isHealthy,
        hitRate: (metrics.hitRate * 100).toFixed(2) + '%',
        cacheFailureRate: (metrics.cacheFailureRate * 100).toFixed(2) + '%',
        totalOperations: metrics.totalOperations
      });

    } catch (error) {
      logger.error('📊 缓存健康检查异常:', error);
    }
  }

  // 检查告警条件
  private async checkAlerts(metrics: CacheHealthMetrics): Promise<void> {
    const alerts: CacheAlert[] = [];

    // 检查命中率告警
    if (metrics.hitRate < this.thresholds.hitRate) {
      alerts.push({
        type: 'performance',
        severity: metrics.hitRate < 0.5 ? 'high' : 'medium',
        message: `缓存命中率过低: ${(metrics.hitRate * 100).toFixed(2)}%`,
        timestamp: Date.now(),
        metrics,
        recommendations: [
          '检查缓存策略配置',
          '增加缓存TTL时间',
          '优化缓存键生成策略',
          '检查数据访问模式'
        ]
      });
    }

    // 检查缓存失败率告警
    if (metrics.cacheFailureRate > this.thresholds.cacheFailureRate) {
      alerts.push({
        type: 'error',
        severity: metrics.cacheFailureRate > 0.1 ? 'critical' : 'high',
        message: `缓存失败率过高: ${(metrics.cacheFailureRate * 100).toFixed(2)}%`,
        timestamp: Date.now(),
        metrics,
        recommendations: [
          '检查Redis连接状态',
          '检查网络连接',
          '检查Redis服务器状态',
          '查看错误日志'
        ]
      });
    }

    // 检查内存使用率告警
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      alerts.push({
        type: 'memory',
        severity: metrics.memoryUsage > 0.9 ? 'critical' : 'high',
        message: `Redis内存使用率过高: ${(metrics.memoryUsage * 100).toFixed(2)}%`,
        timestamp: Date.now(),
        metrics,
        recommendations: [
          '增加Redis内存限制',
          '清理过期缓存',
          '优化缓存数据结构',
          '考虑Redis集群'
        ]
      });
    }

    // 检查连接数告警
    if (metrics.connectionCount > this.thresholds.connectionCount) {
      alerts.push({
        type: 'connection',
        severity: metrics.connectionCount > 200 ? 'critical' : 'high',
        message: `Redis连接数过多: ${metrics.connectionCount}`,
        timestamp: Date.now(),
        metrics,
        recommendations: [
          '检查连接池配置',
          '优化连接管理',
          '检查连接泄漏',
          '增加Redis实例'
        ]
      });
    }

    // 检查连接状态告警
    if (!metrics.isConnected) {
      alerts.push({
        type: 'connection',
        severity: 'critical',
        message: 'Redis连接断开',
        timestamp: Date.now(),
        metrics,
        recommendations: [
          '检查Redis服务状态',
          '检查网络连接',
          '重启Redis服务',
          '检查防火墙设置'
        ]
      });
    }

    // 记录告警
    for (const alert of alerts) {
      this.alerts.push(alert);
      logger.warn('🚨 缓存告警:', alert);
    }

    // 限制告警数量
    if (this.alerts.length > this.thresholds.maxAlerts) {
      this.alerts = this.alerts.slice(-this.thresholds.maxAlerts);
    }
  }

  // 获取缓存健康报告
  public getHealthReport(): {
    currentMetrics: CacheHealthMetrics | null;
    recentAlerts: CacheAlert[];
    metricsTrend: CacheHealthMetrics[];
    recommendations: string[];
  } {
    const currentMetrics = this.metricsHistory.length > 0 ? 
      this.metricsHistory[this.metricsHistory.length - 1] : null;
    const recentAlerts = this.alerts.slice(-10);
    const metricsTrend = this.metricsHistory.slice(-24);

    const recommendations: string[] = [];
    
    if (currentMetrics) {
      if (currentMetrics.hitRate < 0.7) {
        recommendations.push('优化缓存策略，提高命中率');
      }
      if (currentMetrics.cacheFailureRate > 0.05) {
        recommendations.push('检查Redis连接稳定性');
      }
      if (currentMetrics.memoryUsage > 0.8) {
        recommendations.push('监控Redis内存使用情况');
      }
      if (!currentMetrics.isConnected) {
        recommendations.push('检查Redis服务状态');
      }
    }

    return {
      currentMetrics,
      recentAlerts,
      metricsTrend,
      recommendations
    };
  }

  // 获取缓存统计信息
  public getCacheStats(): {
    isMonitoring: boolean;
    totalAlerts: number;
    recentAlerts: number;
    averageHitRate: number;
    totalOperations: number;
  } {
    const recentAlerts = this.alerts.filter(alert => 
      Date.now() - alert.timestamp < 24 * 60 * 60 * 1000
    ).length;

    const averageHitRate = this.metricsHistory.length > 0 ?
      this.metricsHistory.reduce((sum, metrics) => sum + metrics.hitRate, 0) / this.metricsHistory.length :
      0;

    const totalOperations = this.metricsHistory.length > 0 ?
      this.metricsHistory[this.metricsHistory.length - 1].totalOperations :
      0;

    return {
      isMonitoring: this.isMonitoring,
      totalAlerts: this.alerts.length,
      recentAlerts,
      averageHitRate,
      totalOperations
    };
  }

  // 清理旧数据
  private cleanupOldData(): void {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天

    // 清理旧告警
    this.alerts = this.alerts.filter(alert => now - alert.timestamp < maxAge);

    // 清理旧指标
    this.metricsHistory = this.metricsHistory.filter(metrics => 
      now - metrics.lastCheckTime < maxAge
    );

    logger.info('📊 缓存监控数据清理完成');
  }

  // 更新告警阈值
  public updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('📊 更新缓存监控阈值:', this.thresholds);
  }

  // 获取当前告警
  public getCurrentAlerts(): CacheAlert[] {
    return this.alerts.slice(-20);
  }

  // 清除告警
  public clearAlerts(): void {
    this.alerts = [];
    logger.info('📊 缓存告警已清除');
  }

  // 手动触发健康检查
  public async triggerHealthCheck(): Promise<CacheHealthMetrics | null> {
    try {
      await this.checkCacheHealth();
      return this.metricsHistory.length > 0 ? 
        this.metricsHistory[this.metricsHistory.length - 1] : null;
    } catch (error) {
      logger.error('📊 手动健康检查失败:', error);
      return null;
    }
  }
}

export default CacheMonitoringService;
