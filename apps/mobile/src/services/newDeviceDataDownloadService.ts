/**
 * ========================================
 * 🔄 [SYNC SERVICE] 数据同步服务
 * ========================================
 * 
 * 服务类型: 数据同步相关服务
 * 功能描述: 新设备数据下载服务 - 云端数据下载
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
import { NewDeviceDetectionService, DeviceInfo, NewDeviceStatus } from './newDeviceDetectionService';
import { LocalDataOverwriteService, OverwriteResult } from './localDataOverwriteService';
import { DeviceInitializationService, DeviceInitResult } from './deviceInitializationService';
import { API_BASE_URL } from '../constants/config';

export interface CloudData {
  vocabulary: any[];
  shows: any[];
  learningRecords: any[];
  experience: any;
  badges: any[];
  userStats: any;
  lastModified: number;
  syncVersion: number;
}

export interface DownloadResult {
  success: boolean;
  data?: CloudData;
  message: string;
  error?: string;
  downloadTime: number;
  dataSize: number;
}

export interface BatchDownloadResult {
  success: boolean;
  data: any[];
  totalBatches: number;
  totalItems: number;
  downloadTime: number;
  averageSpeed: number;
  errors: string[];
}

export interface NewDeviceDownloadResult {
  success: boolean;
  message: string;
  isNewDevice: boolean;
  deviceInfo?: DeviceInfo;
  downloadResult?: DownloadResult;
  overwriteResult?: OverwriteResult;
  initResult?: DeviceInitResult;
  totalTime: number;
  error?: string;
}

export interface DownloadProgress {
  stage: 'detecting' | 'downloading' | 'overwriting' | 'initializing' | 'completed' | 'failed';
  progress: number;
  message: string;
  currentStep: string;
  totalSteps: number;
}

export class NewDeviceDataDownloadService {
  private static instance: NewDeviceDataDownloadService;
  private isProcessing: boolean = false;
  private isDownloading: boolean = false;
  private currentProgress: DownloadProgress = {
    stage: 'detecting',
    progress: 0,
    message: '准备开始...',
    currentStep: '设备检测',
    totalSteps: 4
  };
  private batchSize = 100; // 每批处理100条记录
  private maxConcurrentBatches = 3; // 最多3个并发批次
  private retryCount = 3;
  private retryDelay = 1000; // 1秒
  private timeout = 30000; // 30秒

  public static getInstance(): NewDeviceDataDownloadService {
    if (!NewDeviceDataDownloadService.instance) {
      NewDeviceDataDownloadService.instance = new NewDeviceDataDownloadService();
    }
    return NewDeviceDataDownloadService.instance;
  }

  private constructor() {}

  // 主要的新设备数据下载流程
  public async processNewDeviceDataDownload(appleId: string): Promise<NewDeviceDownloadResult> {
    try {
      if (this.isProcessing) {
        return {
          success: false,
          message: '新设备数据下载正在进行中，请稍候',
          isNewDevice: false,
          totalTime: 0
        };
      }

      console.log('🚀 开始新设备数据下载流程...');
      this.isProcessing = true;
      const startTime = Date.now();

      // 1. 检测是否为新设备
      this.updateProgress('detecting', 0, '正在检测设备状态...', '设备检测', 1);
      const deviceStatus = await this.detectNewDevice(appleId);

      if (!deviceStatus.isNewDevice) {
        console.log('ℹ️ 设备已初始化，无需下载数据');
        this.updateProgress('completed', 100, '设备已初始化，无需下载', '完成', 4);
        
        return {
          success: true,
          message: '设备已初始化，无需下载数据',
          isNewDevice: false,
          totalTime: Date.now() - startTime
        };
      }

      console.log('🔍 检测到新设备，开始下载数据...');

      // 2. 下载云端数据
      this.updateProgress('downloading', 25, '正在下载云端数据...', '数据下载', 2);
      const downloadResult = await this.downloadCloudDataPrivate(appleId);

      if (!downloadResult.success || !downloadResult.data) {
        throw new Error(`云端数据下载失败: ${downloadResult.message}`);
      }

      console.log('☁️ 云端数据下载完成，开始覆盖本地数据...');

      // 3. 覆盖本地数据
      this.updateProgress('overwriting', 50, '正在覆盖本地数据...', '数据覆盖', 3);
      const overwriteResult = await this.overwriteLocalData(downloadResult.data, deviceStatus.deviceInfo!);

      if (!overwriteResult.success) {
        throw new Error(`本地数据覆盖失败: ${overwriteResult.message}`);
      }

      console.log('📱 本地数据覆盖完成，开始初始化设备...');

      // 4. 初始化设备
      this.updateProgress('initializing', 75, '正在初始化设备...', '设备初始化', 4);
      const initResult = await this.initializeDevice(deviceStatus.deviceInfo!, downloadResult.data);

      if (!initResult.success) {
        throw new Error(`设备初始化失败: ${initResult.message}`);
      }

      // 5. 完成
      this.updateProgress('completed', 100, '新设备数据下载完成！', '完成', 4);
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ 新设备数据下载流程完成: ${totalTime}ms`);

      return {
        success: true,
        message: '新设备数据下载完成',
        isNewDevice: true,
        deviceInfo: deviceStatus.deviceInfo,
        downloadResult,
        overwriteResult,
        initResult,
        totalTime
      };

    } catch (error) {
      console.error('❌ 新设备数据下载流程失败:', error);
      
      this.updateProgress('failed', 0, '下载失败', '失败', 4);
      
      return {
        success: false,
        message: '新设备数据下载失败',
        isNewDevice: false,
        totalTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.isProcessing = false;
    }
  }

  // 检测新设备
  private async detectNewDevice(appleId: string): Promise<NewDeviceStatus> {
    try {
      const detectionService = NewDeviceDetectionService.getInstance();
      return await detectionService.detectNewDevice(appleId);
    } catch (error) {
      console.error('❌ 新设备检测失败:', error);
      throw error;
    }
  }

  // 下载云端数据（私有方法）
  private async downloadCloudDataPrivate(appleId: string): Promise<DownloadResult> {
    try {
      const downloadService = NewDeviceDataDownloadService.getInstance();
      return await downloadService.downloadCloudData(appleId);
    } catch (error) {
      console.error('❌ 云端数据下载失败:', error);
      throw error;
    }
  }

  // 覆盖本地数据
  private async overwriteLocalData(cloudData: CloudData, deviceInfo: DeviceInfo): Promise<OverwriteResult> {
    try {
      const overwriteService = LocalDataOverwriteService.getInstance();
      return await overwriteService.overwriteLocalData(cloudData, deviceInfo);
    } catch (error) {
      console.error('❌ 本地数据覆盖失败:', error);
      throw error;
    }
  }

  // 初始化设备
  private async initializeDevice(deviceInfo: DeviceInfo, cloudData: CloudData): Promise<DeviceInitResult> {
    try {
      const initService = DeviceInitializationService.getInstance();
      return await initService.initializeDevice(deviceInfo, cloudData);
    } catch (error) {
      console.error('❌ 设备初始化失败:', error);
      throw error;
    }
  }

  // 更新进度
  private updateProgress(
    stage: DownloadProgress['stage'],
    progress: number,
    message: string,
    currentStep: string,
    stepNumber: number
  ): void {
    this.currentProgress = {
      stage,
      progress,
      message,
      currentStep,
      totalSteps: 4
    };

    console.log(`📊 [${currentStep}] ${message} (${progress}%)`);
  }

  // 获取当前进度
  public getCurrentProgress(): DownloadProgress {
    return { ...this.currentProgress };
  }

  // 检查是否正在处理
  public isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  // 重置进度
  public resetProgress(): void {
    this.currentProgress = {
      stage: 'detecting',
      progress: 0,
      message: '准备开始...',
      currentStep: '设备检测',
      totalSteps: 4
    };
  }

  // 获取设备状态摘要
  public async getDeviceStatusSummary(appleId: string): Promise<any> {
    try {
      const detectionService = NewDeviceDetectionService.getInstance();
      const deviceInfo = await detectionService.getLocalDeviceInfo(appleId);
      
      const initService = DeviceInitializationService.getInstance();
      const initStatus = await initService.getDeviceInitStatus(appleId, deviceInfo.deviceId);

      return {
        deviceInfo,
        initStatus,
        isNewDevice: !initStatus?.isInitialized,
        lastSyncTime: deviceInfo.lastSyncTime,
        deviceAge: Date.now() - deviceInfo.lastSyncTime
      };

    } catch (error) {
      console.error('❌ 获取设备状态摘要失败:', error);
      return null;
    }
  }

  // 手动触发数据同步（用于测试或手动同步）
  public async manualDataSync(appleId: string): Promise<NewDeviceDownloadResult> {
    try {
      console.log('🔄 手动触发数据同步...');
      
      // 重置设备初始化状态（模拟新设备）
      const detectionService = NewDeviceDetectionService.getInstance();
      const deviceInfo = await detectionService.getLocalDeviceInfo(appleId);
      
      const initService = DeviceInitializationService.getInstance();
      await initService.resetDeviceInitStatus(appleId, deviceInfo.deviceId);

      // 执行新设备数据下载流程
      return await this.processNewDeviceDataDownload(appleId);

    } catch (error) {
      console.error('❌ 手动数据同步失败:', error);
      throw error;
    }
  }

  // 检查云端数据更新
  public async checkCloudDataUpdates(appleId: string): Promise<any> {
    try {
      const downloadService = NewDeviceDataDownloadService.getInstance();
      return await downloadService.getDownloadStats(appleId);
    } catch (error) {
      console.error('❌ 检查云端数据更新失败:', error);
      return null;
    }
  }

  // 恢复备份数据
  public async restoreBackupData(): Promise<boolean> {
    try {
      const overwriteService = LocalDataOverwriteService.getInstance();
      return await overwriteService.restoreBackupData();
    } catch (error) {
      console.error('❌ 恢复备份数据失败:', error);
      return false;
    }
  }

  // 清理备份数据
  public async clearBackupData(): Promise<void> {
    try {
      const overwriteService = LocalDataOverwriteService.getInstance();
      await overwriteService.clearBackupData();
    } catch (error) {
      console.error('❌ 清理备份数据失败:', error);
    }
  }

  // ==================== 云端数据下载方法 ====================

  // 下载云端数据
  public async downloadCloudData(appleId: string): Promise<DownloadResult> {
    try {
      if (this.isDownloading) {
        return {
          success: false,
          message: '下载正在进行中，请稍候',
          downloadTime: 0,
          dataSize: 0
        };
      }

      console.log('☁️ 开始下载云端数据...');
      this.isDownloading = true;
      const startTime = Date.now();

      // 获取设备信息
      const deviceInfo = await this.getDeviceInfo(appleId);
      if (!deviceInfo) {
        throw new Error('无法获取设备信息');
      }

      // 获取认证token
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('未找到认证token');
      }

      // 使用增量同步API下载数据
      const cloudData = await this.fetchCloudData(appleId, deviceInfo, token);
      
      const downloadTime = Date.now() - startTime;
      const dataSize = JSON.stringify(cloudData).length;

      console.log(`✅ 云端数据下载完成，耗时 ${downloadTime}ms，数据大小 ${dataSize} bytes`);

      return {
        success: true,
        data: cloudData,
        message: '云端数据下载成功',
        downloadTime,
        dataSize
      };

    } catch (error) {
      console.error('❌ 云端数据下载失败:', error);
      return {
        success: false,
        message: `下载失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error: error instanceof Error ? error.message : '未知错误',
        downloadTime: 0,
        dataSize: 0
      };
    } finally {
      this.isDownloading = false;
    }
  }

  // 获取云端数据
  private async fetchCloudData(appleId: string, deviceInfo: DeviceInfo, token: string): Promise<CloudData> {
    try {
      const response = await fetch(`${API_BASE_URL}/data-version/${deviceInfo.deviceId}/incremental`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataType: 'all', // 获取所有数据类型
          lastSyncTime: 0, // 首次同步，从0开始
          localVersion: 'v1.0.0',
          deviceId: deviceInfo.deviceId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '服务器返回错误');
      }

      return result.data;

    } catch (error) {
      console.error('❌ 获取云端数据失败:', error);
      throw error;
    }
  }

  // 获取设备信息
  private async getDeviceInfo(appleId: string): Promise<DeviceInfo | null> {
    try {
      const detectionService = NewDeviceDetectionService.getInstance();
      return await detectionService.getLocalDeviceInfo(appleId);
    } catch (error) {
      console.error('❌ 获取设备信息失败:', error);
      return null;
    }
  }

  // 获取认证token
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('❌ 获取认证token失败:', error);
      return null;
    }
  }

  // ==================== 批量下载方法 ====================

  // 分批下载数据
  public async downloadDataInBatches(
    dataType: string,
    totalCount: number,
    onProgress?: (progress: any) => void
  ): Promise<BatchDownloadResult> {
    if (this.isDownloading) {
      throw new Error('批量下载正在进行中，请稍候');
    }

    this.isDownloading = true;
    const startTime = Date.now();
    const results: any[] = [];
    const errors: string[] = [];

    try {
      console.log(`🚀 开始分批下载 ${dataType} 数据，总计 ${totalCount} 条记录`);
      
      const batches = Math.ceil(totalCount / this.batchSize);
      const concurrentBatches = Math.min(batches, this.maxConcurrentBatches);
      
      console.log(`📊 下载计划: ${batches} 个批次，每批 ${this.batchSize} 条，并发 ${concurrentBatches} 个批次`);

      // 分批下载
      for (let i = 0; i < batches; i += concurrentBatches) {
        const currentBatches = Math.min(concurrentBatches, batches - i);
        const batchPromises: Promise<any[]>[] = [];

        // 创建当前批次的下载任务
        for (let j = 0; j < currentBatches; j++) {
          const batchIndex = i + j;
          const batchStart = batchIndex * this.batchSize;
          const batchEnd = Math.min(batchStart + this.batchSize, totalCount);
          
          batchPromises.push(
            this.downloadBatch(dataType, batchStart, batchEnd, batchIndex + 1, batches)
          );
        }

        // 等待当前批次完成
        const batchResults = await Promise.allSettled(batchPromises);
        
        // 处理批次结果
        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j];
          if (result.status === 'fulfilled') {
            results.push(...result.value);
          } else {
            const error = `批次 ${i + j + 1} 下载失败: ${result.reason}`;
            errors.push(error);
            console.error('❌', error);
          }
        }

        // 更新进度
        if (onProgress) {
          const completedItems = Math.min((i + currentBatches) * this.batchSize, totalCount);
          const percentage = Math.round((completedItems / totalCount) * 100);
          onProgress({
            currentBatch: i + currentBatches,
            totalBatches: batches,
            currentItem: completedItems,
            totalItems: totalCount,
            percentage
          });
        }

        // 批次间延迟，避免过快请求
        if (i + currentBatches < batches) {
          await this.delay(200); // 200ms延迟
        }
      }

      const downloadTime = (Date.now() - startTime) / 1000;
      const averageSpeed = totalCount / downloadTime;

      console.log(`✅ 批量下载完成: ${results.length} 条记录，耗时 ${downloadTime.toFixed(2)} 秒，平均速度 ${averageSpeed.toFixed(2)} 条/秒`);

      return {
        success: errors.length === 0,
        data: results,
        totalBatches: batches,
        totalItems: results.length,
        downloadTime,
        averageSpeed,
        errors
      };

    } catch (error) {
      console.error('❌ 批量下载失败:', error);
      throw error;
    } finally {
      this.isDownloading = false;
    }
  }

  // 下载单个批次
  private async downloadBatch(
    dataType: string,
    start: number,
    end: number,
    batchNumber: number,
    totalBatches: number
  ): Promise<any[]> {
    let retryCount = 0;
    
    while (retryCount < this.retryCount) {
      try {
        console.log(`📦 下载批次 ${batchNumber}/${totalBatches}: 项目 ${start}-${end}`);
        
        const response = await this.fetchBatchData(dataType, start, end);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || '服务器返回错误');
        }
        
        return result.data || [];
        
      } catch (error) {
        retryCount++;
        console.warn(`⚠️ 批次 ${batchNumber} 下载失败 (重试 ${retryCount}/${this.retryCount}):`, error);
        
        if (retryCount < this.retryCount) {
          await this.delay(this.retryDelay * retryCount); // 指数退避
        } else {
          throw error;
        }
      }
    }
    
    return [];
  }

  // 获取批次数据
  private async fetchBatchData(
    dataType: string,
    start: number,
    end: number
  ): Promise<Response> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('未找到认证token');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${API_BASE_URL}/data/${dataType}/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          start,
          end,
          dataType,
          timestamp: Date.now()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 配置批量下载参数
  public configure(config: {
    batchSize?: number;
    maxConcurrentBatches?: number;
    retryCount?: number;
    retryDelay?: number;
    timeout?: number;
  }): void {
    if (config.batchSize) this.batchSize = config.batchSize;
    if (config.maxConcurrentBatches) this.maxConcurrentBatches = config.maxConcurrentBatches;
    if (config.retryCount) this.retryCount = config.retryCount;
    if (config.retryDelay) this.retryDelay = config.retryDelay;
    if (config.timeout) this.timeout = config.timeout;
    
    console.log('📊 批量下载配置已更新:', {
      batchSize: this.batchSize,
      maxConcurrentBatches: this.maxConcurrentBatches,
      retryCount: this.retryCount,
      timeout: this.timeout
    });
  }

  // 获取下载统计
  public async getDownloadStats(appleId: string): Promise<any> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/data/${appleId}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ 获取下载统计失败:', error);
      return null;
    }
  }
}
