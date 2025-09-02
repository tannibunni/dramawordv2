import express from 'express';
import { DataVersionController } from '../controllers/dataVersionController';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// 测试端点（不需要认证）
router.post('/test', async (req, res) => {
  try {
    logger.info('数据版本管理测试请求:', {
      body: req.body,
      headers: req.headers
    });
    
    res.json({
      success: true,
      message: '数据版本管理测试端点正常',
      data: {
        timestamp: new Date().toISOString(),
        requestBody: req.body,
        endpoints: [
          'POST /api/data-version/:deviceId/compare - 版本比较',
          'POST /api/data-version/conflicts/detect - 冲突检测',
          'POST /api/data-version/:deviceId/incremental - 增量同步',
          'POST /api/data-version/:deviceId/save - 保存数据版本',
          'GET /api/data-version/:dataType/history - 获取版本历史'
        ]
      }
    });
  } catch (error) {
    logger.error('数据版本管理测试失败:', error);
    res.status(500).json({
      success: false,
      error: '数据版本管理测试失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 版本比较
router.post('/:deviceId/compare', authenticateToken, DataVersionController.compareVersions);

// 冲突检测
router.post('/conflicts/detect', authenticateToken, DataVersionController.detectConflicts);

// 增量同步
router.post('/:deviceId/incremental', authenticateToken, DataVersionController.getIncrementalData);

// 保存数据版本
router.post('/:deviceId/save', authenticateToken, DataVersionController.saveVersion);

// 获取版本历史
router.get('/:dataType/history', authenticateToken, DataVersionController.getVersionHistory);

export default router;
