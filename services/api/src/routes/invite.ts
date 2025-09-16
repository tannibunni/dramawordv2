import express from 'express';
import { InviteController } from '../controllers/inviteController';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// 验证邀请码（不需要认证）
router.post('/validate', InviteController.validateInviteCode);

// 应用邀请码（需要认证）
router.post('/apply', authenticateToken, InviteController.applyInviteCode);

// 生成邀请码（需要认证）
router.post('/generate', authenticateToken, InviteController.generateInviteCode);

// 获取用户邀请码列表（需要认证）
router.get('/list', authenticateToken, InviteController.getUserInviteCodes);

// 健康检查
router.get('/health', (req, res) => {
  try {
    res.json({
      success: true,
      message: '邀请码服务运行正常',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('❌ 邀请码健康检查失败:', error);
    res.status(500).json({
      success: false,
      message: '邀请码服务异常',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;
