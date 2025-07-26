import express from 'express';
import { AuthController } from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

/**
 * @route POST /api/auth/send-code
 * @desc 发送验证码
 * @access Public
 */
router.post('/send-code',
  validateRequest({
    body: {
      phoneNumber: { type: 'string', required: true, minLength: 11, maxLength: 11 }
    }
  }),
  AuthController.sendVerificationCode
);

/**
 * @route POST /api/auth/verify-code
 * @desc 验证验证码
 * @access Public
 */
router.post('/verify-code',
  validateRequest({
    body: {
      phoneNumber: { type: 'string', required: true, minLength: 11, maxLength: 11 },
      code: { type: 'string', required: true, minLength: 6, maxLength: 6 }
    }
  }),
  AuthController.verifyCode
);

/**
 * @route POST /api/auth/phone-login
 * @desc 手机号登录
 * @access Public
 */
router.post('/phone-login',
  validateRequest({
    body: {
      phoneNumber: { type: 'string', required: true, minLength: 11, maxLength: 11 },
      code: { type: 'string', required: true, minLength: 6, maxLength: 6 }
    }
  }),
  AuthController.phoneLogin
);

export default router; 