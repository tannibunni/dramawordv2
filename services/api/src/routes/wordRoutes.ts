import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
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
  clearUserVocabulary,
  clearUserSearchHistory,
  checkEnvironment,
  testOpenAI,
  translateChineseToEnglish, // 新增
  translateEnglishToChinese, // 新增
  testPromptLoading, // 新增
  getRateLimitStatus, // 新增
  getCloudWord, // 新增：云词库获取
  getChineseWordDetails // 新增：中文词汇详细信息
} from '../controllers/wordController';
import { 
  wordCacheMiddleware, 
  wordCacheSetMiddleware,
  cacheStatsMiddleware,
  createCacheClearMiddleware
} from '../middleware/cacheMiddleware';

const router = Router();

// 添加缓存统计中间件
router.use(cacheStatsMiddleware);

// 单词搜索路由 - 使用可选认证，支持游客和登录用户，添加缓存
router.post('/search', 
  optionalAuth, 
  wordCacheMiddleware, 
  searchWord, 
  wordCacheSetMiddleware
);
router.post('/translate', translateChineseToEnglish); // 新增
router.post('/translate-english-to-chinese', translateEnglishToChinese); // 新增
router.get('/popular', 
  wordCacheMiddleware, 
  getPopularWords, 
  wordCacheSetMiddleware
);
router.get('/recent-searches', 
  optionalAuth,
  wordCacheMiddleware, 
  getRecentSearches, 
  wordCacheSetMiddleware
);
router.post('/history', 
  optionalAuth,
  createCacheClearMiddleware(['word']),
  saveSearchHistory
);

// 云词库路由 - 从云词库获取单词数据，添加缓存
router.get('/cloud/:word', 
  wordCacheMiddleware, 
  getCloudWord, 
  wordCacheSetMiddleware
);

// 中文词汇详细信息路由
router.get('/chinese/:word', 
  wordCacheMiddleware, 
  getChineseWordDetails, 
  wordCacheSetMiddleware
);

// 清空所有数据（管理员功能）
router.delete('/clear-all', clearAllData);

// 清空用户历史记录
router.delete('/clear-user-history', clearUserHistory);

// 用户单词本相关API
router.get('/user/vocabulary', getUserVocabulary); // ?userId=xxx
router.post('/user/vocabulary', addToUserVocabulary);
router.put('/user/progress', updateWordProgress);
router.delete('/user/vocabulary', removeFromUserVocabulary);
router.delete('/user/clear-vocabulary', clearUserVocabulary);
router.delete('/clear-search-history', clearUserSearchHistory);

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

// 限流状态监控
router.get('/debug/rate-limit-status', getRateLimitStatus);

// 测试 prompt 文件加载
router.get('/debug/prompt', testPromptLoading);

export default router; 