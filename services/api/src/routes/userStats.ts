import express from 'express';
import { UserStatsController } from '../controllers/userStatsController';

const router = express.Router();

// 获取用户词汇排行榜
router.get('/top-users', UserStatsController.getTopUsers);

// 获取特定用户的词汇统计
router.get('/user/:userId', UserStatsController.getUserWordStats);

// 测试端点
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '用户统计API测试成功',
    timestamp: new Date().toISOString()
  });
});

export default router;
