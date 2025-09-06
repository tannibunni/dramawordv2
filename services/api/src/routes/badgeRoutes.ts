/**
 * 徽章路由 - 徽章系统API端点
 * 提供徽章获取、进度更新等功能
 */

import express from 'express';
import { BadgeController } from '../controllers/badgeController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { 
  badgeCacheMiddleware, 
  badgeCacheSetMiddleware,
  cacheStatsMiddleware,
  createCacheClearMiddleware
} from '../middleware/cacheMiddleware';

const router = express.Router();

// 添加缓存统计中间件
router.use(cacheStatsMiddleware);

/**
 * @route GET /api/badges/definitions
 * @desc 获取所有徽章定义 - 添加缓存
 * @access Public
 */
router.get('/definitions', 
  badgeCacheMiddleware, 
  BadgeController.getBadgeDefinitions, 
  badgeCacheSetMiddleware
);

/**
 * @route GET /api/badges/user/:userId
 * @desc 获取用户徽章进度 - 添加缓存
 * @access Private
 */
router.get('/user/:userId', 
  authenticateToken, 
  badgeCacheMiddleware, 
  BadgeController.getUserBadgeProgress, 
  badgeCacheSetMiddleware
);

/**
 * @route GET /api/badges/user/:userId/summary
 * @desc 获取用户徽章摘要 - 添加缓存
 * @access Private
 */
router.get('/user/:userId/summary', 
  authenticateToken, 
  badgeCacheMiddleware, 
  BadgeController.getUserBadgeSummary, 
  badgeCacheSetMiddleware
);

/**
 * @route POST /api/badges/user/:userId/progress
 * @desc 更新用户徽章进度 - 添加缓存清理
 * @access Private
 */
router.post('/user/:userId/progress', 
  authenticateToken, 
  validateRequest({
    body: {
      badgeId: { type: 'string', required: true },
      progress: { type: 'number', required: true, min: 0 },
      action: { type: 'string', required: false }
    }
  }),
  createCacheClearMiddleware(['badge']),
  BadgeController.updateBadgeProgress
);

/**
 * @route POST /api/badges/user/:userId/unlock
 * @desc 解锁徽章 - 添加缓存清理
 * @access Private
 */
router.post('/user/:userId/unlock', 
  authenticateToken, 
  validateRequest({
    body: {
      badgeId: { type: 'string', required: true }
    }
  }),
  createCacheClearMiddleware(['badge']),
  BadgeController.unlockBadge
);

/**
 * @route GET /api/badges/user/:userId/recent
 * @desc 获取用户最近获得的徽章 - 添加缓存
 * @access Private
 */
router.get('/user/:userId/recent', 
  authenticateToken, 
  badgeCacheMiddleware, 
  BadgeController.getRecentBadges, 
  badgeCacheSetMiddleware
);

/**
 * @route GET /api/badges/user/:userId/achievements
 * @desc 获取用户成就统计 - 添加缓存
 * @access Private
 */
router.get('/user/:userId/achievements', 
  authenticateToken, 
  badgeCacheMiddleware, 
  BadgeController.getUserAchievements, 
  badgeCacheSetMiddleware
);

/**
 * @route POST /api/badges/user/:userId/check
 * @desc 检查并更新所有徽章进度 - 添加缓存清理
 * @access Private
 */
router.post('/user/:userId/check', 
  authenticateToken, 
  createCacheClearMiddleware(['badge']),
  BadgeController.checkAllBadges
);

/**
 * @route GET /api/badges/leaderboard
 * @desc 获取徽章排行榜 - 添加缓存
 * @access Public
 */
router.get('/leaderboard', 
  badgeCacheMiddleware, 
  BadgeController.getBadgeLeaderboard, 
  badgeCacheSetMiddleware
);

/**
 * @route GET /api/badges/categories
 * @desc 获取徽章分类 - 添加缓存
 * @access Public
 */
router.get('/categories', 
  badgeCacheMiddleware, 
  BadgeController.getBadgeCategories, 
  badgeCacheSetMiddleware
);

/**
 * @route GET /api/badges/:badgeId/details
 * @desc 获取特定徽章详情 - 添加缓存
 * @access Public
 */
router.get('/:badgeId/details', 
  badgeCacheMiddleware, 
  BadgeController.getBadgeDetails, 
  badgeCacheSetMiddleware
);

export default router;
