import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../constants/config';
import { DataConflictResolver } from './dataConflictResolver';
import { experienceManager } from './experienceManager';

export interface SyncData {
  type: 'experience' | 'vocabulary' | 'progress' | 'achievements' | 'userStats' | 'learningRecords' | 'searchHistory' | 'userSettings' | 'badges';
  data: any;
  timestamp: number;
  userId: string;
  operation: 'create' | 'update' | 'delete';
  localVersion: number;
  serverVersion?: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SyncConfig {
  wifiSyncInterval: number;
  mobileSyncInterval: number;
  offlineSyncInterval: number;
  maxRetryAttempts: number;
  batchSize: number;
  conflictResolutionStrategy: 'local-wins' | 'server-wins' | 'smart-merge';
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
  syncMode: 'offline' | 'online' | 'conflict-resolution';
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
  private localDataVersions: Map<string, number> = new Map();
  private serverDataVersions: Map<string, number> = new Map();
  private pendingOperations: Set<string> = new Set();
  private syncProgress: number = 0;

  // 统一配置
  private config: SyncConfig = {
    wifiSyncInterval: 2 * 60 * 1000, // 2分钟
    mobileSyncInterval: 5 * 60 * 1000, // 5分钟
    offlineSyncInterval: 10 * 60 * 1000, // 10分钟
    maxRetryAttempts: 5,
    batchSize: 20,
    conflictResolutionStrategy: 'smart-merge',
    enableIncrementalSync: true,
    enableOfflineFirst: true,
    enableRealTimeSync: true
  };

  private constructor() {
    this.initializeNetworkListener();
    this.initializeActivityListener();
    this.loadDataVersions();
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

    if (typeof document !== 'undefined') {
      document.addEventListener('touchstart', handleUserActivity);
      document.addEventListener('mousedown', handleUserActivity);
      document.addEventListener('keydown', handleUserActivity);
    }
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
  public addToSyncQueue(data: Omit<SyncData, 'timestamp' | 'localVersion'>): void {
    const localVersion = this.getNextLocalVersion(data.type);
    const syncData: SyncData = {
      ...data,
      timestamp: Date.now(),
      localVersion
    };

    this.syncQueue.push(syncData);
    this.pendingOperations.add(`${data.type}-${data.operation}-${localVersion}`);
    this.persistSyncQueue();

    if (this.isImportantOperation(data.type)) {
      this.syncPendingData();
    }

    console.log(`📝 添加同步数据: ${data.type} (${data.operation}) - 版本 ${localVersion}`);
  }

  // 判断是否为重要操作
  private isImportantOperation(type: string): boolean {
    return ['experience', 'achievements', 'userStats'].includes(type);
  }

  // 同步待同步数据
  public async syncPendingData(): Promise<SyncResult> {
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
    console.log(`🔄 同步数据类型: ${dataType} (${dataItems.length} 个变更)`);

    const conflicts: any[] = [];
    const errors: string[] = [];

    try {
      const serverVersion = await this.getServerVersion(dataType, token);
      const detectedConflicts = this.detectConflicts(dataItems, serverVersion);
      
      if (detectedConflicts.length > 0) {
        const resolutionResult = await this.resolveConflicts(detectedConflicts, token);
        conflicts.push(...resolutionResult);
      } else {
        await this.syncDataWithoutConflicts(dataItems, token);
      }
    } catch (error) {
      errors.push(`同步 ${dataType} 失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { conflicts, errors };
  }

  // 检测冲突
  private detectConflicts(dataItems: SyncData[], serverVersion: number): SyncData[] {
    return dataItems.filter(item => {
      const serverVer = this.serverDataVersions.get(item.type) || 0;
      return item.serverVersion && item.serverVersion < serverVer;
    });
  }

  // 解决冲突
  private async resolveConflicts(conflicts: SyncData[], token: string): Promise<any[]> {
    const resolutions: any[] = [];
    
    for (const conflict of conflicts) {
      try {
        const serverData = await this.getServerData(conflict.type, token);
        
        const resolution = DataConflictResolver.resolveConflict({
          localData: conflict.data,
          serverData,
          localTimestamp: conflict.timestamp,
          serverTimestamp: Date.now(),
          dataType: conflict.type
        });
        
        await this.applyResolvedData(conflict.type, resolution.resolvedData, token);
        
        resolutions.push({
          type: conflict.type,
          resolution: resolution.reason,
          confidence: resolution.confidence
        });
        
        console.log(`🔄 冲突解决: ${conflict.type} - ${resolution.reason}`);
      } catch (error) {
        console.error(`解决冲突失败: ${conflict.type}`, error);
      }
    }
    
    return resolutions;
  }

  // 无冲突同步
  private async syncDataWithoutConflicts(dataItems: SyncData[], token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/batch-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: dataItems,
        timestamp: Date.now()
      }),
    });

    if (!response.ok) {
      throw new Error(`同步失败: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || '同步失败');
    }

    dataItems.forEach(item => {
      this.serverDataVersions.set(item.type, (this.serverDataVersions.get(item.type) || 0) + 1);
    });
  }

  // 获取服务器版本
  private async getServerVersion(dataType: string, token: string): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/version/${dataType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.version || 0;
      }
    } catch (error) {
      console.warn(`获取服务器版本失败: ${dataType}`, error);
    }
    
    return 0;
  }

  // 获取服务器数据
  private async getServerData(dataType: string, token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/data/${dataType}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`获取服务器数据失败: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  }

  // 应用解决后的数据
  private async applyResolvedData(dataType: string, resolvedData: any, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/apply-resolved-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        dataType,
        data: resolvedData,
        timestamp: Date.now()
      }),
    });
    
    if (!response.ok) {
      throw new Error(`应用解决数据失败: ${response.status}`);
    }
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
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.token || null;
      }
      return null;
    } catch (error) {
      console.error('获取认证token失败:', error);
      return null;
    }
  }

  // 获取下一个本地版本号
  private getNextLocalVersion(dataType: string): number {
    const currentVersion = this.localDataVersions.get(dataType) || 0;
    const nextVersion = currentVersion + 1;
    this.localDataVersions.set(dataType, nextVersion);
    this.persistDataVersions();
    return nextVersion;
  }

  // 持久化数据版本
  private async persistDataVersions(): Promise<void> {
    try {
      const versions = Object.fromEntries(this.localDataVersions);
      await AsyncStorage.setItem('unifiedLocalDataVersions', JSON.stringify(versions));
    } catch (error) {
      console.error('持久化数据版本失败:', error);
    }
  }

  // 加载数据版本
  private async loadDataVersions(): Promise<void> {
    try {
      const versionsStr = await AsyncStorage.getItem('unifiedLocalDataVersions');
      if (versionsStr) {
        const versions = JSON.parse(versionsStr);
        this.localDataVersions = new Map(Object.entries(versions));
      }
    } catch (error) {
      console.error('加载数据版本失败:', error);
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

      // 迁移旧的数据版本
      const oldVersionsData = await AsyncStorage.getItem('localDataVersions');
      if (oldVersionsData) {
        const oldVersions = JSON.parse(oldVersionsData);
        Object.entries(oldVersions).forEach(([type, version]) => {
          this.localDataVersions.set(type, version);
        });
        await AsyncStorage.removeItem('localDataVersions');
        console.log('✅ 迁移了旧数据版本');
      }

      this.persistSyncQueue();
      this.persistDataVersions();
      
      console.log('✅ 旧同步数据迁移完成');
    } catch (error) {
      console.error('❌ 迁移旧同步数据失败:', error);
    }
  }
}

// 导出单例实例
export const unifiedSyncService = UnifiedSyncService.getInstance(); 