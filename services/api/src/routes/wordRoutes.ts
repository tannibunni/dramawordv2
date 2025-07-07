import { Router } from 'express';
import { 
  searchWord, 
  getPopularWords, 
  getRecentSearches, 
  saveSearchHistory 
} from '../controllers/wordController';

const router = Router();

// 单词搜索路由
router.post('/search', searchWord);
router.get('/popular', getPopularWords);
router.get('/recent-searches', getRecentSearches);
router.post('/history', saveSearchHistory);

export default router; 