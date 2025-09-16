import { Request, Response, NextFunction } from 'express';
import { connectionPoolMonitor } from '../services/connectionPoolMonitor';
import { logger } from '../utils/logger';

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

export const databasePerformanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // 记录请求开始时间
  req.startTime = startTime;
  
  // 监听响应结束
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // 记录响应时间
    connectionPoolMonitor.recordResponseTime(responseTime);
    
    // 记录慢查询
    if (responseTime > 1000) {
      logger.warn(`🐌 Slow query detected: ${req.method} ${req.path} - ${responseTime}ms`);
    }
    
    // 记录数据库操作统计
    logger.info(`📊 Database operation: ${req.method} ${req.path} - ${responseTime}ms`);
  });
  
  // 监听错误
  res.on('error', (error) => {
    connectionPoolMonitor.recordError();
    logger.error(`❌ Database operation error: ${req.method} ${req.path} - ${error.message}`);
  });
  
  next();
};
