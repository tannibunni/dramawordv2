/**
 * ========================================
 * 🔄 [SYNC SERVICE] 数据同步服务
 * ========================================
 * 
 * 服务类型: 数据同步相关服务
 * 功能描述: 设备初始化服务 - 设备初始化管理
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
import { API_BASE_URL } from '../constants/config';
import { DeviceInfo } from './newDeviceDetectionService';
import { CloudData } from './newDeviceDataDownloadService';

export interface DeviceInitResult {
  success: boolean;
  message: string;
  deviceId: string;
  appleId: string;
  initTime: number;
  error?: string;
}

export interface DeviceRegistrationData {
  deviceId: string;
  deviceName: string;
  deviceType: 'iOS' | 'Android' | 'Web' | 'Desktop';
  appleId: string;
  osVersion: string;
  appVersion: string;
  isActive: boolean;
  isInitialized: boolean;
  lastSyncTime: number;
  dataTypes: string[];
  totalDataSize: number;
}

export class DeviceInitializationService {
  private static instance: DeviceInitializationService;
  private isInitializing: boolean = false;

  public static getInstance(): DeviceInitializationService {
    if (!DeviceInitializationService.instance) {
      DeviceInitializationService.instance = new DeviceInitializationService();
    }
    return DeviceInitializationService.instance;
  }

  private constructor() {}

  // 初始化设备
  public async initializeDevice(
    deviceInfo: DeviceInfo,
    cloudData: CloudData
  ): Promise<DeviceInitResult> {
    try {
      if (this.isInitializing) {
        return {
          success: false,
          message: '设备初始化正在进行中，请稍候',
          deviceId: deviceInfo.deviceId,
          appleId: deviceInfo.appleId,
          initTime: 0
        };
      }

      console.log('🚀 开始初始化设备...');
      this.isInitializing = true;

      const startTime = Date.now();

      // 1. 本地标记为已初始化
      await this.markLocalAsInitialized(deviceInfo);

      // 2. 注册设备到云端
      const registrationResult = await this.registerDeviceToCloud(deviceInfo, cloudData);

      if (!registrationResult.success) {
        throw new Error(registrationResult.message);
      }

      // 3. 更新本地同步状态
      await this.updateLocalSyncStatus(deviceInfo, cloudData);

      // 4. 清理临时数据
      await this.cleanupTemporaryData();

      const initTime = Date.now() - startTime;

      console.log(`✅ 设备初始化完成: ${initTime}ms`);

      return {
        success: true,
        message: '设备初始化成功',
        deviceId: deviceInfo.deviceId,
        appleId: deviceInfo.appleId,
        initTime
      };

    } catch (error) {
      console.error('❌ 设备初始化失败:', error);
      
      return {
        success: false,
        message: '设备初始化失败',
        deviceId: deviceInfo.deviceId,
        appleId: deviceInfo.appleId,
        initTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.isInitializing = false;
    }
  }

  // 本地标记为已初始化
  private async markLocalAsInitialized(deviceInfo: DeviceInfo): Promise<void> {
    try {
      // 标记设备已初始化
      const key = `device_initialized_${deviceInfo.appleId}_${deviceInfo.deviceId}`;
      await AsyncStorage.setItem(key, 'true');

      // 更新最后同步时间
      const lastSyncKey = `last_sync_time_${deviceInfo.appleId}_${deviceInfo.deviceId}`;
      await AsyncStorage.setItem(lastSyncKey, Date.now().toString());

      // 保存设备信息
      await AsyncStorage.setItem('current_device_info', JSON.stringify(deviceInfo));

      console.log('✅ 本地设备标记为已初始化');

    } catch (error) {
      console.error('❌ 本地设备标记失败:', error);
      throw error;
    }
  }

  // 注册设备到云端
  private async registerDeviceToCloud(
    deviceInfo: DeviceInfo,
    cloudData: CloudData
  ): Promise<any> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('未找到认证token');
      }

      console.log('📡 正在注册设备到云端...');

      // 准备设备注册数据
      const registrationData = {
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType.toLowerCase() as 'ios' | 'android' | 'web' | 'unknown',
        osVersion: await this.getOSVersion(),
        appVersion: await this.getAppVersion(),
        deviceFingerprint: deviceInfo.deviceFingerprint,
        metadata: {
          manufacturer: deviceInfo.deviceType === 'iOS' ? 'Apple' : 'Unknown',
          model: deviceInfo.deviceName,
          screenResolution: 'unknown',
          totalStorage: 0,
          availableStorage: 0,
          batteryLevel: 0,
          isCharging: false
        }
      };

      // 发送设备注册请求
      const response = await fetch(`${API_BASE_URL}/device/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      if (!response.ok) {
        throw new Error(`设备注册失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || '设备注册失败');
      }

      console.log('✅ 设备已成功注册到云端');

      // 标记设备为已初始化
      await this.markDeviceAsInitialized(deviceInfo.deviceId);

      return result;

    } catch (error) {
      console.error('❌ 设备云端注册失败:', error);
      throw error;
    }
  }

  // 更新本地同步状态
  private async updateLocalSyncStatus(deviceInfo: DeviceInfo, cloudData: CloudData): Promise<void> {
    try {
      // 更新同步元数据
      const syncMetadata = {
        deviceInitialized: true,
        deviceInitTime: Date.now(),
        lastCloudSyncTime: cloudData.lastModified,
        cloudSyncVersion: cloudData.syncVersion,
        deviceId: deviceInfo.deviceId,
        appleId: deviceInfo.appleId,
        syncStatus: 'initialized'
      };

      await AsyncStorage.setItem('device_sync_status', JSON.stringify(syncMetadata));

      // 更新设备状态
      const deviceStatus = {
        isInitialized: true,
        lastInitTime: Date.now(),
        syncEnabled: true,
        lastSyncTime: Date.now()
      };

      await AsyncStorage.setItem('device_status', JSON.stringify(deviceStatus));

      console.log('✅ 本地同步状态更新完成');

    } catch (error) {
      console.error('❌ 本地同步状态更新失败:', error);
      throw error;
    }
  }

  // 清理临时数据
  private async cleanupTemporaryData(): Promise<void> {
    try {
      // 清理备份数据（可选）
      const keepBackup = await AsyncStorage.getItem('keep_data_backup');
      if (keepBackup !== 'true') {
        await AsyncStorage.removeItem('data_backup');
        console.log('✅ 临时备份数据清理完成');
      }

      // 清理其他临时数据
      const tempKeys = [
        'temp_sync_data',
        'sync_queue_backup',
        'device_init_temp'
      ];

      for (const key of tempKeys) {
        await AsyncStorage.removeItem(key);
      }

      console.log('✅ 临时数据清理完成');

    } catch (error) {
      console.warn('⚠️ 临时数据清理失败:', error);
      // 清理失败不影响主要功能
    }
  }

  // 获取操作系统版本
  private async getOSVersion(): Promise<string> {
    try {
      // 从AsyncStorage获取OS版本
      const osVersion = await AsyncStorage.getItem('os_version');
      if (osVersion) {
        return osVersion;
      }

      // 默认版本（实际应该从Platform.OS获取）
      const defaultVersion = 'iOS 17.0';
      await AsyncStorage.setItem('os_version', defaultVersion);
      return defaultVersion;

    } catch (error) {
      console.warn('⚠️ 获取OS版本失败:', error);
      return 'Unknown';
    }
  }

  // 获取应用版本
  private async getAppVersion(): Promise<string> {
    try {
      // 从AsyncStorage获取应用版本
      const appVersion = await AsyncStorage.getItem('app_version');
      if (appVersion) {
        return appVersion;
      }

      // 默认版本（实际应该从package.json或app.json获取）
      const defaultVersion = '1.0.0';
      await AsyncStorage.setItem('app_version', defaultVersion);
      return defaultVersion;

    } catch (error) {
      console.warn('⚠️ 获取应用版本失败:', error);
      return 'Unknown';
    }
  }

  // 从云端数据获取数据类型
  private getDataTypesFromCloudData(cloudData: CloudData): string[] {
    const dataTypes: string[] = [];

    if (cloudData.vocabulary && cloudData.vocabulary.length > 0) {
      dataTypes.push('vocabulary');
    }

    if (cloudData.shows && cloudData.shows.length > 0) {
      dataTypes.push('shows');
    }

    if (cloudData.learningRecords && cloudData.learningRecords.length > 0) {
      dataTypes.push('learningRecords');
    }

    if (cloudData.experience) {
      dataTypes.push('experience');
    }

    if (cloudData.badges && cloudData.badges.length > 0) {
      dataTypes.push('badges');
    }

    if (cloudData.userStats) {
      dataTypes.push('userStats');
    }

    return dataTypes;
  }

  // 计算总数据大小
  private calculateTotalDataSize(cloudData: CloudData): number {
    try {
      const jsonString = JSON.stringify(cloudData);
      return new Blob([jsonString]).size;
    } catch (error) {
      console.warn('⚠️ 计算数据大小失败:', error);
      return 0;
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

  // 检查设备是否已初始化
  public async isDeviceInitialized(appleId: string, deviceId: string): Promise<boolean> {
    try {
      const key = `device_initialized_${appleId}_${deviceId}`;
      const isInitialized = await AsyncStorage.getItem(key);
      return isInitialized === 'true';
    } catch (error) {
      console.error('❌ 检查设备初始化状态失败:', error);
      return false;
    }
  }

  // 获取设备初始化状态
  public async getDeviceInitStatus(appleId: string, deviceId: string): Promise<any> {
    try {
      const deviceStatus = await AsyncStorage.getItem('device_status');
      const syncStatus = await AsyncStorage.getItem('device_sync_status');
      
      return {
        deviceStatus: deviceStatus ? JSON.parse(deviceStatus) : null,
        syncStatus: syncStatus ? JSON.parse(syncStatus) : null,
        isInitialized: await this.isDeviceInitialized(appleId, deviceId)
      };
    } catch (error) {
      console.error('❌ 获取设备初始化状态失败:', error);
      return null;
    }
  }

  // 重置设备初始化状态
  public async resetDeviceInitStatus(appleId: string, deviceId: string): Promise<void> {
    try {
      // 移除初始化标记
      const key = `device_initialized_${appleId}_${deviceId}`;
      await AsyncStorage.removeItem(key);

      // 清理相关状态
      await AsyncStorage.removeItem('device_status');
      await AsyncStorage.removeItem('device_sync_status');
      await AsyncStorage.removeItem('current_device_info');

      console.log('✅ 设备初始化状态已重置');

    } catch (error) {
      console.error('❌ 重置设备初始化状态失败:', error);
      throw error;
    }
  }

  // 标记设备为已初始化
  private async markDeviceAsInitialized(deviceId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('未找到认证token');
      }

      const response = await fetch(`${API_BASE_URL}/device/${deviceId}/init`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`设备初始化标记失败: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '设备初始化标记失败');
      }

      console.log('✅ 设备已标记为已初始化');
    } catch (error) {
      console.error('❌ 标记设备初始化状态失败:', error);
      throw error;
    }
  }

  // 检查是否正在初始化
  public isCurrentlyInitializing(): boolean {
    return this.isInitializing;
  }
}
