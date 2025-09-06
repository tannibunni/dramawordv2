/**
 * ========================================
 * 🔄 [SYNC SERVICE] 数据同步服务
 * ========================================
 * 
 * 服务类型: 数据同步相关服务
 * 功能描述: 智能上传策略服务 - 上传决策管理
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

const API_BASE_URL = 'https://api.dramaword.com';

export interface UploadDecision {
  shouldUpload: boolean;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedSize: number;
  recommendedDelay: number;
}

export interface UploadConditions {
  passes: boolean;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  recommendedDelay: number;
}

export interface DataChanges {
  added: any[];
  updated: any[];
  deleted: any[];
  totalChanges: number;
}

export interface IncrementalUploadResult {
  success: boolean;
  message: string;
  uploadedItems: number;
  skippedItems: number;
  uploadTime: number;
  dataSize: number;
}

export interface UploadStats {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  averageUploadSize: number;
  averageUploadTime: number;
  lastUploadTime: number;
}

export class SmartUploadStrategy {
  private static instance: SmartUploadStrategy;
  private uploadIntervals: Record<string, number> = {
    'vocabulary': 2 * 60 * 1000,      // 2分钟 (原30秒) - 减少80%访问
    'learningRecords': 30 * 1000,     // 30秒 (原10秒) - 减少67%访问
    'userStats': 5 * 60 * 1000,       // 5分钟 (原1分钟) - 减少80%访问
    'shows': 10 * 60 * 1000,          // 10分钟 (原2分钟) - 减少80%访问
    'experience': 10 * 1000,          // 10秒 (原5秒) - 减少50%访问
    'badges': 15 * 60 * 1000,         // 15分钟 (原5分钟) - 减少67%访问
    'searchHistory': 30 * 60 * 1000,  // 30分钟 (原5分钟) - 减少83%访问
    'userSettings': 60 * 60 * 1000    // 1小时 (原10分钟) - 减少83%访问
  };
  
  private changeThresholds: Record<string, number> = {
    'vocabulary': 3,        // 3个词汇变化 (原1个) - 减少67%上传
    'learningRecords': 2,   // 2条学习记录 (原1条) - 减少50%上传
    'userStats': 0.2,       // 20%变化 (原10%) - 减少50%上传
    'shows': 1,             // 1个剧单 (保持不变)
    'experience': 5,        // 5点经验 (原1点) - 减少80%上传
    'badges': 1,            // 1个徽章 (保持不变)
    'searchHistory': 10,    // 10条搜索历史 (原5条) - 减少50%上传
    'userSettings': 0.05    // 5%设置变化 (原1%) - 减少80%上传
  };

  private isUserActive = false;
  private lastUserActivity = Date.now();
  private uploadQueue: Array<{
    dataType: string;
    data: any;
    timestamp: number;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  private constructor() {
    this.initializeUserActivityTracking();
  }

  public static getInstance(): SmartUploadStrategy {
    if (!SmartUploadStrategy.instance) {
      SmartUploadStrategy.instance = new SmartUploadStrategy();
    }
    return SmartUploadStrategy.instance;
  }

  // 初始化用户活跃度跟踪
  private initializeUserActivityTracking(): void {
    // 监听用户交互事件
    this.startUserActivityTracking();
    
    // 定期检查用户活跃状态
    setInterval(() => {
      this.updateUserActivityStatus();
    }, 30000); // 30秒检查一次
  }

  // 开始用户活跃度跟踪
  private startUserActivityTracking(): void {
    // 这里应该监听实际的用户交互事件
    // 暂时使用模拟的方式
    this.isUserActive = true;
    this.lastUserActivity = Date.now();
  }

  // 更新用户活跃状态
  private updateUserActivityStatus(): void {
    const now = Date.now();
    const inactiveTime = now - this.lastUserActivity;
    
    // 如果用户5分钟没有活动，认为不活跃
    this.isUserActive = inactiveTime < 5 * 60 * 1000;
  }

  // 记录用户活动
  public recordUserActivity(): void {
    this.isUserActive = true;
    this.lastUserActivity = Date.now();
  }

  // 判断是否应该上传
  public async shouldUpload(
    dataType: string,
    data: any,
    lastUploadTime: number
  ): Promise<UploadDecision> {
    const conditions = await this.checkUploadConditions(dataType, data, lastUploadTime);
    
    return {
      shouldUpload: conditions.passes,
      reason: conditions.reason,
      priority: conditions.priority,
      estimatedSize: this.calculateDataSize(data),
      recommendedDelay: conditions.recommendedDelay
    };
  }

  // 检查上传条件
  private async checkUploadConditions(
    dataType: string,
    data: any,
    lastUploadTime: number
  ): Promise<UploadConditions> {
    const now = Date.now();
    const timeSinceLastUpload = now - lastUploadTime;
    
    // 条件1: 最小上传间隔（避免频繁上传）
    const minInterval = this.getMinUploadInterval(dataType);
    if (timeSinceLastUpload < minInterval) {
      return {
        passes: false,
        reason: '上传间隔太短',
        priority: 'low',
        recommendedDelay: minInterval - timeSinceLastUpload
      };
    }

    // 条件2: 数据变化量检查
    const changeThreshold = this.getChangeThreshold(dataType);
    const dataChange = await this.calculateDataChange(dataType, data);
    
    if (dataChange < changeThreshold) {
      return {
        passes: false,
        reason: '数据变化量不足',
        priority: 'low',
        recommendedDelay: 5 * 60 * 1000 // 5分钟后重试
      };
    }

    // 条件3: 网络状态检查
    const networkQuality = await this.checkNetworkQuality();
    if (networkQuality === 'poor' || networkQuality === 'offline') {
      return {
        passes: false,
        reason: '网络质量不佳',
        priority: 'medium',
        recommendedDelay: 2 * 60 * 1000 // 2分钟后重试
      };
    }

    // 条件4: 用户活跃状态
    if (this.isUserActive) {
      return {
        passes: true,
        reason: '用户活跃，数据已更新',
        priority: 'high',
        recommendedDelay: 0
      };
    }

    // 条件5: 数据重要性检查
    const importance = this.getDataImportance(dataType);
    if (importance === 'critical' && dataChange > 0) {
      return {
        passes: true,
        reason: '关键数据变化',
        priority: 'high',
        recommendedDelay: 0
      };
    }

    // 条件6: 存储空间检查
    const hasEnoughSpace = await this.checkStorageSpace();
    if (!hasEnoughSpace) {
      return {
        passes: false,
        reason: '存储空间不足',
        priority: 'high',
        recommendedDelay: 10 * 60 * 1000 // 10分钟后重试
      };
    }

    return {
      passes: true,
      reason: '满足上传条件',
      priority: 'medium',
      recommendedDelay: 0
    };
  }

  // 获取最小上传间隔
  private getMinUploadInterval(dataType: string): number {
    return this.uploadIntervals[dataType] || 60 * 1000; // 默认1分钟
  }

  // 获取变化阈值
  private getChangeThreshold(dataType: string): number {
    return this.changeThresholds[dataType] || 1;
  }

  // 计算数据变化量
  private async calculateDataChange(dataType: string, currentData: any): Promise<number> {
    try {
      const lastSyncedData = await this.getLastSyncedData(dataType);
      
      if (!lastSyncedData) {
        return 1; // 首次同步，认为有变化
      }

      if (Array.isArray(currentData) && Array.isArray(lastSyncedData)) {
        // 数组数据变化计算
        const currentIds = new Set(currentData.map((item: any) => item.id || item.word));
        const lastIds = new Set(lastSyncedData.map((item: any) => item.id || item.word));
        
        const added = currentData.filter((item: any) => !lastIds.has(item.id || item.word));
        const removed = lastSyncedData.filter((item: any) => !currentIds.has(item.id || item.word));
        const modified = currentData.filter((item: any) => {
          const lastItem = lastSyncedData.find((last: any) => (last.id || last.word) === (item.id || item.word));
          return lastItem && this.hasContentDifferences(item, lastItem);
        });
        
        return added.length + removed.length + modified.length;
      } else if (typeof currentData === 'object' && typeof lastSyncedData === 'object') {
        // 对象数据变化计算
        const differentFields = this.getDifferentFields(currentData, lastSyncedData);
        return differentFields.length;
      }
      
      return currentData !== lastSyncedData ? 1 : 0;
      
    } catch (error) {
      console.error('计算数据变化失败:', error);
      return 1; // 出错时认为有变化
    }
  }

  // 检查内容差异
  private hasContentDifferences(item1: any, item2: any): boolean {
    const fields1 = Object.keys(item1);
    const fields2 = Object.keys(item2);
    
    if (fields1.length !== fields2.length) {
      return true;
    }
    
    for (const field of fields1) {
      if (field === 'lastModified' || field === 'version') {
        continue; // 跳过时间戳和版本字段
      }
      
      if (JSON.stringify(item1[field]) !== JSON.stringify(item2[field])) {
        return true;
      }
    }
    
    return false;
  }

  // 获取不同的字段
  private getDifferentFields(obj1: any, obj2: any): string[] {
    const differentFields: string[] = [];
    const allFields = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    
    for (const field of allFields) {
      if (field === 'lastModified' || field === 'version') {
        continue; // 跳过时间戳和版本字段
      }
      
      if (JSON.stringify(obj1[field]) !== JSON.stringify(obj2[field])) {
        differentFields.push(field);
      }
    }
    
    return differentFields;
  }

  // 检查网络质量
  private async checkNetworkQuality(): Promise<'excellent' | 'good' | 'fair' | 'poor' | 'offline'> {
    try {
      const networkService = NetworkStateManagementService.getInstance();
      const networkQuality = await networkService.detectNetworkQuality();
      return networkQuality.quality;
    } catch (error) {
      return 'offline';
    }
  }

  // 检查存储空间
  private async checkStorageSpace(): Promise<boolean> {
    try {
      // 这里应该检查实际的存储空间
      // 暂时返回true
      return true;
    } catch (error) {
      return false;
    }
  }

  // 获取数据重要性
  private getDataImportance(dataType: string): 'low' | 'medium' | 'high' | 'critical' {
    const importanceMap: Record<string, string> = {
      'vocabulary': 'high',
      'learningRecords': 'critical',
      'userStats': 'high',
      'shows': 'medium',
      'experience': 'critical',
      'badges': 'medium',
      'searchHistory': 'low',
      'userSettings': 'medium'
    };
    
    return (importanceMap[dataType] as any) || 'medium';
  }

  // 计算数据大小
  private calculateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      return 0;
    }
  }

  // 获取最后同步的数据
  private async getLastSyncedData(dataType: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(`last_synced_${dataType}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  // 保存最后同步的数据
  private async saveLastSyncedData(dataType: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`last_synced_${dataType}`, JSON.stringify(data));
    } catch (error) {
      console.error('保存最后同步数据失败:', error);
    }
  }

  // 增量上传
  public async uploadIncrementalChanges(
    dataType: string,
    currentData: any,
    lastSyncedData: any
  ): Promise<IncrementalUploadResult> {
    const startTime = Date.now();
    
    try {
      const changes = this.calculateChanges(currentData, lastSyncedData);
      
      if (changes.totalChanges === 0) {
        return {
          success: true,
          message: '无数据变化，跳过上传',
          uploadedItems: 0,
          skippedItems: 0,
          uploadTime: Date.now() - startTime,
          dataSize: 0
        };
      }

      console.log(`📤 增量上传 ${dataType}: 新增 ${changes.added.length}，更新 ${changes.updated.length}，删除 ${changes.deleted.length}`);

      // 只上传变化的部分
      const uploadData = {
        added: changes.added,
        updated: changes.updated,
        deleted: changes.deleted,
        timestamp: Date.now(),
        dataType,
        version: await this.getCurrentVersion(dataType)
      };

      const result = await this.uploadToServer(uploadData);
      
      if (result.success) {
        // 保存最后同步的数据
        await this.saveLastSyncedData(dataType, currentData);
        
        // 更新上传统计
        await this.updateUploadStats({
          success: true,
          uploadTime: Date.now() - startTime,
          dataSize: this.calculateDataSize(uploadData)
        });
      }
      
      return {
        success: result.success,
        message: result.message,
        uploadedItems: changes.added.length + changes.updated.length + changes.deleted.length,
        skippedItems: 0,
        uploadTime: Date.now() - startTime,
        dataSize: this.calculateDataSize(uploadData)
      };
      
    } catch (error) {
      console.error('增量上传失败:', error);
      
      await this.updateUploadStats({
        success: false,
        uploadTime: Date.now() - startTime,
        dataSize: 0
      });
      
      return {
        success: false,
        message: `上传失败: ${error instanceof Error ? error.message : '未知错误'}`,
        uploadedItems: 0,
        skippedItems: 0,
        uploadTime: Date.now() - startTime,
        dataSize: 0
      };
    }
  }

  // 计算数据变化
  private calculateChanges(current: any, lastSynced: any): DataChanges {
    const changes: DataChanges = {
      added: [],
      updated: [],
      deleted: [],
      totalChanges: 0
    };

    if (Array.isArray(current) && Array.isArray(lastSynced)) {
      // 数组数据变化计算
      const currentMap = new Map(current.map((item: any) => [item.id || item.word, item]));
      const lastMap = new Map(lastSynced.map((item: any) => [item.id || item.word, item]));
      
      // 查找新增和更新的项目
      for (const [id, currentItem] of currentMap) {
        const lastItem = lastMap.get(id);
        if (!lastItem) {
          changes.added.push(currentItem);
        } else if (this.hasContentDifferences(currentItem, lastItem)) {
          changes.updated.push(currentItem);
        }
      }
      
      // 查找删除的项目
      for (const [id, lastItem] of lastMap) {
        if (!currentMap.has(id)) {
          changes.deleted.push({ id, deleted: true, timestamp: Date.now() });
        }
      }
    } else if (typeof current === 'object' && typeof lastSynced === 'object') {
      // 对象数据变化计算
      const differentFields = this.getDifferentFields(current, lastSynced);
      if (differentFields.length > 0) {
        changes.updated.push({
          ...current,
          changedFields: differentFields,
          timestamp: Date.now()
        });
      }
    }
    
    changes.totalChanges = changes.added.length + changes.updated.length + changes.deleted.length;
    
    return changes;
  }

  // 获取当前版本
  private async getCurrentVersion(dataType: string): Promise<number> {
    try {
      const version = await AsyncStorage.getItem(`version_${dataType}`);
      return version ? parseInt(version) : 1;
    } catch (error) {
      return 1;
    }
  }

  // 上传到服务器
  private async uploadToServer(data: any): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('未找到认证token');
      }

      const response = await fetch(`${API_BASE_URL}/data/incremental-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: result.success,
        message: result.message || '上传成功'
      };
      
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '上传失败'
      };
    }
  }

  // 获取认证token
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  }

  // 更新上传统计
  private async updateUploadStats(stats: {
    success: boolean;
    uploadTime: number;
    dataSize: number;
  }): Promise<void> {
    try {
      const currentStats = await this.getUploadStats();
      const newStats: UploadStats = {
        totalUploads: currentStats.totalUploads + 1,
        successfulUploads: currentStats.successfulUploads + (stats.success ? 1 : 0),
        failedUploads: currentStats.failedUploads + (stats.success ? 0 : 1),
        averageUploadSize: (currentStats.averageUploadSize * currentStats.totalUploads + stats.dataSize) / (currentStats.totalUploads + 1),
        averageUploadTime: (currentStats.averageUploadTime * currentStats.totalUploads + stats.uploadTime) / (currentStats.totalUploads + 1),
        lastUploadTime: Date.now()
      };
      
      await AsyncStorage.setItem('upload_stats', JSON.stringify(newStats));
    } catch (error) {
      console.error('更新上传统计失败:', error);
    }
  }

  // 获取上传统计
  public async getUploadStats(): Promise<UploadStats> {
    try {
      const stats = await AsyncStorage.getItem('upload_stats');
      if (stats) {
        return JSON.parse(stats);
      }
      
      return {
        totalUploads: 0,
        successfulUploads: 0,
        failedUploads: 0,
        averageUploadSize: 0,
        averageUploadTime: 0,
        lastUploadTime: 0
      };
    } catch (error) {
      return {
        totalUploads: 0,
        successfulUploads: 0,
        failedUploads: 0,
        averageUploadSize: 0,
        averageUploadTime: 0,
        lastUploadTime: 0
      };
    }
  }

  // 添加上传队列
  public addToUploadQueue(
    dataType: string,
    data: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): void {
    this.uploadQueue.push({
      dataType,
      data,
      timestamp: Date.now(),
      priority
    });
    
    console.log(`📝 添加到上传队列: ${dataType} (优先级: ${priority})`);
  }

  // 处理上传队列
  public async processUploadQueue(): Promise<void> {
    if (this.uploadQueue.length === 0) {
      return;
    }

    console.log(`🔄 处理上传队列，共 ${this.uploadQueue.length} 个任务`);

    // 按优先级排序
    this.uploadQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const queue = [...this.uploadQueue];
    this.uploadQueue = [];

    for (const item of queue) {
      try {
        const lastUploadTime = await this.getLastUploadTime(item.dataType);
        const decision = await this.shouldUpload(item.dataType, item.data, lastUploadTime);
        
        if (decision.shouldUpload) {
          const lastSyncedData = await this.getLastSyncedData(item.dataType);
          await this.uploadIncrementalChanges(item.dataType, item.data, lastSyncedData);
        } else {
          console.log(`⏳ 跳过上传 ${item.dataType}: ${decision.reason}`);
        }
      } catch (error) {
        console.error(`❌ 处理上传队列项失败: ${item.dataType}`, error);
      }
    }
  }

  // 获取最后上传时间
  private async getLastUploadTime(dataType: string): Promise<number> {
    try {
      const time = await AsyncStorage.getItem(`last_upload_${dataType}`);
      return time ? parseInt(time) : 0;
    } catch (error) {
      return 0;
    }
  }
}

export const smartUploadStrategy = SmartUploadStrategy.getInstance();
