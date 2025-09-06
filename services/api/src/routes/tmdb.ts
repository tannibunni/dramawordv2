import { Router } from 'express';
import { TMDBController } from '../controllers/tmdbController';
import { 
  showCacheMiddleware, 
  showCacheSetMiddleware,
  cacheStatsMiddleware
} from '../middleware/cacheMiddleware';

const router = Router();

// 添加缓存统计中间件
router.use(cacheStatsMiddleware);

/**
 * @route GET /api/tmdb/status
 * @desc 检查 TMDB API 配置状态
 * @access Public
 */
router.get('/status', TMDBController.getStatus);

/**
 * @route GET /api/tmdb/search
 * @desc 搜索剧集 - 添加缓存
 * @access Public
 */
router.get('/search', 
  showCacheMiddleware, 
  TMDBController.searchShows, 
  showCacheSetMiddleware
);

/**
 * @route GET /api/tmdb/shows/popular
 * @desc 获取热门剧集 - 添加缓存
 * @access Public
 */
router.get('/shows/popular', 
  showCacheMiddleware, 
  TMDBController.getPopularShows, 
  showCacheSetMiddleware
);

/**
 * @route GET /api/tmdb/shows/on-the-air
 * @desc 获取正在播放的剧集
 * @access Public
 */
router.get('/shows/on-the-air', TMDBController.getOnTheAirShows);

/**
 * @route GET /api/tmdb/shows/:id
 * @desc 获取剧集详情 - 添加缓存
 * @access Public
 */
router.get('/shows/:id', 
  showCacheMiddleware, 
  TMDBController.getShowDetails, 
  showCacheSetMiddleware
);

/**
 * @route GET /api/tmdb/shows/:id/seasons/:seasonNumber
 * @desc 获取剧集季数信息
 * @access Public
 */
router.get('/shows/:id/seasons/:seasonNumber', TMDBController.getSeasonDetails);

/**
 * @route GET /api/tmdb/shows/:id/similar
 * @desc 获取相似剧集
 * @access Public
 */
router.get('/shows/:id/similar', TMDBController.getSimilarShows);

export default router; 