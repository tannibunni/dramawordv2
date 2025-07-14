import express from 'express';
import { WechatController } from '../controllers/wechatController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

/**
 * @route POST /api/wechat/login
 * @desc 微信登录
 * @access Public
 */
router.post('/login', 
  validateRequest({
    body: {
      code: { type: 'string', required: true },
      state: { type: 'string', required: false }
    }
  }),
  WechatController.login
);

/**
 * @route POST /api/wechat/refresh
 * @desc 刷新微信token
 * @access Public
 */
router.post('/refresh',
  validateRequest({
    body: {
      refreshToken: { type: 'string', required: true }
    }
  }),
  WechatController.refreshToken
);

/**
 * @route POST /api/wechat/check-token
 * @desc 检查微信token有效性
 * @access Public
 */
router.post('/check-token',
  validateRequest({
    body: {
      accessToken: { type: 'string', required: true },
      openid: { type: 'string', required: true }
    }
  }),
  WechatController.checkToken
);

/**
 * @route POST /api/wechat/auth-url
 * @desc 获取微信授权URL
 * @access Public
 */
router.post('/auth-url',
  validateRequest({
    body: {
      redirectUri: { type: 'string', required: true },
      state: { type: 'string', required: false }
    }
  }),
  WechatController.getAuthUrl
);

/**
 * @route POST /api/wechat/unbind
 * @desc 解绑微信账号
 * @access Private
 */
router.post('/unbind',
  authenticateToken,
  WechatController.unbind
);

export default router; 