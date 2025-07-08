import { Router } from 'express';
import { 
  searchWord, 
  getPopularWords, 
  getRecentSearches, 
  saveSearchHistory,
  clearAllData,
  clearUserHistory
} from '../controllers/wordController';

const router = Router();

// 单词搜索路由
router.post('/search', searchWord);
router.get('/popular', getPopularWords);
router.get('/recent-searches', getRecentSearches);
router.post('/history', saveSearchHistory);

// 清空所有数据（管理员功能）
router.delete('/clear-all', clearAllData);

// 清空用户历史记录
router.delete('/clear-user-history', clearUserHistory);

export default router; 