import express from 'express';
import { UserSearchController } from '../controllers/userSearchController';

const router = express.Router();

// 通过邮箱查询用户
router.get('/email/:email', UserSearchController.getUserByEmail);

// 查询所有Apple用户
router.get('/apple-users', UserSearchController.getAllAppleUsers);

// 测试端点
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '用户搜索API测试成功',
    timestamp: new Date().toISOString()
  });
});

export default router;
