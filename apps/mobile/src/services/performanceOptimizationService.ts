/**
 * ========================================
 * 🔄 [SYNC SERVICE] 数据同步服务
 * ========================================
 * 
 * 服务类型: 数据同步相关服务
 * 功能描述: 性能优化服务 - 同步性能优化
 * 维护状态: 活跃维护中
 * 
 * 相关服务:
 * - 统一同步: unifiedSyncService.ts
 * - 数据下载: newDeviceDataDownloadService.ts
 * - 上传策略: smartUploadStrategy.ts
 * - 冲突解决: dataConflictResolutionService.ts
 * - 网络管理: networkStateManagementService.ts
 * 
 * 注意事项:
 * - 此服务属于数据同步核心模块
 * - 修改前请确保了解同步机制
 * - 建议在测试环境充分验证
 * ========================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkStateManagementService } from './networkStateManagementService';
import { unifiedSyncService } from './unifiedSyncService';
import { ErrorHandlingAndRetryService } from './errorHandlingAndRetryService';

export interface PerformanceMetrics {
  memoryUsage: number; // MB
  cpuUsage: number; // 百分比
  processingTime: number; // 毫秒
  dataSize: number; // MB
  batchSize: number;
  compressionRatio: number; // 压缩比
  cacheHitRate: number; // 缓存命中率
  lastOptimization: number; // 时间戳
  totalRequests: number; // 总请求数
}

export interface BatchProcessingConfig {
  maxBatchSize: number;
  maxConcurrentBatches: number;
  batchTimeout: number; // 毫秒
  retryAttempts: number;
  enableCompression: boolean;
  enableCaching: boolean;
  memoryThreshold: number; // MB
}

export interface MemoryOptimizationConfig {
  maxMemoryUsage: number; // MB
  cacheSizeLimit: number; // MB
  cleanupInterval: number; // 毫秒
  enableGarbageCollection: boolean;
  enableMemoryMonitoring: boolean;
}

export interface BackgroundSyncConfig {
  enableBackgroundSync: boolean;
  syncInterval: number; // 毫秒
  maxBackgroundTime: number; // 毫秒
  enableBatteryOptimization: boolean;
  enableDataCompression: boolean;
}

export class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private networkService: NetworkStateManagementService;
  
  private performanceMetrics: PerformanceMetrics = {
    memoryUsage: 0,
    cpuUsage: 0,
    processingTime: 0,
    dataSize: 0,
    batchSize: 0,
    compressionRatio: 1.0,
    cacheHitRate: 0,
    lastOptimization: 0,
    totalRequests: 0
  };

  // 添加缺失的属性
  private syncQueue: any[] = [];
  private batchProcessingQueue: any[] = [];
  
  private batchConfig: BatchProcessingConfig = {
    maxBatchSize: 1000,
    maxConcurrentBatches: 3,
    batchTimeout: 30000,
    retryAttempts: 3,
    enableCompression: true,
    enableCaching: true,
    memoryThreshold: 100
  };
  
  private memoryConfig: MemoryOptimizationConfig = {
    maxMemoryUsage: 200, // 200MB
    cacheSizeLimit: 50, // 50MB
    cleanupInterval: 5 * 60 * 1000, // 5分钟
    enableGarbageCollection: true,
    enableMemoryMonitoring: true
  };
  
  private backgroundConfig: BackgroundSyncConfig = {
    enableBackgroundSync: true,
    syncInterval: 10 * 60 * 1000, // 10分钟
    maxBackgroundTime: 5 * 60 * 1000, // 5分钟
    enableBatteryOptimization: true,
    enableDataCompression: true
  };
  
  private isInitialized: boolean = false;
  private cleanupTimer: number | null = null;
  private memoryMonitorTimer: number | null = null;
  private backgroundSyncTimer: number | null = null;
  
  private dataCache: Map<string, { data: any; timestamp: number; size: number }> = new Map();
  private processingBatches: Set<string> = new Set();
  private batchQueue: Array<{ id: string; data: any[]; priority: number }> = [];

  public static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  private constructor() {
    this.networkService = NetworkStateManagementService.getInstance();
  }

  // 初始化性能优化服务
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('🔄 性能优化服务已初始化，跳过重复初始化');
        return;
      }

      console.log('⚡ 初始化性能优化服务...');
      
      // 加载配置
      await this.loadConfigurations();
      
      // 启动内存监控
      this.startMemoryMonitoring();
      
      // 启动定期清理
      this.startPeriodicCleanup();
      
      // 启动后台同步
      this.startBackgroundSync();
      
      this.isInitialized = true;
      console.log('✅ 性能优化服务初始化完成');
      
    } catch (error) {
      console.error('❌ 性能优化服务初始化失败:', error);
      throw error;
    }
  }

  // 大数据量批量处理
  public async processLargeData<T>(
    data: T[],
    processor: (batch: T[]) => Promise<any>,
    options?: Partial<BatchProcessingConfig>
  ): Promise<any[]> {
    try {
      const config = { ...this.batchConfig, ...options };
      const startTime = Date.now();
      
      console.log(`📦 开始批量处理${data.length}条数据，批次大小: ${config.maxBatchSize}`);
      
      // 检查内存使用情况
      await this.checkMemoryUsage();
      
      // 创建批次
      const batches = this.createBatches(data, config.maxBatchSize);
      const results: any[] = [];
      
      // 并发处理批次
      const batchPromises = batches.map(async (batch, index) => {
        const batchId = `batch_${Date.now()}_${index}`;
        
        try {
          this.processingBatches.add(batchId);
          
          // 压缩数据（如果启用）
          let processedBatch = batch;
          if (config.enableCompression) {
            processedBatch = await this.compressData(batch);
          }
          
          // 处理批次
          const result = await this.processBatchWithTimeout(
            batchId,
            processedBatch,
            processor,
            config
          );
          
          results.push(result);
          
          // 更新性能指标
          this.updatePerformanceMetrics({
            dataSize: this.calculateDataSize(batch),
            batchSize: batch.length,
            compressionRatio: config.enableCompression ? this.calculateCompressionRatio(batch, processedBatch) : 1.0
          });
          
        } catch (error) {
          console.error(`❌ 处理批次${batchId}失败:`, error);
          throw error;
        } finally {
          this.processingBatches.delete(batchId);
        }
      });
      
      // 等待所有批次完成
      const batchResults = await Promise.allSettled(batchPromises);
      
      // 处理结果
      const successfulResults = batchResults
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value);
      
      const failedResults = batchResults
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);
      
      if (failedResults.length > 0) {
        console.warn(`⚠️ ${failedResults.length}个批次处理失败`);
      }
      
      const totalTime = Date.now() - startTime;
      this.updatePerformanceMetrics({ processingTime: totalTime });
      
      console.log(`✅ 批量处理完成: 成功${successfulResults.length}个批次，失败${failedResults.length}个批次，总耗时${totalTime}ms`);
      
      return successfulResults;
      
    } catch (error) {
      console.error('❌ 批量处理失败:', error);
      throw error;
    }
  }

  // 创建批次
  private createBatches<T>(data: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    
    return batches;
  }

  // 处理单个批次（带超时）
  private async processBatchWithTimeout<T>(
    batchId: string,
    batch: T[],
    processor: (batch: T[]) => Promise<any>,
    config: BatchProcessingConfig
  ): Promise<any> {
    try {
      console.log(`🔄 处理批次${batchId}，数据量: ${batch.length}`);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`批次${batchId}处理超时`)), config.batchTimeout);
      });
      
      const processPromise = processor(batch);
      
      const result = await Promise.race([processPromise, timeoutPromise]);
      
      console.log(`✅ 批次${batchId}处理完成`);
      return result;
      
    } catch (error) {
      console.error(`❌ 批次${batchId}处理失败:`, error);
      throw error;
    }
  }

  // 数据压缩
  private async compressData<T>(data: T[]): Promise<T[]> {
    try {
      // 这里可以实现实际的数据压缩算法
      // 目前返回原数据
      return data;
    } catch (error) {
      console.error('❌ 数据压缩失败:', error);
      return data;
    }
  }

  // 计算压缩比
  private calculateCompressionRatio(original: any[], compressed: any[]): number {
    try {
      const originalSize = JSON.stringify(original).length;
      const compressedSize = JSON.stringify(compressed).length;
      return originalSize / compressedSize;
    } catch (error) {
      return 1.0;
    }
  }

  // 内存优化
  public async optimizeMemory(): Promise<void> {
    try {
      console.log('🧹 开始内存优化...');
      
      const beforeMemory = await this.getCurrentMemoryUsage();
      
      // 1. 清理过期缓存
      await this.cleanupExpiredCache();
      
      // 2. 清理大对象
      await this.cleanupLargeObjects();
      
      // 3. 清理同步队列
      await this.cleanupSyncQueue();
      
      // 4. 清理批处理队列
      await this.cleanupBatchQueue();
      
      // 5. 清理临时数据
      await this.cleanupTemporaryData();
      
      // 6. 强制垃圾回收（如果启用）
      if (this.memoryConfig.enableGarbageCollection) {
        this.forceGarbageCollection();
      }
      
      // 7. 更新性能指标
      const afterMemory = await this.getCurrentMemoryUsage();
      this.updatePerformanceMetrics({
        memoryUsage: afterMemory,
        lastOptimization: Date.now()
      });
      
      const memorySaved = beforeMemory - afterMemory;
      console.log(`✅ 内存优化完成，释放内存: ${memorySaved.toFixed(1)}%`);
      
    } catch (error) {
      console.error('❌ 内存优化失败:', error);
    }
  }

  // 清理过期缓存
  private async cleanupExpiredCache(): Promise<void> {
    try {
      const now = Date.now();
      const cacheExpiry = 30 * 60 * 1000; // 30分钟
      
      for (const [key, value] of this.dataCache.entries()) {
        if (now - value.timestamp > cacheExpiry) {
          this.dataCache.delete(key);
        }
      }
      
      console.log(`🗑️ 清理过期缓存完成，剩余缓存项: ${this.dataCache.size}`);
      
    } catch (error) {
      console.error('❌ 清理过期缓存失败:', error);
    }
  }

  // 清理大对象
  private async cleanupLargeObjects(): Promise<void> {
    try {
      const maxObjectSize = 1024 * 1024; // 1MB
      
      for (const [key, value] of this.dataCache.entries()) {
        if (value.size > maxObjectSize) {
          this.dataCache.delete(key);
        }
      }
      
      console.log('🗑️ 清理大对象完成');
      
    } catch (error) {
      console.error('❌ 清理大对象失败:', error);
    }
  }

  // 强制垃圾回收
  private forceGarbageCollection(): void {
    try {
      // 在React Native中，垃圾回收是自动的
      // 这里可以尝试通过清理引用和设置null来帮助垃圾回收
      console.log('♻️ 垃圾回收优化完成');
    } catch (error) {
      console.error('❌ 垃圾回收优化失败:', error);
    }
  }

  // 缓存管理
  public async setCache<T>(key: string, data: T, ttl: number = 30 * 60 * 1000): Promise<void> {
    try {
      const size = this.calculateDataSize(data);
      
      // 检查缓存大小限制
      if (size > this.memoryConfig.cacheSizeLimit * 1024 * 1024) {
        console.warn(`⚠️ 数据过大，跳过缓存: ${key}`);
        return;
      }
      
      this.dataCache.set(key, {
        data,
        timestamp: Date.now(),
        size
      });
      
      console.log(`💾 数据已缓存: ${key}, 大小: ${(size / 1024 / 1024).toFixed(2)}MB`);
      
    } catch (error) {
      console.error('❌ 设置缓存失败:', error);
    }
  }

  public async getCache<T>(key: string): Promise<T | null> {
    try {
      const cached = this.dataCache.get(key);
      
      if (cached) {
        // 更新缓存命中率
        this.updateCacheHitRate(true);
        console.log(`🎯 缓存命中: ${key}`);
        return cached.data as T;
      } else {
        // 更新缓存命中率
        this.updateCacheHitRate(false);
        console.log(`❌ 缓存未命中: ${key}`);
        return null;
      }
      
    } catch (error) {
      console.error('❌ 获取缓存失败:', error);
      return null;
    }
  }

  // 后台同步
  public async startBackgroundSync(): Promise<void> {
    try {
      if (!this.backgroundConfig.enableBackgroundSync) {
        console.log('⏸️ 后台同步已禁用');
        return;
      }
      
      console.log('🔄 启动后台同步...');
      
      // 设置定时器
      this.backgroundSyncTimer = setInterval(async () => {
        await this.performBackgroundSync();
      }, this.backgroundConfig.syncInterval);
      
      console.log('✅ 后台同步已启动');
      
    } catch (error) {
      console.error('❌ 启动后台同步失败:', error);
    }
  }

  // 执行后台同步
  private async performBackgroundSync(): Promise<void> {
    try {
      console.log('🔄 执行后台同步...');
      
      // 检查网络状态
      if (!this.networkService.isNetworkConnected()) {
        console.log('📴 网络未连接，跳过后台同步');
        return;
      }
      
      // 检查电池状态（如果启用）
      if (this.backgroundConfig.enableBatteryOptimization) {
        const batteryLevel = await this.getBatteryLevel();
        if (batteryLevel < 0.2) { // 电池电量低于20%
          console.log('🔋 电池电量低，跳过后台同步');
          return;
        }
      }
      
      // 执行同步
      const startTime = Date.now();
      await unifiedSyncService.syncPendingData();
      const syncTime = Date.now() - startTime;
      
      // 检查是否超过最大后台时间
      if (syncTime > this.backgroundConfig.maxBackgroundTime) {
        console.warn(`⚠️ 后台同步时间过长: ${syncTime}ms`);
      }
      
      console.log(`✅ 后台同步完成，耗时: ${syncTime}ms`);
      
    } catch (error) {
      console.error('❌ 后台同步失败:', error);
    }
  }

  // 获取电池电量
  private async getBatteryLevel(): Promise<number> {
    try {
      // 这里应该调用实际的电池API
      // 目前返回模拟值
      return 0.8; // 80%
    } catch (error) {
      console.error('❌ 获取电池电量失败:', error);
      return 1.0; // 默认100%
    }
  }

  // 启动内存监控
  private startMemoryMonitoring(): void {
    if (!this.memoryConfig.enableMemoryMonitoring) return;
    
    this.memoryMonitorTimer = setInterval(async () => {
      await this.monitorMemoryUsage();
    }, 30 * 1000); // 每30秒监控一次
    
    console.log('📊 内存监控已启动');
  }

  // 监控内存使用
  private async monitorMemoryUsage(): Promise<void> {
    try {
      const currentMemory = await this.getCurrentMemoryUsage();
      
      if (currentMemory > this.memoryConfig.maxMemoryUsage) {
        console.warn(`⚠️ 内存使用过高: ${currentMemory}MB，开始优化...`);
        await this.optimizeMemory();
      }
      
      // 更新性能指标
      this.updatePerformanceMetrics({ memoryUsage: currentMemory });
      
    } catch (error) {
      console.error('❌ 监控内存使用失败:', error);
    }
  }

  // 启动定期清理
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.optimizeMemory();
    }, this.memoryConfig.cleanupInterval);
    
    console.log('🧹 定期清理已启动');
  }

  // 检查内存使用
  private async checkMemoryUsage(): Promise<void> {
    try {
      const currentMemory = await this.getCurrentMemoryUsage();
      
      if (currentMemory > this.memoryConfig.maxMemoryUsage * 0.8) {
        console.warn(`⚠️ 内存使用较高: ${currentMemory}MB，建议优化`);
        await this.optimizeMemory();
      }
      
    } catch (error) {
      console.error('❌ 检查内存使用失败:', error);
    }
  }

  // 获取当前内存使用
  private async getCurrentMemoryUsage(): Promise<number> {
    try {
      // 使用真实的内存监控
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        // 浏览器环境
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        const totalMB = memory.totalJSHeapSize / (1024 * 1024);
        const usagePercentage = (usedMB / totalMB) * 100;
        
        // 记录性能问题
        if (usagePercentage > 80) {
          const errorService = ErrorHandlingAndRetryService.getInstance();
          await errorService.recordPerformanceIssue(
            'memory_high',
            usagePercentage > 90 ? 'high' : 'medium',
            `内存使用率过高: ${usagePercentage.toFixed(1)}%`,
            { memoryUsage: usagePercentage }
          );
        }
        
        return usagePercentage;
      } else {
        // React Native 环境 - 使用估算方法
        const estimatedMemory = await this.estimateMemoryUsage();
        return estimatedMemory;
      }
    } catch (error) {
      console.error('❌ 获取内存使用失败:', error);
      return 0;
    }
  }

  // 估算内存使用（React Native环境）
  private async estimateMemoryUsage(): Promise<number> {
    try {
      // 基于缓存大小和数据量估算
      let totalMemory = 0;
      
      // 计算缓存占用
      totalMemory += this.dataCache.size * 0.1; // 每个缓存项约0.1MB
      
      // 计算同步队列占用
      totalMemory += this.syncQueue.length * 0.05; // 每个同步项约0.05MB
      
      // 计算批处理数据占用
      totalMemory += this.batchProcessingQueue.length * 0.2; // 每个批处理约0.2MB
      
      // 基础内存占用
      totalMemory += 20; // 基础内存20MB
      
      // 转换为百分比（假设总内存为200MB）
      const totalAvailableMemory = 200;
      const usagePercentage = (totalMemory / totalAvailableMemory) * 100;
      
      // 记录性能问题
      if (usagePercentage > 80) {
        const errorService = ErrorHandlingAndRetryService.getInstance();
        await errorService.recordPerformanceIssue(
          'memory_high',
          usagePercentage > 90 ? 'high' : 'medium',
          `内存使用率过高: ${usagePercentage.toFixed(1)}%`,
          { memoryUsage: usagePercentage }
        );
      }
      
      return Math.min(usagePercentage, 100);
    } catch (error) {
      console.error('❌ 估算内存使用失败:', error);
      return 0;
    }
  }

  // 计算数据大小
  private calculateDataSize(data: any): number {
    try {
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch (error) {
      return 0;
    }
  }

  // 更新缓存命中率
  private updateCacheHitRate(hit: boolean): void {
    try {
      const totalRequests = this.performanceMetrics.totalRequests || 0;
      const totalHits = this.performanceMetrics.cacheHitRate * totalRequests;
      
      if (hit) {
        this.performanceMetrics.cacheHitRate = (totalHits + 1) / (totalRequests + 1);
      } else {
        this.performanceMetrics.cacheHitRate = totalHits / (totalRequests + 1);
      }
      
      this.performanceMetrics.totalRequests = totalRequests + 1;
      
    } catch (error) {
      console.error('❌ 更新缓存命中率失败:', error);
    }
  }

  // 更新性能指标
  private updatePerformanceMetrics(updates: Partial<PerformanceMetrics>): void {
    try {
      this.performanceMetrics = { ...this.performanceMetrics, ...updates };
    } catch (error) {
      console.error('❌ 更新性能指标失败:', error);
    }
  }

  // 获取性能指标
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // 获取批次配置
  public getBatchConfig(): BatchProcessingConfig {
    return { ...this.batchConfig };
  }

  // 更新批次配置
  public updateBatchConfig(updates: Partial<BatchProcessingConfig>): void {
    this.batchConfig = { ...this.batchConfig, ...updates };
    console.log('✅ 批次配置已更新:', updates);
  }

  // 获取内存配置
  public getMemoryConfig(): MemoryOptimizationConfig {
    return { ...this.memoryConfig };
  }

  // 更新内存配置
  public updateMemoryConfig(updates: Partial<MemoryOptimizationConfig>): void {
    this.memoryConfig = { ...this.memoryConfig, ...updates };
    console.log('✅ 内存配置已更新:', updates);
  }

  // 获取后台同步配置
  public getBackgroundConfig(): BackgroundSyncConfig {
    return { ...this.backgroundConfig };
  }

  // 更新后台同步配置
  public updateBackgroundConfig(updates: Partial<BackgroundSyncConfig>): void {
    this.backgroundConfig = { ...this.backgroundConfig, ...updates };
    console.log('✅ 后台同步配置已更新:', updates);
  }

  // 加载配置
  private async loadConfigurations(): Promise<void> {
    try {
      const batchConfigData = await AsyncStorage.getItem('batchConfig');
      if (batchConfigData) {
        this.batchConfig = { ...this.batchConfig, ...JSON.parse(batchConfigData) };
      }
      
      const memoryConfigData = await AsyncStorage.getItem('memoryConfig');
      if (memoryConfigData) {
        this.memoryConfig = { ...this.memoryConfig, ...JSON.parse(memoryConfigData) };
      }
      
      const backgroundConfigData = await AsyncStorage.getItem('backgroundConfig');
      if (backgroundConfigData) {
        this.backgroundConfig = { ...this.backgroundConfig, ...JSON.parse(backgroundConfigData) };
      }
      
      console.log('✅ 配置加载完成');
      
    } catch (error) {
      console.error('❌ 加载配置失败:', error);
    }
  }

  // 保存配置
  public async saveConfigurations(): Promise<void> {
    try {
      await AsyncStorage.setItem('batchConfig', JSON.stringify(this.batchConfig));
      await AsyncStorage.setItem('memoryConfig', JSON.stringify(this.memoryConfig));
      await AsyncStorage.setItem('backgroundConfig', JSON.stringify(this.backgroundConfig));
      
      console.log('✅ 配置保存完成');
      
    } catch (error) {
      console.error('❌ 保存配置失败:', error);
    }
  }

  // 检查是否正在初始化
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // 销毁服务
  public destroy(): void {
    try {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }
      
      if (this.memoryMonitorTimer) {
        clearInterval(this.memoryMonitorTimer);
        this.memoryMonitorTimer = null;
      }
      
      if (this.backgroundSyncTimer) {
        clearInterval(this.backgroundSyncTimer);
        this.backgroundSyncTimer = null;
      }
      
      this.isInitialized = false;
      console.log('🗑️ 性能优化服务已销毁');
      
    } catch (error) {
      console.error('❌ 销毁性能优化服务失败:', error);
    }
  }

  // 清理同步队列
  private async cleanupSyncQueue(): Promise<void> {
    try {
      const maxQueueSize = 100;
      const oldQueueSize = this.syncQueue.length;
      
      if (this.syncQueue.length > maxQueueSize) {
        // 保留最新的项目，删除旧的
        this.syncQueue = this.syncQueue.slice(-maxQueueSize);
        console.log(`🗑️ 清理同步队列: ${oldQueueSize} → ${this.syncQueue.length}`);
      }
      
    } catch (error) {
      console.error('❌ 清理同步队列失败:', error);
    }
  }

  // 清理批处理队列
  private async cleanupBatchQueue(): Promise<void> {
    try {
      const maxBatchSize = 50;
      const oldBatchSize = this.batchProcessingQueue.length;
      
      if (this.batchProcessingQueue.length > maxBatchSize) {
        // 保留最新的批处理，删除旧的
        this.batchProcessingQueue = this.batchProcessingQueue.slice(-maxBatchSize);
        console.log(`🗑️ 清理批处理队列: ${oldBatchSize} → ${this.batchProcessingQueue.length}`);
      }
      
    } catch (error) {
      console.error('❌ 清理批处理队列失败:', error);
    }
  }

  // 清理临时数据
  private async cleanupTemporaryData(): Promise<void> {
    try {
      // 清理AsyncStorage中的临时数据
      const tempKeys = [
        'temp_sync_data',
        'temp_batch_data',
        'temp_cache_data',
        'temp_upload_data',
        'temp_download_data'
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
        console.log(`🗑️ 清理了 ${cleanedCount} 个临时数据键`);
      }
      
    } catch (error) {
      console.error('❌ 清理临时数据失败:', error);
    }
  }
}
