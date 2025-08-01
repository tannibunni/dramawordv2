import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

// 获取认证token的辅助函数
async function getAuthToken(): Promise<string | null> {
  try {
    // 首先尝试从userData中获取token
    const userDataString = await AsyncStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      if (userData.token) {
        console.log('✅ 从userData中获取到token');
        return userData.token;
      }
    }
    
    // 如果没有找到，尝试从authToken中获取（向后兼容）
    const authToken = await AsyncStorage.getItem('authToken');
    if (authToken) {
      console.log('✅ 从authToken中获取到token');
      return authToken;
    }
    
    console.log('❌ 未找到认证token');
    return null;
  } catch (error) {
    console.error('获取认证token失败:', error);
    return null;
  }
}

// 数据同步项类型
interface SyncItem {
  id: string;
  type: 'realtime' | 'batch' | 'cache';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

// 实时数据类型
interface RealtimeData {
  type: 'user_action' | 'experience_gain' | 'level_up';
  userId: string;
  data: any;
}

// 批量数据类型
interface BatchData {
  type: 'learning_record' | 'search_history' | 'user_setting';
  userId: string;
  data: any[];
}

// 缓存数据类型
interface CacheData {
  type: 'vocabulary' | 'badges' | 'stats';
  userId: string;
  data: any;
}

// 同步队列类
class SyncQueue {
  private queue: SyncItem[] = [];
  private isProcessing = false;
  private readonly BATCH_SIZE = 10;
  private readonly PROCESS_DELAY = 1000;

  async add(item: SyncItem): Promise<void> {
    this.queue.push(item);
    await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    
    try {
      // 按类型分组处理
      const realtimeItems = this.queue.filter(item => item.type === 'realtime');
      const batchItems = this.queue.filter(item => item.type === 'batch');
      const cacheItems = this.queue.filter(item => item.type === 'cache');

      // 立即处理实时数据
      for (const item of realtimeItems) {
        await this.processItem(item);
      }

      // 批量处理批量数据
      if (batchItems.length > 0) {
        const batches = this.chunkArray(batchItems, this.BATCH_SIZE);
        for (const batch of batches) {
          await Promise.all(batch.map(item => this.processItem(item)));
        }
      }

      // 按需处理缓存数据
      for (const item of cacheItems) {
        if (await this.shouldSyncCache(item)) {
          await this.processItem(item);
        }
      }
    } catch (error) {
      console.error('同步队列处理失败:', error);
    } finally {
      this.isProcessing = false;
      
      // 如果队列还有数据，延迟处理
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), this.PROCESS_DELAY);
      }
    }
  }

  private async processItem(item: SyncItem): Promise<void> {
    console.log(`🔄 开始处理同步项: ${item.id} (类型: ${item.type}, 重试次数: ${item.retryCount}/${item.maxRetries})`);
    
    try {
      switch (item.type) {
        case 'realtime':
          await this.uploadRealtimeData(item.data);
          break;
        case 'batch':
          await this.uploadBatchData(item.data);
          break;
        case 'cache':
          await this.uploadCacheData(item.data);
          break;
        default:
          throw new Error(`未知的同步类型: ${item.type}`);
      }
      
      console.log(`✅ 同步项处理成功: ${item.id}`);
      // 成功后从队列中移除
      this.removeFromQueue(item.id);
    } catch (error) {
      console.error(`❌ 处理同步项失败: ${item.id} (类型: ${item.type})`, error);
      
      // 重试机制
      if (item.retryCount < item.maxRetries) {
        item.retryCount++;
        item.timestamp = Date.now();
        // 指数退避
        const delay = Math.pow(2, item.retryCount) * 1000;
        console.log(`🔄 准备重试同步项: ${item.id} (第${item.retryCount}次重试，延迟${delay}ms)`);
        
        // 先移除当前项，然后重新添加
        this.removeFromQueue(item.id);
        setTimeout(() => {
          console.log(`🔄 重新添加同步项到队列: ${item.id}`);
          this.add(item);
        }, delay);
      } else {
        console.error(`❌ 同步项 ${item.id} 达到最大重试次数 (${item.maxRetries})，从队列中移除`);
        // 达到最大重试次数后，从队列中移除
        this.removeFromQueue(item.id);
        
        // 记录失败的同步项到本地存储，以便后续分析
        this.logFailedSyncItem(item, error);
      }
    }
  }

  private removeFromQueue(id: string): void {
    const index = this.queue.findIndex(item => item.id === id);
    if (index > -1) {
      this.queue.splice(index, 1);
    }
  }

  private async logFailedSyncItem(item: SyncItem, error: any): Promise<void> {
    try {
      const failedItems = await AsyncStorage.getItem('failed_sync_items');
      const failedItemsArray = failedItems ? JSON.parse(failedItems) : [];
      
      const failedItem = {
        id: item.id,
        type: item.type,
        timestamp: Date.now(),
        retryCount: item.retryCount,
        maxRetries: item.maxRetries,
        error: error?.message || error?.toString() || 'Unknown error',
        data: item.data
      };
      
      failedItemsArray.push(failedItem);
      
      // 只保留最近100个失败的同步项
      if (failedItemsArray.length > 100) {
        failedItemsArray.splice(0, failedItemsArray.length - 100);
      }
      
      await AsyncStorage.setItem('failed_sync_items', JSON.stringify(failedItemsArray));
      console.log(`📝 已记录失败的同步项: ${item.id}`);
    } catch (logError) {
      console.error('记录失败同步项时出错:', logError);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async shouldSyncCache(item: SyncItem): Promise<boolean> {
    const lastSyncKey = `last_sync_${item.data.type}`;
    const lastSync = await AsyncStorage.getItem(lastSyncKey);
    if (!lastSync) return true;

    const timeDiff = Date.now() - parseInt(lastSync);
    const cacheInterval = 5 * 60 * 1000; // 5分钟
    return timeDiff > cacheInterval;
  }

  private async uploadRealtimeData(data: RealtimeData): Promise<void> {
    const token = await getAuthToken();
    
    // 游客模式跳过同步
    if (!token) {
      console.log('游客模式，跳过实时数据同步');
      return;
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/sync/realtime`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ 认证失败，清除无效token');
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
        throw new Error('认证失败，请重新登录');
      }
      throw new Error(`实时数据上传失败: ${response.status}`);
    }
  }

  private async uploadBatchData(data: BatchData): Promise<void> {
    const token = await getAuthToken();
    
    // 游客模式跳过同步
    if (!token) {
      console.log('游客模式，跳过批量数据同步');
      return;
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log('🔄 开始批量数据上传...');
      
      // 使用兼容的超时机制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
      
      const response = await fetch(`${API_BASE_URL}/sync/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ 批量数据上传失败: ${response.status}`, errorText);
        
        // 根据错误类型处理
        if (response.status === 401) {
          console.error('❌ 认证失败，token可能已过期，清除无效token');
          // 清除无效的token
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userData');
          throw new Error('认证失败，请重新登录');
        } else if (response.status === 500) {
          console.error('❌ 服务器内部错误，可能是数据库连接问题');
          throw new Error('服务器内部错误，请稍后重试');
        } else {
          throw new Error(`批量数据上传失败: ${response.status} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('✅ 批量数据上传成功:', result);
    } catch (error) {
      console.error('❌ 批量数据上传异常:', error);
      
      // 如果是网络错误，记录详细信息
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('❌ 网络连接错误，请检查网络连接');
      }
      
      throw error;
    }
  }

  private async uploadCacheData(data: CacheData): Promise<void> {
    const token = await getAuthToken();
    
    // 游客模式跳过同步
    if (!token) {
      console.log('游客模式，跳过缓存数据同步');
      return;
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/sync/cache`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ 认证失败，清除无效token');
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
        throw new Error('认证失败，请重新登录');
      }
      throw new Error(`缓存数据上传失败: ${response.status}`);
    }

    // 更新最后同步时间
    await AsyncStorage.setItem(`last_sync_${data.type}`, Date.now().toString());
  }
}

// 优化的数据同步服务
export class OptimizedDataSyncService {
  private static instance: OptimizedDataSyncService;
  private syncQueue: SyncQueue;
  private readonly STORAGE_KEYS = {
    SYNC_QUEUE: 'sync_queue',
    LAST_SYNC_TIME: 'last_sync_time',
    CONFLICT_RESOLUTION: 'conflict_resolution',
  };

  private constructor() {
    this.syncQueue = new SyncQueue();
  }

  public static getInstance(): OptimizedDataSyncService {
    if (!OptimizedDataSyncService.instance) {
      OptimizedDataSyncService.instance = new OptimizedDataSyncService();
    }
    return OptimizedDataSyncService.instance;
  }

  // 同步实时数据（立即上传）
  async syncRealtimeData(data: RealtimeData): Promise<void> {
    const syncItem: SyncItem = {
      id: this.generateId(),
      type: 'realtime',
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    await this.syncQueue.add(syncItem);
  }

  // 同步批量数据（队列处理）
  async syncBatchData(data: BatchData): Promise<void> {
    const syncItem: SyncItem = {
      id: this.generateId(),
      type: 'batch',
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 5,
    };

    await this.syncQueue.add(syncItem);
  }

  // 同步缓存数据（按需同步）
  async syncCacheData(data: CacheData): Promise<void> {
    const syncItem: SyncItem = {
      id: this.generateId(),
      type: 'cache',
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    await this.syncQueue.add(syncItem);
  }

  // 冲突检测和解决
  async resolveConflicts(localData: any, remoteData: any): Promise<any> {
    // 时间戳优先策略
    if (localData.timestamp > remoteData.timestamp) {
      return localData;
    }

    // 数据类型合并策略
    switch (localData.type) {
      case 'learning_progress':
        return this.mergeLearningProgress(localData, remoteData);
      case 'user_settings':
        return remoteData; // 设置类数据使用最新值
      case 'vocabulary':
        return this.mergeVocabulary(localData, remoteData);
      default:
        return remoteData;
    }
  }

  // 合并学习进度数据
  private mergeLearningProgress(local: any, remote: any): any {
    return {
      ...remote,
      reviewCount: Math.max(local.reviewCount || 0, remote.reviewCount || 0),
      correctCount: Math.max(local.correctCount || 0, remote.correctCount || 0),
      incorrectCount: Math.max(local.incorrectCount || 0, remote.incorrectCount || 0),
      consecutiveCorrect: Math.max(local.consecutiveCorrect || 0, remote.consecutiveCorrect || 0),
      consecutiveIncorrect: Math.max(local.consecutiveIncorrect || 0, remote.consecutiveIncorrect || 0),
      mastery: Math.max(local.mastery || 0, remote.mastery || 0),
      lastReviewDate: new Date(Math.max(
        new Date(local.lastReviewDate || 0).getTime(),
        new Date(remote.lastReviewDate || 0).getTime()
      )).toISOString(),
    };
  }

  // 合并词汇表数据
  private mergeVocabulary(local: any, remote: any): any {
    const merged = { ...local };
    
    // 合并词汇列表
    if (remote.vocabulary && Array.isArray(remote.vocabulary)) {
      merged.vocabulary = [...(local.vocabulary || []), ...remote.vocabulary];
      // 去重
      merged.vocabulary = merged.vocabulary.filter((item: any, index: number, arr: any[]) => 
        arr.findIndex(t => t.word === item.word) === index
      );
    }

    return merged;
  }

  // 生成唯一ID
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取同步状态
  async getSyncStatus(): Promise<{
    queueLength: number;
    lastSyncTime: number | null;
    isProcessing: boolean;
  }> {
    const lastSyncTime = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_SYNC_TIME);
    
    return {
      queueLength: 0, // 这里需要从队列获取实际长度
      lastSyncTime: lastSyncTime ? parseInt(lastSyncTime) : null,
      isProcessing: false, // 这里需要从队列获取实际状态
    };
  }

  // 清除同步队列
  async clearSyncQueue(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEYS.SYNC_QUEUE);
  }

  // 获取失败的同步项列表（用于调试）
  async getFailedSyncItems(): Promise<any[]> {
    try {
      const failedItems = await AsyncStorage.getItem('failed_sync_items');
      return failedItems ? JSON.parse(failedItems) : [];
    } catch (error) {
      console.error('获取失败同步项时出错:', error);
      return [];
    }
  }

  // 清除失败的同步项记录
  async clearFailedSyncItems(): Promise<void> {
    try {
      await AsyncStorage.removeItem('failed_sync_items');
      console.log('已清除失败的同步项记录');
    } catch (error) {
      console.error('清除失败同步项记录时出错:', error);
    }
  }
}

export default OptimizedDataSyncService.getInstance(); 