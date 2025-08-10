import express from 'express';
import { UnifiedSearchController } from '../controllers/unifiedSearchController';

const router = express.Router();

/**
 * @route GET /api/search/unified
 * @desc 统一搜索：先查TMDB，查不到再查OMDb
 * @access Public
 */
router.get('/unified', UnifiedSearchController.searchShows);

/**
 * @route GET /api/search/stats
 * @desc 获取搜索统计信息
 * @access Public
 */
router.get('/stats', UnifiedSearchController.getSearchStats);

export default router;
