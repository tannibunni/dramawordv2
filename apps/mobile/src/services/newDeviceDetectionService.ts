import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
// import { logger } from '../utils/logger';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'iOS' | 'Android' | 'Web' | 'Desktop';
  isInitialized: boolean;
  lastSyncTime: number;
  appleId: string;
}

export interface NewDeviceStatus {
  isNewDevice: boolean;
  deviceInfo?: DeviceInfo;
  reason?: string;
}

export class NewDeviceDetectionService {
  private static instance: NewDeviceDetectionService;
  private deviceInfo: DeviceInfo | null = null;

  public static getInstance(): NewDeviceDetectionService {
    if (!NewDeviceDetectionService.instance) {
      NewDeviceDetectionService.instance = new NewDeviceDetectionService();
    }
    return NewDeviceDetectionService.instance;
  }

  private constructor() {}

  // 检测是否为新设备
  public async detectNewDevice(appleId: string): Promise<NewDeviceStatus> {
    try {
      console.log('🔍 开始检测新设备状态...');
      
      // 1. 获取本地设备信息
      const localDeviceInfo = await this.getLocalDeviceInfo(appleId);
      
      // 2. 检查云端设备状态
      const cloudDeviceStatus = await this.checkCloudDeviceStatus(appleId, localDeviceInfo.deviceId);
      
      // 3. 判断是否为新设备
      const isNewDevice = this.isNewDevice(localDeviceInfo, cloudDeviceStatus);
      
      console.log(`🔍 设备检测完成: ${isNewDevice ? '新设备' : '已初始化设备'}`);
      
      return {
        isNewDevice,
        deviceInfo: localDeviceInfo,
        reason: isNewDevice ? '设备未在云端注册' : '设备已初始化'
      };
      
    } catch (error) {
      console.error('❌ 新设备检测失败:', error);
      // 检测失败时，保守地认为是新设备
      return {
        isNewDevice: true,
        reason: '检测失败，按新设备处理'
      };
    }
  }

  // 获取本地设备信息
  public async getLocalDeviceInfo(appleId: string): Promise<DeviceInfo> {
    try {
      // 获取或生成设备ID
      let deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem('deviceId', deviceId);
      }

      // 获取设备名称和类型
      const deviceName = await this.getDeviceName();
      const deviceType = await this.getDeviceType();

      // 检查本地是否已标记为初始化
      const isInitialized = await this.checkLocalInitialization(appleId, deviceId);
      const lastSyncTime = await this.getLastSyncTime(appleId, deviceId);

      return {
        deviceId,
        deviceName,
        deviceType,
        isInitialized,
        lastSyncTime,
        appleId
      };
      
    } catch (error) {
      console.error('❌ 获取本地设备信息失败:', error);
      throw error;
    }
  }

  // 生成设备ID
  private generateDeviceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `device_${timestamp}_${random}`;
  }

  // 获取设备名称
  private async getDeviceName(): Promise<string> {
    try {
      // 尝试从AsyncStorage获取自定义设备名
      const customName = await AsyncStorage.getItem('customDeviceName');
      if (customName) {
        return customName;
      }

      // 使用默认设备名
      const platform = await this.getDeviceType();
      const timestamp = new Date().toLocaleDateString();
      return `${platform} Device (${timestamp})`;
      
    } catch (error) {
      console.warn('⚠️ 获取设备名称失败，使用默认名称');
      return 'Unknown Device';
    }
  }

  // 获取设备类型
  private async getDeviceType(): Promise<'iOS' | 'Android' | 'Web' | 'Desktop'> {
    try {
      // 从AsyncStorage获取设备类型
      const deviceType = await AsyncStorage.getItem('deviceType');
      if (deviceType && ['iOS', 'Android', 'Web', 'Desktop'].includes(deviceType)) {
        return deviceType as any;
      }

      // 根据平台判断（这里简化处理，实际应该使用Platform.OS）
      // 在React Native中，通常可以通过Platform.OS获取
      const platform = 'iOS'; // 简化处理，实际应该动态获取
      
      // 保存设备类型
      await AsyncStorage.setItem('deviceType', platform);
      return platform;
      
    } catch (error) {
      console.warn('⚠️ 获取设备类型失败，使用默认类型');
      return 'iOS';
    }
  }

  // 检查本地初始化状态
  private async checkLocalInitialization(appleId: string, deviceId: string): Promise<boolean> {
    try {
      const key = `device_initialized_${appleId}_${deviceId}`;
      const isInitialized = await AsyncStorage.getItem(key);
      return isInitialized === 'true';
    } catch (error) {
      console.warn('⚠️ 检查本地初始化状态失败:', error);
      return false;
    }
  }

  // 获取最后同步时间
  private async getLastSyncTime(appleId: string, deviceId: string): Promise<number> {
    try {
      const key = `last_sync_time_${appleId}_${deviceId}`;
      const lastSyncTime = await AsyncStorage.getItem(key);
      return lastSyncTime ? parseInt(lastSyncTime) : 0;
    } catch (error) {
      console.warn('⚠️ 获取最后同步时间失败:', error);
      return 0;
    }
  }

  // 检查云端设备状态
  private async checkCloudDeviceStatus(appleId: string, deviceId: string): Promise<any> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('ℹ️ 未找到认证token，跳过云端检查');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/sync/apple/${appleId}/devices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // 设备列表不存在，说明是新用户
          return null;
        }
        throw new Error(`获取设备状态失败: ${response.status}`);
      }

      const devices = await response.json();
      const currentDevice = devices.devices?.find((device: any) => device.deviceId === deviceId);
      
      return currentDevice || null;
      
    } catch (error) {
      console.error('❌ 检查云端设备状态失败:', error);
      return null;
    }
  }

  // 判断是否为新设备
  private isNewDevice(localDeviceInfo: DeviceInfo, cloudDeviceStatus: any): boolean {
    // 如果本地已标记为初始化，则不是新设备
    if (localDeviceInfo.isInitialized) {
      return false;
    }

    // 如果云端没有此设备记录，则是新设备
    if (!cloudDeviceStatus) {
      return true;
    }

    // 如果云端设备未激活，则是新设备
    if (!cloudDeviceStatus.isActive) {
      return true;
    }

    // 如果云端设备已初始化，则不是新设备
    if (cloudDeviceStatus.isInitialized) {
      return false;
    }

    // 其他情况认为是新设备
    return true;
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

  // 标记设备为已初始化
  public async markDeviceAsInitialized(appleId: string, deviceId: string): Promise<void> {
    try {
      const key = `device_initialized_${appleId}_${deviceId}`;
      await AsyncStorage.setItem(key, 'true');
      
      // 更新最后同步时间
      const lastSyncKey = `last_sync_time_${appleId}_${deviceId}`;
      await AsyncStorage.setItem(lastSyncKey, Date.now().toString());
      
      console.log('✅ 设备已标记为初始化');
      
    } catch (error) {
      console.error('❌ 标记设备初始化失败:', error);
      throw error;
    }
  }

  // 获取设备信息
  public getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  // 设置设备信息
  public setDeviceInfo(deviceInfo: DeviceInfo): void {
    this.deviceInfo = deviceInfo;
  }
}
