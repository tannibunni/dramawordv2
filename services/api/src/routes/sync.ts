import express from 'express';
import { SyncController } from '../controllers/syncController';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// 测试端点（不需要认证）
router.post('/test', async (req, res) => {
  try {
    logger.info('同步测试请求:', {
      body: req.body,
      headers: req.headers
    });
    
    res.json({
      success: true,
      message: '同步测试端点正常',
      data: {
        timestamp: new Date().toISOString(),
        requestBody: req.body
      }
    });
  } catch (error) {
    logger.error('同步测试失败:', error);
    res.status(500).json({
      success: false,
      error: '同步测试失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 实时数据同步
router.post('/realtime', authenticateToken, SyncController.uploadData);

// 批量数据同步
router.post('/batch', authenticateToken, SyncController.uploadData);

// 缓存数据同步
router.post('/cache', authenticateToken, SyncController.uploadData);

// 获取同步状态
router.get('/status', authenticateToken, SyncController.getSyncStatus);

// 强制同步
router.post('/force', authenticateToken, SyncController.forceSync);

// 获取同步历史
router.get('/history', authenticateToken, SyncController.getSyncHistory);

export default router; 