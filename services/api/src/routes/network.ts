import express from 'express';
import { NetworkController } from '../controllers/networkController';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// 测试端点（不需要认证）
router.post('/test', async (req, res) => {
  try {
    logger.info('网络状态管理测试请求:', {
      body: req.body,
      headers: req.headers
    });
    
    res.json({
      success: true,
      message: '网络状态管理测试端点正常',
      data: {
        timestamp: new Date().toISOString(),
        requestBody: req.body,
        endpoints: [
          'POST /api/network/quality - 获取网络质量评估',
          'GET /api/network/:deviceId/status - 获取网络状态',
          'POST /api/network/:deviceId/optimize - 网络优化建议'
        ]
      }
    });
  } catch (error) {
    logger.error('网络状态管理测试失败:', error);
    res.status(500).json({
      success: false,
      error: '网络状态管理测试失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取网络质量评估
router.post('/quality', authenticateToken, NetworkController.getQuality);

// 获取网络状态
router.get('/:deviceId/status', authenticateToken, NetworkController.getStatus);

// 网络优化建议
router.post('/:deviceId/optimize', authenticateToken, NetworkController.optimize);

export default router;
