/**
 * 批量操作服务 - 优化数据库性能
 * 合并小批量写入操作，减少数据库访问频率
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BatchOperation<T = any> {
  id: string;
  type: 'insert' | 'update' | 'delete';
  data: T;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
}

export interface BatchConfig {
  maxBatchSize: number;      // 最大批量大小
  maxBatchWaitTime: number;  // 最大等待时间
  flushInterval: number;     // 刷新间隔
  maxRetries: number;        // 最大重试次数
}

export class BatchOperationService {
  private static instance: BatchOperationService;
  private batches: Map<string, BatchOperation[]> = new Map();
  private timers: Map<string, number> = new Map();
  private configs: Map<string, BatchConfig> = new Map();
  private isProcessing: Map<string, boolean> = new Map();

  private constructor() {
    this.initializeConfigs();
  }

  public static getInstance(): BatchOperationService {
    if (!BatchOperationService.instance) {
      BatchOperationService.instance = new BatchOperationService();
    }
    return BatchOperationService.instance;
  }

  // 初始化批量配置 - 优化批量处理策略
  private initializeConfigs(): void {
    // 学习记录批量配置 - 高频数据，大幅增加批量大小
    this.configs.set('learningRecords', {
      maxBatchSize: 200,       // 增加批量大小 (原50) - 减少75%请求
      maxBatchWaitTime: 30 * 1000,  // 最多等待30秒
      flushInterval: 60 * 1000,     // 每分钟刷新一次
      maxRetries: 3
    });

    // 词汇数据批量配置 - 中频数据，增加批量大小
    this.configs.set('vocabulary', {
      maxBatchSize: 100,       // 增加批量大小 (原20) - 减少80%请求
      maxBatchWaitTime: 60 * 1000,  // 最多等待1分钟
      flushInterval: 2 * 60 * 1000,  // 每2分钟刷新一次
      maxRetries: 3
    });

    // 用户统计批量配置 - 低频数据，适度增加批量大小
    this.configs.set('userStats', {
      maxBatchSize: 50,        // 增加批量大小 (原10) - 减少80%请求
      maxBatchWaitTime: 2 * 60 * 1000,  // 最多等待2分钟
      flushInterval: 5 * 60 * 1000,     // 每5分钟刷新一次
      maxRetries: 2
    });

    // 经验值批量配置 - 超高频数据，大幅增加批量大小
    this.configs.set('experience', {
      maxBatchSize: 500,       // 增加批量大小 (原100) - 减少80%请求
      maxBatchWaitTime: 10 * 1000,  // 最多等待10秒
      flushInterval: 30 * 1000,     // 每30秒刷新一次
      maxRetries: 3
    });

    // 剧单数据批量配置 - 低频数据，适度增加批量大小
    this.configs.set('shows', {
      maxBatchSize: 30,        // 增加批量大小 (原10) - 减少67%请求
      maxBatchWaitTime: 5 * 60 * 1000,  // 最多等待5分钟
      flushInterval: 10 * 60 * 1000,    // 每10分钟刷新一次
      maxRetries: 2
    });

    // 徽章数据批量配置 - 低频数据，适度增加批量大小
    this.configs.set('badges', {
      maxBatchSize: 50,        // 增加批量大小 (原20) - 减少60%请求
      maxBatchWaitTime: 5 * 60 * 1000,  // 最多等待5分钟
      flushInterval: 15 * 60 * 1000,    // 每15分钟刷新一次
      maxRetries: 2
    });

    // 搜索历史批量配置 - 中频数据，大幅增加批量大小
    this.configs.set('searchHistory', {
      maxBatchSize: 300,       // 新增配置 - 大幅批量处理
      maxBatchWaitTime: 2 * 60 * 1000,  // 最多等待2分钟
      flushInterval: 5 * 60 * 1000,     // 每5分钟刷新一次
      maxRetries: 2
    });

    // 用户设置批量配置 - 超低频数据，保持较小批量大小
    this.configs.set('userSettings', {
      maxBatchSize: 20,        // 新增配置 - 保持较小批量
      maxBatchWaitTime: 10 * 60 * 1000,  // 最多等待10分钟
      flushInterval: 30 * 60 * 1000,     // 每30分钟刷新一次
      maxRetries: 1
    });
  }

  // 添加操作到批量队列
  public async addOperation<T>(
    dataType: string,
    operation: Omit<BatchOperation<T>, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    const config = this.configs.get(dataType);
    if (!config) {
      console.warn(`[BatchOperationService] 未知的数据类型: ${dataType}`);
      return;
    }

    const batchOperation: BatchOperation<T> = {
      ...operation,
      id: `${dataType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    // 添加到批量队列
    if (!this.batches.has(dataType)) {
      this.batches.set(dataType, []);
    }
    this.batches.get(dataType)!.push(batchOperation);

    console.log(`[BatchOperationService] 添加操作到批量队列: ${dataType}, 当前队列大小: ${this.batches.get(dataType)!.length}`);

    // 检查是否需要立即处理
    const currentBatch = this.batches.get(dataType)!;
    if (currentBatch.length >= config.maxBatchSize) {
      await this.processBatch(dataType);
    } else if (currentBatch.length === 1) {
      // 第一个操作，启动定时器
      this.startBatchTimer(dataType);
    }
  }

  // 启动批量定时器
  private startBatchTimer(dataType: string): void {
    const config = this.configs.get(dataType);
    if (!config) return;

    // 清除现有定时器
    if (this.timers.has(dataType)) {
      clearTimeout(this.timers.get(dataType)!);
    }

    // 设置新定时器
    const timer = setTimeout(async () => {
      await this.processBatch(dataType);
    }, config.maxBatchWaitTime);

    this.timers.set(dataType, timer);
  }

  // 处理批量操作
  private async processBatch(dataType: string): Promise<void> {
    if (this.isProcessing.get(dataType)) {
      console.log(`[BatchOperationService] 批量处理正在进行中: ${dataType}`);
      return;
    }

    const batch = this.batches.get(dataType);
    if (!batch || batch.length === 0) {
      return;
    }

    this.isProcessing.set(dataType, true);

    try {
      console.log(`[BatchOperationService] 开始处理批量操作: ${dataType}, 操作数量: ${batch.length}`);

      // 按优先级排序
      const sortedBatch = batch.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // 执行批量操作
      const success = await this.executeBatchOperation(dataType, sortedBatch);

      if (success) {
        // 清空批量队列
        this.batches.set(dataType, []);
        console.log(`[BatchOperationService] 批量操作成功: ${dataType}`);
      } else {
        // 重试失败的操作
        await this.retryFailedOperations(dataType, sortedBatch);
      }

    } catch (error) {
      console.error(`[BatchOperationService] 批量操作失败: ${dataType}`, error);
      await this.retryFailedOperations(dataType, batch);
    } finally {
      this.isProcessing.set(dataType, false);
      this.timers.delete(dataType);
    }
  }

  // 执行批量操作
  private async executeBatchOperation(dataType: string, operations: BatchOperation[]): Promise<boolean> {
    try {
      // 模拟批量操作执行
      console.log(`[BatchOperationService] 执行批量操作: ${dataType}, 操作数量: ${operations.length}`);

      // 这里应该调用实际的API批量操作
      // 例如：await apiService.batchUpload(dataType, operations);
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 100));

      // 模拟成功率（实际应该根据API响应判断）
      const successRate = 0.95; // 95%成功率
      return Math.random() < successRate;

    } catch (error) {
      console.error(`[BatchOperationService] 执行批量操作异常: ${dataType}`, error);
      return false;
    }
  }

  // 重试失败的操作
  private async retryFailedOperations(dataType: string, operations: BatchOperation[]): Promise<void> {
    const config = this.configs.get(dataType);
    if (!config) return;

    const retryOperations: BatchOperation[] = [];

    for (const operation of operations) {
      if (operation.retryCount < config.maxRetries) {
        operation.retryCount++;
        retryOperations.push(operation);
      } else {
        console.warn(`[BatchOperationService] 操作重试次数超限，丢弃: ${operation.id}`);
        // 这里可以保存到失败队列或发送错误报告
      }
    }

    if (retryOperations.length > 0) {
      // 延迟重试
      setTimeout(async () => {
        if (!this.batches.has(dataType)) {
          this.batches.set(dataType, []);
        }
        this.batches.get(dataType)!.push(...retryOperations);
        await this.processBatch(dataType);
      }, 5000); // 5秒后重试
    }
  }

  // 强制刷新所有批量队列
  public async flushAllBatches(): Promise<void> {
    console.log('[BatchOperationService] 强制刷新所有批量队列');
    
    const dataTypes = Array.from(this.batches.keys());
    const promises = dataTypes.map(dataType => this.processBatch(dataType));
    
    await Promise.all(promises);
  }

  // 获取批量队列状态
  public getBatchStatus(): Record<string, { count: number; oldestOperation: number }> {
    const status: Record<string, { count: number; oldestOperation: number }> = {};

    for (const [dataType, batch] of this.batches.entries()) {
      if (batch.length > 0) {
        const oldestOperation = Math.min(...batch.map(op => op.timestamp));
        status[dataType] = {
          count: batch.length,
          oldestOperation
        };
      }
    }

    return status;
  }

  // 清理过期操作
  public async cleanupExpiredOperations(): Promise<void> {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时

    for (const [dataType, batch] of this.batches.entries()) {
      const validOperations = batch.filter(op => now - op.timestamp < maxAge);
      
      if (validOperations.length !== batch.length) {
        this.batches.set(dataType, validOperations);
        console.log(`[BatchOperationService] 清理过期操作: ${dataType}, 清理数量: ${batch.length - validOperations.length}`);
      }
    }
  }

  // 启动定期清理
  public startPeriodicCleanup(): void {
    // 每小时清理一次过期操作
    setInterval(() => {
      this.cleanupExpiredOperations();
    }, 60 * 60 * 1000);

    // 每5分钟检查一次批量队列状态
    setInterval(() => {
      const status = this.getBatchStatus();
      if (Object.keys(status).length > 0) {
        console.log('[BatchOperationService] 批量队列状态:', status);
      }
    }, 5 * 60 * 1000);
  }
}

export default BatchOperationService;
