import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { API_BASE_URL } from '../constants/config';

export interface DetectionStrategy {
  name: string;
  weight: number; // 权重，用于综合判断
  description: string;
}

export interface DetectionResult {
  strategy: string;
  result: boolean;
  confidence: number; // 置信度 0-1
  reason: string;
  details: any;
}

export interface SmartDetectionResult {
  shouldDownload: boolean;
  confidence: number;
  primaryReason: string;
  allResults: DetectionResult[];
  recommendation: string;
}

export class SmartDetectionStrategyService {
  private static instance: SmartDetectionStrategyService;
  private strategies: DetectionStrategy[] = [];

  public static getInstance(): SmartDetectionStrategyService {
    if (!SmartDetectionStrategyService.instance) {
      SmartDetectionStrategyService.instance = new SmartDetectionStrategyService();
    }
    return SmartDetectionStrategyService.instance;
  }

  private constructor() {
    this.initializeStrategies();
  }

  // 初始化检测策略
  private initializeStrategies(): void {
    this.strategies = [
      {
        name: 'localInitializationCheck',
        weight: 0.4,
        description: '检查本地初始化标记'
      },
      {
        name: 'cloudDeviceRegistration',
        weight: 0.3,
        description: '检查云端设备注册状态'
      },
      {
        name: 'appInstallationTime',
        weight: 0.2,
        description: '检查APP安装时间'
      },
      {
        name: 'deviceFingerprint',
        weight: 0.1,
        description: '检查设备指纹变化'
      }
    ];
  }

  // 智能检测是否需要下载数据
  public async smartDetectNeedDownload(appleId: string, deviceId: string): Promise<SmartDetectionResult> {
    try {
      console.log('🧠 开始智能检测策略...');
      
      const results: DetectionResult[] = [];
      let totalWeight = 0;
      let weightedSum = 0;

      // 执行所有检测策略
      for (const strategy of this.strategies) {
        const result = await this.executeStrategy(strategy.name, appleId, deviceId);
        results.push(result);
        
        totalWeight += strategy.weight;
        weightedSum += result.confidence * strategy.weight;
      }

      // 计算综合置信度
      const overallConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0;
      
      // 判断是否应该下载
      const shouldDownload = overallConfidence > 0.6; // 置信度阈值
      
      // 获取主要原因
      const primaryResult = results.reduce((prev, current) => 
        (current.confidence * this.getStrategyWeight(current.strategy)) > 
        (prev.confidence * this.getStrategyWeight(prev.strategy)) ? current : prev
      );

      // 生成建议
      const recommendation = this.generateRecommendation(shouldDownload, overallConfidence, results);

      const smartResult: SmartDetectionResult = {
        shouldDownload,
        confidence: overallConfidence,
        primaryReason: primaryResult.reason,
        allResults: results,
        recommendation
      };

      console.log('🧠 智能检测完成:', smartResult);
      return smartResult;

    } catch (error) {
      console.error('❌ 智能检测失败:', error);
      
      // 出错时保守地建议下载
      return {
        shouldDownload: true,
        confidence: 0.5,
        primaryReason: '检测失败，建议下载数据',
        allResults: [],
        recommendation: '由于检测失败，建议下载数据以确保数据完整性'
      };
    }
  }

  // 执行具体策略
  private async executeStrategy(strategyName: string, appleId: string, deviceId: string): Promise<DetectionResult> {
    try {
      switch (strategyName) {
        case 'localInitializationCheck':
          return await this.checkLocalInitialization(appleId, deviceId);
        case 'cloudDeviceRegistration':
          return await this.checkCloudDeviceRegistration(appleId, deviceId);
        case 'appInstallationTime':
          return await this.checkAppInstallationTime();
        case 'deviceFingerprint':
          return await this.checkDeviceFingerprint(appleId, deviceId);
        default:
          return {
            strategy: strategyName,
            result: false,
            confidence: 0,
            reason: '未知策略',
            details: {}
          };
      }
    } catch (error) {
      console.error(`❌ 策略 ${strategyName} 执行失败:`, error);
      return {
        strategy: strategyName,
        result: false,
        confidence: 0,
        reason: '策略执行失败',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // 策略1：检查本地初始化状态
  private async checkLocalInitialization(appleId: string, deviceId: string): Promise<DetectionResult> {
    try {
      const key = `device_initialized_${appleId}_${deviceId}`;
      const isInitialized = await AsyncStorage.getItem(key);
      
      const result = isInitialized === 'true';
      const confidence = result ? 0.9 : 0.1; // 已初始化则高置信度不需要下载
      
      return {
        strategy: 'localInitializationCheck',
        result: !result, // 未初始化则需要下载
        confidence,
        reason: result ? '本地已标记为初始化' : '本地未标记为初始化',
        details: { isInitialized: result }
      };
      
    } catch (error) {
      return {
        strategy: 'localInitializationCheck',
        result: true,
        confidence: 0.5,
        reason: '检查本地状态失败',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // 策略2：检查云端设备注册状态
  private async checkCloudDeviceRegistration(appleId: string, deviceId: string): Promise<DetectionResult> {
    try {
      // 这里应该调用云端API，暂时模拟
      const hasCloudDevice = await this.checkCloudDeviceExists(appleId, deviceId);
      
      const result = !hasCloudDevice; // 云端无设备则需要下载
      const confidence = hasCloudDevice ? 0.8 : 0.7;
      
      return {
        strategy: 'cloudDeviceRegistration',
        result,
        confidence,
        reason: hasCloudDevice ? '云端已有设备记录' : '云端无设备记录',
        details: { hasCloudDevice }
      };
      
    } catch (error) {
      return {
        strategy: 'cloudDeviceRegistration',
        result: true,
        confidence: 0.5,
        reason: '检查云端状态失败',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // 策略3：检查APP安装时间
  private async checkAppInstallationTime(): Promise<DetectionResult> {
    try {
      const installTime = await AsyncStorage.getItem('app_install_time');
      const currentTime = Date.now();
      
      if (!installTime) {
        // 首次安装，记录时间
        await AsyncStorage.setItem('app_install_time', currentTime.toString());
        return {
          strategy: 'appInstallationTime',
          result: true, // 首次安装需要下载
          confidence: 0.9,
          reason: '首次安装APP',
          details: { installTime: currentTime, isFirstInstall: true }
        };
      }
      
      const installTimestamp = parseInt(installTime);
      const hoursSinceInstall = (currentTime - installTimestamp) / (1000 * 60 * 60);
      
      // 如果安装时间很短（比如1小时内），可能是重装
      const isRecentInstall = hoursSinceInstall < 1;
      const result = isRecentInstall;
      const confidence = isRecentInstall ? 0.8 : 0.3;
      
      return {
        strategy: 'appInstallationTime',
        result,
        confidence,
        reason: isRecentInstall ? 'APP最近安装，可能是重装' : 'APP安装时间较长',
        details: { installTime: installTimestamp, hoursSinceInstall, isRecentInstall }
      };
      
    } catch (error) {
      return {
        strategy: 'appInstallationTime',
        result: true,
        confidence: 0.5,
        reason: '检查安装时间失败',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // 策略4：检查设备指纹
  private async checkDeviceFingerprint(appleId: string, deviceId: string): Promise<DetectionResult> {
    try {
      const currentFingerprint = await this.generateCurrentFingerprint();
      const storedFingerprint = await AsyncStorage.getItem(`device_fingerprint_${appleId}_${deviceId}`);
      
      if (!storedFingerprint) {
        // 没有存储的指纹，记录当前指纹
        await AsyncStorage.setItem(`device_fingerprint_${appleId}_${deviceId}`, currentFingerprint);
        return {
          strategy: 'deviceFingerprint',
          result: true, // 首次记录指纹，需要下载
          confidence: 0.7,
          reason: '首次记录设备指纹',
          details: { currentFingerprint, isFirstRecord: true }
        };
      }
      
      const fingerprintChanged = currentFingerprint !== storedFingerprint;
      const result = fingerprintChanged;
      const confidence = fingerprintChanged ? 0.8 : 0.6;
      
      return {
        strategy: 'deviceFingerprint',
        result,
        confidence,
        reason: fingerprintChanged ? '设备指纹发生变化' : '设备指纹未变化',
        details: { currentFingerprint, storedFingerprint, fingerprintChanged }
      };
      
    } catch (error) {
      return {
        strategy: 'deviceFingerprint',
        result: true,
        confidence: 0.5,
        reason: '检查设备指纹失败',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // 生成当前设备指纹
  private async generateCurrentFingerprint(): Promise<string> {
    try {
      const deviceName = Device.deviceName || 'Unknown';
      const deviceType = Device.deviceType || 'Unknown';
      const osVersion = Device.osVersion || 'Unknown';
      const appVersion = Application.nativeApplicationVersion || 'Unknown';
      
      const fingerprint = `${deviceName}_${deviceType}_${osVersion}_${appVersion}`;
      return fingerprint;
      
    } catch (error) {
      console.warn('⚠️ 生成设备指纹失败:', error);
      return `fingerprint_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
  }

  // 检查云端设备是否存在（真实API实现）
  private async checkCloudDeviceExists(appleId: string, deviceId: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('ℹ️ 未找到认证token，跳过云端检查');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/device/user/devices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ 云端暂无设备记录');
          return false;
        }
        throw new Error(`检查云端设备失败: ${response.status}`);
      }

      const result = await response.json();
      const hasDevice = result.data?.devices?.some((device: any) => device.deviceId === deviceId);
      
      console.log(`🔍 云端设备检查结果: ${hasDevice ? '找到设备' : '未找到设备'}`);
      return hasDevice;
      
    } catch (error) {
      console.warn('⚠️ 检查云端设备失败:', error);
      return false;
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

  // 获取策略权重
  private getStrategyWeight(strategyName: string): number {
    const strategy = this.strategies.find(s => s.name === strategyName);
    return strategy ? strategy.weight : 0;
  }

  // 生成建议
  private generateRecommendation(
    shouldDownload: boolean, 
    confidence: number, 
    results: DetectionResult[]
  ): string {
    if (shouldDownload) {
      if (confidence > 0.8) {
        return '强烈建议下载数据，检测到明显的设备变化';
      } else if (confidence > 0.6) {
        return '建议下载数据，检测到可能的设备变化';
      } else {
        return '建议下载数据，以确保数据完整性';
      }
    } else {
      if (confidence > 0.8) {
        return '无需下载数据，设备状态正常';
      } else if (confidence > 0.6) {
        return '可能无需下载数据，但建议检查';
      } else {
        return '检测结果不明确，建议手动检查';
      }
    }
  }

  // 获取所有策略信息
  public getStrategies(): DetectionStrategy[] {
    return [...this.strategies];
  }

  // 重置检测状态
  public async resetDetectionState(appleId: string, deviceId: string): Promise<void> {
    try {
      const keysToRemove = [
        `device_initialized_${appleId}_${deviceId}`,
        `device_fingerprint_${appleId}_${deviceId}`,
        'app_install_time'
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ 检测状态已重置');
      
    } catch (error) {
      console.error('❌ 重置检测状态失败:', error);
    }
  }
}
