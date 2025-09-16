import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  connectionUtilization: number;
  averageResponseTime: number;
  errorRate: number;
  lastCheckTime: number;
}

export class ConnectionPoolMonitor {
  private static instance: ConnectionPoolMonitor;
  private stats: ConnectionPoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    connectionUtilization: 0,
    averageResponseTime: 0,
    errorRate: 0,
    lastCheckTime: Date.now()
  };
  
  private responseTimes: number[] = [];
  private errorCount = 0;
  private totalRequests = 0;

  public static getInstance(): ConnectionPoolMonitor {
    if (!ConnectionPoolMonitor.instance) {
      ConnectionPoolMonitor.instance = new ConnectionPoolMonitor();
    }
    return ConnectionPoolMonitor.instance;
  }

  // 记录响应时间
  public recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    this.totalRequests++;
    
    // 保持最近100个响应时间
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
  }

  // 记录错误
  public recordError(): void {
    this.errorCount++;
    this.totalRequests++;
  }

  // 获取连接池统计
  public async getConnectionPoolStats(): Promise<ConnectionPoolStats> {
    try {
      if (!mongoose.connection.db) {
        throw new Error('Database not connected');
      }

      const admin = mongoose.connection.db.admin();
      const serverStatus = await admin.serverStatus();
      
      const connections = serverStatus.connections || {};
      const totalConnections = connections.current || 0;
      const availableConnections = connections.available || 0;
      const activeConnections = totalConnections - availableConnections;
      
      const connectionUtilization = totalConnections > 0 
        ? (activeConnections / totalConnections) * 100 
        : 0;

      const averageResponseTime = this.responseTimes.length > 0
        ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
        : 0;

      const errorRate = this.totalRequests > 0
        ? (this.errorCount / this.totalRequests) * 100
        : 0;

      this.stats = {
        totalConnections,
        activeConnections,
        idleConnections: availableConnections,
        connectionUtilization,
        averageResponseTime,
        errorRate,
        lastCheckTime: Date.now()
      };

      return this.stats;
    } catch (error) {
      logger.error('❌ Failed to get connection pool stats:', error);
      return this.stats;
    }
  }

  // 检查连接池健康状态
  public async checkHealth(): Promise<{
    healthy: boolean;
    warnings: string[];
    recommendations: string[];
  }> {
    const stats = await this.getConnectionPoolStats();
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // 检查连接利用率
    if (stats.connectionUtilization > 80) {
      warnings.push(`连接池利用率过高: ${stats.connectionUtilization.toFixed(2)}%`);
      recommendations.push('考虑增加maxPoolSize或优化查询性能');
    }

    // 检查平均响应时间
    if (stats.averageResponseTime > 1000) {
      warnings.push(`平均响应时间过长: ${stats.averageResponseTime.toFixed(2)}ms`);
      recommendations.push('检查数据库索引和查询优化');
    }

    // 检查错误率
    if (stats.errorRate > 5) {
      warnings.push(`错误率过高: ${stats.errorRate.toFixed(2)}%`);
      recommendations.push('检查数据库连接和查询逻辑');
    }

    return {
      healthy: warnings.length === 0,
      warnings,
      recommendations
    };
  }

  // 启动监控
  public startMonitoring(intervalMs: number = 30000): void {
    setInterval(async () => {
      try {
        const stats = await this.getConnectionPoolStats();
        const health = await this.checkHealth();
        
        logger.info('📊 Connection Pool Stats:', {
          ...stats,
          health: health.healthy ? '✅ Healthy' : '⚠️ Issues detected',
          warnings: health.warnings,
          recommendations: health.recommendations
        });
      } catch (error) {
        logger.error('❌ Connection pool monitoring failed:', error);
      }
    }, intervalMs);
  }
}

export const connectionPoolMonitor = ConnectionPoolMonitor.getInstance();
