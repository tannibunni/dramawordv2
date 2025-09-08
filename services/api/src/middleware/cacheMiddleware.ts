/**
 * 缓存中间件 - 智能缓存策略
 * 自动处理缓存逻辑，减少数据库查询
 */

import { Request, Response, NextFunction } from 'express';
import RedisCacheService from '../services/redisCacheService';
import { logger } from '../utils/logger';

export interface CacheMiddlewareOptions {
  strategy: string;                    // 缓存策略
  keyGenerator?: (req: Request) => string;  // 自定义键生成器
  ttl?: number;                       // 自定义TTL
  skipCache?: (req: Request) => boolean;    // 跳过缓存条件
  onCacheHit?: (req: Request, data: any) => void;  // 缓存命中回调
  onCacheMiss?: (req: Request) => void;     // 缓存未命中回调
}

export interface CacheableRequest extends Request {
  cacheKey?: string;
  cacheStrategy?: string;
  skipCache?: boolean;
}

// 缓存中间件工厂
export function createCacheMiddleware(options: CacheMiddlewareOptions) {
  const cacheService = RedisCacheService.getInstance();

  return async (req: CacheableRequest, res: Response, next: NextFunction) => {
    try {
      // 检查是否跳过缓存
      if (options.skipCache && options.skipCache(req)) {
        req.skipCache = true;
        return next();
      }

      // 生成缓存键
      const cacheKey = options.keyGenerator ? 
        options.keyGenerator(req) : 
        generateDefaultCacheKey(req, options.strategy);

      req.cacheKey = cacheKey;
      req.cacheStrategy = options.strategy;

      // 尝试从缓存获取数据
      const cachedData = await cacheService.get(options.strategy, cacheKey);

      if (cachedData) {
        // 缓存命中
        if (options.onCacheHit) {
          options.onCacheHit(req, cachedData);
        }

        logger.debug(`📊 缓存命中: ${cacheKey}`);
        
        // 设置缓存头信息
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'X-Cache-Strategy': options.strategy
        });

        // 返回缓存数据
        return res.json({
          success: true,
          data: cachedData,
          cached: true,
          cacheKey
        });
      } else {
        // 缓存未命中
        if (options.onCacheMiss) {
          options.onCacheMiss(req);
        }

        logger.debug(`📊 缓存未命中: ${cacheKey}`);

        // 设置缓存头信息
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'X-Cache-Strategy': options.strategy
        });

        // 继续处理请求
        next();
      }
    } catch (error) {
      logger.error('📊 缓存中间件错误:', error);
      // 出错时继续处理请求
      next();
    }
  };
}

// 缓存设置中间件
export function createCacheSetMiddleware(options: CacheMiddlewareOptions) {
  const cacheService = RedisCacheService.getInstance();

  return async (req: CacheableRequest, res: Response, next: NextFunction) => {
    // 保存原始的json方法
    const originalJson = res.json;

    // 重写json方法以拦截响应数据
    res.json = function(data: any) {
      // 检查响应是否已经发送
      if (res.headersSent) {
        logger.warn('📊 响应已发送，跳过缓存设置');
        return originalJson.call(this, data);
      }

      // 调用原始json方法
      const result = originalJson.call(this, data);

      // 异步设置缓存
      setCacheAsync(req, data, options, cacheService);

      return result;
    };

    next();
  };
}

// 异步设置缓存
async function setCacheAsync(
  req: CacheableRequest,
  data: any,
  options: CacheMiddlewareOptions,
  cacheService: RedisCacheService
): Promise<void> {
  try {
    if (req.skipCache || !req.cacheKey || !req.cacheStrategy) {
      return;
    }

    // 只缓存成功的响应
    if (data && data.success !== false) {
      const ttl = options.ttl;
      const success = await cacheService.set(req.cacheStrategy, req.cacheKey, data);

      if (success) {
        logger.debug(`📊 缓存设置成功: ${req.cacheKey}`);
      } else {
        logger.warn(`📊 缓存设置失败: ${req.cacheKey}`);
      }
    }
  } catch (error) {
    logger.error('📊 异步缓存设置错误:', error);
  }
}

// 生成默认缓存键
function generateDefaultCacheKey(req: Request, strategy: string): string {
  const userId = (req as any).user?.id || 'anonymous';
  const method = req.method;
  const path = req.path;
  const query = JSON.stringify(req.query);
  const body = req.method === 'POST' ? JSON.stringify(req.body) : '';

  return `${strategy}:${method}:${path}:${userId}:${hashString(query + body)}`;
}

// 字符串哈希函数
function hashString(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return Math.abs(hash).toString(36);
}

// 预定义的缓存中间件

// 用户数据缓存中间件
export const userCacheMiddleware = createCacheMiddleware({
  strategy: 'user',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    return `profile:${userId}`;
  },
  skipCache: (req) => {
    // 跳过缓存的条件
    return req.method !== 'GET' || req.query.refresh === 'true';
  }
});

export const userCacheSetMiddleware = createCacheSetMiddleware({
  strategy: 'user',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    return `profile:${userId}`;
  }
});

// 词汇数据缓存中间件
export const wordCacheMiddleware = createCacheMiddleware({
  strategy: 'word',
  keyGenerator: (req) => {
    const wordId = req.params.id || req.query.wordId;
    const userId = (req as any).user?.id || 'anonymous';
    return `word:${wordId}:${userId}`;
  },
  skipCache: (req) => {
    return req.method !== 'GET' || req.query.refresh === 'true';
  }
});

export const wordCacheSetMiddleware = createCacheSetMiddleware({
  strategy: 'word',
  keyGenerator: (req) => {
    const wordId = req.params.id || req.query.wordId;
    const userId = (req as any).user?.id || 'anonymous';
    return `word:${wordId}:${userId}`;
  }
});

// 学习记录缓存中间件
export const learningCacheMiddleware = createCacheMiddleware({
  strategy: 'learningRecord',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    const date = req.query.date || new Date().toISOString().split('T')[0];
    return `learning:${userId}:${date}`;
  },
  skipCache: (req) => {
    return req.method !== 'GET' || req.query.refresh === 'true';
  }
});

export const learningCacheSetMiddleware = createCacheSetMiddleware({
  strategy: 'learningRecord',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    const date = req.query.date || new Date().toISOString().split('T')[0];
    return `learning:${userId}:${date}`;
  }
});

// 剧单数据缓存中间件
export const showCacheMiddleware = createCacheMiddleware({
  strategy: 'show',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    const showId = req.params.id || req.query.showId;
    return `show:${showId || 'list'}:${userId}`;
  },
  skipCache: (req) => {
    return req.method !== 'GET' || req.query.refresh === 'true';
  }
});

export const showCacheSetMiddleware = createCacheSetMiddleware({
  strategy: 'show',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    const showId = req.params.id || req.query.showId;
    return `show:${showId || 'list'}:${userId}`;
  }
});

// 徽章数据缓存中间件
export const badgeCacheMiddleware = createCacheMiddleware({
  strategy: 'badge',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    const badgeId = req.params.id || req.query.badgeId;
    return `badge:${badgeId || 'list'}:${userId}`;
  },
  skipCache: (req) => {
    return req.method !== 'GET' || req.query.refresh === 'true';
  }
});

export const badgeCacheSetMiddleware = createCacheSetMiddleware({
  strategy: 'badge',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    const badgeId = req.params.id || req.query.badgeId;
    return `badge:${badgeId || 'list'}:${userId}`;
  }
});

// 经验值缓存中间件
export const experienceCacheMiddleware = createCacheMiddleware({
  strategy: 'experience',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    return `experience:${userId}`;
  },
  skipCache: (req) => {
    return req.method !== 'GET' || req.query.refresh === 'true';
  }
});

export const experienceCacheSetMiddleware = createCacheSetMiddleware({
  strategy: 'experience',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    return `experience:${userId}`;
  }
});

// 缓存清理中间件
export function createCacheClearMiddleware(strategies: string[]) {
  const cacheService = RedisCacheService.getInstance();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return next();
      }

      // 清理用户相关的所有缓存
      for (const strategy of strategies) {
        await cacheService.deletePattern(strategy, `*:${userId}:*`);
      }

      logger.info(`📊 清理用户缓存: ${userId}`);
      next();
    } catch (error) {
      logger.error('📊 缓存清理中间件错误:', error);
      next();
    }
  };
}

// 缓存统计中间件
export function cacheStatsMiddleware(req: Request, res: Response, next: NextFunction) {
  const cacheService = RedisCacheService.getInstance();
  
  // 在响应开始时添加缓存统计信息
  const originalJson = res.json;
  res.json = function(data: any) {
    // 检查响应是否已经发送
    if (!res.headersSent) {
      try {
        const stats = cacheService.getStats();
        res.set({
          'X-Cache-Hits': stats.hits.toString(),
          'X-Cache-Misses': stats.misses.toString(),
          'X-Cache-Hit-Rate': (stats.hitRate * 100).toFixed(2) + '%',
          'X-Cache-Total-Ops': stats.totalOperations.toString()
        });
      } catch (error) {
        // 如果设置头信息失败，记录警告但不中断响应
        logger.warn('📊 设置缓存统计头信息失败:', error);
      }
    }
    
    return originalJson.call(this, data);
  };

  next();
}

export default {
  createCacheMiddleware,
  createCacheSetMiddleware,
  createCacheClearMiddleware,
  cacheStatsMiddleware,
  userCacheMiddleware,
  userCacheSetMiddleware,
  wordCacheMiddleware,
  wordCacheSetMiddleware,
  learningCacheMiddleware,
  learningCacheSetMiddleware,
  showCacheMiddleware,
  showCacheSetMiddleware,
  badgeCacheMiddleware,
  badgeCacheSetMiddleware,
  experienceCacheMiddleware,
  experienceCacheSetMiddleware
};
