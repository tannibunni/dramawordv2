import express from 'express';
import { clearChineseCloudWords, getCloudWordsStats } from '../controllers/adminController';

const router = express.Router();

// 清理所有中文Cloud Words数据
router.delete('/cloud-words/chinese', clearChineseCloudWords);

// 获取Cloud Words统计信息
router.get('/cloud-words/stats', getCloudWordsStats);

export default router;
