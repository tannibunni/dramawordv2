import express from 'express';
import { batchProcessingMiddleware, batchStatusMiddleware, flushBatchMiddleware } from '../middleware/batchProcessingMiddleware';
import { smartBatchProcessingService } from '../services/smartBatchProcessingService';
import { logger } from '../utils/logger';

const router = express.Router();

// 批量处理路由 - 学习记录
router.post('/learning-records', batchProcessingMiddleware('learningRecords'), (req, res) => {
  res.json({ success: true, message: '学习记录批量处理已启动' });
});

// 批量处理路由 - 经验值
router.post('/experience', batchProcessingMiddleware('experience'), (req, res) => {
  res.json({ success: true, message: '经验值批量处理已启动' });
});

// 批量处理路由 - 词汇数据
router.post('/vocabulary', batchProcessingMiddleware('vocabulary'), (req, res) => {
  res.json({ success: true, message: '词汇数据批量处理已启动' });
});

// 批量处理路由 - 用户统计
router.post('/user-stats', batchProcessingMiddleware('userStats'), (req, res) => {
  res.json({ success: true, message: '用户统计批量处理已启动' });
});

// 批量处理路由 - 剧单数据
router.post('/shows', batchProcessingMiddleware('shows'), (req, res) => {
  res.json({ success: true, message: '剧单数据批量处理已启动' });
});

// 批量处理路由 - 徽章数据
router.post('/badges', batchProcessingMiddleware('badges'), (req, res) => {
  res.json({ success: true, message: '徽章数据批量处理已启动' });
});

// 批量处理路由 - 搜索历史
router.post('/search-history', batchProcessingMiddleware('searchHistory'), (req, res) => {
  res.json({ success: true, message: '搜索历史批量处理已启动' });
});

// 批量处理路由 - 用户设置
router.post('/user-settings', batchProcessingMiddleware('userSettings'), (req, res) => {
  res.json({ success: true, message: '用户设置批量处理已启动' });
});

// 批量处理状态检查
router.get('/status/:dataType', batchStatusMiddleware);

// 批量处理状态检查 - 所有类型
router.get('/status', (req, res) => {
  try {
    const queueStatus = smartBatchProcessingService.getQueueStatus();
    const processingStats = smartBatchProcessingService.getProcessingStats();
    
    const allStatus = Array.from(queueStatus.entries()).map(([dataType, queueLength]) => {
      const stats = processingStats.get(dataType) || {
        totalProcessed: 0,
        totalErrors: 0,
        totalTime: 0,
        averageTimePerItem: 0,
        lastProcessed: 0
      };
      
      return {
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
        }
      };
    });

    res.json({
      success: true,
      data: {
        allStatus,
        totalQueued: Array.from(queueStatus.values()).reduce((sum, count) => sum + count, 0),
        totalProcessed: Array.from(processingStats.values()).reduce((sum, stats) => sum + stats.totalProcessed, 0),
        totalErrors: Array.from(processingStats.values()).reduce((sum, stats) => sum + stats.totalErrors, 0)
      }
    });
  } catch (error) {
    logger.error('❌ 获取批量处理状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取批量处理状态失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 强制刷新批量队列
router.post('/flush/:dataType', flushBatchMiddleware);

// 强制刷新所有批量队列
router.post('/flush', flushBatchMiddleware);

// 清空批量队列
router.delete('/queue/:dataType', (req, res) => {
  try {
    const { dataType } = req.params;
    smartBatchProcessingService.clearQueue(dataType);
    
    logger.info(`🗑️ 清空批量队列: ${dataType}`);
    res.json({
      success: true,
      message: `批量队列 ${dataType} 已清空`
    });
  } catch (error) {
    logger.error('❌ 清空批量队列失败:', error);
    res.status(500).json({
      success: false,
      message: '清空批量队列失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 清空所有批量队列
router.delete('/queue', (req, res) => {
  try {
    smartBatchProcessingService.clearAllQueues();
    
    logger.info('🗑️ 清空所有批量队列');
    res.json({
      success: true,
      message: '所有批量队列已清空'
    });
  } catch (error) {
    logger.error('❌ 清空所有批量队列失败:', error);
    res.status(500).json({
      success: false,
      message: '清空所有批量队列失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取批量处理统计
router.get('/stats', (req, res) => {
  try {
    const processingStats = smartBatchProcessingService.getProcessingStats();
    const queueStatus = smartBatchProcessingService.getQueueStatus();
    
    const stats = Array.from(processingStats.entries()).map(([dataType, stats]) => {
      const queueLength = queueStatus.get(dataType) || 0;
      
      return {
        dataType,
        queueLength,
        totalProcessed: stats.totalProcessed,
        totalErrors: stats.totalErrors,
        totalTime: stats.totalTime,
        averageTimePerItem: stats.averageTimePerItem,
        lastProcessed: stats.lastProcessed,
        successRate: stats.totalProcessed > 0 
          ? ((stats.totalProcessed - stats.totalErrors) / stats.totalProcessed * 100).toFixed(2) + '%'
          : '0%',
        throughput: stats.totalTime > 0 
          ? (stats.totalProcessed / (stats.totalTime / 1000)).toFixed(2) + ' items/sec'
          : '0 items/sec'
      };
    });

    const totalStats = {
      totalQueued: Array.from(queueStatus.values()).reduce((sum, count) => sum + count, 0),
      totalProcessed: Array.from(processingStats.values()).reduce((sum, stats) => sum + stats.totalProcessed, 0),
      totalErrors: Array.from(processingStats.values()).reduce((sum, stats) => sum + stats.totalErrors, 0),
      totalTime: Array.from(processingStats.values()).reduce((sum, stats) => sum + stats.totalTime, 0),
      overallSuccessRate: Array.from(processingStats.values()).reduce((sum, stats) => {
        const total = stats.totalProcessed;
        const errors = stats.totalErrors;
        return total > 0 ? sum + ((total - errors) / total * 100) : sum;
      }, 0) / processingStats.size
    };

    res.json({
      success: true,
      data: {
        stats,
        totalStats,
        summary: {
          activeQueues: Array.from(queueStatus.values()).filter(count => count > 0).length,
          totalQueues: queueStatus.size,
          averageSuccessRate: totalStats.overallSuccessRate.toFixed(2) + '%',
          averageThroughput: totalStats.totalTime > 0 
            ? (totalStats.totalProcessed / (totalStats.totalTime / 1000)).toFixed(2) + ' items/sec'
            : '0 items/sec'
        }
      }
    });
  } catch (error) {
    logger.error('❌ 获取批量处理统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取批量处理统计失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;
