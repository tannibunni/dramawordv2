import AsyncStorage from '@react-native-async-storage/async-storage';

// 缓存数据类型定义
export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  version: string;
  expiresAt?: number;
}

export interface CacheConfig {
  maxAge?: number; // 缓存最大年龄（毫秒）
  maxSize?: number; // 缓存最大条目数
  version?: string; // 缓存版本号
}

// 缓存键前缀
export const CACHE_KEYS = {
  WORD_DETAIL: 'word_detail',
  SEARCH_HISTORY: 'search_history',
  USER_VOCABULARY: 'user_vocabulary',
  USER_STATS: 'user_stats',
  APP_SETTINGS: 'app_settings',
} as const;

// 默认缓存配置
const DEFAULT_CONFIG: CacheConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24小时
  maxSize: 100, // 最大100个条目
  version: '1.0.0',
};

export class CacheService {
  private static instance: CacheService;
  private config: CacheConfig;
  private memoryCache = new Map<string, CacheItem>();

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<CacheConfig>): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  // 生成缓存键
  private generateKey(prefix: string, identifier: string): string {
    return `${prefix}_${identifier.toLowerCase()}`;
  }

  // 设置缓存
  async set<T>(prefix: string, identifier: string, data: T, customConfig?: Partial<CacheConfig>): Promise<void> {
    const key = this.generateKey(prefix, identifier);
    const config = { ...this.config, ...customConfig };
    
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      version: config.version!,
      expiresAt: config.maxAge ? Date.now() + config.maxAge : undefined,
    };

    // 同时设置内存缓存和持久化缓存
    this.memoryCache.set(key, cacheItem);
    
    try {
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
      console.log(`✅ 缓存已设置: ${key}`);
    } catch (error) {
      console.error(`❌ 设置缓存失败: ${key}`, error);
    }

    // 检查缓存大小限制
    await this.enforceSizeLimit(prefix);
  }

  // 获取缓存
  async get<T>(prefix: string, identifier: string): Promise<T | null> {
    const key = this.generateKey(prefix, identifier);

    // 1. 先检查内存缓存
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      console.log(`✅ 从内存缓存获取: ${key}`);
      return memoryItem.data as T;
    }

    // 2. 检查持久化缓存
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const cacheItem: CacheItem<T> = JSON.parse(stored);
        
        if (!this.isExpired(cacheItem)) {
          // 更新内存缓存
          this.memoryCache.set(key, cacheItem);
          console.log(`✅ 从持久化缓存获取: ${key}`);
          return cacheItem.data;
        } else {
          // 缓存已过期，删除
          await this.delete(prefix, identifier);
          console.log(`🗑️ 缓存已过期，已删除: ${key}`);
        }
      }
    } catch (error) {
      console.error(`❌ 读取缓存失败: ${key}`, error);
    }

    return null;
  }

  // 删除缓存
  async delete(prefix: string, identifier: string): Promise<void> {
    const key = this.generateKey(prefix, identifier);
    
    // 删除内存缓存
    this.memoryCache.delete(key);
    
    // 删除持久化缓存
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ 缓存已删除: ${key}`);
    } catch (error) {
      console.error(`❌ 删除缓存失败: ${key}`, error);
    }
  }

  // 检查缓存是否过期
  private isExpired(cacheItem: CacheItem): boolean {
    if (cacheItem.expiresAt && Date.now() > cacheItem.expiresAt) {
      return true;
    }
    return false;
  }

  // 强制缓存大小限制
  private async enforceSizeLimit(prefix: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixKeys = keys.filter(key => key.startsWith(prefix));
      
      if (prefixKeys.length > this.config.maxSize!) {
        // 获取所有缓存项并按时间排序
        const cacheItems = await Promise.all(
          prefixKeys.map(async (key) => {
            try {
              const stored = await AsyncStorage.getItem(key);
              if (stored) {
                const item: CacheItem = JSON.parse(stored);
                return { key, timestamp: item.timestamp };
              }
            } catch (error) {
              console.error(`❌ 读取缓存项失败: ${key}`, error);
            }
            return null;
          })
        );

        // 过滤掉无效项并按时间排序
        const validItems = cacheItems
          .filter(item => item !== null)
          .sort((a, b) => a!.timestamp - b!.timestamp);

        // 删除最旧的缓存项
        const itemsToDelete = validItems.slice(0, validItems.length - this.config.maxSize!);
        const keysToDelete = itemsToDelete.map(item => item!.key);
        
        await AsyncStorage.multiRemove(keysToDelete);
        console.log(`🗑️ 清理过期缓存: ${keysToDelete.length} 项`);
      }
    } catch (error) {
      console.error('❌ 强制缓存大小限制失败:', error);
    }
  }

  // 清理指定前缀的所有缓存
  async clearPrefix(prefix: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixKeys = keys.filter(key => key.startsWith(prefix));
      
      // 清理内存缓存
      prefixKeys.forEach(key => this.memoryCache.delete(key));
      
      // 清理持久化缓存
      await AsyncStorage.multiRemove(prefixKeys);
      console.log(`🗑️ 清理前缀缓存: ${prefix} (${prefixKeys.length} 项)`);
    } catch (error) {
      console.error(`❌ 清理前缀缓存失败: ${prefix}`, error);
    }
  }

  // 清理所有缓存
  async clearAll(): Promise<void> {
    try {
      // 清理内存缓存
      this.memoryCache.clear();
      
      // 清理持久化缓存
      await AsyncStorage.clear();
      console.log('🗑️ 所有缓存已清理');
    } catch (error) {
      console.error('❌ 清理所有缓存失败:', error);
    }
  }

  // 获取缓存统计信息
  async getStats(): Promise<{
    memorySize: number;
    storageSize: number;
    hitRate: number;
  }> {
    const memorySize = this.memoryCache.size;
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const storageSize = keys.length;
      
      return {
        memorySize,
        storageSize,
        hitRate: 0, // 可以添加命中率统计
      };
    } catch (error) {
      console.error('❌ 获取缓存统计失败:', error);
      return {
        memorySize,
        storageSize: 0,
        hitRate: 0,
      };
    }
  }

  // 更新缓存配置
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ 缓存配置已更新:', this.config);
  }
}

// 导出单例实例
export const cacheService = CacheService.getInstance(); 