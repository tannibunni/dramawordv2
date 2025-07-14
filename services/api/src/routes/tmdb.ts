import { Router } from 'express';
import { TMDBController } from '../controllers/tmdbController';

const router = Router();

/**
 * @route GET /api/tmdb/status
 * @desc 检查 TMDB API 配置状态
 * @access Public
 */
router.get('/status', TMDBController.getStatus);

/**
 * @route GET /api/tmdb/search
 * @desc 搜索剧集
 * @access Public
 */
router.get('/search', TMDBController.searchShows);

/**
 * @route GET /api/tmdb/shows/popular
 * @desc 获取热门剧集
 * @access Public
 */
router.get('/shows/popular', TMDBController.getPopularShows);

/**
 * @route GET /api/tmdb/shows/on-the-air
 * @desc 获取正在播放的剧集
 * @access Public
 */
router.get('/shows/on-the-air', TMDBController.getOnTheAirShows);

/**
 * @route GET /api/tmdb/shows/:id
 * @desc 获取剧集详情
 * @access Public
 */
router.get('/shows/:id', TMDBController.getShowDetails);

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