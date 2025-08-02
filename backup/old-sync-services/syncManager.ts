import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../constants/config';
import { DataConflictResolver } from './dataConflictResolver';

export interface SyncData {
  type: 'experience' | 'vocabulary' | 'progress' | 'achievements' | 'userStats' | 'learningRecords';
  data: any;
  timestamp: number;
  userId: string;
  operation: 'create' | 'update' | 'delete';
  localVersion: number;
  serverVersion?: number;
}

export interface SyncConfig {
  wifiSyncInterval: number; // WiFi下的同步间隔（毫秒）
  mobileSyncInterval: number; // 移动网络下的同步间隔（毫秒）
  offlineSyncInterval: number; // 离线时的同步间隔（毫秒）
  maxRetryAttempts: number; // 最大重试次数
  batchSize: number; // 批量同步大小
  conflictResolutionStrategy: 'local-wins' | 'server-wins' | 'smart-merge';
  enableIncrementalSync: boolean; // 启用增量同步
  enableOfflineFirst: boolean; // 启用离线优先
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
}

export class SyncManager {
  private static instance: SyncManager;
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

  // 多邻国风格的默认配置
  private config: SyncConfig = {
    wifiSyncInterval: 2 * 60 * 1000, // 2分钟（更频繁的同步）
    mobileSyncInterval: 5 * 60 * 1000, // 5分钟
    offlineSyncInterval: 10 * 60 * 1000, // 10分钟
    maxRetryAttempts: 5, // 增加重试次数
    batchSize: 20, // 减小批量大小，提高响应性
    conflictResolutionStrategy: 'smart-merge',
    enableIncrementalSync: true,
    enableOfflineFirst: true
  };

  private constructor() {
    this.initializeNetworkListener();
    this.initializeActivityListener();
    this.loadDataVersions();
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  // 初始化网络监听 - 多邻国风格
  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = this.networkType === 'none';
      this.networkType = state.type;
      
      if (wasOffline && state.isConnected) {
        // 网络恢复，立即同步待同步数据
        console.log('🌐 网络恢复，开始同步待同步数据');
        this.syncPendingData();
      }
      
      // 根据网络状态调整同步策略
      this.adjustSyncStrategy();
    });
  }

  // 初始化用户活跃度监听 - 多邻国风格
  private initializeActivityListener() {
    // 监听用户交互事件
    const handleUserActivity = () => {
      this.isUserActive = true;
      this.resetActivityTimer();
      
      // 用户活跃时，如果有待同步数据，立即同步
      if (this.syncQueue.length > 0 && this.networkType !== 'none') {
        this.syncPendingData();
      }
    };

    // 添加事件监听器
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
    }, 3 * 60 * 1000); // 3分钟无操作后标记为非活跃
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

  // 获取当前同步间隔 - 多邻国风格
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

  // 添加数据到同步队列 - 多邻国风格（离线优先）
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

    // 如果是重要操作，立即同步
    if (this.isImportantOperation(data.type)) {
      this.syncPendingData();
    }

    console.log(`📝 添加同步数据: ${data.type} (${data.operation}) - 版本 ${localVersion}`);
  }

  // 判断是否为重要操作
  private isImportantOperation(type: string): boolean {
    return ['experience', 'achievements', 'userStats'].includes(type);
  }

  // 同步待同步数据 - 多邻国风格
  public async syncPendingData(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      console.log('📱 离线模式，数据已保存到本地队列');
      return; // 离线时不同步，但数据已保存
    }

    this.isSyncing = true;
    this.retryCount = 0;

    try {
      await this.performSmartSync();
      this.lastSyncTime = Date.now();
    } catch (error) {
      console.error('❌ 同步失败:', error);
      this.handleSyncError();
    } finally {
      this.isSyncing = false;
    }
  }

  // 执行智能同步 - 多邻国风格
  private async performSmartSync(): Promise<void> {
    const batch = this.syncQueue.splice(0, this.config.batchSize);
    
    if (batch.length === 0) return;

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('未找到认证token');
    }

    // 按数据类型分组处理
    const groupedData = this.groupDataByType(batch);
    
    for (const [dataType, dataItems] of Object.entries(groupedData)) {
      await this.syncDataType(dataType, dataItems, token);
    }

    // 同步成功，清理队列
    this.persistSyncQueue();
    console.log(`✅ 智能同步成功: ${batch.length} 条数据`);
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
  private async syncDataType(dataType: string, dataItems: SyncData[], token: string): Promise<void> {
    try {
      // 获取服务器当前版本
      const serverVersion = await this.getServerVersion(dataType, token);
      
      // 检查冲突
      const conflicts = this.detectConflicts(dataItems, serverVersion);
      
      if (conflicts.length > 0) {
        // 解决冲突
        await this.resolveConflicts(conflicts, token);
      } else {
        // 无冲突，直接同步
        await this.syncDataWithoutConflicts(dataItems, token);
      }
    } catch (error) {
      console.error(`同步数据类型 ${dataType} 失败:`, error);
      // 将失败的数据重新加入队列
      this.syncQueue.unshift(...dataItems);
    }
  }

  // 检测冲突
  private detectConflicts(dataItems: SyncData[], serverVersion: number): SyncData[] {
    return dataItems.filter(item => {
      const serverVer = this.serverDataVersions.get(item.type) || 0;
      return item.serverVersion && item.serverVersion < serverVer;
    });
  }

  // 解决冲突
  private async resolveConflicts(conflicts: SyncData[], token: string): Promise<void> {
    for (const conflict of conflicts) {
      try {
        // 获取服务器数据
        const serverData = await this.getServerData(conflict.type, token);
        
        // 使用冲突解决器
        const resolution = DataConflictResolver.resolveConflict({
          localData: conflict.data,
          serverData,
          localTimestamp: conflict.timestamp,
          serverTimestamp: Date.now(),
          dataType: conflict.type
        });
        
        // 应用解决后的数据
        await this.applyResolvedData(conflict.type, resolution.resolvedData, token);
        
        console.log(`🔄 冲突解决: ${conflict.type} - ${resolution.reason}`);
      } catch (error) {
        console.error(`解决冲突失败: ${conflict.type}`, error);
      }
    }
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

    // 更新服务器版本
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

  // 处理同步错误 - 多邻国风格
  private handleSyncError(): void {
    this.retryCount++;
    
    if (this.retryCount < this.config.maxRetryAttempts) {
      // 指数退避重试
      const delay = Math.pow(2, this.retryCount) * 1000;
      console.log(`🔄 ${this.retryCount}/${this.config.maxRetryAttempts} 重试同步，延迟 ${delay}ms`);
      
      setTimeout(() => {
        this.syncPendingData();
      }, delay);
    } else {
      // 达到最大重试次数，将数据重新加入队列
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
      await AsyncStorage.setItem('localDataVersions', JSON.stringify(versions));
    } catch (error) {
      console.error('持久化数据版本失败:', error);
    }
  }

  // 加载数据版本
  private async loadDataVersions(): Promise<void> {
    try {
      const versionsStr = await AsyncStorage.getItem('localDataVersions');
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
      await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('持久化同步队列失败:', error);
    }
  }

  // 加载同步队列
  public async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('syncQueue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('加载同步队列失败:', error);
    }
  }

  // 获取同步状态 - 多邻国风格
  public getSyncStatus(): SyncStatus {
    return {
      queueLength: this.syncQueue.length,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      networkType: this.networkType,
      isUserActive: this.isUserActive,
      retryCount: this.retryCount,
      syncMode: this.networkType === 'none' ? 'offline' : 'online',
      pendingOperations: this.pendingOperations.size
    };
  }

  // 手动触发同步
  public async forceSync(): Promise<void> {
    console.log('🚀 手动触发同步');
    await this.syncPendingData();
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

  // 销毁实例
  public destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }
}

// 导出单例实例
export const syncManager = SyncManager.getInstance(); 