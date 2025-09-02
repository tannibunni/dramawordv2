import AsyncStorage from '@react-native-async-storage/async-storage';
import { NewDeviceDataDownloadService } from './newDeviceDataDownloadService';
import { NewDeviceDetectionService } from './newDeviceDetectionService';
import { SmartDetectionStrategyService } from './smartDetectionStrategyService';

export interface AutoDetectionResult {
  shouldShowSync: boolean;
  reason: string;
  deviceStatus: any;
  confidence: number;
  recommendation: string;
}

export interface LoginFlowState {
  stage: 'detecting' | 'downloading' | 'completed' | 'failed' | 'skipped';
  message: string;
  progress: number;
  showSyncModal: boolean;
}

export class AppleLoginAutoDetectionService {
  private static instance: AppleLoginAutoDetectionService;
  private isDetecting: boolean = false;
  private currentState: LoginFlowState = {
    stage: 'detecting',
    message: '准备检测设备状态...',
    progress: 0,
    showSyncModal: false
  };

  public static getInstance(): AppleLoginAutoDetectionService {
    if (!AppleLoginAutoDetectionService.instance) {
      AppleLoginAutoDetectionService.instance = new AppleLoginAutoDetectionService();
    }
    return AppleLoginAutoDetectionService.instance;
  }

  private constructor() {}

  // Apple登录成功后自动检测
  public async autoDetectAfterLogin(appleId: string): Promise<AutoDetectionResult> {
    try {
      if (this.isDetecting) {
        console.log('🔄 检测已在进行中，跳过重复检测');
        return {
          shouldShowSync: false,
          reason: '检测已在进行中',
          deviceStatus: null,
          confidence: 0,
          recommendation: '请等待当前检测完成'
        };
      }

      console.log('🍎 Apple登录成功，开始自动检测设备状态...');
      this.isDetecting = true;
      this.updateState('detecting', '正在检测设备状态...', 10);

      // 1. 使用智能检测策略
      const smartDetection = await this.performSmartDetection(appleId);
      this.updateState('detecting', '设备状态检测完成', 30);

      // 2. 检查是否需要显示同步
      const shouldShowSync = this.shouldShowSyncModal(smartDetection);
      this.updateState('detecting', '分析检测结果...', 50);

      // 3. 更新状态
      if (shouldShowSync) {
        this.updateState('detecting', '检测到需要同步数据', 70);
        this.currentState.showSyncModal = true;
      } else {
        this.updateState('completed', '设备状态正常，无需同步', 100);
        this.currentState.showSyncModal = false;
      }

      console.log('✅ 自动检测完成:', { shouldShowSync, reason: smartDetection.primaryReason });

      return {
        shouldShowSync,
        reason: smartDetection.primaryReason,
        deviceStatus: smartDetection,
        confidence: smartDetection.confidence,
        recommendation: smartDetection.recommendation
      };

    } catch (error) {
      console.error('❌ 自动检测失败:', error);
      this.updateState('failed', '检测失败，请手动检查', 0);
      
      return {
        shouldShowSync: false,
        reason: '检测失败',
        deviceStatus: null,
        confidence: 0,
        recommendation: '检测过程中发生错误，建议手动检查同步状态'
      };
    } finally {
      this.isDetecting = false;
    }
  }

  // 执行智能检测
  private async performSmartDetection(appleId: string): Promise<any> {
    try {
      // 生成临时设备ID用于检测
      const tempDeviceId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      const smartService = SmartDetectionStrategyService.getInstance();
      const result = await smartService.smartDetectNeedDownload(appleId, tempDeviceId);
      
      return result;
    } catch (error) {
      console.error('❌ 智能检测失败:', error);
      throw error;
    }
  }

  // 判断是否应该显示同步模态框
  private shouldShowSyncModal(detectionResult: any): boolean {
    // 基于检测结果判断
    if (detectionResult.shouldDownload && detectionResult.confidence > 0.6) {
      return true;
    }

    // 检查是否有云端数据
    if (detectionResult.allResults) {
      const hasCloudData = detectionResult.allResults.some((result: any) => 
        result.strategy === 'cloudDeviceRegistration' && result.result === true
      );
      
      if (hasCloudData) {
        return true;
      }
    }

    return false;
  }

  // 更新状态
  private updateState(stage: LoginFlowState['stage'], message: string, progress: number): void {
    this.currentState = {
      ...this.currentState,
      stage,
      message,
      progress
    };

    console.log(`📊 [Apple登录检测] ${stage}: ${message} (${progress}%)`);
  }

  // 获取当前状态
  public getCurrentState(): LoginFlowState {
    return { ...this.currentState };
  }

  // 重置状态
  public resetState(): void {
    this.currentState = {
      stage: 'detecting',
      message: '准备检测设备状态...',
      progress: 0,
      showSyncModal: false
    };
    this.isDetecting = false;
  }

  // 检查是否正在检测
  public isCurrentlyDetecting(): boolean {
    return this.isDetecting;
  }

  // 标记同步模态框已显示
  public markSyncModalShown(): void {
    this.currentState.showSyncModal = true;
  }

  // 标记同步模态框已关闭
  public markSyncModalClosed(): void {
    this.currentState.showSyncModal = false;
  }

  // 获取检测历史记录
  public async getDetectionHistory(appleId: string): Promise<any[]> {
    try {
      const historyKey = `detection_history_${appleId}`;
      const history = await AsyncStorage.getItem(historyKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('❌ 获取检测历史失败:', error);
      return [];
    }
  }

  // 记录检测结果
  public async recordDetectionResult(appleId: string, result: AutoDetectionResult): Promise<void> {
    try {
      const historyKey = `detection_history_${appleId}`;
      const history = await this.getDetectionHistory(appleId);
      
      const record = {
        timestamp: Date.now(),
        result,
        deviceInfo: await this.getDeviceInfo()
      };
      
      history.unshift(record);
      
      // 只保留最近10条记录
      if (history.length > 10) {
        history.splice(10);
      }
      
      await AsyncStorage.setItem(historyKey, JSON.stringify(history));
      console.log('✅ 检测结果已记录');
      
    } catch (error) {
      console.error('❌ 记录检测结果失败:', error);
    }
  }

  // 获取设备信息
  private async getDeviceInfo(): Promise<any> {
    try {
      const deviceId = await AsyncStorage.getItem('deviceId');
      const deviceType = await AsyncStorage.getItem('deviceType');
      const appVersion = await AsyncStorage.getItem('app_version');
      
      return {
        deviceId: deviceId || 'unknown',
        deviceType: deviceType || 'unknown',
        appVersion: appVersion || 'unknown',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ 获取设备信息失败:', error);
      return { error: '获取失败' };
    }
  }

  // 检查是否应该跳过检测（避免频繁检测）
  public async shouldSkipDetection(appleId: string): Promise<boolean> {
    try {
      const lastDetectionKey = `last_detection_${appleId}`;
      const lastDetection = await AsyncStorage.getItem(lastDetectionKey);
      
      if (!lastDetection) {
        return false;
      }
      
      const lastTime = parseInt(lastDetection);
      const now = Date.now();
      const hoursSinceLastDetection = (now - lastTime) / (1000 * 60 * 60);
      
      // 如果距离上次检测不到1小时，跳过检测
      if (hoursSinceLastDetection < 1) {
        console.log('⏰ 距离上次检测不到1小时，跳过检测');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ 检查是否跳过检测失败:', error);
      return false;
    }
  }

  // 记录检测时间
  public async recordDetectionTime(appleId: string): Promise<void> {
    try {
      const lastDetectionKey = `last_detection_${appleId}`;
      await AsyncStorage.setItem(lastDetectionKey, Date.now().toString());
    } catch (error) {
      console.error('❌ 记录检测时间失败:', error);
    }
  }
}
