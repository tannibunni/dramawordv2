/**
 * 缓存监控路由 - 提供缓存监控和告警API
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth';
import CacheMonitoringService from '../services/cacheMonitoringService';
import RedisCacheService from '../services/redisCacheService';
import { logger } from '../utils/logger';

const router = express.Router();

// 获取缓存健康状态
router.get('/health', async (req, res) => {
  try {
    const monitoringService = CacheMonitoringService.getInstance();
    const healthReport = monitoringService.getHealthReport();
    
    res.json({
      success: true,
      data: healthReport
    });
  } catch (error) {
    logger.error('获取缓存健康状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取缓存健康状态失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取缓存统计信息
router.get('/stats', async (req, res) => {
  try {
    const monitoringService = CacheMonitoringService.getInstance();
    const cacheService = RedisCacheService.getInstance();
    
    const monitoringStats = monitoringService.getCacheStats();
    const cacheStats = cacheService.getStats();
    
    res.json({
      success: true,
      data: {
        monitoring: monitoringStats,
        cache: cacheStats
      }
    });
  } catch (error) {
    logger.error('获取缓存统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取缓存统计信息失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取当前告警
router.get('/alerts', async (req, res) => {
  try {
    const monitoringService = CacheMonitoringService.getInstance();
    const alerts = monitoringService.getCurrentAlerts();
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('获取缓存告警失败:', error);
    res.status(500).json({
      success: false,
      message: '获取缓存告警失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 清除告警
router.delete('/alerts', authenticateToken, async (req, res) => {
  try {
    const monitoringService = CacheMonitoringService.getInstance();
    monitoringService.clearAlerts();
    
    res.json({
      success: true,
      message: '告警已清除'
    });
  } catch (error) {
    logger.error('清除缓存告警失败:', error);
    res.status(500).json({
      success: false,
      message: '清除缓存告警失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 手动触发健康检查
router.post('/health-check', authenticateToken, async (req, res) => {
  try {
    const monitoringService = CacheMonitoringService.getInstance();
    const metrics = await monitoringService.triggerHealthCheck();
    
    res.json({
      success: true,
      message: '健康检查完成',
      data: metrics
    });
  } catch (error) {
    logger.error('手动健康检查失败:', error);
    res.status(500).json({
      success: false,
      message: '手动健康检查失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取Redis信息
router.get('/redis-info', authenticateToken, async (req, res) => {
  try {
    const cacheService = RedisCacheService.getInstance();
    const redisInfo = await cacheService.getRedisInfo();
    
    res.json({
      success: true,
      data: redisInfo
    });
  } catch (error) {
    logger.error('获取Redis信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取Redis信息失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 重置缓存统计
router.post('/reset-stats', authenticateToken, async (req, res) => {
  try {
    const cacheService = RedisCacheService.getInstance();
    cacheService.resetStats();
    
    res.json({
      success: true,
      message: '缓存统计已重置'
    });
  } catch (error) {
    logger.error('重置缓存统计失败:', error);
    res.status(500).json({
      success: false,
      message: '重置缓存统计失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 启动/停止监控
router.post('/monitoring/:action', authenticateToken, async (req, res) => {
  try {
    const { action } = req.params;
    const monitoringService = CacheMonitoringService.getInstance();
    
    if (action === 'start') {
      monitoringService.startMonitoring();
      res.json({
        success: true,
        message: '缓存监控已启动'
      });
    } else if (action === 'stop') {
      monitoringService.stopMonitoring();
      res.json({
        success: true,
        message: '缓存监控已停止'
      });
    } else {
      res.status(400).json({
        success: false,
        message: '无效的操作，支持的操作: start, stop'
      });
    }
  } catch (error) {
    logger.error('监控操作失败:', error);
    res.status(500).json({
      success: false,
      message: '监控操作失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 更新告警阈值
router.put('/thresholds', authenticateToken, async (req, res) => {
  try {
    const { thresholds } = req.body;
    const monitoringService = CacheMonitoringService.getInstance();
    
    monitoringService.updateThresholds(thresholds);
    
    res.json({
      success: true,
      message: '告警阈值已更新'
    });
  } catch (error) {
    logger.error('更新告警阈值失败:', error);
    res.status(500).json({
      success: false,
      message: '更新告警阈值失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 缓存预热
router.post('/warmup', authenticateToken, async (req, res) => {
  try {
    const { strategy, data } = req.body;
    const cacheService = RedisCacheService.getInstance();
    
    if (!strategy || !data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: '请提供策略和数据数组'
      });
    }
    
    const successCount = await cacheService.warmupCache(strategy, data);
    
    res.json({
      success: true,
      message: '缓存预热完成',
      data: {
        total: data.length,
        success: successCount,
        failed: data.length - successCount
      }
    });
  } catch (error) {
    logger.error('缓存预热失败:', error);
    res.status(500).json({
      success: false,
      message: '缓存预热失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 清理过期缓存
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    const cacheService = RedisCacheService.getInstance();
    const cleanedCount = await cacheService.cleanupExpiredCache();
    
    res.json({
      success: true,
      message: '缓存清理完成',
      data: {
        cleanedCount
      }
    });
  } catch (error) {
    logger.error('缓存清理失败:', error);
    res.status(500).json({
      success: false,
      message: '缓存清理失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
