/**
 * ========================================
 * 🔄 [SYNC SERVICE] 数据同步服务
 * ========================================
 * 
 * 服务类型: 数据同步相关服务
 * 功能描述: 增量同步策略服务 - 增量同步管理
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
import { DataConflictResolutionService } from './dataConflictResolutionService';
import { DataVersionManagementService, IncrementalSyncData } from './dataVersionManagementService';
import { unifiedSyncService } from './unifiedSyncService';

export interface SyncStrategy {
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  batchSize: number;
  retryCount: number;
  timeout: number;
  enabled: boolean;
}

export interface IncrementalSyncResult {
  success: boolean;
  syncedDataTypes: string[];
  totalChanges: number;
  totalSize: number;
  estimatedTime: number;
  actualTime: number;
  conflicts: any[];
  errors: string[];
  stats: {
    added: number;
    updated: number;
    deleted: number;
    unchanged: number;
  };
}

export interface SyncProgress {
  stage: 'preparing' | 'analyzing' | 'syncing' | 'resolving' | 'completed' | 'failed';
  currentDataType: string;
  progress: number;
  message: string;
  details: {
    processed: number;
    total: number;
    currentSize: number;
    totalSize: number;
  };
}

export class IncrementalSyncStrategyService {
  private static instance: IncrementalSyncStrategyService;
  private isSyncing: boolean = false;
  private currentProgress: SyncProgress | null = null;
  private syncStrategies: Map<string, SyncStrategy> = new Map();

  public static getInstance(): IncrementalSyncStrategyService {
    if (!IncrementalSyncStrategyService.instance) {
      IncrementalSyncStrategyService.instance = new IncrementalSyncStrategyService();
    }
    return IncrementalSyncStrategyService.instance;
  }

  private constructor() {
    this.initializeStrategies();
  }

  // 初始化同步策略
  private initializeStrategies(): void {
    // 词汇数据同步策略
    this.syncStrategies.set('vocabulary', {
      name: 'vocabulary',
      description: '词汇学习数据同步',
      priority: 'high',
      batchSize: 100,
      retryCount: 3,
      timeout: 30000,
      enabled: true
    });

    // 剧单数据同步策略
    this.syncStrategies.set('shows', {
      name: 'shows',
      description: '剧单和单词本同步',
      priority: 'medium',
      batchSize: 50,
      retryCount: 2,
      timeout: 20000,
      enabled: true
    });

    // 学习记录同步策略
    this.syncStrategies.set('learningRecords', {
      name: 'learningRecords',
      description: '学习记录和进度同步',
      priority: 'critical',
      batchSize: 200,
      retryCount: 5,
      timeout: 60000,
      enabled: true
    });

    // 经验值同步策略
    this.syncStrategies.set('experience', {
      name: 'experience',
      description: '经验值和等级同步',
      priority: 'high',
      batchSize: 1,
      retryCount: 3,
      timeout: 15000,
      enabled: true
    });

    // 徽章同步策略
    this.syncStrategies.set('badges', {
      name: 'badges',
      description: '徽章和成就同步',
      priority: 'medium',
      batchSize: 20,
      retryCount: 2,
      timeout: 25000,
      enabled: true
    });

    // 用户统计同步策略
    this.syncStrategies.set('userStats', {
      name: 'userStats',
      description: '用户统计数据同步',
      priority: 'low',
      batchSize: 1,
      retryCount: 2,
      timeout: 10000,
      enabled: true
    });
  }

  // 执行增量同步
  public async executeIncrementalSync(
    dataTypes: string[] = [],
    strategy: 'smart' | 'aggressive' | 'conservative' = 'smart'
  ): Promise<IncrementalSyncResult> {
    try {
      if (this.isSyncing) {
        throw new Error('增量同步正在进行中，请等待完成');
      }

      this.isSyncing = true;
      const startTime = Date.now();

      console.log(`🚀 开始执行增量同步，策略: ${strategy}`);
      
      // 确定要同步的数据类型
      const typesToSync = dataTypes.length > 0 ? dataTypes : Array.from(this.syncStrategies.keys());
      
      // 按优先级排序
      const sortedTypes = this.sortByPriority(typesToSync);
      
      const result: IncrementalSyncResult = {
        success: true,
        syncedDataTypes: [],
        totalChanges: 0,
        totalSize: 0,
        estimatedTime: 0,
        actualTime: 0,
        conflicts: [],
        errors: [],
        stats: { added: 0, updated: 0, deleted: 0, unchanged: 0 }
      };

      // 更新进度
      this.updateProgress('preparing', '准备增量同步...', 0);

      // 分析所有数据类型的变更
      const analysisResults = await this.analyzeAllDataTypes(sortedTypes);
      
      this.updateProgress('analyzing', '分析数据变更...', 20);

      // 计算总变更和大小
      for (const analysis of analysisResults) {
        if (analysis.success) {
          result.totalChanges += analysis.changes.added.length + analysis.changes.updated.length + analysis.changes.deleted.length;
          result.totalSize += analysis.syncSize;
          result.estimatedTime += analysis.estimatedTime;
        }
      }

      // 执行同步
      this.updateProgress('syncing', '执行数据同步...', 40);

      for (let i = 0; i < sortedTypes.length; i++) {
        const dataType = sortedTypes[i];
        const progress = 40 + (i / sortedTypes.length) * 40;
        
        this.updateProgress('syncing', `同步${dataType}数据...`, progress);
        
        try {
          const syncResult = await this.syncDataType(dataType, analysisResults[i], strategy);
          
          if (syncResult.success) {
            result.syncedDataTypes.push(dataType);
            result.stats.added += syncResult.stats.added;
            result.stats.updated += syncResult.stats.updated;
            result.stats.deleted += syncResult.stats.deleted;
            result.stats.unchanged += syncResult.stats.unchanged;
          } else {
            result.errors.push(`${dataType}: ${syncResult.error}`);
          }
        } catch (error: any) {
          result.errors.push(`${dataType}: ${error.message}`);
        }
      }

      // 解决冲突
      this.updateProgress('resolving', '解决数据冲突...', 80);
      
      const conflictService = DataConflictResolutionService.getInstance();
      const conflicts = conflictService.getCurrentConflicts();
      
      if (conflicts.length > 0) {
        const resolutionResult = await conflictService.resolveConflicts(conflicts, 'smart');
        result.conflicts = conflicts;
        
        if (!resolutionResult.success) {
          result.errors.push('冲突解决失败');
        }
      }

      // 完成同步
      this.updateProgress('completed', '增量同步完成', 100);
      
      result.actualTime = Date.now() - startTime;
      
      console.log(`✅ 增量同步完成: 同步了${result.syncedDataTypes.length}个数据类型，总变更${result.totalChanges}项`);
      
      return result;

    } catch (error: any) {
      console.error('❌ 增量同步失败:', error);
      this.updateProgress('failed', '增量同步失败', 0);
      
      return {
        success: false,
        syncedDataTypes: [],
        totalChanges: 0,
        totalSize: 0,
        estimatedTime: 0,
        actualTime: 0,
        conflicts: [],
        errors: [error.message],
        stats: { added: 0, updated: 0, deleted: 0, unchanged: 0 }
      };
    } finally {
      this.isSyncing = false;
      this.currentProgress = null;
    }
  }

  // 分析所有数据类型
  private async analyzeAllDataTypes(dataTypes: string[]): Promise<any[]> {
    const versionService = DataVersionManagementService.getInstance();
    const results = [];

    for (const dataType of dataTypes) {
      try {
        // 获取本地和云端数据
        const localData = await this.getLocalData(dataType);
        const cloudData = await this.getCloudData(dataType);

        // 生成增量同步数据
        const incrementalData = await versionService.generateIncrementalSyncData(
          dataType,
          localData,
          cloudData
        );

        results.push({
          success: true,
          ...incrementalData
        });

              } catch (error: any) {
          console.error(`❌ 分析${dataType}失败:`, error);
          results.push({
            success: false,
            error: error.message,
            changes: { added: [], updated: [], deleted: [], unchanged: [] },
            syncSize: 0,
            estimatedTime: 0
          });
        }
    }

    return results;
  }

  // 同步单个数据类型
  private async syncDataType(
    dataType: string,
    analysis: any,
    strategy: string
  ): Promise<{ success: boolean; stats: any; error?: string }> {
    try {
      if (!analysis.success) {
        return { success: false, stats: { added: 0, updated: 0, deleted: 0, unchanged: 0 }, error: analysis.error };
      }

      const strategyConfig = this.syncStrategies.get(dataType);
      if (!strategyConfig || !strategyConfig.enabled) {
        return { success: false, stats: { added: 0, updated: 0, deleted: 0, unchanged: 0 }, error: '策略未启用' };
      }

      console.log(`📊 开始同步${dataType}，变更: ${analysis.changes.added.length}新增, ${analysis.changes.updated.length}更新, ${analysis.changes.deleted.length}删除`);

      // 根据策略选择同步方法
      let syncResult;
      switch (strategy) {
        case 'aggressive':
          syncResult = await this.aggressiveSync(dataType, analysis, strategyConfig);
          break;
        case 'conservative':
          syncResult = await this.conservativeSync(dataType, analysis, strategyConfig);
          break;
        default:
          syncResult = await this.smartSync(dataType, analysis, strategyConfig);
      }

      return syncResult;

    } catch (error: any) {
      console.error(`❌ 同步${dataType}失败:`, error);
      return { success: false, stats: { added: 0, updated: 0, deleted: 0, unchanged: 0 }, error: error.message };
    }
  }

  // 智能同步策略
  private async smartSync(dataType: string, analysis: any, strategy: any): Promise<{ success: boolean; stats: any }> {
    const { changes } = analysis;
    const stats = { added: 0, updated: 0, deleted: 0, unchanged: 0 };

    try {
      // 1. 同步新增数据
      if (changes.added.length > 0) {
        await this.syncAddedData(dataType, changes.added, strategy);
        stats.added = changes.added.length;
      }

      // 2. 同步更新数据
      if (changes.updated.length > 0) {
        await this.syncUpdatedData(dataType, changes.updated, strategy);
        stats.updated = changes.updated.length;
      }

      // 3. 同步删除数据
      if (changes.deleted.length > 0) {
        await this.syncDeletedData(dataType, changes.deleted, strategy);
        stats.deleted = changes.deleted.length;
      }

      // 4. 记录未变更数据
      stats.unchanged = changes.unchanged.length;

      // 5. 更新本地版本
      await this.updateLocalVersion(dataType);

      return { success: true, stats };

    } catch (error) {
      console.error(`❌ 智能同步${dataType}失败:`, error);
      throw error;
    }
  }

  // 激进同步策略
  private async aggressiveSync(dataType: string, analysis: any, strategy: any): Promise<{ success: boolean; stats: any }> {
    // 激进策略：强制同步所有变更，忽略冲突
    const { changes } = analysis;
    const stats = { added: 0, updated: 0, deleted: 0, unchanged: 0 };

    try {
      // 批量同步所有变更
      const allChanges = [...changes.added, ...changes.updated];
      
      if (allChanges.length > 0) {
        await this.batchSyncData(dataType, allChanges, strategy);
        stats.added = changes.added.length;
        stats.updated = changes.updated.length;
      }

      if (changes.deleted.length > 0) {
        await this.batchDeleteData(dataType, changes.deleted, strategy);
        stats.deleted = changes.deleted.length;
      }

      stats.unchanged = changes.unchanged.length;

      // 强制更新版本
      await this.forceUpdateVersion(dataType);

      return { success: true, stats };

    } catch (error) {
      console.error(`❌ 激进同步${dataType}失败:`, error);
      throw error;
    }
  }

  // 保守同步策略
  private async conservativeSync(dataType: string, analysis: any, strategy: any): Promise<{ success: boolean; stats: any }> {
    // 保守策略：只同步高优先级变更，避免冲突
    const { changes } = analysis;
    const stats = { added: 0, updated: 0, deleted: 0, unchanged: 0 };

    try {
      // 只同步高优先级数据
      const highPriorityChanges = this.filterHighPriorityChanges(changes, dataType);
      
      if (highPriorityChanges.added.length > 0) {
        await this.syncAddedData(dataType, highPriorityChanges.added, strategy);
        stats.added = highPriorityChanges.added.length;
      }

      if (highPriorityChanges.updated.length > 0) {
        await this.syncUpdatedData(dataType, highPriorityChanges.updated, strategy);
        stats.updated = highPriorityChanges.updated.length;
      }

      // 保守策略不删除数据
      stats.deleted = 0;
      stats.unchanged = changes.unchanged.length + (changes.added.length - highPriorityChanges.added.length) + (changes.updated.length - highPriorityChanges.updated.length);

      // 谨慎更新版本
      await this.cautiousUpdateVersion(dataType);

      return { success: true, stats };

    } catch (error) {
      console.error(`❌ 保守同步${dataType}失败:`, error);
      throw error;
    }
  }

  // 同步新增数据
  private async syncAddedData(dataType: string, addedData: any[], strategy: any): Promise<void> {
    if (addedData.length === 0) return;

    console.log(`➕ 同步${dataType}新增数据: ${addedData.length}项`);

    // 分批处理
    const batches = this.createBatches(addedData, strategy.batchSize);
    
    for (const batch of batches) {
      await this.processBatch(dataType, batch, 'add', strategy);
    }
  }

  // 同步更新数据
  private async syncUpdatedData(dataType: string, updatedData: any[], strategy: any): Promise<void> {
    if (updatedData.length === 0) return;

    console.log(`🔄 同步${dataType}更新数据: ${updatedData.length}项`);

    // 分批处理
    const batches = this.createBatches(updatedData, strategy.batchSize);
    
    for (const batch of batches) {
      await this.processBatch(dataType, batch, 'update', strategy);
    }
  }

  // 同步删除数据
  private async syncDeletedData(dataType: string, deletedData: string[], strategy: any): Promise<void> {
    if (deletedData.length === 0) return;

    console.log(`🗑️ 同步${dataType}删除数据: ${deletedData.length}项`);

    // 分批处理
    const batches = this.createBatches(deletedData, strategy.batchSize);
    
    for (const batch of batches) {
      await this.processBatch(dataType, batch, 'delete', strategy);
    }
  }

  // 批量同步数据
  private async batchSyncData(dataType: string, data: any[], strategy: any): Promise<void> {
    const batches = this.createBatches(data, strategy.batchSize);
    
    for (const batch of batches) {
      await this.processBatch(dataType, batch, 'sync', strategy);
    }
  }

  // 批量删除数据
  private async batchDeleteData(dataType: string, data: string[], strategy: any): Promise<void> {
    const batches = this.createBatches(data, strategy.batchSize);
    
    for (const batch of batches) {
      await this.processBatch(dataType, batch, 'delete', strategy);
    }
  }

  // 处理批次数据
  private async processBatch(dataType: string, batch: any[], action: string, strategy: any): Promise<void> {
    try {
      console.log(`📦 处理${dataType}批次: ${action} ${batch.length}项`);

      // 添加到统一同步队列
      await unifiedSyncService.addToSyncQueue({
        type: dataType as any,
        data: batch,
        operation: action as any,
        priority: this.getPriorityFromStrategy(strategy.priority),
        userId: 'current_user_id' // 应该从认证服务获取
      });

      // 等待处理完成
      await this.waitForBatchProcessing(dataType, batch.length, strategy.timeout);

    } catch (error) {
      console.error(`❌ 处理${dataType}批次失败:`, error);
      throw error;
    }
  }

  // 等待批次处理完成
  private async waitForBatchProcessing(dataType: string, batchSize: number, timeout: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const status = unifiedSyncService.getSyncStatus();
      
      if (status.queueLength === 0) {
        break; // 队列已清空
      }
      
      // 等待100ms后再次检查
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 过滤高优先级变更
  private filterHighPriorityChanges(changes: any, dataType: string): any {
    const highPriority = { added: [], updated: [], deleted: [] };

    // 根据数据类型定义高优先级规则
    switch (dataType) {
      case 'learningRecords':
        // 学习记录：只同步最近7天的数据
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        highPriority.added = changes.added.filter((item: any) => 
          item.lastModified > sevenDaysAgo
        );
        highPriority.updated = changes.updated.filter((item: any) => 
          item.lastModified > sevenDaysAgo
        );
        break;
        
      case 'experience':
        // 经验值：只同步重要变更
        highPriority.updated = changes.updated.filter((item: any) => 
          item.difference > 10 // 只同步经验值差异大于10的
        );
        break;
        
      default:
        // 其他类型：同步所有变更
        highPriority.added = changes.added;
        highPriority.updated = changes.updated;
        highPriority.deleted = changes.deleted;
    }

    return highPriority;
  }

  // 创建批次
  private createBatches(data: any[], batchSize: number): any[][] {
    const batches = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    
    return batches;
  }

  // 获取本地数据
  private async getLocalData(dataType: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(dataType);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`❌ 获取本地${dataType}数据失败:`, error);
      return null;
    }
  }

  // 获取云端数据
  private async getCloudData(dataType: string): Promise<any> {
    try {
      // 这里应该调用实际的云端API
      // 目前返回模拟数据
      return null;
    } catch (error) {
      console.error(`❌ 获取云端${dataType}数据失败:`, error);
      return null;
    }
  }

  // 更新本地版本
  private async updateLocalVersion(dataType: string): Promise<void> {
    try {
      const versionService = DataVersionManagementService.getInstance();
      const localData = await this.getLocalData(dataType);
      
      if (localData) {
        await versionService.createVersionedData(
          dataType,
          localData,
          'current_user_id', // 应该从认证服务获取
          'current_device_id', // 应该从设备服务获取
          'update'
        );
      }
    } catch (error) {
      console.error(`❌ 更新${dataType}本地版本失败:`, error);
    }
  }

  // 强制更新版本
  private async forceUpdateVersion(dataType: string): Promise<void> {
    try {
      const versionService = DataVersionManagementService.getInstance();
      const localData = await this.getLocalData(dataType);
      
      if (localData) {
        await versionService.createVersionedData(
          dataType,
          localData,
          'current_user_id',
          'current_device_id',
          'update'
        );
      }
    } catch (error) {
      console.error(`❌ 强制更新${dataType}版本失败:`, error);
    }
  }

  // 谨慎更新版本
  private async cautiousUpdateVersion(dataType: string): Promise<void> {
    try {
      // 谨慎策略：只在数据确实发生变化时才更新版本
      const versionService = DataVersionManagementService.getInstance();
      const currentVersion = await (versionService as any).getCurrentVersion(dataType);
      const localData = await this.getLocalData(dataType);
      
      if (localData && currentVersion) {
        const newChecksum = this.calculateChecksum(localData);
        
        if (newChecksum !== currentVersion.checksum) {
          await versionService.createVersionedData(
            dataType,
            localData,
            'current_user_id',
            'current_device_id',
            'update'
          );
        }
      }
    } catch (error) {
      console.error(`❌ 谨慎更新${dataType}版本失败:`, error);
    }
  }

  // 计算校验和
  private calculateChecksum(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      let hash = 0;
      
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return hash.toString(16);
    } catch (error) {
      return Date.now().toString(16);
    }
  }

  // 按优先级排序
  private sortByPriority(dataTypes: string[]): string[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    return dataTypes.sort((a, b) => {
      const aPriority = this.syncStrategies.get(a)?.priority || 'medium';
      const bPriority = this.syncStrategies.get(b)?.priority || 'medium';
      
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    });
  }

  // 从策略获取优先级
  private getPriorityFromStrategy(strategyPriority: string): 'high' | 'medium' | 'low' {
    switch (strategyPriority) {
      case 'critical':
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  // 更新进度
  private updateProgress(stage: SyncProgress['stage'], message: string, progress: number): void {
    this.currentProgress = {
      stage,
      currentDataType: '',
      progress,
      message,
      details: {
        processed: 0,
        total: 0,
        currentSize: 0,
        totalSize: 0
      }
    };
  }

  // 获取当前进度
  public getCurrentProgress(): SyncProgress | null {
    return this.currentProgress;
  }

  // 检查是否正在同步
  public isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  // 获取同步策略
  public getSyncStrategies(): SyncStrategy[] {
    return Array.from(this.syncStrategies.values());
  }

  // 更新同步策略
  public updateSyncStrategy(dataType: string, updates: Partial<SyncStrategy>): void {
    const strategy = this.syncStrategies.get(dataType);
    if (strategy) {
      Object.assign(strategy, updates);
      console.log(`✅ 更新${dataType}同步策略:`, updates);
    }
  }

  // 启用/禁用同步策略
  public toggleSyncStrategy(dataType: string, enabled: boolean): void {
    const strategy = this.syncStrategies.get(dataType);
    if (strategy) {
      strategy.enabled = enabled;
      console.log(`${enabled ? '✅' : '❌'} ${dataType}同步策略已${enabled ? '启用' : '禁用'}`);
    }
  }

  // 获取同步统计
  public getSyncStats(): { totalStrategies: number; enabledStrategies: number; disabledStrategies: number } {
    const total = this.syncStrategies.size;
    const enabled = Array.from(this.syncStrategies.values()).filter(s => s.enabled).length;
    const disabled = total - enabled;
    
    return { totalStrategies: total, enabledStrategies: enabled, disabledStrategies: disabled };
  }
}
