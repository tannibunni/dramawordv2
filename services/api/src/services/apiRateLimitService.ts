/**
 * API限流服务 - 防止数据库过载
 * 基于用户、IP和端点的智能限流机制
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface RateLimitConfig {
  windowMs: number;        // 时间窗口(毫秒)
  maxRequests: number;     // 最大请求数
  skipSuccessfulRequests?: boolean;  // 跳过成功请求
  skipFailedRequests?: boolean;      // 跳过失败请求
  keyGenerator?: (req: Request) => string;  // 自定义键生成器
  onLimitReached?: (req: Request, res: Response) => void;  // 限流回调
}

export interface RateLimitRule {
  endpoint: string;        // 端点路径
  config: RateLimitConfig; // 限流配置
  priority: 'low' | 'medium' | 'high';  // 优先级
}

export interface RateLimitStats {
  key: string;
  count: number;
  resetTime: number;
  blocked: boolean;
}

export class ApiRateLimitService {
  private static instance: ApiRateLimitService;
  private rules: Map<string, RateLimitRule> = new Map();
  private counters: Map<string, { count: number; resetTime: number }> = new Map();
  private blockedKeys: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeDefaultRules();
    this.startCleanup();
  }

  public static getInstance(): ApiRateLimitService {
    if (!ApiRateLimitService.instance) {
      ApiRateLimitService.instance = new ApiRateLimitService();
    }
    return ApiRateLimitService.instance;
  }

  // 初始化默认限流规则
  private initializeDefaultRules(): void {
    // 用户认证相关 - 高优先级
    this.addRule({
      endpoint: '/api/auth/login',
      config: {
        windowMs: 15 * 60 * 1000,  // 15分钟
        maxRequests: 5,            // 最多5次登录尝试
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      priority: 'high'
    });

    this.addRule({
      endpoint: '/api/auth/register',
      config: {
        windowMs: 60 * 60 * 1000,  // 1小时
        maxRequests: 3,            // 最多3次注册尝试
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      priority: 'high'
    });

    // 数据同步相关 - 中优先级
    this.addRule({
      endpoint: '/api/sync/upload',
      config: {
        windowMs: 60 * 1000,       // 1分钟
        maxRequests: 10,           // 最多10次上传
        skipSuccessfulRequests: true,
        skipFailedRequests: false
      },
      priority: 'medium'
    });

    this.addRule({
      endpoint: '/api/sync/download',
      config: {
        windowMs: 60 * 1000,       // 1分钟
        maxRequests: 20,           // 最多20次下载
        skipSuccessfulRequests: true,
        skipFailedRequests: false
      },
      priority: 'medium'
    });

    // 学习记录相关 - 中优先级
    this.addRule({
      endpoint: '/api/learning',
      config: {
        windowMs: 60 * 1000,       // 1分钟
        maxRequests: 30,           // 最多30次学习操作
        skipSuccessfulRequests: true,
        skipFailedRequests: false
      },
      priority: 'medium'
    });

    // 词汇查询相关 - 低优先级
    this.addRule({
      endpoint: '/api/words',
      config: {
        windowMs: 60 * 1000,       // 1分钟
        maxRequests: 100,          // 最多100次查询
        skipSuccessfulRequests: true,
        skipFailedRequests: false
      },
      priority: 'low'
    });

    // 剧单相关 - 低优先级
    this.addRule({
      endpoint: '/api/shows',
      config: {
        windowMs: 60 * 1000,       // 1分钟
        maxRequests: 50,           // 最多50次剧单操作
        skipSuccessfulRequests: true,
        skipFailedRequests: false
      },
      priority: 'low'
    });

    // 全局IP限流 - 最高优先级
    this.addRule({
      endpoint: '*',  // 全局规则
      config: {
        windowMs: 60 * 1000,       // 1分钟
        maxRequests: 200,          // 每个IP最多200次请求
        skipSuccessfulRequests: true,
        skipFailedRequests: false,
        keyGenerator: (req) => `ip:${req.ip}`
      },
      priority: 'high'
    });

    logger.info('📊 API限流规则初始化完成');
  }

  // 添加限流规则
  public addRule(rule: RateLimitRule): void {
    this.rules.set(rule.endpoint, rule);
    logger.info(`📊 添加限流规则: ${rule.endpoint} - ${rule.config.maxRequests}/${rule.config.windowMs}ms`);
  }

  // 移除限流规则
  public removeRule(endpoint: string): void {
    this.rules.delete(endpoint);
    logger.info(`📊 移除限流规则: ${endpoint}`);
  }

  // 获取限流中间件
  public getRateLimitMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = this.checkRateLimit(req);
        
        if (result.allowed) {
          // 设置限流头信息
          res.set({
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString()
          });
          next();
        } else {
          // 限流触发
          res.set({
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          });

          logger.warn(`🚨 API限流触发: ${req.method} ${req.path} - ${result.key}`);
          
          res.status(429).json({
            error: 'Too Many Requests',
            message: '请求过于频繁，请稍后再试',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          });
        }
      } catch (error) {
        logger.error('📊 限流检查失败:', error);
        next(); // 出错时允许通过
      }
    };
  }

  // 检查限流
  private checkRateLimit(req: Request): {
    allowed: boolean;
    key: string;
    limit: number;
    remaining: number;
    resetTime: number;
  } {
    const path = req.path;
    const method = req.method;
    
    // 查找匹配的规则
    let rule: RateLimitRule | undefined;
    
    // 1. 精确匹配
    rule = this.rules.get(`${method}:${path}`);
    if (!rule) {
      // 2. 路径匹配
      rule = this.rules.get(path);
      if (!rule) {
        // 3. 全局规则
        rule = this.rules.get('*');
      }
    }

    if (!rule) {
      return {
        allowed: true,
        key: 'no-rule',
        limit: 0,
        remaining: 0,
        resetTime: Date.now()
      };
    }

    // 生成限流键
    const key = rule.config.keyGenerator ? 
      rule.config.keyGenerator(req) : 
      this.generateDefaultKey(req, rule.endpoint);

    // 检查是否被阻止
    if (this.blockedKeys.has(key)) {
      return {
        allowed: false,
        key,
        limit: rule.config.maxRequests,
        remaining: 0,
        resetTime: this.getCounter(key).resetTime
      };
    }

    // 获取或创建计数器
    const counter = this.getCounter(key);
    const now = Date.now();

    // 检查是否需要重置计数器
    if (now >= counter.resetTime) {
      counter.count = 0;
      counter.resetTime = now + rule.config.windowMs;
    }

    // 检查限流
    if (counter.count >= rule.config.maxRequests) {
      // 触发限流
      this.blockedKeys.add(key);
      
      // 设置自动解封时间
      setTimeout(() => {
        this.blockedKeys.delete(key);
      }, rule.config.windowMs);

      return {
        allowed: false,
        key,
        limit: rule.config.maxRequests,
        remaining: 0,
        resetTime: counter.resetTime
      };
    }

    // 增加计数
    counter.count++;

    return {
      allowed: true,
      key,
      limit: rule.config.maxRequests,
      remaining: rule.config.maxRequests - counter.count,
      resetTime: counter.resetTime
    };
  }

  // 生成默认限流键
  private generateDefaultKey(req: Request, endpoint: string): string {
    const userId = (req as any).user?.id || 'anonymous';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (endpoint === '*') {
      return `ip:${ip}`;
    }
    
    return `user:${userId}:ip:${ip}:${endpoint}`;
  }

  // 获取计数器
  private getCounter(key: string): { count: number; resetTime: number } {
    if (!this.counters.has(key)) {
      this.counters.set(key, {
        count: 0,
        resetTime: Date.now() + 60 * 1000 // 默认1分钟
      });
    }
    return this.counters.get(key)!;
  }

  // 启动清理任务
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }

  // 清理过期数据
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, counter] of this.counters.entries()) {
      if (now >= counter.resetTime + 60 * 1000) { // 过期1分钟后清理
        this.counters.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`📊 清理过期限流数据: ${cleanedCount} 条`);
    }
  }

  // 获取限流统计
  public getStats(): {
    totalRules: number;
    activeCounters: number;
    blockedKeys: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  } {
    const endpointCounts = new Map<string, number>();
    
    for (const [key, counter] of this.counters.entries()) {
      const endpoint = key.split(':').pop() || 'unknown';
      endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + counter.count);
    }

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRules: this.rules.size,
      activeCounters: this.counters.size,
      blockedKeys: this.blockedKeys.size,
      topEndpoints
    };
  }

  // 重置限流计数器
  public resetCounter(key: string): void {
    this.counters.delete(key);
    this.blockedKeys.delete(key);
    logger.info(`📊 重置限流计数器: ${key}`);
  }

  // 更新限流规则
  public updateRule(endpoint: string, config: Partial<RateLimitConfig>): void {
    const rule = this.rules.get(endpoint);
    if (rule) {
      rule.config = { ...rule.config, ...config };
      logger.info(`📊 更新限流规则: ${endpoint}`);
    }
  }

  // 获取特定键的限流状态
  public getKeyStatus(key: string): RateLimitStats | null {
    const counter = this.counters.get(key);
    if (!counter) {
      return null;
    }

    return {
      key,
      count: counter.count,
      resetTime: counter.resetTime,
      blocked: this.blockedKeys.has(key)
    };
  }

  // 停止服务
  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    logger.info('📊 API限流服务已停止');
  }
}

export default ApiRateLimitService;
