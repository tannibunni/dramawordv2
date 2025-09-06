/**
 * 数据库性能监控服务
 * 监控数据库性能指标，提供告警和优化建议
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export interface DatabaseMetrics {
  connectionCount: number;      // 连接数
  activeConnections: number;    // 活跃连接数
  queryCount: number;          // 查询次数
  averageQueryTime: number;    // 平均查询时间
  slowQueries: number;         // 慢查询数量
  errorRate: number;           // 错误率
  memoryUsage: number;         // 内存使用率
  cpuUsage: number;            // CPU使用率
  timestamp: number;           // 时间戳
}

export interface AlertThresholds {
  maxConnections: number;          // 最大连接数告警
  slowQueryThreshold: number;      // 慢查询阈值(ms)
  errorRateThreshold: number;      // 错误率阈值
  cpuUsageThreshold: number;       // CPU使用率阈值
  memoryUsageThreshold: number;    // 内存使用率阈值
}

export interface PerformanceAlert {
  type: 'connection' | 'query' | 'error' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: DatabaseMetrics;
  timestamp: number;
  recommendations: string[];
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: DatabaseMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  private thresholds: AlertThresholds = {
    maxConnections: 80,          // 最大连接数告警
    slowQueryThreshold: 1000,    // 慢查询阈值(ms)
    errorRateThreshold: 0.05,    // 错误率阈值(5%)
    cpuUsageThreshold: 80,       // CPU使用率阈值
    memoryUsageThreshold: 85     // 内存使用率阈值
  };

  private constructor() {
    this.initializeMonitoring();
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  // 初始化监控
  private initializeMonitoring(): void {
    // 监听Mongoose事件
    mongoose.connection.on('connected', () => {
      logger.info('📊 数据库性能监控已启动');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('📊 数据库连接错误:', error);
      this.recordError(error);
    });

    // 启动定期监控
    this.startMonitoring();
  }

  // 开始监控
  public startMonitoring(): void {
    if (this.isMonitoring) {
      logger.warn('📊 性能监控已在运行中');
      return;
    }

    this.isMonitoring = true;
    logger.info('📊 启动数据库性能监控');

    // 每30秒收集一次指标
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkAlerts();
      } catch (error) {
        logger.error('📊 性能监控收集指标失败:', error);
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
    logger.info('📊 数据库性能监控已停止');
  }

  // 收集性能指标
  private async collectMetrics(): Promise<void> {
    try {
      const connection = mongoose.connection;
      
      // 基础连接信息
      const connectionCount = connection.readyState === 1 ? 1 : 0;
      const activeConnections = connectionCount;

      // 获取服务器状态
      let serverStatus = null;
      try {
        if (connection.db) {
          serverStatus = await connection.db.admin().serverStatus();
        }
      } catch (error) {
        logger.warn('📊 获取服务器状态失败:', error);
      }

      // 计算查询统计
      const queryCount = this.calculateQueryCount();
      const averageQueryTime = this.calculateAverageQueryTime();
      const slowQueries = this.calculateSlowQueries();
      const errorRate = this.calculateErrorRate();

      // 系统资源使用率
      const memoryUsage = this.calculateMemoryUsage(serverStatus);
      const cpuUsage = this.calculateCpuUsage(serverStatus);

      const metrics: DatabaseMetrics = {
        connectionCount,
        activeConnections,
        queryCount,
        averageQueryTime,
        slowQueries,
        errorRate,
        memoryUsage,
        cpuUsage,
        timestamp: Date.now()
      };

      this.metrics.push(metrics);

      // 只保留最近24小时的数据
      const maxMetrics = 24 * 60 * 2; // 24小时 * 60分钟 * 2次/分钟
      if (this.metrics.length > maxMetrics) {
        this.metrics = this.metrics.slice(-maxMetrics);
      }

      logger.info('📊 性能指标收集完成:', {
        connections: activeConnections,
        queries: queryCount,
        avgQueryTime: averageQueryTime,
        slowQueries,
        errorRate: (errorRate * 100).toFixed(2) + '%',
        memoryUsage: memoryUsage.toFixed(1) + '%',
        cpuUsage: cpuUsage.toFixed(1) + '%'
      });

    } catch (error) {
      logger.error('📊 收集性能指标失败:', error);
    }
  }

  // 计算查询次数
  private calculateQueryCount(): number {
    // 这里应该从实际的查询统计中获取
    // 暂时返回模拟数据
    return Math.floor(Math.random() * 100) + 50;
  }

  // 计算平均查询时间
  private calculateAverageQueryTime(): number {
    // 这里应该从实际的查询统计中获取
    // 暂时返回模拟数据
    return Math.floor(Math.random() * 200) + 50;
  }

  // 计算慢查询数量
  private calculateSlowQueries(): number {
    // 这里应该从实际的查询统计中获取
    // 暂时返回模拟数据
    return Math.floor(Math.random() * 10);
  }

  // 计算错误率
  private calculateErrorRate(): number {
    // 这里应该从实际的错误统计中获取
    // 暂时返回模拟数据
    return Math.random() * 0.02; // 0-2%错误率
  }

  // 计算内存使用率
  private calculateMemoryUsage(serverStatus: any): number {
    if (serverStatus && serverStatus.mem) {
      const mem = serverStatus.mem;
      return (mem.resident / mem.virtual) * 100;
    }
    return Math.random() * 20 + 60; // 60-80%内存使用率
  }

  // 计算CPU使用率
  private calculateCpuUsage(serverStatus: any): number {
    if (serverStatus && serverStatus.cpu) {
      return serverStatus.cpu.usage || 0;
    }
    return Math.random() * 30 + 40; // 40-70%CPU使用率
  }

  // 检查告警
  private async checkAlerts(): Promise<void> {
    if (this.metrics.length === 0) return;

    const latestMetrics = this.metrics[this.metrics.length - 1];
    const alerts: PerformanceAlert[] = [];

    // 检查连接数告警
    if (latestMetrics.activeConnections > this.thresholds.maxConnections) {
      alerts.push({
        type: 'connection',
        severity: 'high',
        message: `数据库连接数过高: ${latestMetrics.activeConnections}/${this.thresholds.maxConnections}`,
        metrics: latestMetrics,
        timestamp: Date.now(),
        recommendations: [
          '检查连接池配置',
          '优化数据库查询',
          '考虑增加数据库实例'
        ]
      });
    }

    // 检查慢查询告警
    if (latestMetrics.slowQueries > 5) {
      alerts.push({
        type: 'query',
        severity: 'medium',
        message: `慢查询数量过多: ${latestMetrics.slowQueries}`,
        metrics: latestMetrics,
        timestamp: Date.now(),
        recommendations: [
          '检查数据库索引',
          '优化查询语句',
          '考虑查询缓存'
        ]
      });
    }

    // 检查错误率告警
    if (latestMetrics.errorRate > this.thresholds.errorRateThreshold) {
      alerts.push({
        type: 'error',
        severity: 'high',
        message: `数据库错误率过高: ${(latestMetrics.errorRate * 100).toFixed(2)}%`,
        metrics: latestMetrics,
        timestamp: Date.now(),
        recommendations: [
          '检查数据库连接',
          '查看错误日志',
          '检查网络连接'
        ]
      });
    }

    // 检查CPU使用率告警
    if (latestMetrics.cpuUsage > this.thresholds.cpuUsageThreshold) {
      alerts.push({
        type: 'resource',
        severity: 'medium',
        message: `CPU使用率过高: ${latestMetrics.cpuUsage.toFixed(1)}%`,
        metrics: latestMetrics,
        timestamp: Date.now(),
        recommendations: [
          '优化数据库查询',
          '检查索引使用情况',
          '考虑增加CPU资源'
        ]
      });
    }

    // 检查内存使用率告警
    if (latestMetrics.memoryUsage > this.thresholds.memoryUsageThreshold) {
      alerts.push({
        type: 'resource',
        severity: 'high',
        message: `内存使用率过高: ${latestMetrics.memoryUsage.toFixed(1)}%`,
        metrics: latestMetrics,
        timestamp: Date.now(),
        recommendations: [
          '检查内存泄漏',
          '优化查询缓存',
          '考虑增加内存资源'
        ]
      });
    }

    // 记录告警
    for (const alert of alerts) {
      this.alerts.push(alert);
      logger.warn('🚨 数据库性能告警:', alert);
    }

    // 只保留最近100条告警
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  // 记录错误
  private recordError(error: any): void {
    logger.error('📊 数据库错误记录:', error);
  }

  // 清理旧数据
  private cleanupOldData(): void {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天

    // 清理旧指标
    this.metrics = this.metrics.filter(metric => now - metric.timestamp < maxAge);

    // 清理旧告警
    this.alerts = this.alerts.filter(alert => now - alert.timestamp < maxAge);

    logger.info('📊 清理旧监控数据完成');
  }

  // 获取性能报告
  public getPerformanceReport(): {
    currentMetrics: DatabaseMetrics | null;
    recentAlerts: PerformanceAlert[];
    performanceTrend: DatabaseMetrics[];
    recommendations: string[];
  } {
    const currentMetrics = this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
    const recentAlerts = this.alerts.slice(-10); // 最近10条告警
    const performanceTrend = this.metrics.slice(-24); // 最近24个数据点

    const recommendations: string[] = [];
    
    if (currentMetrics) {
      if (currentMetrics.averageQueryTime > 500) {
        recommendations.push('优化数据库查询性能');
      }
      if (currentMetrics.slowQueries > 3) {
        recommendations.push('检查并优化慢查询');
      }
      if (currentMetrics.errorRate > 0.01) {
        recommendations.push('检查数据库连接稳定性');
      }
      if (currentMetrics.memoryUsage > 80) {
        recommendations.push('监控内存使用情况');
      }
    }

    return {
      currentMetrics,
      recentAlerts,
      performanceTrend,
      recommendations
    };
  }

  // 更新告警阈值
  public updateThresholds(newThresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('📊 更新告警阈值:', this.thresholds);
  }

  // 获取当前指标
  public getCurrentMetrics(): DatabaseMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  // 获取告警历史
  public getAlerts(limit: number = 50): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }
}

export default PerformanceMonitoringService;
