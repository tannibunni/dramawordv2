// services/api/src/utils/rateLimiter.ts
import { logger } from './logger';

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxConcurrentRequests: number;
  retryDelay: number; // 毫秒
  maxRetries: number;
}

class OpenAIRateLimiter {
  private requestQueue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private requestCount = 0;
  private lastResetTime = Date.now();
  
  private config: RateLimitConfig = {
    maxRequestsPerMinute: 60, // 每分钟最多60个请求
    maxConcurrentRequests: 5, // 最多5个并发请求
    retryDelay: 1000, // 1秒重试延迟
    maxRetries: 3 // 最多重试3次
  };

  constructor(config?: Partial<RateLimitConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // 检查是否超过频率限制
  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.lastResetTime >= 60000) { // 1分钟重置
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    
    if (this.requestCount >= this.config.maxRequestsPerMinute) {
      logger.warn(`⚠️ OpenAI API频率限制: ${this.requestCount}/${this.config.maxRequestsPerMinute}`);
      return false;
    }
    
    if (this.activeRequests >= this.config.maxConcurrentRequests) {
      logger.warn(`⚠️ OpenAI API并发限制: ${this.activeRequests}/${this.config.maxConcurrentRequests}`);
      return false;
    }
    
    return true;
  }

  // 执行请求
  async executeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async (retryCount = 0) => {
        try {
          if (!this.checkRateLimit()) {
            // 如果超过限制，加入队列等待
            this.requestQueue.push(() => execute(retryCount));
            return;
          }

          this.activeRequests++;
          this.requestCount++;
          
          logger.info(`🚀 OpenAI请求开始: ${this.activeRequests}个并发, ${this.requestCount}个/分钟`);
          
          const result = await requestFn();
          
          this.activeRequests--;
          logger.info(`✅ OpenAI请求完成: ${this.activeRequests}个并发`);
          
          // 处理队列中的下一个请求
          this.processQueue();
          
          resolve(result);
        } catch (error) {
          this.activeRequests--;
          logger.error(`❌ OpenAI请求失败: ${error.message}`);
          
          // 改进错误日志记录
          if (error && typeof error === 'object') {
            const errorObj = error as any;
            logger.error(`❌ OpenAI请求详细错误:`, {
              message: errorObj.message,
              type: errorObj.constructor?.name || 'Unknown',
              status: errorObj.status,
              code: errorObj.code,
              response: errorObj.response?.data,
              requestId: errorObj.requestId
            });
          }
          
          if (retryCount < this.config.maxRetries) {
            logger.info(`🔄 重试请求 (${retryCount + 1}/${this.config.maxRetries})`);
            setTimeout(() => execute(retryCount + 1), this.config.retryDelay);
          } else {
            logger.error(`❌ 请求重试次数已达上限，最终失败`);
            reject(error);
          }
        }
      };
      
      execute();
    });
  }

  // 处理队列
  private processQueue() {
    if (this.requestQueue.length > 0 && this.checkRateLimit()) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }

  // 获取当前状态
  getStatus() {
    return {
      activeRequests: this.activeRequests,
      requestCount: this.requestCount,
      queueLength: this.requestQueue.length,
      lastResetTime: this.lastResetTime
    };
  }

  // 更新配置
  updateConfig(config: Partial<RateLimitConfig>) {
    this.config = { ...this.config, ...config };
    logger.info(`⚙️ 更新限流配置:`, this.config);
  }
}

// 创建全局实例
export const openAIRateLimiter = new OpenAIRateLimiter();

// 根据用户数量动态调整配置
export function updateRateLimitForUserCount(userCount: number) {
  if (userCount <= 10) {
    // 小规模用户：保守配置
    openAIRateLimiter.updateConfig({
      maxRequestsPerMinute: 30,
      maxConcurrentRequests: 3,
      retryDelay: 2000
    });
  } else if (userCount <= 100) {
    // 中等规模用户：平衡配置
    openAIRateLimiter.updateConfig({
      maxRequestsPerMinute: 60,
      maxConcurrentRequests: 5,
      retryDelay: 1000
    });
  } else if (userCount <= 1000) {
    // 大规模用户：积极配置
    openAIRateLimiter.updateConfig({
      maxRequestsPerMinute: 120,
      maxConcurrentRequests: 10,
      retryDelay: 500
    });
  } else {
    // 超大规模用户：需要更复杂的架构
    logger.warn(`⚠️ 用户数量过多(${userCount})，建议升级OpenAI计划或使用缓存策略`);
  }
} 