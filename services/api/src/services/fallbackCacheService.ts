import { logger } from '../utils/logger';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface FallbackCacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
  totalOperations: number;
}

export class FallbackCacheService {
  private static instance: FallbackCacheService;
  private memoryCache = new Map<string, CacheItem<any>>();
  private stats: FallbackCacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0,
    totalOperations: 0
  };

  private constructor() {
    this.startCleanupInterval();
  }

  public static getInstance(): FallbackCacheService {
    if (!FallbackCacheService.instance) {
      FallbackCacheService.instance = new FallbackCacheService();
    }
    return FallbackCacheService.instance;
  }

  // 设置缓存
  async set<T>(strategy: string, identifier: string, data: T, ttl: number = 3600): Promise<boolean> {
    try {
      const key = `${strategy}:${identifier}`;
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl * 1000 // 转换为毫秒
      };

      this.memoryCache.set(key, item);
      this.stats.sets++;
      this.stats.totalOperations++;
      this.updateHitRate();

      logger.debug(`💾 内存缓存设置成功: ${key}`);
      return true;
    } catch (error) {
      this.stats.errors++;
      this.stats.totalOperations++;
      this.updateHitRate();
      logger.error(`❌ 内存缓存设置失败: ${strategy}:${identifier}`, error);
      return false;
    }
  }

  // 获取缓存
  async get<T>(strategy: string, identifier: string): Promise<T | null> {
    try {
      const key = `${strategy}:${identifier}`;
      const item = this.memoryCache.get(key);

      if (!item) {
        this.stats.misses++;
        this.stats.totalOperations++;
        this.updateHitRate();
        logger.debug(`📊 内存缓存未命中: ${key}`);
        return null;
      }

      // 检查是否过期
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
        this.stats.misses++;
        this.stats.totalOperations++;
        this.updateHitRate();
        logger.debug(`🗑️ 内存缓存已过期: ${key}`);
        return null;
      }

      this.stats.hits++;
      this.stats.totalOperations++;
      this.updateHitRate();
      logger.debug(`✅ 内存缓存命中: ${key}`);
      return item.data as T;
    } catch (error) {
      this.stats.errors++;
      this.stats.totalOperations++;
      this.updateHitRate();
      logger.error(`❌ 内存缓存获取失败: ${strategy}:${identifier}`, error);
      return null;
    }
  }

  // 删除缓存
  async delete(strategy: string, identifier: string): Promise<boolean> {
    try {
      const key = `${strategy}:${identifier}`;
      const deleted = this.memoryCache.delete(key);
      
      if (deleted) {
        this.stats.deletes++;
        this.stats.totalOperations++;
        this.updateHitRate();
        logger.debug(`🗑️ 内存缓存删除成功: ${key}`);
      }
      
      return deleted;
    } catch (error) {
      this.stats.errors++;
      this.stats.totalOperations++;
      this.updateHitRate();
      logger.error(`❌ 内存缓存删除失败: ${strategy}:${identifier}`, error);
      return false;
    }
  }

  // 清空缓存
  async clear(): Promise<boolean> {
    try {
      this.memoryCache.clear();
      logger.info('🗑️ 内存缓存已清空');
      return true;
    } catch (error) {
      logger.error('❌ 清空内存缓存失败:', error);
      return false;
    }
  }

  // 获取统计信息
  getStats(): FallbackCacheStats {
    return { ...this.stats };
  }

  // 健康检查
  async healthCheck(): Promise<{
    healthy: boolean;
    message: string;
    stats: FallbackCacheStats;
  }> {
    try {
      const stats = this.getStats();
      const healthy = stats.errors < stats.totalOperations * 0.1; // 错误率低于10%认为健康
      
      return {
        healthy,
        message: healthy ? '内存缓存服务运行正常' : '内存缓存服务存在异常',
        stats
      };
    } catch (error) {
      logger.error('❌ 内存缓存健康检查失败:', error);
      return {
        healthy: false,
        message: '内存缓存健康检查失败',
        stats: this.getStats()
      };
    }
  }

  // 检查是否过期
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  // 更新命中率
  private updateHitRate(): void {
    if (this.stats.totalOperations > 0) {
      this.stats.hitRate = (this.stats.hits / this.stats.totalOperations) * 100;
    }
  }

  // 启动清理定时器
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 5 * 60 * 1000); // 每5分钟清理一次过期项
  }

  // 清理过期项
  private cleanupExpiredItems(): void {
    let cleanedCount = 0;
    const now = Date.now();
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.debug(`🧹 清理过期缓存项: ${cleanedCount} 个`);
    }
  }

  // 获取缓存大小
  getCacheSize(): {
    itemCount: number;
    memoryUsage: number;
    memoryUsageMB: number;
  } {
    let memoryUsage = 0;
    
    for (const [key, item] of this.memoryCache.entries()) {
      memoryUsage += key.length * 2; // 字符串长度 * 2字节
      memoryUsage += JSON.stringify(item).length * 2; // JSON字符串长度 * 2字节
    }
    
    return {
      itemCount: this.memoryCache.size,
      memoryUsage,
      memoryUsageMB: Math.round(memoryUsage / 1024 / 1024 * 100) / 100
    };
  }
}

export const fallbackCacheService = FallbackCacheService.getInstance();
