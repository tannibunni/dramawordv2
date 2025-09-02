import express from 'express';
import { DeviceController } from '../controllers/deviceController';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// 测试端点（不需要认证）
router.post('/test', async (req, res) => {
  try {
    logger.info('设备管理测试请求:', {
      body: req.body,
      headers: req.headers
    });
    
    res.json({
      success: true,
      message: '设备管理测试端点正常',
      data: {
        timestamp: new Date().toISOString(),
        requestBody: req.body,
        endpoints: [
          'POST /api/device/register - 设备注册',
          'GET /api/device/:deviceId/status - 获取设备状态',
          'POST /api/device/:deviceId/init - 设备初始化',
          'DELETE /api/device/:deviceId/unregister - 设备注销',
          'GET /api/device/user/devices - 获取用户设备列表',
          'PUT /api/device/:deviceId/network - 更新网络状态',
          'PUT /api/device/:deviceId/sync-status - 更新同步状态',
          'POST /api/device/admin/cleanup - 清理过期设备'
        ]
      }
    });
  } catch (error) {
    logger.error('设备管理测试失败:', error);
    res.status(500).json({
      success: false,
      error: '设备管理测试失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 设备注册
router.post('/register', authenticateToken, DeviceController.register);

// 获取设备状态
router.get('/:deviceId/status', authenticateToken, DeviceController.getStatus);

// 设备初始化
router.post('/:deviceId/init', authenticateToken, DeviceController.initialize);

// 设备注销
router.delete('/:deviceId/unregister', authenticateToken, DeviceController.unregister);

// 获取用户的所有设备
router.get('/user/devices', authenticateToken, DeviceController.getUserDevices);

// 更新设备网络状态
router.put('/:deviceId/network', authenticateToken, DeviceController.updateNetworkStatus);

// 更新设备同步状态
router.put('/:deviceId/sync-status', authenticateToken, DeviceController.updateSyncStatus);

// 管理员功能：清理过期设备
router.post('/admin/cleanup', authenticateToken, DeviceController.cleanupExpiredDevices);

export default router;
