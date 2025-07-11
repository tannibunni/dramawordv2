import { Router } from 'express';
import { 
  searchWord, 
  getPopularWords, 
  getRecentSearches, 
  saveSearchHistory,
  clearAllData,
  clearUserHistory,
  getUserVocabulary,
  addToUserVocabulary,
  updateWordProgress,
  removeFromUserVocabulary,
  checkEnvironment,
  testOpenAI
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

// 用户单词本相关API
router.get('/user/vocabulary', getUserVocabulary); // ?userId=xxx
router.post('/user/vocabulary', addToUserVocabulary);
router.put('/user/progress', updateWordProgress);
router.delete('/user/vocabulary', removeFromUserVocabulary);

// 测试路由
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Word routes are working!',
    timestamp: new Date().toISOString()
  });
});

// 调试路由 - 检查环境变量
router.get('/debug/environment', checkEnvironment);

// 测试 Open AI 连接
router.get('/debug/openai', testOpenAI);

export default router; 