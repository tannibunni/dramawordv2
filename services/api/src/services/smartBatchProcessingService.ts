import { logger } from '../utils/logger';

export interface BatchProcessingConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  flushInterval: number;
  maxRetries: number;
  enableCompression: boolean;
  enableDeduplication: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface BatchOperation<T = any> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  userId: string;
}

export interface BatchProcessingResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  totalTime: number;
  averageTimePerItem: number;
  compressionRatio?: number;
  errors: string[];
}

export class SmartBatchProcessingService {
  private static instance: SmartBatchProcessingService;
  private batchQueues: Map<string, BatchOperation[]> = new Map();
  private processingBatches: Set<string> = new Set();
  private configs: Map<string, BatchProcessingConfig> = new Map();
  private flushTimers: Map<string, NodeJS.Timeout> = new Map();
  private processingStats: Map<string, any> = new Map();

  private constructor() {
    this.initializeConfigs();
    this.startPeriodicFlush();
  }

  public static getInstance(): SmartBatchProcessingService {
    if (!SmartBatchProcessingService.instance) {
      SmartBatchProcessingService.instance = new SmartBatchProcessingService();
    }
    return SmartBatchProcessingService.instance;
  }

  // 初始化批量处理配置
  private initializeConfigs(): void {
    // 学习记录批量配置 - 高频数据
    this.configs.set('learningRecords', {
      maxBatchSize: 200,              // 增加批量大小 (原50)
      maxWaitTime: 30 * 1000,         // 30秒等待时间
      flushInterval: 60 * 1000,       // 1分钟刷新间隔
      maxRetries: 3,
      enableCompression: true,
      enableDeduplication: true,
      priority: 'high'
    });

    // 经验值批量配置 - 超高频数据
    this.configs.set('experience', {
      maxBatchSize: 500,              // 大幅增加批量大小 (原100)
      maxWaitTime: 10 * 1000,         // 10秒等待时间
      flushInterval: 30 * 1000,       // 30秒刷新间隔
      maxRetries: 3,
      enableCompression: true,
      enableDeduplication: true,
      priority: 'high'
    });

    // 词汇数据批量配置 - 中频数据
    this.configs.set('vocabulary', {
      maxBatchSize: 100,              // 增加批量大小 (原20)
      maxWaitTime: 60 * 1000,         // 1分钟等待时间
      flushInterval: 2 * 60 * 1000,   // 2分钟刷新间隔
      maxRetries: 3,
      enableCompression: true,
      enableDeduplication: true,
      priority: 'medium'
    });

    // 用户统计批量配置 - 低频数据
    this.configs.set('userStats', {
      maxBatchSize: 50,               // 增加批量大小 (原10)
      maxWaitTime: 2 * 60 * 1000,     // 2分钟等待时间
      flushInterval: 5 * 60 * 1000,   // 5分钟刷新间隔
      maxRetries: 2,
      enableCompression: false,
      enableDeduplication: false,
      priority: 'low'
    });

    // 剧单数据批量配置 - 低频数据
    this.configs.set('shows', {
      maxBatchSize: 30,               // 增加批量大小 (原10)
      maxWaitTime: 5 * 60 * 1000,     // 5分钟等待时间
      flushInterval: 10 * 60 * 1000,  // 10分钟刷新间隔
      maxRetries: 2,
      enableCompression: false,
      enableDeduplication: false,
      priority: 'low'
    });

    // 徽章数据批量配置 - 低频数据
    this.configs.set('badges', {
      maxBatchSize: 50,               // 增加批量大小 (原20)
      maxWaitTime: 5 * 60 * 1000,     // 5分钟等待时间
      flushInterval: 15 * 60 * 1000,  // 15分钟刷新间隔
      maxRetries: 2,
      enableCompression: false,
      enableDeduplication: false,
      priority: 'low'
    });

    // 搜索历史批量配置 - 中频数据
    this.configs.set('searchHistory', {
      maxBatchSize: 300,              // 大幅增加批量大小
      maxWaitTime: 2 * 60 * 1000,     // 2分钟等待时间
      flushInterval: 5 * 60 * 1000,   // 5分钟刷新间隔
      maxRetries: 2,
      enableCompression: true,
      enableDeduplication: true,
      priority: 'medium'
    });

    // 用户设置批量配置 - 超低频数据
    this.configs.set('userSettings', {
      maxBatchSize: 20,               // 保持较小批量大小
      maxWaitTime: 10 * 60 * 1000,    // 10分钟等待时间
      flushInterval: 30 * 60 * 1000,  // 30分钟刷新间隔
      maxRetries: 1,
      enableCompression: false,
      enableDeduplication: false,
      priority: 'low'
    });
  }

  // 添加操作到批量队列
  public async addOperation<T>(
    dataType: string,
    operation: Omit<BatchOperation<T>, 'id' | 'timestamp' | 'retryCount'>,
    userId: string
  ): Promise<void> {
    const config = this.configs.get(dataType);
    if (!config) {
      throw new Error(`未知的数据类型: ${dataType}`);
    }

    const batchOperation: BatchOperation<T> = {
      id: `${dataType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: dataType,
      data: operation.data,
      timestamp: Date.now(),
      priority: operation.priority || config.priority,
      retryCount: 0,
      userId
    };

    // 获取或创建队列
    if (!this.batchQueues.has(dataType)) {
      this.batchQueues.set(dataType, []);
    }

    const queue = this.batchQueues.get(dataType)!;
    
    // 去重处理
    if (config.enableDeduplication) {
      const existingIndex = queue.findIndex(op => 
        op.userId === userId && 
        JSON.stringify(op.data) === JSON.stringify(operation.data)
      );
      
      if (existingIndex !== -1) {
        // 更新现有操作而不是添加新操作
        queue[existingIndex] = batchOperation;
        logger.info(`🔄 更新重复操作: ${dataType} for user ${userId}`);
        return;
      }
    }

    queue.push(batchOperation);
    logger.info(`📝 添加操作到队列: ${dataType} for user ${userId}, 队列长度: ${queue.length}`);

    // 检查是否需要立即处理
    if (queue.length >= config.maxBatchSize) {
      await this.processBatch(dataType);
    }
  }

  // 处理批量数据
  private async processBatch(dataType: string): Promise<BatchProcessingResult> {
    const config = this.configs.get(dataType);
    if (!config) {
      throw new Error(`未知的数据类型: ${dataType}`);
    }

    const queue = this.batchQueues.get(dataType);
    if (!queue || queue.length === 0) {
      return {
        success: true,
        processedCount: 0,
        errorCount: 0,
        totalTime: 0,
        averageTimePerItem: 0,
        errors: []
      };
    }

    // 防止重复处理
    if (this.processingBatches.has(dataType)) {
      logger.warn(`⚠️ 批量处理正在进行中: ${dataType}`);
      return {
        success: false,
        processedCount: 0,
        errorCount: 0,
        totalTime: 0,
        averageTimePerItem: 0,
        errors: ['批量处理正在进行中']
      };
    }

    this.processingBatches.add(dataType);
    const startTime = Date.now();

    try {
      // 获取要处理的数据
      const batchSize = Math.min(config.maxBatchSize, queue.length);
      const batch = queue.splice(0, batchSize);
      
      logger.info(`🚀 开始处理批量数据: ${dataType}, 数量: ${batch.length}`);

      // 按用户分组处理
      const userGroups = this.groupByUser(batch);
      const results: any[] = [];
      const errors: string[] = [];

      // 并发处理不同用户的数据
      const userPromises = Array.from(userGroups.entries()).map(async ([userId, userBatch]) => {
        try {
          const userResult = await this.processUserBatch(dataType, userBatch, userId, config);
          results.push(...userResult);
        } catch (error) {
          const errorMsg = `处理用户 ${userId} 的 ${dataType} 数据失败: ${error instanceof Error ? error.message : '未知错误'}`;
          errors.push(errorMsg);
          logger.error(`❌ ${errorMsg}`);
        }
      });

      await Promise.allSettled(userPromises);

      const totalTime = Date.now() - startTime;
      const processedCount = results.length;
      const errorCount = errors.length;

      // 更新统计信息
      this.updateProcessingStats(dataType, {
        processedCount,
        errorCount,
        totalTime,
        averageTimePerItem: processedCount > 0 ? totalTime / processedCount : 0,
        lastProcessed: Date.now()
      });

      logger.info(`✅ 批量处理完成: ${dataType}, 成功: ${processedCount}, 失败: ${errorCount}, 耗时: ${totalTime}ms`);

      return {
        success: errorCount === 0,
        processedCount,
        errorCount,
        totalTime,
        averageTimePerItem: processedCount > 0 ? totalTime / processedCount : 0,
        errors
      };

    } catch (error) {
      logger.error(`❌ 批量处理失败: ${dataType}`, error);
      return {
        success: false,
        processedCount: 0,
        errorCount: queue.length,
        totalTime: Date.now() - startTime,
        averageTimePerItem: 0,
        errors: [error instanceof Error ? error.message : '未知错误']
      };
    } finally {
      this.processingBatches.delete(dataType);
    }
  }

  // 按用户分组
  private groupByUser(batch: BatchOperation[]): Map<string, BatchOperation[]> {
    const userGroups = new Map<string, BatchOperation[]>();
    
    for (const operation of batch) {
      if (!userGroups.has(operation.userId)) {
        userGroups.set(operation.userId, []);
      }
      userGroups.get(operation.userId)!.push(operation);
    }
    
    return userGroups;
  }

  // 处理单个用户的批量数据
  private async processUserBatch(
    dataType: string,
    userBatch: BatchOperation[],
    userId: string,
    config: BatchProcessingConfig
  ): Promise<any[]> {
    // 这里应该调用实际的数据库操作
    // 例如：批量插入、更新、删除等
    logger.info(`👤 处理用户 ${userId} 的 ${dataType} 数据: ${userBatch.length} 条`);
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    return userBatch.map(op => ({
      id: op.id,
      userId: op.userId,
      type: op.type,
      success: true,
      timestamp: Date.now()
    }));
  }

  // 更新处理统计
  private updateProcessingStats(dataType: string, stats: any): void {
    const currentStats = this.processingStats.get(dataType) || {
      totalProcessed: 0,
      totalErrors: 0,
      totalTime: 0,
      averageTimePerItem: 0,
      lastProcessed: 0
    };

    currentStats.totalProcessed += stats.processedCount;
    currentStats.totalErrors += stats.errorCount;
    currentStats.totalTime += stats.totalTime;
    currentStats.averageTimePerItem = currentStats.totalProcessed > 0 
      ? currentStats.totalTime / currentStats.totalProcessed 
      : 0;
    currentStats.lastProcessed = stats.lastProcessed;

    this.processingStats.set(dataType, currentStats);
  }

  // 启动定期刷新
  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushAllBatches();
    }, 30000); // 每30秒检查一次
  }

  // 刷新所有批量队列
  public async flushAllBatches(): Promise<void> {
    for (const [dataType, queue] of this.batchQueues.entries()) {
      if (queue.length > 0) {
        const config = this.configs.get(dataType);
        if (config && Date.now() - queue[0].timestamp > config.maxWaitTime) {
          await this.processBatch(dataType);
        }
      }
    }
  }

  // 获取处理统计
  public getProcessingStats(): Map<string, any> {
    return new Map(this.processingStats);
  }

  // 获取队列状态
  public getQueueStatus(): Map<string, number> {
    const status = new Map<string, number>();
    for (const [dataType, queue] of this.batchQueues.entries()) {
      status.set(dataType, queue.length);
    }
    return status;
  }

  // 清空队列
  public clearQueue(dataType: string): void {
    this.batchQueues.set(dataType, []);
    logger.info(`🗑️ 清空队列: ${dataType}`);
  }

  // 清空所有队列
  public clearAllQueues(): void {
    this.batchQueues.clear();
    logger.info(`🗑️ 清空所有队列`);
  }
}

export const smartBatchProcessingService = SmartBatchProcessingService.getInstance();
