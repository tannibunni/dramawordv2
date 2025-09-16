import { Request, Response, NextFunction } from 'express';
import { smartBatchProcessingService } from '../services/smartBatchProcessingService';
import { logger } from '../utils/logger';

export interface BatchProcessingRequest extends Request {
  batchData?: any[];
  batchType?: string;
  userId?: string;
}

export const batchProcessingMiddleware = (dataType: string) => {
  return async (req: BatchProcessingRequest, res: Response, next: NextFunction) => {
    try {
      // 检查是否为批量请求
      if (req.body && Array.isArray(req.body.data)) {
        const userId = (req as any).user?.id || req.query.userId as string;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: '用户ID缺失'
          });
        }

        // 将批量数据添加到处理队列
        const batchPromises = req.body.data.map((item: any) => 
          smartBatchProcessingService.addOperation(dataType, {
            type: dataType,
            userId: userId,
            data: item,
            priority: item.priority || 'medium'
          }, userId)
        );

        await Promise.all(batchPromises);

        // 获取队列状态
        const queueStatus = smartBatchProcessingService.getQueueStatus();
        const queueLength = queueStatus.get(dataType) || 0;

        logger.info(`📦 批量数据已加入队列: ${dataType}, 数量: ${req.body.data.length}, 队列长度: ${queueLength}`);

        // 返回队列状态而不是立即处理结果
        return res.json({
          success: true,
          message: `批量数据已加入处理队列`,
          data: {
            queuedCount: req.body.data.length,
            queueLength,
            dataType,
            estimatedProcessingTime: estimateProcessingTime(dataType, queueLength || 0)
          }
        });
      }

      // 非批量请求，继续正常处理
      next();
    } catch (error) {
      logger.error(`❌ 批量处理中间件错误: ${dataType}`, error);
      res.status(500).json({
        success: false,
        message: '批量处理失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };
};

// 估算处理时间
function estimateProcessingTime(dataType: string, queueLength: number): number {
  const estimates: Record<string, number> = {
    'learningRecords': 50,    // 50ms per item
    'experience': 20,         // 20ms per item
    'vocabulary': 100,        // 100ms per item
    'userStats': 200,         // 200ms per item
    'shows': 300,             // 300ms per item
    'badges': 150,            // 150ms per item
    'searchHistory': 30,      // 30ms per item
    'userSettings': 500       // 500ms per item
  };

  const baseTime = estimates[dataType] || 100;
  return Math.ceil((queueLength * baseTime) / 1000); // 转换为秒
}

// 批量处理状态检查中间件
export const batchStatusMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const dataType = req.params.dataType || req.query.dataType as string;
    
    if (!dataType) {
      return res.status(400).json({
        success: false,
        message: '数据类型参数缺失'
      });
    }

    const queueStatus = smartBatchProcessingService.getQueueStatus();
    const processingStats = smartBatchProcessingService.getProcessingStats();
    
    const queueLength = queueStatus.get(dataType) || 0;
    const stats = processingStats.get(dataType) || {
      totalProcessed: 0,
      totalErrors: 0,
      totalTime: 0,
      averageTimePerItem: 0,
      lastProcessed: 0
    };

    res.json({
      success: true,
      data: {
        dataType,
        queueLength,
        isProcessing: queueLength > 0,
        stats: {
          totalProcessed: stats.totalProcessed,
          totalErrors: stats.totalErrors,
          totalTime: stats.totalTime,
          averageTimePerItem: stats.averageTimePerItem,
          lastProcessed: stats.lastProcessed,
          successRate: stats.totalProcessed > 0 
            ? ((stats.totalProcessed - stats.totalErrors) / stats.totalProcessed * 100).toFixed(2) + '%'
            : '0%'
        },
        estimatedProcessingTime: estimateProcessingTime(dataType, queueLength || 0)
      }
    });
  } catch (error) {
    logger.error('❌ 批量状态检查错误:', error);
    res.status(500).json({
      success: false,
      message: '获取批量处理状态失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 强制刷新批量队列中间件
export const flushBatchMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const dataType = req.params.dataType || req.query.dataType as string;
    
    if (dataType) {
      // 刷新特定类型的队列
      // smartBatchProcessingService.processBatch(dataType);
      logger.info(`🔄 强制刷新批量队列: ${dataType}`);
    } else {
      // 刷新所有队列
      smartBatchProcessingService.flushAllBatches();
      logger.info(`🔄 强制刷新所有批量队列`);
    }

    res.json({
      success: true,
      message: dataType ? `批量队列 ${dataType} 已刷新` : '所有批量队列已刷新'
    });
  } catch (error) {
    logger.error('❌ 强制刷新批量队列错误:', error);
    res.status(500).json({
      success: false,
      message: '刷新批量队列失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};
