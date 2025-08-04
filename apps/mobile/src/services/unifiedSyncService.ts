import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../constants/config';
import { experienceManager } from './experienceManager';
import { guestModeService } from './guestModeService';
import { tokenValidationService } from './tokenValidationService';

export interface SyncData {
  type: 'experience' | 'vocabulary' | 'progress' | 'achievements' | 'userStats' | 'learningRecords' | 'searchHistory' | 'userSettings' | 'badges' | 'wordbooks' | 'shows';
  data: any;
  timestamp: number;
  userId: string;
  operation: 'create' | 'update' | 'delete';
  priority: 'high' | 'medium' | 'low';
  // 添加经验值相关字段以保持对齐
  xpGained?: number;
  leveledUp?: boolean;
  level?: number;
}

export interface SyncConfig {
  wifiSyncInterval: number;
  mobileSyncInterval: number;
  offlineSyncInterval: number;
  maxRetryAttempts: number;
  batchSize: number;
  enableIncrementalSync: boolean;
  enableOfflineFirst: boolean;
  enableRealTimeSync: boolean;
}

export interface SyncStatus {
  queueLength: number;
  isSyncing: boolean;
  lastSyncTime: number;
  networkType: string;
  isUserActive: boolean;
  retryCount: number;
  syncMode: 'offline' | 'online';
  pendingOperations: number;
  syncProgress: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  conflicts?: any[];
  errors?: string[];
}

export class UnifiedSyncService {
  private static instance: UnifiedSyncService;
  private syncQueue: SyncData[] = [];
  private isSyncing: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private retryCount: number = 0;
  private lastSyncTime: number = 0;
  private isUserActive: boolean = false;
  private networkType: string = 'unknown';

  private pendingOperations: Set<string> = new Set();
  private syncProgress: number = 0;

  // 统一配置
  private config: SyncConfig = {
    wifiSyncInterval: 2 * 60 * 1000, // 2分钟
    mobileSyncInterval: 5 * 60 * 1000, // 5分钟
    offlineSyncInterval: 10 * 60 * 1000, // 10分钟
    maxRetryAttempts: 5,
    batchSize: 20,
    enableIncrementalSync: true,
    enableOfflineFirst: true,
    enableRealTimeSync: true
  };

  private constructor() {
    this.initializeNetworkListener();
    this.initializeActivityListener();
    this.loadSyncQueue();
  }

  public static getInstance(): UnifiedSyncService {
    if (!UnifiedSyncService.instance) {
      UnifiedSyncService.instance = new UnifiedSyncService();
    }
    return UnifiedSyncService.instance;
  }

  // 初始化网络监听
  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = this.networkType === 'none';
      this.networkType = state.type;
      
      if (wasOffline && state.isConnected) {
        console.log('🌐 网络恢复，开始同步待同步数据');
        this.syncPendingData();
      }
      
      this.adjustSyncStrategy();
    });
  }

  // 初始化用户活跃度监听
  private initializeActivityListener() {
    const handleUserActivity = () => {
      this.isUserActive = true;
      this.resetActivityTimer();
      
      if (this.syncQueue.length > 0 && this.networkType !== 'none') {
        this.syncPendingData();
      }
    };

    // React Native环境中不监听DOM事件，改为定期检查
    // 在React Native中，用户活跃度通过其他方式检测
    console.log('📱 React Native环境，跳过DOM事件监听');
  }

  // 重置活跃度计时器
  private resetActivityTimer() {
    setTimeout(() => {
      this.isUserActive = false;
    }, 3 * 60 * 1000);
  }

  // 根据网络状态调整同步策略
  private adjustSyncStrategy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    const interval = this.getCurrentSyncInterval();
    this.syncTimer = setInterval(() => {
      this.performPeriodicSync();
    }, interval);
  }

  // 获取当前同步间隔
  private getCurrentSyncInterval(): number {
    if (!this.isUserActive) {
      return this.config.offlineSyncInterval;
    }

    switch (this.networkType) {
      case 'wifi':
        return this.config.wifiSyncInterval;
      case 'cellular':
        return this.config.mobileSyncInterval;
      default:
        return this.config.offlineSyncInterval;
    }
  }

  // 添加数据到同步队列
  public async addToSyncQueue(data: Omit<SyncData, 'timestamp'>): Promise<void> {
    // 检查是否为游客模式
    const isGuestMode = await guestModeService.isGuestMode();
    if (isGuestMode) {
      console.log('👤 游客模式，数据仅保存本地，不加入同步队列');
      return;
    }

    const syncData: SyncData = {
      ...data,
      timestamp: Date.now()
    };

    this.syncQueue.push(syncData);
    this.pendingOperations.add(`${data.type}-${data.operation}-${Date.now()}`);
    this.persistSyncQueue();

    if (this.isImportantOperation(data.type)) {
      this.syncPendingData();
    }

    console.log(`📝 添加同步数据: ${data.type} (${data.operation})`);
  }

  // 判断是否为重要操作
  private isImportantOperation(type: string): boolean {
    // 重要操作类型，需要立即同步
    const importantTypes = ['experience', 'userStats', 'vocabulary', 'wordbooks', 'shows'];
    return importantTypes.includes(type);
  }

  // 同步待同步数据
  public async syncPendingData(): Promise<SyncResult> {
    // 检查是否为游客模式
    const isGuestMode = await guestModeService.isGuestMode();
    if (isGuestMode) {
      console.log('👤 游客模式，跳过云端同步，数据仅保存本地');
      return {
        success: true,
        message: '游客模式，数据仅保存本地'
      };
    }

    if (this.isSyncing || this.syncQueue.length === 0) {
      return {
        success: true,
        message: '无待同步数据或正在同步中'
      };
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      console.log('📱 离线模式，数据已保存到本地队列');
      return {
        success: true,
        message: '离线模式，数据已保存到本地队列'
      };
    }

    this.isSyncing = true;
    this.retryCount = 0;
    this.syncProgress = 0;

    try {
      const result = await this.performUnifiedSync();
      this.lastSyncTime = Date.now();
      this.syncProgress = 100;
      return result;
    } catch (error) {
      console.error('❌ 同步失败:', error);
      this.handleSyncError();
      return {
        success: false,
        message: '同步失败',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // 执行统一同步
  private async performUnifiedSync(): Promise<SyncResult> {
    const batch = this.syncQueue.splice(0, this.config.batchSize);
    
    if (batch.length === 0) {
      return {
        success: true,
        message: '无数据需要同步'
      };
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('未找到认证token');
    }

    const groupedData = this.groupDataByType(batch);
    const conflicts: any[] = [];
    const errors: string[] = [];
    
    let processedCount = 0;
    
    for (const [dataType, dataItems] of Object.entries(groupedData)) {
      try {
        const result = await this.syncDataType(dataType, dataItems, token);
        if (result.conflicts) {
          conflicts.push(...result.conflicts);
        }
        if (result.errors) {
          errors.push(...result.errors);
        }
        
        processedCount += dataItems.length;
        this.syncProgress = (processedCount / batch.length) * 100;
      } catch (error) {
        console.error(`同步数据类型 ${dataType} 失败:`, error);
        errors.push(`同步 ${dataType} 失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // 将失败的数据重新加入队列
        this.syncQueue.unshift(...dataItems);
      }
    }

    this.persistSyncQueue();
    console.log(`✅ 统一同步完成: ${batch.length} 条数据`);

    return {
      success: errors.length === 0,
      message: `同步完成: ${batch.length} 条数据`,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // 按数据类型分组
  private groupDataByType(batch: SyncData[]): Record<string, SyncData[]> {
    const grouped: Record<string, SyncData[]> = {};
    
    batch.forEach(item => {
      if (!grouped[item.type]) {
        grouped[item.type] = [];
      }
      grouped[item.type].push(item);
    });
    
    return grouped;
  }

  // 同步特定数据类型
  private async syncDataType(dataType: string, dataItems: SyncData[], token: string): Promise<{ conflicts?: any[], errors?: string[] }> {
    console.log(`🔄 同步数据类型: ${dataType} (${dataItems.length} 个变更) - 仅上传模式`);
    
    try {
      // 直接上传，无需冲突检测
      await this.syncDataWithoutConflicts(dataItems, token);
      console.log(`✅ 数据类型 ${dataType} 同步完成（仅上传）`);
      return { conflicts: [], errors: [] };
    } catch (error) {
      return { 
        conflicts: [], 
        errors: [`同步 ${dataType} 失败: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }



  // 无冲突同步 - 遵循多邻国原则：只上传，不更新本地版本号
  private async syncDataWithoutConflicts(dataItems: SyncData[], token: string): Promise<void> {
    try {
      // 添加数据完整性检查
      const validatedData = dataItems.filter(item => this.validateSyncData(item));
      
      if (validatedData.length === 0) {
        console.log('⚠️ 没有有效数据需要同步');
        return;
      }

      console.log(`📤 准备同步 ${validatedData.length} 条数据`);

      const response = await fetch(`${API_BASE_URL}/users/batch-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: validatedData,
          timestamp: Date.now(),
          // 添加同步策略标识
          syncStrategy: 'local-first',
          deviceId: await this.getDeviceId()
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // 处理401未授权错误
        if (response.status === 401) {
          console.warn('⚠️ Token验证失败，清除无效token并触发重新认证');
          await tokenValidationService.clearInvalidToken();
          tokenValidationService.triggerReauth();
          throw new Error('Token验证失败，请重新登录');
        }
        
        throw new Error(`同步失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '同步失败');
      }

      // 遵循多邻国原则：不更新本地服务器版本号，避免影响后续冲突检测
      // 本地数据始终是权威的，不需要跟踪服务器版本
      console.log(`✅ 数据类型同步完成（仅上传，不更新版本号）`);
      
      // 记录同步成功的数据
      this.logSyncSuccess(validatedData);
      
    } catch (error) {
      console.error(`❌ 同步失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // 验证同步数据
  private validateSyncData(data: SyncData): boolean {
    try {
      // 基本字段验证
      if (!data.type || !data.data || !data.userId || !data.operation) {
        console.warn(`⚠️ 跳过无效同步数据: 缺少必需字段`, data);
        return false;
      }

      // 时间戳验证
      if (!data.timestamp || typeof data.timestamp !== 'number' || data.timestamp <= 0) {
        console.warn(`⚠️ 跳过无效同步数据: 无效时间戳`, data);
        return false;
      }

      // 数据类型特定验证
      switch (data.type) {
        case 'vocabulary':
          return this.validateVocabularyData(data.data);
        case 'learningRecords':
          return this.validateLearningRecordsData(data.data);
        case 'experience':
          return this.validateExperienceData(data.data);
        case 'userStats':
          return this.validateUserStatsData(data.data);
        case 'badges':
          return this.validateBadgesData(data.data);
        case 'wordbooks':
          return this.validateWordbooksData(data.data);
        case 'shows':
          return this.validateShowsData(data.data);
        case 'searchHistory':
          return this.validateSearchHistoryData(data.data);
        case 'userSettings':
          return this.validateUserSettingsData(data.data);
        default:
          console.warn(`⚠️ 未知数据类型: ${data.type}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ 数据验证异常: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  // 验证词汇数据
  private validateVocabularyData(data: any): boolean {
    return data && typeof data === 'object' && 
           (Array.isArray(data) ? data.length > 0 : true);
  }

  // 验证学习记录数据
  private validateLearningRecordsData(data: any): boolean {
    return data && Array.isArray(data) && data.length > 0 &&
           data.every(record => record && typeof record === 'object');
  }

  // 验证经验值数据
  private validateExperienceData(data: any): boolean {
    return data && typeof data === 'object' && 
           typeof data.experience === 'number' && data.experience >= 0;
  }

  // 验证用户统计数据
  private validateUserStatsData(data: any): boolean {
    return data && typeof data === 'object' && 
           typeof data.experience === 'number';
  }

  // 验证徽章数据
  private validateBadgesData(data: any): boolean {
    return data && Array.isArray(data) && 
           data.every(badge => badge && typeof badge === 'object');
  }

  // 验证单词本数据
  private validateWordbooksData(data: any): boolean {
    return data && Array.isArray(data) && 
           data.every(wordbook => wordbook && typeof wordbook === 'object');
  }

  // 验证剧单数据
  private validateShowsData(data: any): boolean {
    return data && Array.isArray(data) && 
           data.every(show => show && typeof show === 'object');
  }

  // 验证搜索历史数据
  private validateSearchHistoryData(data: any): boolean {
    return data && Array.isArray(data) && 
           data.every(history => history && typeof history === 'object');
  }

  // 验证用户设置数据
  private validateUserSettingsData(data: any): boolean {
    return data && typeof data === 'object';
  }

  // 获取设备ID
  private async getDeviceId(): Promise<string> {
    try {
      const deviceId = await AsyncStorage.getItem('deviceId');
      if (deviceId) return deviceId;
      
      // 生成新的设备ID
      const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('deviceId', newDeviceId);
      return newDeviceId;
    } catch (error) {
      console.warn('⚠️ 获取设备ID失败，使用默认值');
      return 'unknown_device';
    }
  }

  // 记录同步成功
  private logSyncSuccess(dataItems: SyncData[]): void {
    const dataTypeCounts = dataItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊 同步成功统计:', dataTypeCounts);
    
    // 更新最后同步时间
    this.lastSyncTime = Date.now();
  }

  // 处理同步错误
  private handleSyncError(): void {
    this.retryCount++;
    
    if (this.retryCount < this.config.maxRetryAttempts) {
      const delay = Math.pow(2, this.retryCount) * 1000;
      console.log(`🔄 ${this.retryCount}/${this.config.maxRetryAttempts} 重试同步，延迟 ${delay}ms`);
      
      setTimeout(() => {
        this.syncPendingData();
      }, delay);
    } else {
      console.warn('⚠️ 达到最大重试次数，数据将稍后重试');
    }
  }

  // 执行定期同步
  private async performPeriodicSync(): Promise<void> {
    if (this.syncQueue.length > 0) {
      await this.syncPendingData();
    }
  }

  // 获取认证token
  private async getAuthToken(): Promise<string | null> {
    try {
      // 首先尝试从authToken获取（统一存储方式）
      const authToken = await AsyncStorage.getItem('authToken');
      if (authToken) {
        // 验证token有效性
        const validation = await tokenValidationService.validateToken(authToken);
        if (validation.isValid) {
          return authToken;
        } else {
          console.warn('⚠️ authToken无效:', validation.error);
          // 清除无效token
          await tokenValidationService.clearInvalidToken();
          // 触发重新认证
          tokenValidationService.triggerReauth();
          return null;
        }
      }
      
      // 兼容性：从userData获取
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed.token) {
          // 验证token有效性
          const validation = await tokenValidationService.validateToken(parsed.token);
          if (validation.isValid) {
            return parsed.token;
          } else {
            console.warn('⚠️ userData.token无效:', validation.error);
            // 清除无效token
            await tokenValidationService.clearInvalidToken();
            // 触发重新认证
            tokenValidationService.triggerReauth();
            return null;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('获取认证token失败:', error);
      return null;
    }
  }



  // 持久化同步队列
  private async persistSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('unifiedSyncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('持久化同步队列失败:', error);
    }
  }

  // 加载同步队列
  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('unifiedSyncQueue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('加载同步队列失败:', error);
    }
  }

  // 获取同步状态
  public getSyncStatus(): SyncStatus {
    return {
      queueLength: this.syncQueue.length,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      networkType: this.networkType,
      isUserActive: this.isUserActive,
      retryCount: this.retryCount,
      syncMode: this.networkType === 'none' ? 'offline' : 'online',
      pendingOperations: this.pendingOperations.size,
      syncProgress: this.syncProgress
    };
  }

  // 手动触发同步
  public async forceSync(): Promise<SyncResult> {
    console.log('🚀 手动触发同步');
    return await this.syncPendingData();
  }

  // 清理同步队列
  public clearSyncQueue(): void {
    this.syncQueue = [];
    this.pendingOperations.clear();
    this.persistSyncQueue();
    console.log('🧹 同步队列已清理');
  }

  // 更新配置
  public updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.adjustSyncStrategy();
    console.log('⚙️ 同步配置已更新:', newConfig);
  }

  // 获取配置
  public getConfig(): SyncConfig {
    return { ...this.config };
  }

  // 销毁实例
  public destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }

  // 兼容性方法：迁移旧同步数据
  public async migrateOldSyncData(): Promise<void> {
    try {
      console.log('🔄 开始迁移旧同步数据...');
      
      // 迁移旧的同步队列
      const oldQueueData = await AsyncStorage.getItem('syncQueue');
      if (oldQueueData) {
        const oldQueue = JSON.parse(oldQueueData);
        this.syncQueue.push(...oldQueue);
        await AsyncStorage.removeItem('syncQueue');
        console.log(`✅ 迁移了 ${oldQueue.length} 条旧同步数据`);
      }

      // 清理旧的数据版本文件
      await AsyncStorage.removeItem('localDataVersions');
      await AsyncStorage.removeItem('unifiedLocalDataVersions');
      console.log('✅ 清理了旧数据版本文件');

      this.persistSyncQueue();
      
      console.log('✅ 旧同步数据迁移完成');
    } catch (error) {
      console.error('❌ 迁移旧同步数据失败:', error);
    }
  }
}

// 导出单例实例
export const unifiedSyncService = UnifiedSyncService.getInstance(); 