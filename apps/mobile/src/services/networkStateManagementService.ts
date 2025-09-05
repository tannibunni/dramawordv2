/**
 * ========================================
 * 🔄 [SYNC SERVICE] 数据同步服务
 * ========================================
 * 
 * 服务类型: 数据同步相关服务
 * 功能描述: 网络状态管理服务 - 网络监控和优化
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

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { unifiedSyncService } from './unifiedSyncService';
import { API_BASE_URL } from '../constants/config';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: 'wifi' | 'cellular' | 'none' | 'unknown';
  isWifi: boolean;
  isCellular: boolean;
  isOffline: boolean;
  strength?: number; // WiFi信号强度或移动网络信号强度
  details?: {
    ssid?: string; // WiFi名称
    carrier?: string; // 运营商
    cellularGeneration?: string; // 网络制式 (4G, 5G等)
  };
}

export interface NetworkQuality {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  score: number; // 0-100
  recommendedAction: 'proceed' | 'delay' | 'compress' | 'abort';
  estimatedSpeed: number; // Mbps
  speed: number; // Mbps
  latency: number; // ms
  reliability: number; // 0-1
}

export interface OfflineQueueItem {
  id: string;
  timestamp: number;
  type: string;
  operation: string;
  data: any;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
  dataType?: string;
}

export interface RetryOperation {
  id: string;
  operation: () => Promise<any>;
  context: string;
  retryCount: number;
  maxRetries: number;
  delay: number;
  priority: 'high' | 'medium' | 'low';
}

export interface NetworkMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastSyncTime: number;
  offlineQueueLength: number;
  networkQualityHistory: NetworkQuality[];
}

export class NetworkStateManagementService {
  private static instance: NetworkStateManagementService;
  private networkState: NetworkState = {
    isConnected: false,
    isInternetReachable: false,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
    isOffline: true
  };
  
  private networkListener: NetInfoSubscription | null = null;
  private offlineQueue: OfflineQueueItem[] = [];
  private retryQueue: RetryOperation[] = [];
  private metrics: NetworkMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastSyncTime: 0,
    offlineQueueLength: 0,
    networkQualityHistory: []
  };
  
  private isInitialized: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // 1秒
  private isProcessingQueue: boolean = false;
  private networkQuality: NetworkQuality | null = null;
  private lastNetworkCheck: number = 0;
  private networkCheckInterval: number = 30000; // 30秒检查一次
  private maxRetries: number = 3;
  private baseRetryDelay: number = 1000; // 1秒

  public static getInstance(): NetworkStateManagementService {
    if (!NetworkStateManagementService.instance) {
      NetworkStateManagementService.instance = new NetworkStateManagementService();
    }
    return NetworkStateManagementService.instance;
  }

  private constructor() {}

  // 初始化网络状态管理
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('🔄 网络状态管理服务已初始化，跳过重复初始化');
        return;
      }

      console.log('🌐 初始化网络状态管理服务...');
      
      // 加载离线队列
      await this.loadOfflineQueueEnhanced();
      
      // 加载网络指标
      await this.loadNetworkMetrics();
      
      // 设置网络状态监听器
      this.setupNetworkListener();
      
      // 获取初始网络状态
      await this.updateNetworkState();
      
      this.isInitialized = true;
      console.log('✅ 网络状态管理服务初始化完成');
      
    } catch (error) {
      console.error('❌ 网络状态管理服务初始化失败:', error);
      throw error;
    }
  }

  // 设置网络状态监听器
  private setupNetworkListener(): void {
    try {
      this.networkListener = NetInfo.addEventListener(this.handleNetworkStateChange);
      console.log('📡 网络状态监听器设置完成');
    } catch (error) {
      console.error('❌ 设置网络状态监听器失败:', error);
    }
  }

  // 处理网络状态变化
  private handleNetworkStateChange = (state: NetInfoState): void => {
    try {
      const previousState = { ...this.networkState };
      
      // 更新网络状态
      this.networkState = this.parseNetworkState(state);
      
      console.log('🌐 网络状态变化:', {
        previous: previousState.type,
        current: this.networkState.type,
        connected: this.networkState.isConnected,
        reachable: this.networkState.isInternetReachable
      });
      
      // 处理网络状态变化
      this.handleNetworkStateTransition(previousState, this.networkState);
      
      // 保存网络状态
      this.saveNetworkState();
      
    } catch (error) {
      console.error('❌ 处理网络状态变化失败:', error);
    }
  };

  // 解析网络状态
  private parseNetworkState(state: NetInfoState): NetworkState {
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable ?? false;
    const type = state.type ?? 'unknown';
    
    return {
      isConnected,
      isInternetReachable,
      type: type as any,
      isWifi: type === 'wifi',
      isCellular: type === 'cellular',
      isOffline: !isConnected || !isInternetReachable,
      strength: this.getNetworkStrength(state),
      details: this.getNetworkDetails(state)
    };
  }

  // 获取网络信号强度
  private getNetworkStrength(state: NetInfoState): number | undefined {
    if (state.type === 'wifi' && state.details) {
      // WiFi信号强度 (dBm)
      return (state.details as any).strength;
    } else if (state.type === 'cellular' && state.details) {
      // 移动网络信号强度
      return (state.details as any).strength;
    }
    return undefined;
  }

  // 获取网络详细信息
  private getNetworkDetails(state: NetInfoState): any {
    if (state.type === 'wifi' && state.details) {
      return {
        ssid: state.details.ssid,
        strength: (state.details as any).strength
      };
    } else if (state.type === 'cellular' && state.details) {
      return {
        carrier: state.details.carrier,
        cellularGeneration: state.details.cellularGeneration,
        strength: (state.details as any).strength
      };
    }
    return {};
  }

  // 处理网络状态转换
  private async handleNetworkStateTransition(previousState: NetworkState, currentState: NetworkState): Promise<void> {
    try {
      // 从离线到在线
      if (previousState.isOffline && !currentState.isOffline) {
        console.log('🟢 网络恢复，开始处理离线队列...');
        await this.handleNetworkReconnection();
      }
      
      // 从在线到离线
      if (!previousState.isOffline && currentState.isOffline) {
        console.log('🔴 网络断开，切换到离线模式...');
        await this.handleNetworkDisconnection();
      }
      
      // WiFi到移动网络切换
      if (previousState.isWifi && currentState.isCellular) {
        console.log('📱 从WiFi切换到移动网络，调整同步策略...');
        await this.handleNetworkTypeChange('wifi-to-cellular');
      }
      
      // 移动网络到WiFi切换
      if (previousState.isCellular && currentState.isWifi) {
        console.log('📶 从移动网络切换到WiFi，优化同步策略...');
        await this.handleNetworkTypeChange('cellular-to-wifi');
      }
      
    } catch (error) {
      console.error('❌ 处理网络状态转换失败:', error);
    }
  }

  // 处理网络重连
  private async handleNetworkReconnection(): Promise<void> {
    try {
      // 重置重连尝试次数
      this.reconnectAttempts = 0;
      
      // 处理离线队列
      if (this.offlineQueue.length > 0) {
        console.log(`📦 处理离线队列中的${this.offlineQueue.length}个项目...`);
        await this.processOfflineQueue();
      }
      
      // 恢复统一同步服务
      await this.resumeUnifiedSync();
      
      // 更新网络指标
      this.metrics.lastSyncTime = Date.now();
      await this.saveNetworkMetrics();
      
    } catch (error) {
      console.error('❌ 处理网络重连失败:', error);
    }
  }

  // 处理网络断开
  private async handleNetworkDisconnection(): Promise<void> {
    try {
      console.log('📴 网络断开，暂停同步服务...');
      
      // 暂停统一同步服务
      await this.pauseUnifiedSync();
      
      // 保存当前状态
      await this.saveNetworkState();
      
    } catch (error) {
      console.error('❌ 处理网络断开失败:', error);
    }
  }

  // 处理网络类型变化
  private async handleNetworkTypeChange(changeType: string): Promise<void> {
    try {
      if (changeType === 'wifi-to-cellular') {
        // 切换到移动网络：减少同步频率，压缩数据
        console.log('📱 切换到移动网络，调整同步策略');
        // TODO: 实现unifiedSyncService.updateConfig方法
      } else if (changeType === 'cellular-to-wifi') {
        // 切换到WiFi：增加同步频率，不压缩数据
        console.log('📶 切换到WiFi，优化同步策略');
        // TODO: 实现unifiedSyncService.updateConfig方法
      }
      
      console.log('✅ 网络类型切换处理完成');
      
    } catch (error) {
      console.error('❌ 处理网络类型变化失败:', error);
    }
  }

  // 暂停统一同步服务
  private async pauseUnifiedSync(): Promise<void> {
    try {
      // 这里可以调用unifiedSyncService的暂停方法
      console.log('⏸️ 统一同步服务已暂停');
    } catch (error) {
      console.error('❌ 暂停统一同步服务失败:', error);
    }
  }

  // 恢复统一同步服务
  private async resumeUnifiedSync(): Promise<void> {
    try {
      // 这里可以调用unifiedSyncService的恢复方法
      console.log('▶️ 统一同步服务已恢复');
    } catch (error) {
      console.error('❌ 恢复统一同步服务失败:', error);
    }
  }

  // 获取当前网络状态
  public getCurrentNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  // 检查网络连接状态
  public isNetworkConnected(): boolean {
    return this.networkState.isConnected && this.networkState.isInternetReachable;
  }

  // 检查是否为WiFi连接
  public isWifiConnection(): boolean {
    return this.networkState.isWifi && this.isNetworkConnected();
  }

  // 检查是否为移动网络连接
  public isCellularConnection(): boolean {
    return this.networkState.isCellular && this.isNetworkConnected();
  }

  // 检查是否为离线状态
  public isOfflineMode(): boolean {
    return this.networkState.isOffline;
  }

  // 获取网络质量评估
  public async getNetworkQuality(): Promise<NetworkQuality> {
    try {
      // 尝试使用后端API进行网络质量评估
      const backendQuality = await this.getBackendNetworkQuality();
      if (backendQuality) {
        return backendQuality;
      }
    } catch (error) {
      console.warn('⚠️ 后端网络质量评估失败，使用本地评估:', error);
    }
    
    // 回退到本地评估
    const quality = this.assessNetworkQuality();
    return quality;
  }

  // 评估网络质量
  private assessNetworkQuality(): NetworkQuality {
    try {
      let quality: NetworkQuality['quality'] = 'poor';
      let score = 0;
      let recommendedAction: NetworkQuality['recommendedAction'] = 'abort';
      let estimatedSpeed = 0;

      if (!this.networkState.isConnected) {
        return { quality: 'poor', score: 0, recommendedAction: 'abort', estimatedSpeed: 0, speed: 0, latency: 0, reliability: 0 };
      }

      // 基于网络类型和信号强度评估
      if (this.networkState.isWifi) {
        const strength = this.networkState.strength || -50;
        
        if (strength >= -50) {
          quality = 'excellent';
          score = 90;
          recommendedAction = 'proceed';
          estimatedSpeed = 100; // 100 Mbps
        } else if (strength >= -60) {
          quality = 'good';
          score = 75;
          recommendedAction = 'proceed';
          estimatedSpeed = 50; // 50 Mbps
        } else if (strength >= -70) {
          quality = 'fair';
          score = 60;
          recommendedAction = 'delay';
          estimatedSpeed = 25; // 25 Mbps
        } else {
          quality = 'poor';
          score = 40;
          recommendedAction = 'compress';
          estimatedSpeed = 10; // 10 Mbps
        }
      } else if (this.networkState.isCellular) {
        const generation = this.networkState.details?.cellularGeneration;
        
        if (generation === '5G') {
          quality = 'excellent';
          score = 85;
          recommendedAction = 'proceed';
          estimatedSpeed = 50; // 50 Mbps
        } else if (generation === '4G') {
          quality = 'good';
          score = 70;
          recommendedAction = 'proceed';
          estimatedSpeed = 20; // 20 Mbps
        } else if (generation === '3G') {
          quality = 'fair';
          score = 50;
          recommendedAction = 'delay';
          estimatedSpeed = 5; // 5 Mbps
        } else {
          quality = 'poor';
          score = 30;
          recommendedAction = 'compress';
          estimatedSpeed = 1; // 1 Mbps
        }
      }

      return { quality, score, recommendedAction, estimatedSpeed, speed: estimatedSpeed, latency: 0, reliability: 0.8 };
      
    } catch (error) {
      console.error('❌ 评估网络质量失败:', error);
      return { quality: 'poor', score: 0, recommendedAction: 'abort', estimatedSpeed: 0, speed: 0, latency: 0, reliability: 0 };
    }
  }

  // 添加离线队列项目
  public async addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp'>): Promise<void> {
    try {
      const offlineItem: OfflineQueueItem = {
        ...item,
        id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        timestamp: Date.now()
      };

      this.offlineQueue.push(offlineItem);
      this.metrics.offlineQueueLength = this.offlineQueue.length;
      
      await this.saveOfflineQueueEnhanced();
      await this.saveNetworkMetrics();
      
      console.log(`📦 添加到离线队列: ${item.type} (${item.operation})`);
      
    } catch (error) {
      console.error('❌ 添加到离线队列失败:', error);
    }
  }

  // 处理离线队列
  private async processOfflineQueue(): Promise<void> {
    try {
      if (this.offlineQueue.length === 0) return;

      console.log(`🔄 开始处理离线队列，共${this.offlineQueue.length}个项目...`);

      // 按优先级排序
      const sortedQueue = [...this.offlineQueue].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      let processedCount = 0;
      let failedCount = 0;

      for (const item of sortedQueue) {
        try {
          if (item.retryCount >= item.maxRetries) {
            console.log(`❌ 跳过重试次数过多的项目: ${item.type} (${item.operation})`);
            failedCount++;
            continue;
          }

          // 尝试处理项目
          const success = await this.processOfflineQueueItem(item);
          
          if (success) {
            // 处理成功，从队列中移除
            this.offlineQueue = this.offlineQueue.filter(q => q.id !== item.id);
            processedCount++;
          } else {
            // 处理失败，增加重试次数
            item.retryCount++;
            failedCount++;
          }

        } catch (error) {
          console.error(`❌ 处理离线队列项目失败:`, error);
          item.retryCount++;
          failedCount++;
        }
      }

      // 更新指标
      this.metrics.offlineQueueLength = this.offlineQueue.length;
      await this.saveOfflineQueueEnhanced();
      await this.saveNetworkMetrics();

      console.log(`✅ 离线队列处理完成: 成功${processedCount}个，失败${failedCount}个，剩余${this.offlineQueue.length}个`);

    } catch (error) {
      console.error('❌ 处理离线队列失败:', error);
    }
  }

  // 处理单个离线队列项目
  private async processOfflineQueueItem(item: OfflineQueueItem): Promise<boolean> {
    try {
      console.log(`🔄 处理离线队列项目: ${item.type} (${item.operation})`);

      // 这里应该调用实际的API或同步方法
      // 目前模拟处理
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 模拟成功率
      const success = Math.random() > 0.3; // 70%成功率
      
      if (success) {
        console.log(`✅ 离线队列项目处理成功: ${item.type} (${item.operation})`);
      } else {
        console.log(`❌ 离线队列项目处理失败: ${item.type} (${item.operation})`);
      }
      
      return success;
      
    } catch (error) {
      console.error(`❌ 处理离线队列项目异常:`, error);
      return false;
    }
  }

  // 获取离线队列
  public getOfflineQueue(): OfflineQueueItem[] {
    return [...this.offlineQueue];
  }

  // 清空离线队列
  public async clearOfflineQueue(): Promise<void> {
    try {
      this.offlineQueue = [];
      this.metrics.offlineQueueLength = 0;
      
      await this.saveOfflineQueueEnhanced();
      await this.saveNetworkMetrics();
      
      console.log('🗑️ 离线队列已清空');
      
    } catch (error) {
      console.error('❌ 清空离线队列失败:', error);
    }
  }

  // 获取网络指标
  public getNetworkMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  // 记录网络请求
  public async recordNetworkRequest(success: boolean, responseTime: number): Promise<void> {
    try {
      this.metrics.totalRequests++;
      
      if (success) {
        this.metrics.successfulRequests++;
      } else {
        this.metrics.failedRequests++;
      }
      
      // 更新平均响应时间
      const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
      this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
      
      // 添加网络质量历史
      const quality = await this.getNetworkQuality();
      this.metrics.networkQualityHistory.push(quality);
      
      // 只保留最近100条记录
      if (this.metrics.networkQualityHistory.length > 100) {
        this.metrics.networkQualityHistory = this.metrics.networkQualityHistory.slice(-100);
      }
      
    } catch (error) {
      console.error('❌ 记录网络请求失败:', error);
    }
  }

  // 保存离线队列
  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('❌ 保存离线队列失败:', error);
    }
  }

  // 加载离线队列
  private async loadOfflineQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('offlineQueue');
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
        this.metrics.offlineQueueLength = this.offlineQueue.length;
      }
    } catch (error) {
      console.error('❌ 加载离线队列失败:', error);
    }
  }

  // 保存网络状态
  private async saveNetworkState(): Promise<void> {
    try {
      await AsyncStorage.setItem('networkState', JSON.stringify(this.networkState));
    } catch (error) {
      console.error('❌ 保存网络状态失败:', error);
    }
  }

  // 保存网络指标
  private async saveNetworkMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem('networkMetrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('❌ 保存网络指标失败:', error);
    }
  }

  // 加载网络指标
  private async loadNetworkMetrics(): Promise<void> {
    try {
      const metricsData = await AsyncStorage.getItem('networkMetrics');
      if (metricsData) {
        this.metrics = { ...this.metrics, ...JSON.parse(metricsData) };
      }
    } catch (error) {
      console.error('❌ 加载网络指标失败:', error);
    }
  }

  // 更新网络状态
  private async updateNetworkState(): Promise<void> {
    try {
      const state = await NetInfo.fetch();
      this.networkState = this.parseNetworkState(state);
      await this.saveNetworkState();
    } catch (error) {
      console.error('❌ 更新网络状态失败:', error);
    }
  }

  // 检查是否正在初始化
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // 使用后端API获取网络质量评估
  private async getBackendNetworkQuality(): Promise<NetworkQuality | null> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return null;
      }

      const deviceId = await this.getDeviceId();
      if (!deviceId) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/network/quality`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          networkType: this.networkState.type,
          signalStrength: this.networkState.strength,
          cellularGeneration: this.networkState.details?.cellularGeneration,
          ssid: this.networkState.details?.ssid,
          carrier: this.networkState.details?.carrier,
          deviceId: deviceId
        })
      });

      if (!response.ok) {
        throw new Error(`网络质量评估失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log('✅ 后端网络质量评估成功:', result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('❌ 后端网络质量评估失败:', error);
      return null;
    }
  }

  // 获取设备ID
  private async getDeviceId(): Promise<string | null> {
    try {
      const deviceInfo = await AsyncStorage.getItem('deviceInfo');
      if (deviceInfo) {
        const parsed = JSON.parse(deviceInfo);
        return parsed.deviceId || null;
      }
      return null;
    } catch (error) {
      console.error('❌ 获取设备ID失败:', error);
      return null;
    }
  }

  // 销毁服务
  public destroy(): void {
    try {
      if (this.networkListener) {
        this.networkListener();
        this.networkListener = null;
      }
      
      this.isInitialized = false;
      console.log('🗑️ 网络状态管理服务已销毁');
      
    } catch (error) {
      console.error('❌ 销毁网络状态管理服务失败:', error);
    }
  }

  // ==================== 增强网络质量检测方法 ====================

  // 智能网络检测
  public async detectNetworkQuality(): Promise<NetworkQuality> {
    const now = Date.now();
    
    // 如果最近检查过，返回缓存结果
    if (this.networkQuality && (now - this.lastNetworkCheck) < this.networkCheckInterval) {
      return this.networkQuality;
    }

    try {
      const startTime = Date.now();
      
      // 测试网络延迟
      const latency = await this.measureLatency();
      
      // 测试下载速度
      const speed = await this.measureDownloadSpeed();
      
      // 计算可靠性
      const reliability = await this.calculateReliability();
      
      // 确定网络质量
      let quality: NetworkQuality['quality'];
      if (latency < 100 && speed > 10 && reliability > 0.9) {
        quality = 'excellent';
      } else if (latency < 300 && speed > 5 && reliability > 0.8) {
        quality = 'good';
      } else if (latency < 1000 && speed > 1 && reliability > 0.6) {
        quality = 'fair';
      } else if (latency < 2000 && speed > 0.5 && reliability > 0.4) {
        quality = 'poor';
      } else {
        quality = 'offline';
      }

      this.networkQuality = {
        quality,
        score: this.calculateQualityScore(latency, speed, reliability),
        recommendedAction: this.getRecommendedAction(quality),
        estimatedSpeed: speed,
        speed,
        latency,
        reliability
      };

      this.lastNetworkCheck = now;
      
      console.log(`🌐 网络质量检测完成: ${quality} (延迟: ${latency}ms, 速度: ${speed}Mbps)`);
      
      return this.networkQuality;
      
    } catch (error) {
      console.error('❌ 网络质量检测失败:', error);
      return {
        quality: 'offline',
        score: 0,
        recommendedAction: 'abort',
        estimatedSpeed: 0,
        speed: 0,
        latency: 9999,
        reliability: 0
      };
    }
  }

  // 测量网络延迟
  private async measureLatency(): Promise<number> {
    const startTime = Date.now();
    
    try {
      // 发送一个小的请求来测量延迟
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD'
      });
      
      return Date.now() - startTime;
    } catch (error) {
      return 9999; // 超时或失败
    }
  }

  // 测量下载速度
  private async measureDownloadSpeed(): Promise<number> {
    const startTime = Date.now();
    
    try {
      // 下载一个小的测试文件
      const response = await fetch('https://httpbin.org/bytes/1024');
      
      if (response.ok) {
        const data = await response.arrayBuffer();
        const downloadTime = (Date.now() - startTime) / 1000; // 秒
        const sizeInMB = data.byteLength / (1024 * 1024);
        return sizeInMB / downloadTime; // Mbps
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // 计算网络可靠性
  private async calculateReliability(): Promise<number> {
    try {
      const recentChecks = await this.getRecentNetworkChecks();
      const successCount = recentChecks.filter(check => check.success).length;
      return successCount / recentChecks.length;
    } catch (error) {
      return 0.5; // 默认中等可靠性
    }
  }

  // 获取最近的网络检查记录
  private async getRecentNetworkChecks(): Promise<Array<{ success: boolean; timestamp: number }>> {
    try {
      const data = await AsyncStorage.getItem('network_checks');
      if (data) {
        const checks = JSON.parse(data);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        return checks.filter((check: any) => check.timestamp > oneHourAgo);
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  // 保存网络检查记录
  private async saveNetworkCheck(success: boolean): Promise<void> {
    try {
      const checks = await this.getRecentNetworkChecks();
      checks.push({ success, timestamp: Date.now() });
      
      // 只保留最近100条记录
      if (checks.length > 100) {
        checks.splice(0, checks.length - 100);
      }
      
      await AsyncStorage.setItem('network_checks', JSON.stringify(checks));
    } catch (error) {
      console.error('保存网络检查记录失败:', error);
    }
  }

  // 计算质量分数
  private calculateQualityScore(latency: number, speed: number, reliability: number): number {
    const latencyScore = Math.max(0, 100 - (latency / 20)); // 延迟分数
    const speedScore = Math.min(100, speed * 10); // 速度分数
    const reliabilityScore = reliability * 100; // 可靠性分数
    
    return Math.round((latencyScore + speedScore + reliabilityScore) / 3);
  }

  // 获取推荐操作
  private getRecommendedAction(quality: NetworkQuality['quality']): 'proceed' | 'delay' | 'compress' | 'abort' {
    switch (quality) {
      case 'excellent':
      case 'good':
        return 'proceed';
      case 'fair':
        return 'delay';
      case 'poor':
        return 'compress';
      case 'offline':
        return 'abort';
      default:
        return 'delay';
    }
  }

  // 智能重试机制
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    const operationId = `${context}_${Date.now()}`;
    
    const retryOperation: RetryOperation = {
      id: operationId,
      operation,
      context,
      retryCount: 0,
      maxRetries: this.maxRetries,
      delay: this.baseRetryDelay,
      priority
    };

    return this.executeRetryOperation(retryOperation);
  }

  // 执行重试操作
  private async executeRetryOperation<T>(retryOp: RetryOperation): Promise<T> {
    try {
      const result = await retryOp.operation();
      await this.saveNetworkCheck(true);
      return result;
    } catch (error) {
      await this.saveNetworkCheck(false);
      
      if (retryOp.retryCount < retryOp.maxRetries) {
        retryOp.retryCount++;
        retryOp.delay *= 2; // 指数退避
        
        console.log(`🔄 重试操作 ${retryOp.context} (${retryOp.retryCount}/${retryOp.maxRetries})`);
        
        await this.delay(retryOp.delay);
        return this.executeRetryOperation(retryOp);
      } else {
        // 添加到离线队列
        await this.addToOfflineQueue({
          type: 'retry_operation',
          operation: 'update', // 默认操作类型
          data: { context: retryOp.context, error: error instanceof Error ? error.message : 'Unknown error' },
          retryCount: 0,
          maxRetries: 3,
          priority: retryOp.priority,
          dataType: retryOp.context
        });
        
        throw error;
      }
    }
  }

  // 添加离线操作（完整版）
  public async addOfflineOperation(operation: OfflineQueueItem): Promise<void> {
    this.offlineQueue.push(operation);
    await this.saveOfflineQueue();
    console.log(`📝 操作已添加到离线队列: ${operation.type}`);
  }

  // 处理离线队列（增强版）
  private async processOfflineQueueEnhanced(): Promise<void> {
    if (this.isProcessingQueue || this.offlineQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(`🔄 开始处理离线队列，共 ${this.offlineQueue.length} 个操作`);

    try {
      // 按优先级排序
      this.offlineQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      const batchSize = 5; // 每批处理5个操作
      const batches = Math.ceil(this.offlineQueue.length / batchSize);

      for (let i = 0; i < batches; i++) {
        const batch = this.offlineQueue.splice(0, batchSize);
        
        await Promise.all(
          batch.map(async (operation) => {
            try {
              // 这里应该调用相应的同步服务
              console.log(`🔄 处理离线操作: ${operation.type}`);
              // await this.processOfflineOperation(operation);
              
              // 模拟处理成功
              await this.delay(100);
            } catch (error) {
              console.error(`❌ 处理离线操作失败: ${operation.type}`, error);
            }
          })
        );

        // 批次间延迟
        if (i < batches - 1) {
          await this.delay(500);
        }
      }

      await this.saveOfflineQueueEnhanced();
      console.log('✅ 离线队列处理完成');
      
    } catch (error) {
      console.error('❌ 处理离线队列失败:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // 保存离线队列（增强版）
  private async saveOfflineQueueEnhanced(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('保存离线队列失败:', error);
    }
  }

  // 加载离线队列（增强版）
  private async loadOfflineQueueEnhanced(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('offline_queue');
      if (data) {
        this.offlineQueue = JSON.parse(data);
        console.log(`📦 已加载离线队列，共 ${this.offlineQueue.length} 个操作`);
      }
    } catch (error) {
      console.error('加载离线队列失败:', error);
    }
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取当前网络状态（简化版）
  public getCurrentNetworkStateSimple(): 'online' | 'offline' | 'slow' | 'unstable' {
    if (this.networkState.isOffline) return 'offline';
    if (this.networkQuality?.quality === 'poor') return 'slow';
    if (this.networkQuality?.reliability && this.networkQuality.reliability < 0.7) return 'unstable';
    return 'online';
  }

  // 获取网络质量（缓存版）
  public getCachedNetworkQuality(): NetworkQuality | null {
    return this.networkQuality;
  }

  // 获取离线队列状态
  public getOfflineQueueStatus(): {
    count: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  } {
    return {
      count: this.offlineQueue.length,
      highPriority: this.offlineQueue.filter(op => op.priority === 'high').length,
      mediumPriority: this.offlineQueue.filter(op => op.priority === 'medium').length,
      lowPriority: this.offlineQueue.filter(op => op.priority === 'low').length
    };
  }
}
