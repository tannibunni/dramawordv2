import { Router } from 'express';
import { 
  searchWord, 
  getPopularWords, 
  getRecentSearches, 
  saveSearchHistory 
} from '../controllers/wordController';

const router = Router();

// 单词搜索路由
router.post('/words/search', searchWord);
router.get('/words/popular', getPopularWords);
router.get('/words/recent-searches', getRecentSearches);
router.post('/words/history', saveSearchHistory);

export { router as wordRoutes }; 