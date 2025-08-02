import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncManager } from './syncManager';
import { DataConflictResolver } from './dataConflictResolver';

export interface IncrementalSyncData {
  id: string;
  type: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  version: number;
  checksum: string;
  dependencies?: string[];
}

export interface SyncMetadata {
  lastSyncTimestamp: number;
  dataVersions: Record<string, number>;
  pendingOperations: string[];
  syncStatus: 'idle' | 'syncing' | 'conflict' | 'error';
  lastError?: string;
}

export class IncrementalSyncManager {
  private static instance: IncrementalSyncManager;
  private metadata: SyncMetadata;
  private pendingChanges: Map<string, IncrementalSyncData> = new Map();
  private isInitialized: boolean = false;

  private constructor() {
    this.metadata = {
      lastSyncTimestamp: 0,
      dataVersions: {},
      pendingOperations: [],
      syncStatus: 'idle'
    };
  }

  public static getInstance(): IncrementalSyncManager {
    if (!IncrementalSyncManager.instance) {
      IncrementalSyncManager.instance = new IncrementalSyncManager();
    }
    return IncrementalSyncManager.instance;
  }

  // 初始化增量同步管理器
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadMetadata();
      await this.loadPendingChanges();
      this.isInitialized = true;
      console.log('✅ 增量同步管理器初始化完成');
    } catch (error) {
      console.error('❌ 增量同步管理器初始化失败:', error);
      throw error;
    }
  }

  // 记录数据变更
  public async recordChange(
    type: string,
    operation: 'create' | 'update' | 'delete',
    data: any,
    id?: string
  ): Promise<string> {
    const changeId = id || this.generateChangeId();
    const timestamp = Date.now();
    const version = this.getNextVersion(type);
    const checksum = this.calculateChecksum(data);

    const change: IncrementalSyncData = {
      id: changeId,
      type,
      operation,
      data,
      timestamp,
      version,
      checksum
    };

    this.pendingChanges.set(changeId, change);
    this.metadata.pendingOperations.push(changeId);
    
    await this.persistPendingChanges();
    await this.persistMetadata();

    console.log(`📝 记录变更: ${type} (${operation}) - ID: ${changeId}`);

    // 添加到同步队列
    syncManager.addToSyncQueue({
      type,
      data: change,
      userId: await this.getUserId(),
      operation
    });

    return changeId;
  }

  // 批量记录变更
  public async recordBatchChanges(changes: Array<{
    type: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
    id?: string;
  }>): Promise<string[]> {
    const changeIds: string[] = [];

    for (const change of changes) {
      const changeId = await this.recordChange(
        change.type,
        change.operation,
        change.data,
        change.id
      );
      changeIds.push(changeId);
    }

    return changeIds;
  }

  // 执行增量同步
  public async performIncrementalSync(): Promise<void> {
    if (this.pendingChanges.size === 0) {
      console.log('📱 无待同步数据');
      return;
    }

    this.metadata.syncStatus = 'syncing';

    try {
      const changes = Array.from(this.pendingChanges.values());
      const groupedChanges = this.groupChangesByType(changes);

      for (const [type, typeChanges] of Object.entries(groupedChanges)) {
        await this.syncDataType(type, typeChanges);
      }

      // 清理已同步的变更
      this.clearSyncedChanges(changes.map(c => c.id));
      this.metadata.lastSyncTimestamp = Date.now();
      this.metadata.syncStatus = 'idle';

      console.log(`✅ 增量同步完成: ${changes.length} 个变更`);
    } catch (error) {
      this.metadata.syncStatus = 'error';
      this.metadata.lastError = error.message;
      console.error('❌ 增量同步失败:', error);
      throw error;
    } finally {
      await this.persistMetadata();
    }
  }

  // 按数据类型分组变更
  private groupChangesByType(changes: IncrementalSyncData[]): Record<string, IncrementalSyncData[]> {
    const grouped: Record<string, IncrementalSyncData[]> = {};

    changes.forEach(change => {
      if (!grouped[change.type]) {
        grouped[change.type] = [];
      }
      grouped[change.type].push(change);
    });

    return grouped;
  }

  // 同步特定数据类型的变更
  private async syncDataType(type: string, changes: IncrementalSyncData[]): Promise<void> {
    console.log(`🔄 同步数据类型: ${type} (${changes.length} 个变更)`);

    // 按操作类型排序：delete -> update -> create
    const sortedChanges = this.sortChangesByOperation(changes);

    for (const change of sortedChanges) {
      await this.syncChange(change);
    }
  }

  // 按操作类型排序
  private sortChangesByOperation(changes: IncrementalSyncData[]): IncrementalSyncData[] {
    const operationOrder = { delete: 0, update: 1, create: 2 };
    
    return changes.sort((a, b) => {
      return operationOrder[a.operation] - operationOrder[b.operation];
    });
  }

  // 同步单个变更
  private async syncChange(change: IncrementalSyncData): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('未找到认证token');
      }

      const response = await fetch(`${this.getApiUrl()}/users/incremental-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          change,
          metadata: {
            lastSyncTimestamp: this.metadata.lastSyncTimestamp,
            clientVersion: change.version
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`同步失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.conflict) {
        await this.handleConflict(change, result.serverData);
      } else {
        // 更新本地版本
        this.metadata.dataVersions[change.type] = change.version;
        console.log(`✅ 变更同步成功: ${change.type} (${change.operation})`);
      }
    } catch (error) {
      console.error(`❌ 变更同步失败: ${change.type} (${change.operation})`, error);
      throw error;
    }
  }

  // 处理冲突
  private async handleConflict(change: IncrementalSyncData, serverData: any): Promise<void> {
    console.log(`🔄 检测到冲突: ${change.type}`);

    const conflict = {
      localData: change.data,
      serverData,
      localTimestamp: change.timestamp,
      serverTimestamp: Date.now(),
      dataType: change.type
    };

    const resolution = DataConflictResolver.resolveConflict(conflict);
    
    console.log(`✅ 冲突解决: ${resolution.reason} (置信度: ${resolution.confidence})`);

    // 应用解决后的数据
    if (resolution.source === 'local') {
      // 本地数据获胜，继续同步
      return;
    } else if (resolution.source === 'server') {
      // 服务器数据获胜，更新本地数据
      await this.updateLocalData(change.type, resolution.resolvedData);
    } else if (resolution.source === 'merged') {
      // 合并数据，更新本地并重新同步
      await this.updateLocalData(change.type, resolution.resolvedData);
      await this.recordChange(change.type, 'update', resolution.resolvedData, change.id);
    }
  }

  // 更新本地数据
  private async updateLocalData(type: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`${type}Data`, JSON.stringify(data));
      console.log(`📱 本地数据已更新: ${type}`);
    } catch (error) {
      console.error(`❌ 更新本地数据失败: ${type}`, error);
    }
  }

  // 清理已同步的变更
  private clearSyncedChanges(changeIds: string[]): void {
    changeIds.forEach(id => {
      this.pendingChanges.delete(id);
      const index = this.metadata.pendingOperations.indexOf(id);
      if (index > -1) {
        this.metadata.pendingOperations.splice(index, 1);
      }
    });
  }

  // 获取同步状态
  public getSyncStatus(): SyncMetadata {
    return { ...this.metadata };
  }

  // 获取待同步变更数量
  public getPendingChangesCount(): number {
    return this.pendingChanges.size;
  }

  // 获取特定类型的待同步变更
  public getPendingChangesByType(type: string): IncrementalSyncData[] {
    return Array.from(this.pendingChanges.values()).filter(change => change.type === type);
  }

  // 清理所有待同步变更
  public async clearAllPendingChanges(): Promise<void> {
    this.pendingChanges.clear();
    this.metadata.pendingOperations = [];
    await this.persistPendingChanges();
    await this.persistMetadata();
    console.log('🧹 所有待同步变更已清理');
  }

  // 生成变更ID
  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取下一个版本号
  private getNextVersion(type: string): number {
    const currentVersion = this.metadata.dataVersions[type] || 0;
    const nextVersion = currentVersion + 1;
    this.metadata.dataVersions[type] = nextVersion;
    return nextVersion;
  }

  // 计算数据校验和
  private calculateChecksum(data: any): string {
    const dataString = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return hash.toString(36);
  }

  // 获取用户ID
  private async getUserId(): Promise<string> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.id || 'unknown';
      }
      return 'unknown';
    } catch (error) {
      console.error('获取用户ID失败:', error);
      return 'unknown';
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

  // 获取API URL
  private getApiUrl(): string {
    // 从配置文件获取API URL
    return 'https://dramawordv2.onrender.com/api';
  }

  // 持久化元数据
  private async persistMetadata(): Promise<void> {
    try {
      await AsyncStorage.setItem('incrementalSyncMetadata', JSON.stringify(this.metadata));
    } catch (error) {
      console.error('持久化元数据失败:', error);
    }
  }

  // 加载元数据
  private async loadMetadata(): Promise<void> {
    try {
      const metadataStr = await AsyncStorage.getItem('incrementalSyncMetadata');
      if (metadataStr) {
        this.metadata = { ...this.metadata, ...JSON.parse(metadataStr) };
      }
    } catch (error) {
      console.error('加载元数据失败:', error);
    }
  }

  // 持久化待同步变更
  private async persistPendingChanges(): Promise<void> {
    try {
      const changes = Array.from(this.pendingChanges.values());
      await AsyncStorage.setItem('pendingSyncChanges', JSON.stringify(changes));
    } catch (error) {
      console.error('持久化待同步变更失败:', error);
    }
  }

  // 加载待同步变更
  private async loadPendingChanges(): Promise<void> {
    try {
      const changesStr = await AsyncStorage.getItem('pendingSyncChanges');
      if (changesStr) {
        const changes: IncrementalSyncData[] = JSON.parse(changesStr);
        changes.forEach(change => {
          this.pendingChanges.set(change.id, change);
        });
      }
    } catch (error) {
      console.error('加载待同步变更失败:', error);
    }
  }

  // 销毁实例
  public destroy(): void {
    this.pendingChanges.clear();
    this.isInitialized = false;
  }
}

// 导出单例实例
export const incrementalSyncManager = IncrementalSyncManager.getInstance(); 