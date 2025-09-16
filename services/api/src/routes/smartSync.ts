import express from 'express';
import { SmartSyncController } from '../controllers/smartSyncController';
import { logger } from '../utils/logger';

const router = express.Router();

// 获取用户智能同步策略
router.get('/strategy/:userId', SmartSyncController.getUserSyncStrategy);

// 获取当前用户的智能同步策略
router.get('/strategy', SmartSyncController.getUserSyncStrategy);

// 更新用户同步上下文
router.put('/context', SmartSyncController.updateUserContext);

// 获取用户活跃度分析
router.get('/activity/:userId', SmartSyncController.getUserActivityAnalysis);

// 获取当前用户的活跃度分析
router.get('/activity', SmartSyncController.getUserActivityAnalysis);

// 获取智能同步统计
router.get('/stats', SmartSyncController.getSmartSyncStats);

// 重置用户同步策略
router.post('/reset/:userId', SmartSyncController.resetUserSyncStrategy);

// 重置当前用户的同步策略
router.post('/reset', SmartSyncController.resetUserSyncStrategy);

// 健康检查
router.get('/health', (req, res) => {
  try {
    res.json({
      success: true,
      message: '智能同步服务运行正常',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('❌ 智能同步健康检查失败:', error);
    res.status(500).json({
      success: false,
      message: '智能同步服务异常',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;
