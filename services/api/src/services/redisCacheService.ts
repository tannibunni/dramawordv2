/**
 * Redis缓存服务 - 高性能数据缓存
 * 提供智能缓存策略，减少数据库查询压力
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keepAlive: number;
  connectTimeout: number;
  commandTimeout: number;
}

export interface CacheStrategy {
  ttl: number;                    // 生存时间(秒)
  prefix: string;                 // 键前缀
  serialize?: boolean;            // 是否序列化
  compress?: boolean;             // 是否压缩
  fallbackToDb?: boolean;         // 缓存未命中时是否回退到数据库
}

export interface CacheStats {
  hits: number;                   // 缓存命中次数
  misses: number;                 // 缓存未命中次数
  sets: number;                   // 缓存设置次数
  deletes: number;                // 缓存删除次数
  errors: number;                 // 缓存错误次数
  hitRate: number;                // 命中率
  totalOperations: number;        // 总操作次数
}

export class RedisCacheService {
  private static instance: RedisCacheService;
  private redis: Redis;
  private isConnected: boolean = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0,
    totalOperations: 0
  };

  // 缓存策略配置
  private strategies: Map<string, CacheStrategy> = new Map();

  private constructor() {
    this.initializeRedis();
    this.initializeStrategies();
  }

  public static getInstance(): RedisCacheService {
    if (!RedisCacheService.instance) {
      RedisCacheService.instance = new RedisCacheService();
    }
    return RedisCacheService.instance;
  }

  // 初始化Redis连接
  private initializeRedis(): void {
    // 检查是否有Redis配置
    const hasRedisConfig = process.env.REDIS_HOST || process.env.REDIS_URL;
    
    if (!hasRedisConfig) {
      logger.warn('⚠️ 未检测到Redis配置，缓存功能将被禁用');
      this.isConnected = false;
      return;
    }

    let config: CacheConfig;
    
    // 优先使用REDIS_URL
    if (process.env.REDIS_URL) {
      logger.info('🔗 使用REDIS_URL连接Redis');
      logger.info('Redis URL:', process.env.REDIS_URL.replace(/:[^:]*@/, ':***@'));
      
      this.redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined
      });
    } else {
      // 使用单独的Redis配置
      config = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000
      };
      
      this.redis = new Redis(config);
    }

    // 监听连接事件
    this.redis.on('connect', () => {
      this.isConnected = true;
      logger.info('✅ Redis缓存服务连接成功');
    });

    this.redis.on('error', (error) => {
      this.isConnected = false;
      logger.error('❌ Redis缓存服务连接错误:', error);
      this.stats.errors++;
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      logger.warn('⚠️ Redis缓存服务连接关闭');
    });

    this.redis.on('reconnecting', () => {
      logger.info('🔄 Redis缓存服务重新连接中...');
    });
  }

  // 初始化缓存策略
  private initializeStrategies(): void {
    // 用户数据缓存策略
    this.strategies.set('user', {
      ttl: 3600,                    // 1小时
      prefix: 'user:',
      serialize: true,
      compress: false,
      fallbackToDb: true
    });

    // 用户进度缓存策略
    this.strategies.set('userProgress', {
      ttl: 1800,                    // 30分钟
      prefix: 'progress:',
      serialize: true,
      compress: false,
      fallbackToDb: true
    });

    // 词汇数据缓存策略
    this.strategies.set('word', {
      ttl: 7200,                    // 2小时
      prefix: 'word:',
      serialize: true,
      compress: false,
      fallbackToDb: true
    });

    // 学习记录缓存策略
    this.strategies.set('learningRecord', {
      ttl: 900,                     // 15分钟
      prefix: 'learning:',
      serialize: true,
      compress: false,
      fallbackToDb: true
    });

    // 剧单数据缓存策略
    this.strategies.set('show', {
      ttl: 1800,                    // 30分钟
      prefix: 'show:',
      serialize: true,
      compress: false,
      fallbackToDb: true
    });

    // 徽章数据缓存策略
    this.strategies.set('badge', {
      ttl: 1800,                    // 30分钟
      prefix: 'badge:',
      serialize: true,
      compress: false,
      fallbackToDb: true
    });

    // 搜索历史缓存策略
    this.strategies.set('searchHistory', {
      ttl: 3600,                    // 1小时
      prefix: 'search:',
      serialize: true,
      compress: false,
      fallbackToDb: true
    });

    // 经验值缓存策略
    this.strategies.set('experience', {
      ttl: 300,                     // 5分钟
      prefix: 'exp:',
      serialize: true,
      compress: false,
      fallbackToDb: true
    });

    logger.info('📊 缓存策略初始化完成');
  }

  // 生成缓存键
  private generateKey(strategy: string, identifier: string): string {
    const strategyConfig = this.strategies.get(strategy);
    if (!strategyConfig) {
      throw new Error(`未知的缓存策略: ${strategy}`);
    }
    return `${strategyConfig.prefix}${identifier}`;
  }

  // 序列化数据
  private serialize(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      logger.error('📊 数据序列化失败:', error);
      throw error;
    }
  }

  // 反序列化数据
  private deserialize<T>(data: string): T {
    try {
      return JSON.parse(data);
    } catch (error) {
      logger.error('📊 数据反序列化失败:', error);
      throw error;
    }
  }

  // 设置缓存
  public async set<T>(strategy: string, identifier: string, data: T): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      logger.warn('📊 Redis未连接，跳过缓存设置');
      return false;
    }

    try {
      const key = this.generateKey(strategy, identifier);
      const strategyConfig = this.strategies.get(strategy)!;
      
      const value = strategyConfig.serialize ? this.serialize(data) : data as string;
      
      await this.redis.setex(key, strategyConfig.ttl, value);
      
      this.stats.sets++;
      this.stats.totalOperations++;
      this.updateHitRate();
      
      logger.debug(`📊 缓存设置成功: ${key}`);
      return true;
    } catch (error) {
      logger.error('📊 缓存设置失败:', error);
      this.stats.errors++;
      this.stats.totalOperations++;
      return false;
    }
  }

  // 获取缓存
  public async get<T>(strategy: string, identifier: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      logger.warn('📊 Redis未连接，跳过缓存获取');
      this.stats.misses++;
      this.stats.totalOperations++;
      this.updateHitRate();
      return null;
    }

    try {
      const key = this.generateKey(strategy, identifier);
      const strategyConfig = this.strategies.get(strategy)!;
      
      const value = await this.redis.get(key);
      
      if (value === null) {
        this.stats.misses++;
        this.stats.totalOperations++;
        this.updateHitRate();
        logger.debug(`📊 缓存未命中: ${key}`);
        return null;
      }
      
      const data = strategyConfig.serialize ? this.deserialize<T>(value) : value as T;
      
      this.stats.hits++;
      this.stats.totalOperations++;
      this.updateHitRate();
      
      logger.debug(`📊 缓存命中: ${key}`);
      return data;
    } catch (error) {
      logger.error('📊 缓存获取失败:', error);
      this.stats.errors++;
      this.stats.misses++;
      this.stats.totalOperations++;
      this.updateHitRate();
      return null;
    }
  }

  // 删除缓存
  public async delete(strategy: string, identifier: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      logger.warn('📊 Redis未连接，跳过缓存删除');
      return false;
    }

    try {
      const key = this.generateKey(strategy, identifier);
      const result = await this.redis.del(key);
      
      this.stats.deletes++;
      this.stats.totalOperations++;
      this.updateHitRate();
      
      logger.debug(`📊 缓存删除成功: ${key}`);
      return result > 0;
    } catch (error) {
      logger.error('📊 缓存删除失败:', error);
      this.stats.errors++;
      this.stats.totalOperations++;
      return false;
    }
  }

  // 批量删除缓存
  public async deletePattern(strategy: string, pattern: string): Promise<number> {
    if (!this.isConnected || !this.redis) {
      logger.warn('📊 Redis未连接，跳过批量缓存删除');
      return 0;
    }

    try {
      const strategyConfig = this.strategies.get(strategy);
      if (!strategyConfig) {
        throw new Error(`未知的缓存策略: ${strategy}`);
      }

      const fullPattern = `${strategyConfig.prefix}${pattern}`;
      const keys = await this.redis.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      
      this.stats.deletes += result;
      this.stats.totalOperations += result;
      this.updateHitRate();
      
      logger.info(`📊 批量删除缓存成功: ${result} 个键`);
      return result;
    } catch (error) {
      logger.error('📊 批量删除缓存失败:', error);
      this.stats.errors++;
      return 0;
    }
  }

  // 检查缓存是否存在
  public async exists(strategy: string, identifier: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const key = this.generateKey(strategy, identifier);
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('📊 检查缓存存在性失败:', error);
      this.stats.errors++;
      return false;
    }
  }

  // 设置缓存过期时间
  public async expire(strategy: string, identifier: string, ttl: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const key = this.generateKey(strategy, identifier);
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('📊 设置缓存过期时间失败:', error);
      this.stats.errors++;
      return false;
    }
  }

  // 获取缓存剩余生存时间
  public async ttl(strategy: string, identifier: string): Promise<number> {
    if (!this.isConnected) {
      return -1;
    }

    try {
      const key = this.generateKey(strategy, identifier);
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('📊 获取缓存TTL失败:', error);
      this.stats.errors++;
      return -1;
    }
  }

  // 更新命中率
  private updateHitRate(): void {
    if (this.stats.totalOperations > 0) {
      this.stats.hitRate = this.stats.hits / this.stats.totalOperations;
    }
  }

  // 获取缓存统计信息
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  // 重置统计信息
  public resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      totalOperations: 0
    };
    logger.info('📊 缓存统计信息已重置');
  }

  // 获取Redis信息
  public async getRedisInfo(): Promise<any> {
    if (!this.isConnected || !this.redis) {
      return null;
    }

    try {
      const info = await this.redis.info();
      return info;
    } catch (error) {
      logger.error('📊 获取Redis信息失败:', error);
      return null;
    }
  }

  // 健康检查
  public async healthCheck(): Promise<{
    isHealthy: boolean;
    isConnected: boolean;
    stats: CacheStats;
    redisInfo?: any;
  }> {
    const isHealthy = this.isConnected && this.redis && this.stats.errors < 100;
    const redisInfo = this.redis ? await this.getRedisInfo() : null;

    return {
      isHealthy,
      isConnected: this.isConnected,
      stats: this.getStats(),
      redisInfo
    };
  }

  // 预热缓存
  public async warmupCache<T>(
    strategy: string,
    data: Array<{ identifier: string; data: T }>
  ): Promise<number> {
    let successCount = 0;

    for (const item of data) {
      const success = await this.set(strategy, item.identifier, item.data);
      if (success) {
        successCount++;
      }
    }

    logger.info(`📊 缓存预热完成: ${successCount}/${data.length} 成功`);
    return successCount;
  }

  // 清理过期缓存
  public async cleanupExpiredCache(): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      // Redis会自动清理过期键，这里只是记录统计信息
      const info = await this.redis.info('memory');
      logger.info('📊 缓存清理检查完成');
      return 0;
    } catch (error) {
      logger.error('📊 缓存清理失败:', error);
      return 0;
    }
  }

  // 关闭连接
  public async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      logger.info('📴 Redis缓存服务连接已关闭');
    }
  }
}

export default RedisCacheService;
