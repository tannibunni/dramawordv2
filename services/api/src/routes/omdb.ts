import express from 'express';
import { OMDBController } from '../controllers/omdbController';

const router = express.Router();

/**
 * @route GET /api/omdb/search
 * @desc 搜索OMDb剧集
 * @access Public
 */
router.get('/search', OMDBController.searchShows);

/**
 * @route GET /api/omdb/shows/:imdbId
 * @desc 获取OMDb剧集详情
 * @access Public
 */
router.get('/shows/:imdbId', OMDBController.getShowDetails);

/**
 * @route GET /api/omdb/status
 * @desc 检查OMDb API状态
 * @access Public
 */
router.get('/status', OMDBController.checkStatus);

export default router;
