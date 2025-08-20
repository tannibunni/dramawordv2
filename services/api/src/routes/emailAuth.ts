import express from 'express';
import { 
  registerWithEmail, 
  loginWithEmail, 
  verifyEmail, 
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  deleteTestUser
} from '../controllers/emailAuthController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * 邮箱注册
 * POST /api/email-auth/register
 */
router.post('/register', registerWithEmail);

/**
 * 邮箱登录
 * POST /api/email-auth/login
 */
router.post('/login', loginWithEmail);

/**
 * 验证邮箱
 * GET /api/email-auth/verify/:token
 */
router.get('/verify/:token', verifyEmail);

/**
 * 重新发送验证邮件
 * POST /api/email-auth/resend-verification
 */
router.post('/resend-verification', resendVerificationEmail);

/**
 * 忘记密码
 * POST /api/email-auth/forgot-password
 */
router.post('/forgot-password', forgotPassword);

/**
 * 重置密码
 * POST /api/email-auth/reset-password
 */
router.post('/reset-password', resetPassword);

/**
 * 删除测试用户（仅用于开发测试）
 * DELETE /api/email-auth/test-user
 */
router.delete('/test-user', deleteTestUser);

/**
 * 获取当前用户信息 (需要认证)
 * GET /api/email-auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未认证'
      });
    }

    // 这里可以从数据库获取用户信息
    // const user = await User.findById(userId);
    
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败'
    });
  }
});

export default router;
