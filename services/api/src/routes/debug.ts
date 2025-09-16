import express from 'express';
import { DebugController } from '../controllers/debugController';

const router = express.Router();

// 调试用户统计
router.get('/user-stats', DebugController.debugUserStats);

// 调试用户词汇数据
router.get('/user-vocabulary', DebugController.debugUserVocabulary);

export default router;