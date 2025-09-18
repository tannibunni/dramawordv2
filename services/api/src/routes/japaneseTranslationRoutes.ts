// 日文翻译路由
import express from 'express';
import { 
  translateToJapanese, 
  clearJapaneseTranslationCache, 
  getJapaneseTranslationStats 
} from '../controllers/japaneseTranslationController';

const router = express.Router();

// 翻译中英文到日文
router.post('/translate', translateToJapanese);

// 清理缓存
router.post('/cache/clear', clearJapaneseTranslationCache);

// 获取统计信息
router.get('/stats', getJapaneseTranslationStats);

export default router;
