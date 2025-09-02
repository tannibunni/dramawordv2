import { NewDeviceDetectionService, DeviceInfo, NewDeviceStatus } from './newDeviceDetectionService';
import { CloudDataDownloadService, CloudData, DownloadResult } from './cloudDataDownloadService';
import { LocalDataOverwriteService, OverwriteResult } from './localDataOverwriteService';
import { DeviceInitializationService, DeviceInitResult } from './deviceInitializationService';

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
  private currentProgress: DownloadProgress = {
    stage: 'detecting',
    progress: 0,
    message: '准备开始...',
    currentStep: '设备检测',
    totalSteps: 4
  };

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
      const downloadResult = await this.downloadCloudData(appleId);

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

  // 下载云端数据
  private async downloadCloudData(appleId: string): Promise<DownloadResult> {
    try {
      const downloadService = CloudDataDownloadService.getInstance();
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
      const downloadService = CloudDataDownloadService.getInstance();
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
}
