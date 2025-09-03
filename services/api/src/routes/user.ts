import express from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { uploadAvatar } from '../middleware/avatarUpload';
import { UserShowListController } from '../controllers/userShowListController';
import { SyncController } from '../controllers/syncController';

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

// 更新用户学习统计 (需要认证)
router.put('/stats',
  authenticateToken,
  validateRequest({
    body: {
      totalReviews: { type: 'number', required: false, min: 0 },
      collectedWords: { type: 'number', required: false, min: 0 },
      contributedWords: { type: 'number', required: false, min: 0 },
      currentStreak: { type: 'number', required: false, min: 0 },
      experience: { type: 'number', required: false, min: 0 },
      level: { type: 'number', required: false, min: 1 }
    }
  }),
  UserController.updateUserStats
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

// 清除用户学习统计
router.delete('/clear-stats', UserController.clearUserStats);

// 用户剧集清单 API
router.get('/showlist', authenticateToken, UserShowListController.getShowList);
router.post('/showlist', authenticateToken, UserShowListController.addShow);
router.delete('/showlist', authenticateToken, UserShowListController.removeShow);
router.put('/showlist', authenticateToken, UserShowListController.updateShow);

// 批量数据同步 API
router.post('/batch-sync', authenticateToken, SyncController.uploadData);

// 用户扩展信息 API
// 更新用户地理位置信息
router.put('/:userId/location', 
  authenticateToken,
  validateRequest({
    body: {
      country: { type: 'string', required: false },
      region: { type: 'string', required: false },
      city: { type: 'string', required: false },
      timezone: { type: 'string', required: false },
      systemLanguage: { type: 'string', required: false }
    }
  }),
  UserController.updateLocation
);

// 更新用户错误追踪信息
router.post('/:userId/error-tracking',
  authenticateToken,
  validateRequest({
    body: {
      errorReports: { type: 'array', required: true }
    }
  }),
  UserController.updateErrorTracking
);

// 更新用户性能追踪信息
router.post('/:userId/performance-tracking',
  authenticateToken,
  validateRequest({
    body: {
      performanceReports: { type: 'array', required: true }
    }
  }),
  UserController.updatePerformanceTracking
);

// 更新用户分享行为信息
router.post('/:userId/sharing-behavior',
  authenticateToken,
  validateRequest({
    body: {
      shareRecords: { type: 'array', required: true }
    }
  }),
  UserController.updateSharingBehavior
);

// 获取用户扩展信息
router.get('/:userId/extended-info',
  authenticateToken,
  UserController.getUserExtendedInfo
);

export default router; 