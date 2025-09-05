/**
 * 内存管理使用示例
 * 展示如何使用智能内存管理器解决内存问题
 */

import { SmartMemoryManager } from './smartMemoryManager';
import { PerformanceOptimizationService } from './performanceOptimizationService';
import { ErrorHandlingAndRetryService } from './errorHandlingAndRetryService';

export class MemoryManagementExample {
  private memoryManager: SmartMemoryManager;
  private performanceService: PerformanceOptimizationService;

  constructor() {
    this.memoryManager = SmartMemoryManager.getInstance();
    this.performanceService = PerformanceOptimizationService.getInstance();
  }

  /**
   * 初始化内存管理
   */
  public async initializeMemoryManagement(): Promise<void> {
    try {
      console.log('🧠 初始化内存管理...');

      // 1. 启动内存监控
      this.memoryManager.startMonitoring(30000); // 每30秒监控一次

      // 2. 检查初始内存状态
      const initialHealth = await this.memoryManager.checkMemoryHealth();
      console.log('📊 初始内存状态:', initialHealth);

      // 3. 如果内存状态不佳，立即优化
      if (!initialHealth.isHealthy) {
        console.log('⚠️ 内存状态不佳，开始优化...');
        await this.optimizeMemory();
      }

      console.log('✅ 内存管理初始化完成');
    } catch (error) {
      console.error('❌ 内存管理初始化失败:', error);
    }
  }

  /**
   * 优化内存
   */
  public async optimizeMemory(): Promise<void> {
    try {
      console.log('🧹 开始内存优化...');

      // 1. 使用智能内存管理器优化
      const memoryResult = await this.memoryManager.optimizeMemory();
      console.log('📊 内存优化结果:', memoryResult);

      // 2. 使用性能优化服务优化
      await this.performanceService.optimizeMemory();

      // 3. 检查优化后的状态
      const healthAfter = await this.memoryManager.checkMemoryHealth();
      console.log('📊 优化后内存状态:', healthAfter);

    } catch (error) {
      console.error('❌ 内存优化失败:', error);
    }
  }

  /**
   * 监控内存使用
   */
  public async monitorMemoryUsage(): Promise<void> {
    try {
      // 获取当前内存状态
      const currentState = await this.memoryManager.getCurrentMemoryState();
      console.log('📊 当前内存状态:', {
        used: `${currentState.usedMemory.toFixed(2)}MB`,
        total: `${currentState.totalMemory.toFixed(2)}MB`,
        usage: `${currentState.usagePercentage.toFixed(1)}%`,
        available: `${currentState.availableMemory.toFixed(2)}MB`
      });

      // 检查内存健康状态
      const health = await this.memoryManager.checkMemoryHealth();
      console.log('🏥 内存健康状态:', health);

      // 如果内存使用率过高，自动优化
      if (currentState.usagePercentage > 80) {
        console.log('⚠️ 内存使用率过高，自动优化...');
        await this.optimizeMemory();
      }

    } catch (error) {
      console.error('❌ 监控内存使用失败:', error);
    }
  }

  /**
   * 处理内存泄漏
   */
  public async handleMemoryLeak(): Promise<void> {
    try {
      console.log('🔍 检查内存泄漏...');

      // 获取内存历史
      const history = this.memoryManager.getMemoryHistory();
      if (history.length < 10) {
        console.log('⚠️ 内存历史数据不足，无法检测泄漏');
        return;
      }

      // 分析内存趋势
      const recentStats = history.slice(-10);
      const firstStat = recentStats[0];
      const lastStat = recentStats[recentStats.length - 1];
      const memoryIncrease = lastStat.usedMemory - firstStat.usedMemory;
      const timeDiff = (lastStat.timestamp - firstStat.timestamp) / (1000 * 60); // 分钟
      const leakRate = memoryIncrease / timeDiff;

      console.log('📊 内存泄漏分析:', {
        memoryIncrease: `${memoryIncrease.toFixed(2)}MB`,
        timeDiff: `${timeDiff.toFixed(1)}分钟`,
        leakRate: `${leakRate.toFixed(2)}MB/分钟`
      });

      if (leakRate > 0.1) { // 泄漏率超过0.1MB/分钟
        console.log('🚨 检测到内存泄漏，开始处理...');
        
        // 1. 立即优化内存
        await this.optimizeMemory();
        
        // 2. 记录错误
        const errorService = ErrorHandlingAndRetryService.getInstance();
        await errorService.recordPerformanceIssue(
          'memory_high',
          'high',
          `检测到内存泄漏，泄漏率: ${leakRate.toFixed(2)}MB/分钟`,
          { memoryUsage: lastStat.usagePercentage }
        );
        
        console.log('✅ 内存泄漏处理完成');
      } else {
        console.log('✅ 未检测到内存泄漏');
      }

    } catch (error) {
      console.error('❌ 处理内存泄漏失败:', error);
    }
  }

  /**
   * 演示完整的内存管理流程
   */
  public async demonstrateMemoryManagement(): Promise<void> {
    try {
      console.log('🎯 开始内存管理演示...');

      // 1. 初始化
      await this.initializeMemoryManagement();

      // 2. 监控内存使用
      await this.monitorMemoryUsage();

      // 3. 检查内存泄漏
      await this.handleMemoryLeak();

      // 4. 获取内存历史
      const history = this.memoryManager.getMemoryHistory();
      console.log('📊 内存历史记录:', history.length, '条记录');

      // 5. 最终状态检查
      const finalHealth = await this.memoryManager.checkMemoryHealth();
      console.log('📊 最终内存状态:', finalHealth);

      console.log('✅ 内存管理演示完成');

    } catch (error) {
      console.error('❌ 内存管理演示失败:', error);
    }
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.memoryManager.destroy();
    console.log('🗑️ 内存管理示例已清理');
  }
}

// 使用示例
export const memoryManagementExample = new MemoryManagementExample();

// 在应用启动时初始化内存管理
export const initializeAppMemoryManagement = async () => {
  try {
    await memoryManagementExample.initializeMemoryManagement();
    
    // 定期检查内存状态（每5分钟）
    setInterval(async () => {
      await memoryManagementExample.monitorMemoryUsage();
    }, 5 * 60 * 1000);
    
    console.log('✅ 应用内存管理已启动');
  } catch (error) {
    console.error('❌ 应用内存管理启动失败:', error);
  }
};
