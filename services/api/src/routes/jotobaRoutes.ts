// Jotoba 路由
import express from 'express';
import { JotobaController } from '../controllers/jotobaController';

const router = express.Router();

// 搜索日语词汇
router.post('/search', JotobaController.searchWord);

// 清理缓存
router.post('/cache/clear', JotobaController.clearCache);

// 获取缓存统计
router.get('/cache/stats', JotobaController.getCacheStats);

export default router;
