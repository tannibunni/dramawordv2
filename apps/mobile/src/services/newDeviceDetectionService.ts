/**
 * ========================================
 * 🔄 [SYNC SERVICE] 数据同步服务
 * ========================================
 * 
 * 服务类型: 数据同步相关服务
 * 功能描述: 新设备检测服务 - 设备识别和检测
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
import * as Device from 'expo-device';
import { API_BASE_URL } from '../constants/config';
// import { logger } from '../utils/logger';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'iOS' | 'Android' | 'Web' | 'Desktop';
  isInitialized: boolean;
  lastSyncTime: number;
  appleId: string;
  deviceFingerprint: string;
  model: string;
  osVersion: string;
  appVersion: string;
  installTime: number;
  fingerprint: string;
}

export interface NewDeviceStatus {
  isNewDevice: boolean;
  deviceInfo?: DeviceInfo;
  reason?: string;
  confidence?: number; // 0-1
  reasons?: string[];
  recommendedAction?: 'download' | 'skip' | 'manual_check';
  cloudDeviceStatus?: any;
}

export interface DownloadDecision {
  shouldDownload: boolean;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedSize: number;
  recommendedStrategy: 'immediate' | 'background' | 'delay' | 'skip' | 'cleanup_first';
}

export interface DownloadConditions {
  passes: boolean;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  strategy: 'immediate' | 'background' | 'delay' | 'skip' | 'cleanup_first';
}

export class NewDeviceDetectionService {
  private static instance: NewDeviceDetectionService;
  private deviceInfo: DeviceInfo | null = null;
  private detectionCache: Map<string, NewDeviceStatus> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5分钟缓存

  public static getInstance(): NewDeviceDetectionService {
    if (!NewDeviceDetectionService.instance) {
      NewDeviceDetectionService.instance = new NewDeviceDetectionService();
    }
    return NewDeviceDetectionService.instance;
  }

  private constructor() {
    this.initializeDeviceInfo();
  }

  // 初始化设备信息
  private async initializeDeviceInfo(): Promise<void> {
    try {
      const deviceId = await this.getOrCreateDeviceId();
      const model = Device.modelName || 'Unknown';
      const osVersion = Device.osVersion || 'Unknown';
      const appVersion = await this.getAppVersion();
      const installTime = await this.getInstallTime();
      const fingerprint = await this.getDeviceFingerprint();
      const isInitialized = await this.isDeviceInitialized();

      this.deviceInfo = {
        deviceId,
        deviceName: model,
        deviceType: Device.osName === 'iOS' ? 'iOS' : 'Android',
        isInitialized,
        lastSyncTime: 0,
        appleId: '',
        deviceFingerprint: fingerprint,
        model,
        osVersion,
        appVersion,
        installTime,
        fingerprint
      };

      console.log('📱 设备信息初始化完成:', this.deviceInfo);
    } catch (error) {
      console.error('❌ 设备信息初始化失败:', error);
    }
  }

  // 获取或创建设备ID
  private async getOrCreateDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      
      if (!deviceId) {
        // 生成新的设备ID
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
        console.log('🆔 新设备ID已生成:', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('获取设备ID失败:', error);
      return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // 获取应用版本
  private async getAppVersion(): Promise<string> {
    try {
      const version = await AsyncStorage.getItem('app_version');
      if (version) {
        return version;
      }
      
      // 这里应该从应用配置中获取版本号
      const appVersion = '1.0.0'; // 默认版本
      await AsyncStorage.setItem('app_version', appVersion);
      return appVersion;
    } catch (error) {
      return '1.0.0';
    }
  }

  // 获取安装时间
  private async getInstallTime(): Promise<number> {
    try {
      const installTime = await AsyncStorage.getItem('app_install_time');
      if (installTime) {
        return parseInt(installTime);
      }
      
      const now = Date.now();
      await AsyncStorage.setItem('app_install_time', now.toString());
      return now;
    } catch (error) {
      return Date.now();
    }
  }


  // 检查设备是否已初始化
  private async isDeviceInitialized(): Promise<boolean> {
    try {
      const initialized = await AsyncStorage.getItem('device_initialized');
      return initialized === 'true';
    } catch (error) {
      return false;
    }
  }

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

      // 获取设备指纹信息
      const deviceFingerprint = await this.getDeviceFingerprint();

      return {
        deviceId,
        deviceName,
        deviceType,
        isInitialized,
        lastSyncTime,
        appleId,
        deviceFingerprint,
        model: deviceName,
        osVersion: 'Unknown',
        appVersion: '1.0.0',
        installTime: Date.now(),
        fingerprint: deviceFingerprint
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

  // 获取设备指纹
  private async getDeviceFingerprint(): Promise<string> {
    try {
      // 尝试从AsyncStorage获取设备指纹
      let fingerprint = await AsyncStorage.getItem('device_fingerprint');
      
      if (!fingerprint) {
        // 生成新的设备指纹
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const deviceType = Device.osName || 'iOS';
        const model = Device.modelName || 'Unknown';
        
        fingerprint = `${deviceType}_${model}_${timestamp}_${random}`;
        await AsyncStorage.setItem('device_fingerprint', fingerprint);
      }
      
      return fingerprint;
      
    } catch (error) {
      console.warn('⚠️ 获取设备指纹失败:', error);
      return 'unknown';
    }
  }


  // 检测APP重装
  private detectAppReinstall(cloudDevice: any): boolean {
    try {
      // 检查1：云端设备是否有数据但本地没有
      const hasCloudData = cloudDevice.dataTypes && cloudDevice.dataTypes.length > 0;
      const hasCloudDataSize = cloudDevice.totalDataSize && cloudDevice.totalDataSize > 0;
      
      if (hasCloudData && hasCloudDataSize) {
        console.log('🔍 云端有数据，可能是APP重装');
        return true;
      }
      
      // 检查2：设备最后同步时间
      if (cloudDevice.lastSyncTime) {
        const lastSyncDays = (Date.now() - cloudDevice.lastSyncTime) / (1000 * 60 * 60 * 24);
        if (lastSyncDays > 1) { // 超过1天没有同步
          console.log('🔍 设备超过1天未同步，可能是APP重装');
          return true;
        }
      }
      
      // 检查3：设备指纹变化（如果云端有记录）
      if (cloudDevice.deviceFingerprint) {
        const currentFingerprint = this.getDeviceFingerprint();
        if (cloudDevice.deviceFingerprint !== currentFingerprint) {
          console.log('🔍 设备指纹不匹配，可能是APP重装');
          return true;
        }
      }
      
      // 检查4：设备名称变化（如果云端有记录）
      if (cloudDevice.deviceName) {
        const currentDeviceName = this.getDeviceName();
        if (cloudDevice.deviceName !== currentDeviceName) {
          console.log('🔍 设备名称变化，可能是APP重装');
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.warn('⚠️ APP重装检测失败:', error);
      return false;
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

      console.log('📡 正在检查云端设备状态...');

      const response = await fetch(`${API_BASE_URL}/device/user/devices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // 设备列表不存在，说明是新用户
          console.log('ℹ️ 云端暂无设备记录，新用户');
          return null;
        }
        throw new Error(`获取云端设备状态失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('📱 云端设备列表:', result);
      
      // 查找当前设备
      const currentDevice = result.data?.devices?.find((device: any) => device.deviceId === deviceId);
      
      if (currentDevice) {
        console.log('✅ 找到云端设备记录:', currentDevice);
      } else {
        console.log('ℹ️ 云端无此设备记录，可能是新设备或APP重装');
      }
      
      return currentDevice || null;
      
    } catch (error) {
      console.error('❌ 检查云端设备状态失败:', error);
      return null;
    }
  }

  // 判断是否为新设备
  private isNewDevice(localDeviceInfo: DeviceInfo, cloudDeviceStatus: any): boolean {
    // 情况1：本地已标记为初始化，则不是新设备
    if (localDeviceInfo.isInitialized) {
      console.log('ℹ️ 本地已标记为初始化，不是新设备');
      return false;
    }

    // 情况2：云端没有此设备记录，则是新设备
    if (!cloudDeviceStatus) {
      console.log('ℹ️ 云端无设备记录，视为新设备');
      return true;
    }

    // 情况3：云端设备未激活，则是新设备
    if (!cloudDeviceStatus.isActive) {
      console.log('ℹ️ 云端设备未激活，视为新设备');
      return true;
    }

    // 情况4：云端设备已初始化，则不是新设备
    if (cloudDeviceStatus.isInitialized) {
      console.log('ℹ️ 云端设备已初始化，不是新设备');
      return false;
    }

    // 情况5：APP重装检测 - 检查设备指纹是否匹配
    const isAppReinstall = this.detectAppReinstall(cloudDeviceStatus);
    if (isAppReinstall) {
      console.log('🔍 检测到APP重装，需要重新下载数据');
      return true;
    }

    // 其他情况认为是新设备
    console.log('ℹ️ 其他情况，视为新设备');
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

  // ==================== 智能设备检测方法 ====================

  // 智能检测新设备
  public async smartDetectNewDevice(appleId: string): Promise<NewDeviceStatus> {
    if (!this.deviceInfo) {
      await this.initializeDeviceInfo();
    }

    if (!this.deviceInfo) {
      throw new Error('无法获取设备信息');
    }

    // 检查缓存
    const cacheKey = `${appleId}_${this.deviceInfo.deviceId}`;
    const cached = this.detectionCache.get(cacheKey);
    if (cached && (Date.now() - (cached.reasons?.[0] as any)) < this.cacheExpiry) {
      return cached;
    }

    try {
      console.log('🔍 开始智能新设备检测...');
      
      // 获取云端设备状态
      const cloudDeviceStatus = await this.getCloudDeviceStatus(appleId, this.deviceInfo.deviceId);
      
      // 多重检测条件
      const detectionResults = await Promise.all([
        this.checkDeviceFingerprint(this.deviceInfo, cloudDeviceStatus),
        this.checkInstallationHistory(this.deviceInfo, cloudDeviceStatus),
        this.checkDataConsistency(this.deviceInfo, cloudDeviceStatus),
        this.checkUserBehavior(this.deviceInfo, cloudDeviceStatus)
      ]);

      const confidence = this.calculateConfidence(detectionResults);
      const reasons = this.getDetectionReasons(detectionResults);
      const recommendedAction = this.getRecommendedAction(confidence, detectionResults);
      
      const result: NewDeviceStatus = {
        isNewDevice: confidence > 0.7,
        confidence,
        reasons,
        recommendedAction,
        deviceInfo: this.deviceInfo,
        cloudDeviceStatus,
        reason: reasons.join(', ')
      };

      // 缓存结果
      this.detectionCache.set(cacheKey, result);
      
      console.log('🔍 智能新设备检测完成:', {
        isNewDevice: result.isNewDevice,
        confidence: result.confidence,
        reasons: result.reasons
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ 智能新设备检测失败:', error);
      
      return {
        isNewDevice: true, // 出错时默认认为是新设备
        confidence: 0.5,
        reasons: ['检测过程中发生错误'],
        recommendedAction: 'manual_check',
        deviceInfo: this.deviceInfo,
        reason: '检测失败，按新设备处理'
      };
    }
  }

  // 设备指纹检测
  private async checkDeviceFingerprint(
    currentDevice: DeviceInfo,
    cloudDevice: any
  ): Promise<{ isNew: boolean; confidence: number; reason: string }> {
    if (!cloudDevice) {
      return { isNew: true, confidence: 0.9, reason: '云端无设备记录' };
    }

    if (currentDevice.deviceId !== cloudDevice.deviceId) {
      return { isNew: true, confidence: 0.8, reason: '设备ID不匹配' };
    }

    if (currentDevice.fingerprint !== cloudDevice.fingerprint) {
      return { isNew: true, confidence: 0.7, reason: '设备指纹不匹配' };
    }

    if (currentDevice.model !== cloudDevice.model) {
      return { isNew: true, confidence: 0.6, reason: '设备型号不匹配' };
    }

    return { isNew: false, confidence: 0.9, reason: '设备指纹匹配' };
  }

  // 安装历史检测
  private async checkInstallationHistory(
    currentDevice: DeviceInfo,
    cloudDevice: any
  ): Promise<{ isNew: boolean; confidence: number; reason: string }> {
    if (!cloudDevice) {
      return { isNew: true, confidence: 0.8, reason: '云端无安装记录' };
    }

    const timeDiff = Math.abs(currentDevice.installTime - cloudDevice.installTime);
    if (timeDiff > 24 * 60 * 60 * 1000) { // 24小时
      return { isNew: true, confidence: 0.6, reason: '安装时间差异过大' };
    }

    if (currentDevice.appVersion !== cloudDevice.appVersion) {
      return { isNew: false, confidence: 0.7, reason: '应用版本不同，但设备相同' };
    }

    return { isNew: false, confidence: 0.8, reason: '安装历史匹配' };
  }

  // 数据一致性检测
  private async checkDataConsistency(
    currentDevice: DeviceInfo,
    cloudDevice: any
  ): Promise<{ isNew: boolean; confidence: number; reason: string }> {
    if (!cloudDevice) {
      return { isNew: true, confidence: 0.7, reason: '云端无数据记录' };
    }

    // 检查本地是否有数据
    const hasLocalData = await this.hasLocalData();
    
    if (!hasLocalData && cloudDevice.hasData) {
      return { isNew: true, confidence: 0.8, reason: '本地无数据但云端有数据' };
    }

    if (hasLocalData && !cloudDevice.hasData) {
      return { isNew: false, confidence: 0.6, reason: '本地有数据但云端无数据' };
    }

    return { isNew: false, confidence: 0.7, reason: '数据一致性检查通过' };
  }

  // 用户行为检测
  private async checkUserBehavior(
    currentDevice: DeviceInfo,
    cloudDevice: any
  ): Promise<{ isNew: boolean; confidence: number; reason: string }> {
    if (!cloudDevice) {
      return { isNew: true, confidence: 0.6, reason: '云端无用户行为记录' };
    }

    // 检查最后活跃时间
    const lastActiveTime = await this.getLastActiveTime();
    const cloudLastActive = cloudDevice.lastActiveTime;
    
    if (lastActiveTime && cloudLastActive) {
      const timeDiff = Math.abs(lastActiveTime - cloudLastActive);
      if (timeDiff > 7 * 24 * 60 * 60 * 1000) { // 7天
        return { isNew: true, confidence: 0.5, reason: '用户行为时间差异过大' };
      }
    }

    return { isNew: false, confidence: 0.6, reason: '用户行为模式匹配' };
  }

  // 检查本地是否有数据
  private async hasLocalData(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const dataKeys = keys.filter(key => 
        key.includes('vocabulary') || 
        key.includes('learningRecords') || 
        key.includes('userStats') ||
        key.includes('shows')
      );
      
      return dataKeys.length > 0;
    } catch (error) {
      return false;
    }
  }

  // 获取最后活跃时间
  private async getLastActiveTime(): Promise<number | null> {
    try {
      const time = await AsyncStorage.getItem('last_active_time');
      return time ? parseInt(time) : null;
    } catch (error) {
      return null;
    }
  }

  // 计算检测置信度
  private calculateConfidence(results: Array<{ isNew: boolean; confidence: number; reason: string }>): number {
    const newDeviceCount = results.filter(r => r.isNew).length;
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    
    // 如果大多数检测都认为是新设备，则置信度高
    if (newDeviceCount >= results.length / 2) {
      return Math.min(totalConfidence / results.length + 0.2, 1.0);
    } else {
      return Math.max(totalConfidence / results.length - 0.2, 0.0);
    }
  }

  // 获取检测原因
  private getDetectionReasons(results: Array<{ isNew: boolean; confidence: number; reason: string }>): string[] {
    return results.map(r => r.reason);
  }

  // 获取推荐操作
  private getRecommendedAction(
    confidence: number,
    results: Array<{ isNew: boolean; confidence: number; reason: string }>
  ): 'download' | 'skip' | 'manual_check' {
    if (confidence > 0.8) {
      return 'download';
    } else if (confidence < 0.3) {
      return 'skip';
    } else {
      return 'manual_check';
    }
  }

  // 获取云端设备状态
  private async getCloudDeviceStatus(appleId: string, deviceId: string): Promise<any> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/devices/${appleId}/${deviceId}/status`, {
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
      console.error('获取云端设备状态失败:', error);
      return null;
    }
  }

  // 根据条件决定是否下载
  public async shouldDownloadData(
    appleId: string,
    dataType: string
  ): Promise<DownloadDecision> {
    const conditions = await this.checkDownloadConditions(appleId, dataType);
    
    return {
      shouldDownload: conditions.passes,
      reason: conditions.reason,
      priority: conditions.priority,
      estimatedSize: await this.estimateDataSize(appleId, dataType),
      recommendedStrategy: conditions.strategy
    };
  }

  // 检查下载条件
  private async checkDownloadConditions(
    appleId: string,
    dataType: string
  ): Promise<DownloadConditions> {
    // 条件1: 检查本地数据是否已存在且最新
    const localData = await this.getLocalData(dataType);
    const cloudDataVersion = await this.getCloudDataVersion(appleId, dataType);
    
    if (localData && localData.version >= cloudDataVersion) {
      return {
        passes: false,
        reason: '本地数据已是最新',
        priority: 'low',
        strategy: 'skip'
      };
    }

    // 条件2: 检查网络状态
    const networkQuality = await this.checkNetworkQuality();
    if (networkQuality === 'poor') {
      return {
        passes: false,
        reason: '网络质量不佳',
        priority: 'medium',
        strategy: 'delay'
      };
    }

    // 条件3: 检查存储空间
    const availableSpace = await this.getAvailableStorageSpace();
    const requiredSpace = await this.estimateDataSize(appleId, dataType);
    
    if (availableSpace < requiredSpace * 2) { // 需要2倍空间用于备份
      return {
        passes: false,
        reason: '存储空间不足',
        priority: 'high',
        strategy: 'cleanup_first'
      };
    }

    // 条件4: 检查用户活跃状态
    if (this.isUserActive()) {
      return {
        passes: true,
        reason: '用户活跃，需要最新数据',
        priority: 'high',
        strategy: 'immediate'
      };
    }

    // 条件5: 检查数据重要性
    const importance = this.getDataImportance(dataType);
    if (importance === 'critical') {
      return {
        passes: true,
        reason: '关键数据需要同步',
        priority: 'high',
        strategy: 'immediate'
      };
    }

    return {
      passes: true,
      reason: '满足下载条件',
      priority: 'medium',
      strategy: 'background'
    };
  }

  // 获取本地数据
  private async getLocalData(dataType: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(dataType);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  // 获取云端数据版本
  private async getCloudDataVersion(appleId: string, dataType: string): Promise<number> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return 0;
      }

      const response = await fetch(`${API_BASE_URL}/data/${appleId}/${dataType}/version`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.data?.version || 0;
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // 检查网络质量
  private async checkNetworkQuality(): Promise<'excellent' | 'good' | 'poor' | 'offline'> {
    try {
      // 这里应该调用网络质量检测服务
      return 'good'; // 暂时返回默认值
    } catch (error) {
      return 'offline';
    }
  }

  // 获取可用存储空间
  private async getAvailableStorageSpace(): Promise<number> {
    try {
      // 这里应该检查实际的存储空间
      return 100 * 1024 * 1024; // 暂时返回100MB
    } catch (error) {
      return 0;
    }
  }

  // 估算数据大小
  private async estimateDataSize(appleId: string, dataType: string): Promise<number> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return 0;
      }

      const response = await fetch(`${API_BASE_URL}/data/${appleId}/${dataType}/size`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.data?.size || 0;
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // 检查用户是否活跃
  private isUserActive(): boolean {
    // 这里应该检查实际的用户活跃状态
    return true; // 暂时返回true
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

  // 清除检测缓存
  public clearDetectionCache(): void {
    this.detectionCache.clear();
    console.log('🧹 设备检测缓存已清除');
  }
}
