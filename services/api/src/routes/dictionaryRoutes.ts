// 词库管理路由
import { Router } from 'express';
import { 
  getDictionaryStatus,
  downloadDictionary,
  parseDictionary,
  getDictionaryStats
} from '../controllers/dictionaryController';

const router = Router();

// 获取词库状态
router.get('/status', getDictionaryStatus);

// 获取词库统计信息
router.get('/stats', getDictionaryStats);

// 下载词库
router.post('/download/:dictionaryId', downloadDictionary);

// 解析词库
router.post('/parse/:dictionaryId', parseDictionary);

export default router;
