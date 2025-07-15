import express from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { uploadAvatar } from '../middleware/upload';
import { UserShowListController } from '../controllers/userShowListController';

const router = express.Router();

// 用户注册
router.post('/register', 
  validateRequest({
    body: {
      username: { type: 'string', required: true, minLength: 3, maxLength: 20 },
      nickname: { type: 'string', required: true, maxLength: 30 },
      loginType: { type: 'string', required: true, enum: ['phone', 'wechat', 'apple', 'guest'] },
      phoneNumber: { type: 'string', required: false },
      wechatId: { type: 'string', required: false },
      appleId: { type: 'string', required: false },
      guestId: { type: 'string', required: false }
    }
  }),
  UserController.register
);

// 用户登录
router.post('/login',
  validateRequest({
    body: {
      loginType: { type: 'string', required: true, enum: ['phone', 'wechat', 'apple', 'guest'] },
      phoneNumber: { type: 'string', required: false },
      wechatId: { type: 'string', required: false },
      appleId: { type: 'string', required: false },
      guestId: { type: 'string', required: false }
    }
  }),
  UserController.login
);

// 获取用户信息 (需要认证)
router.get('/profile',
  authenticateToken,
  UserController.getUserInfo
);

// 更新用户信息 (需要认证)
router.put('/profile',
  authenticateToken,
  validateRequest({
    body: {
      nickname: { type: 'string', required: false, maxLength: 30 },
      avatar: { type: 'string', required: false },
      email: { type: 'string', required: false, format: 'email' }
    }
  }),
  UserController.updateUserInfo
);

// 更新用户设置 (需要认证)
router.put('/settings',
  authenticateToken,
  validateRequest({
    body: {
      settings: { type: 'object', required: true }
    }
  }),
  UserController.updateUserSettings
);

// 获取用户学习统计 (需要认证)
router.get('/stats',
  authenticateToken,
  UserController.getUserStats
);

// 删除用户账号 (需要认证)
router.delete('/account',
  authenticateToken,
  UserController.deleteAccount
);

// 上传头像
router.post('/avatar',
  authenticateToken,
  uploadAvatar.single('avatar'),
  UserController.uploadAvatar
);

// 用户剧集清单 API
router.get('/showlist', authenticateToken, UserShowListController.getShowList);
router.post('/showlist', authenticateToken, UserShowListController.addShow);
router.delete('/showlist', authenticateToken, UserShowListController.removeShow);
router.put('/showlist', authenticateToken, UserShowListController.updateShow);

export default router; 