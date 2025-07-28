import express from 'express';
import { AppleController } from '../controllers/appleController';
import { validateRequest } from '../middleware/validateRequest';
import { appleConfig } from '../config/apple';

const router = express.Router();

/**
 * @route GET /api/apple/config
 * @desc 获取苹果登录配置信息（用于调试）
 * @access Public
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      clientId: appleConfig.clientId,
      teamId: appleConfig.teamId ? '已配置' : '未配置',
      keyId: appleConfig.keyId ? '已配置' : '未配置',
      privateKey: appleConfig.privateKey ? '已配置' : '未配置',
      redirectUri: appleConfig.redirectUri,
      hasValidConfig: !!(appleConfig.teamId && appleConfig.keyId && appleConfig.privateKey)
    }
  });
});

router.post('/login',
  validateRequest({
    body: { idToken: { type: 'string', required: true } }
  }),
  AppleController.login
);

export default router; 