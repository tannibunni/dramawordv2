/**
 * ========================================
 * 🧠 [MEMORY MANAGER] 智能内存管理服务
 * ========================================
 * 
 * 服务类型: 内存管理相关服务
 * 功能描述: 智能内存管理服务 - 内存监控、优化和泄漏检测
 * 维护状态: 活跃维护中
 * 
 * 相关服务:
 * - 性能优化: performanceOptimizationService.ts
 * - 错误处理: errorHandlingAndRetryService.ts
 * - 缓存管理: cacheService.ts
 * 
 * 注意事项:
 * - 此服务属于内存管理核心模块
 * - 修改前请确保了解内存管理机制
 * - 建议在测试环境充分验证
 * ========================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorHandlingAndRetryService } from './errorHandlingAndRetryService';

export interface MemoryStats {
  usedMemory: number; // MB
  totalMemory: number; // MB
  usagePercentage: number; // 百分比
  availableMemory: number; // MB
  timestamp: number;
}

export interface MemoryLeakDetection {
  isLeakDetected: boolean;
  leakType: 'gradual' | 'sudden' | 'none';
  leakRate: number; // MB/分钟
  confidence: number; // 0-1
  recommendations: string[];
}

export interface MemoryOptimizationResult {
  beforeMemory: number;
  afterMemory: number;
  memorySaved: number;
  optimizationTime: number;
  optimizationsApplied: string[];
}

export class SmartMemoryManager {
  private static instance: SmartMemoryManager;
  private memoryHistory: MemoryStats[] = [];
  private leakDetectionThreshold = 0.1; // 10% 增长视为潜在泄漏
  private maxHistorySize = 100;
  private monitoringInterval: number | null = null;
  private isMonitoring = false;
  private errorService: ErrorHandlingAndRetryService;

  private constructor() {
    this.errorService = ErrorHandlingAndRetryService.getInstance();
  }

  public static getInstance(): SmartMemoryManager {
    if (!SmartMemoryManager.instance) {
      SmartMemoryManager.instance = new SmartMemoryManager();
    }
    return SmartMemoryManager.instance;
  }

  /**
   * 开始内存监控
   */
  public startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.log('⚠️ 内存监控已在运行中');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.collectMemoryStats();
      await this.detectMemoryLeaks();
    }, intervalMs);

    console.log('🧠 智能内存监控已启动');
  }

  /**
   * 停止内存监控
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🧠 智能内存监控已停止');
  }

  /**
   * 收集内存统计信息
   */
  private async collectMemoryStats(): Promise<void> {
    try {
      const memoryStats = await this.getCurrentMemoryStats();
      this.memoryHistory.push(memoryStats);

      // 限制历史记录大小
      if (this.memoryHistory.length > this.maxHistorySize) {
        this.memoryHistory = this.memoryHistory.slice(-this.maxHistorySize);
      }

      // 检查内存使用率
      if (memoryStats.usagePercentage > 80) {
        await this.errorService.recordPerformanceIssue(
          'memory_high',
          memoryStats.usagePercentage > 90 ? 'high' : 'medium',
          `内存使用率过高: ${memoryStats.usagePercentage.toFixed(1)}%`,
          { memoryUsage: memoryStats.usagePercentage }
        );
      }

    } catch (error) {
      console.error('❌ 收集内存统计失败:', error);
    }
  }

  /**
   * 获取当前内存统计
   */
  private async getCurrentMemoryStats(): Promise<MemoryStats> {
    try {
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        // 浏览器环境
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        const totalMB = memory.totalJSHeapSize / (1024 * 1024);
        const usagePercentage = (usedMB / totalMB) * 100;

        return {
          usedMemory: usedMB,
          totalMemory: totalMB,
          usagePercentage,
          availableMemory: totalMB - usedMB,
          timestamp: Date.now()
        };
      } else {
        // React Native 环境 - 使用估算
        return await this.estimateMemoryStats();
      }
    } catch (error) {
      console.error('❌ 获取内存统计失败:', error);
      return {
        usedMemory: 0,
        totalMemory: 200,
        usagePercentage: 0,
        availableMemory: 200,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 估算内存统计（React Native环境）
   */
  private async estimateMemoryStats(): Promise<MemoryStats> {
    try {
      // 基于应用状态估算内存使用
      let estimatedMemory = 20; // 基础内存

      // 检查AsyncStorage使用情况
      const keys = await AsyncStorage.getAllKeys();
      estimatedMemory += keys.length * 0.01; // 每个键约0.01MB

      // 检查缓存数据
      try {
        const cacheData = await AsyncStorage.getItem('app_cache');
        if (cacheData) {
          estimatedMemory += JSON.stringify(cacheData).length / (1024 * 1024);
        }
      } catch (error) {
        // 忽略错误
      }

      const totalMemory = 200; // 假设总内存200MB
      const usagePercentage = (estimatedMemory / totalMemory) * 100;

      return {
        usedMemory: estimatedMemory,
        totalMemory,
        usagePercentage,
        availableMemory: totalMemory - estimatedMemory,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ 估算内存统计失败:', error);
      return {
        usedMemory: 50,
        totalMemory: 200,
        usagePercentage: 25,
        availableMemory: 150,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 检测内存泄漏
   */
  private async detectMemoryLeaks(): Promise<MemoryLeakDetection> {
    try {
      if (this.memoryHistory.length < 10) {
        return {
          isLeakDetected: false,
          leakType: 'none',
          leakRate: 0,
          confidence: 0,
          recommendations: []
        };
      }

      // 分析最近10个数据点
      const recentStats = this.memoryHistory.slice(-10);
      const leakDetection = this.analyzeMemoryTrend(recentStats);

      if (leakDetection.isLeakDetected) {
        console.warn('🚨 检测到潜在内存泄漏:', leakDetection);
        
        await this.errorService.recordPerformanceIssue(
          'memory_high',
          'high',
          `检测到内存泄漏: ${leakDetection.leakType}类型，泄漏率: ${leakDetection.leakRate.toFixed(2)}MB/分钟`,
          { memoryUsage: recentStats[recentStats.length - 1].usagePercentage }
        );
      }

      return leakDetection;
    } catch (error) {
      console.error('❌ 内存泄漏检测失败:', error);
      return {
        isLeakDetected: false,
        leakType: 'none',
        leakRate: 0,
        confidence: 0,
        recommendations: []
      };
    }
  }

  /**
   * 分析内存趋势
   */
  private analyzeMemoryTrend(stats: MemoryStats[]): MemoryLeakDetection {
    try {
      const firstStat = stats[0];
      const lastStat = stats[stats.length - 1];
      const timeDiff = (lastStat.timestamp - firstStat.timestamp) / (1000 * 60); // 分钟
      const memoryDiff = lastStat.usedMemory - firstStat.usedMemory;
      const leakRate = memoryDiff / timeDiff;

      // 计算趋势
      let increasingCount = 0;
      for (let i = 1; i < stats.length; i++) {
        if (stats[i].usedMemory > stats[i - 1].usedMemory) {
          increasingCount++;
        }
      }

      const increasingRatio = increasingCount / (stats.length - 1);
      const isLeakDetected = leakRate > this.leakDetectionThreshold && increasingRatio > 0.7;

      let leakType: 'gradual' | 'sudden' | 'none' = 'none';
      if (isLeakDetected) {
        leakType = leakRate > 1 ? 'sudden' : 'gradual';
      }

      const confidence = isLeakDetected ? Math.min(increasingRatio, 1) : 0;

      const recommendations: string[] = [];
      if (isLeakDetected) {
        recommendations.push('立即执行内存清理');
        recommendations.push('检查是否有未释放的资源');
        recommendations.push('考虑重启应用');
        if (leakType === 'sudden') {
          recommendations.push('检查最近的操作是否有内存泄漏');
        }
      }

      return {
        isLeakDetected,
        leakType,
        leakRate,
        confidence,
        recommendations
      };
    } catch (error) {
      console.error('❌ 分析内存趋势失败:', error);
      return {
        isLeakDetected: false,
        leakType: 'none',
        leakRate: 0,
        confidence: 0,
        recommendations: []
      };
    }
  }

  /**
   * 执行内存优化
   */
  public async optimizeMemory(): Promise<MemoryOptimizationResult> {
    try {
      const beforeStats = await this.getCurrentMemoryStats();
      const startTime = Date.now();
      const optimizationsApplied: string[] = [];

      console.log('🧠 开始智能内存优化...');

      // 1. 清理过期缓存
      await this.cleanupExpiredCache();
      optimizationsApplied.push('清理过期缓存');

      // 2. 清理临时数据
      await this.cleanupTemporaryData();
      optimizationsApplied.push('清理临时数据');

      // 3. 清理大对象
      await this.cleanupLargeObjects();
      optimizationsApplied.push('清理大对象');

      // 4. 强制垃圾回收
      this.forceGarbageCollection();
      optimizationsApplied.push('强制垃圾回收');

      // 5. 等待内存释放
      await new Promise(resolve => setTimeout(resolve, 1000));

      const afterStats = await this.getCurrentMemoryStats();
      const optimizationTime = Date.now() - startTime;
      const memorySaved = beforeStats.usedMemory - afterStats.usedMemory;

      const result: MemoryOptimizationResult = {
        beforeMemory: beforeStats.usedMemory,
        afterMemory: afterStats.usedMemory,
        memorySaved,
        optimizationTime,
        optimizationsApplied
      };

      console.log(`✅ 内存优化完成，释放内存: ${memorySaved.toFixed(2)}MB，耗时: ${optimizationTime}ms`);

      return result;
    } catch (error) {
      console.error('❌ 内存优化失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期缓存
   */
  private async cleanupExpiredCache(): Promise<void> {
    try {
      const cacheKeys = [
        'app_cache',
        'user_cache',
        'data_cache',
        'image_cache',
        'temp_cache'
      ];

      let cleanedCount = 0;
      for (const key of cacheKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.timestamp && Date.now() - parsed.timestamp > 30 * 60 * 1000) {
              await AsyncStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          // 忽略解析错误
        }
      }

      if (cleanedCount > 0) {
        console.log(`🗑️ 清理了 ${cleanedCount} 个过期缓存`);
      }
    } catch (error) {
      console.error('❌ 清理过期缓存失败:', error);
    }
  }

  /**
   * 清理临时数据
   */
  private async cleanupTemporaryData(): Promise<void> {
    try {
      const tempKeys = [
        'temp_data',
        'temp_upload',
        'temp_download',
        'temp_sync',
        'temp_batch'
      ];

      let cleanedCount = 0;
      for (const key of tempKeys) {
        try {
          await AsyncStorage.removeItem(key);
          cleanedCount++;
        } catch (error) {
          // 忽略不存在的键
        }
      }

      if (cleanedCount > 0) {
        console.log(`🗑️ 清理了 ${cleanedCount} 个临时数据`);
      }
    } catch (error) {
      console.error('❌ 清理临时数据失败:', error);
    }
  }

  /**
   * 清理大对象
   */
  private async cleanupLargeObjects(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let cleanedCount = 0;

      for (const key of keys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data && data.length > 1024 * 1024) { // 大于1MB
            await AsyncStorage.removeItem(key);
            cleanedCount++;
            console.log(`🗑️ 清理大对象: ${key} (${(data.length / 1024 / 1024).toFixed(2)}MB)`);
          }
        } catch (error) {
          // 忽略错误
        }
      }

      if (cleanedCount > 0) {
        console.log(`🗑️ 清理了 ${cleanedCount} 个大对象`);
      }
    } catch (error) {
      console.error('❌ 清理大对象失败:', error);
    }
  }

  /**
   * 强制垃圾回收
   */
  private forceGarbageCollection(): void {
    try {
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
        console.log('🗑️ 强制垃圾回收已执行');
      } else {
        console.log('⚠️ 垃圾回收不可用');
      }
    } catch (error) {
      console.error('❌ 强制垃圾回收失败:', error);
    }
  }

  /**
   * 获取内存历史
   */
  public getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  /**
   * 获取当前内存状态
   */
  public async getCurrentMemoryState(): Promise<MemoryStats> {
    return await this.getCurrentMemoryStats();
  }

  /**
   * 检查内存健康状态
   */
  public async checkMemoryHealth(): Promise<{
    isHealthy: boolean;
    level: 'excellent' | 'good' | 'warning' | 'critical';
    message: string;
    recommendations: string[];
  }> {
    try {
      const currentStats = await this.getCurrentMemoryStats();
      const leakDetection = await this.detectMemoryLeaks();

      let level: 'excellent' | 'good' | 'warning' | 'critical';
      let message: string;
      let recommendations: string[] = [];

      if (currentStats.usagePercentage < 50 && !leakDetection.isLeakDetected) {
        level = 'excellent';
        message = '内存使用正常';
      } else if (currentStats.usagePercentage < 70 && !leakDetection.isLeakDetected) {
        level = 'good';
        message = '内存使用良好';
      } else if (currentStats.usagePercentage < 85 || leakDetection.isLeakDetected) {
        level = 'warning';
        message = '内存使用较高，建议优化';
        recommendations.push('执行内存清理');
        recommendations.push('检查内存泄漏');
      } else {
        level = 'critical';
        message = '内存使用过高，需要立即处理';
        recommendations.push('立即执行内存优化');
        recommendations.push('考虑重启应用');
        recommendations.push('检查内存泄漏');
      }

      if (leakDetection.isLeakDetected) {
        recommendations.push(...leakDetection.recommendations);
      }

      return {
        isHealthy: level === 'excellent' || level === 'good',
        level,
        message,
        recommendations
      };
    } catch (error) {
      console.error('❌ 检查内存健康状态失败:', error);
      return {
        isHealthy: false,
        level: 'critical',
        message: '无法检查内存状态',
        recommendations: ['重启应用']
      };
    }
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.stopMonitoring();
    this.memoryHistory = [];
    console.log('🧠 智能内存管理器已销毁');
  }
}

export const smartMemoryManager = SmartMemoryManager.getInstance();
