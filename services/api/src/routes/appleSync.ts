import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppleSyncController } from '../controllers/appleSyncController';
import { logger } from '../utils/logger';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取Apple ID用户的云端数据
router.get('/:appleId', async (req, res) => {
  try {
    const { appleId } = req.params;
    const userId = (req as any).user.id;
    
    logger.info(`🍎 获取Apple ID ${appleId} 的云端数据，用户ID: ${userId}`);
    
    const result = await AppleSyncController.getCloudData(appleId, userId);
    res.json(result);
  } catch (error) {
    logger.error('获取云端数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取云端数据失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 上传数据到云端
router.post('/:appleId/upload', async (req, res) => {
  try {
    const { appleId } = req.params;
    const userId = (req as any).user.id;
    const { data, deviceId, timestamp, syncVersion } = req.body;
    
    logger.info(`🍎 上传数据到云端: Apple ID ${appleId}, 设备 ${deviceId}, 版本 ${syncVersion}`);
    
    const result = await AppleSyncController.uploadData(appleId, userId, data, deviceId, timestamp, syncVersion);
    res.json(result);
  } catch (error) {
    logger.error('上传云端数据失败:', error);
    res.status(500).json({
      success: false,
      message: '上传云端数据失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取设备列表
router.get('/:appleId/devices', async (req, res) => {
  try {
    const { appleId } = req.params;
    const userId = (req as any).user.id;
    
    logger.info(`🍎 获取Apple ID ${appleId} 的设备列表，用户ID: ${userId}`);
    
    const result = await AppleSyncController.getDevices(appleId, userId);
    res.json(result);
  } catch (error) {
    logger.error('获取设备列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取设备列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 检查是否有更新
router.get('/:appleId/check-updates', async (req, res) => {
  try {
    const { appleId } = req.params;
    const userId = (req as any).user.id;
    const { lastSyncTime } = req.query;
    
    logger.info(`🍎 检查Apple ID ${appleId} 的更新，最后同步时间: ${lastSyncTime}`);
    
    const result = await AppleSyncController.checkForUpdates(appleId, userId, Number(lastSyncTime));
    res.json(result);
  } catch (error) {
    logger.error('检查更新失败:', error);
    res.status(500).json({
      success: false,
      message: '检查更新失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取数据概览
router.get('/:appleId/overview', async (req, res) => {
  try {
    const { appleId } = req.params;
    const userId = (req as any).user.id;
    
    logger.info(`🍎 获取Apple ID ${appleId} 的数据概览，用户ID: ${userId}`);
    
    const result = await AppleSyncController.getDataOverview(appleId, userId);
    res.json(result);
  } catch (error) {
    logger.error('获取数据概览失败:', error);
    res.status(500).json({
      success: false,
      message: '获取数据概览失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 删除设备数据
router.delete('/:appleId/devices/:deviceId', async (req, res) => {
  try {
    const { appleId, deviceId } = req.params;
    const userId = (req as any).user.id;
    
    logger.info(`🍎 删除Apple ID ${appleId} 的设备 ${deviceId} 数据，用户ID: ${userId}`);
    
    const result = await AppleSyncController.deleteDeviceData(appleId, userId, deviceId);
    res.json(result);
  } catch (error) {
    logger.error('删除设备数据失败:', error);
    res.status(500).json({
      success: false,
      message: '删除设备数据失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
