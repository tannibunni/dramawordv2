import { Request, Response } from 'express';
import { TMDBService } from '../services/tmdbService';
import { logger } from '../utils/logger';

export class TMDBController {
  /**
   * 搜索剧集
   * GET /api/tmdb/search?query=剧集名&page=1
   */
  static async searchShows(req: Request, res: Response) {
    try {
      const { query, page = 1 } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query parameter is required'
        });
      }

      const pageNumber = parseInt(page as string) || 1;
      const result = await TMDBService.searchShows(query, pageNumber);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('TMDB search shows error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search shows',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取剧集详情
   * GET /api/tmdb/shows/:id
   */
  static async getShowDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const showId = parseInt(id);

      if (isNaN(showId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid show ID'
        });
      }

      const result = await TMDBService.getShowDetails(showId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('TMDB get show details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get show details',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取剧集季数信息
   * GET /api/tmdb/shows/:id/seasons/:seasonNumber
   */
  static async getSeasonDetails(req: Request, res: Response) {
    try {
      const { id, seasonNumber } = req.params;
      const showId = parseInt(id);
      const season = parseInt(seasonNumber);

      if (isNaN(showId) || isNaN(season)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid show ID or season number'
        });
      }

      const result = await TMDBService.getSeasonDetails(showId, season);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('TMDB get season details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get season details',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取相似剧集
   * GET /api/tmdb/shows/:id/similar?page=1
   */
  static async getSimilarShows(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1 } = req.query;
      const showId = parseInt(id);
      const pageNumber = parseInt(page as string) || 1;

      if (isNaN(showId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid show ID'
        });
      }

      const result = await TMDBService.getSimilarShows(showId, pageNumber);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('TMDB get similar shows error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get similar shows',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取热门剧集
   * GET /api/tmdb/shows/popular?page=1
   */
  static async getPopularShows(req: Request, res: Response) {
    try {
      const { page = 1 } = req.query;
      const pageNumber = parseInt(page as string) || 1;

      const result = await TMDBService.getPopularShows(pageNumber);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('TMDB get popular shows error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get popular shows',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取正在播放的剧集
   * GET /api/tmdb/shows/on-the-air?page=1
   */
  static async getOnTheAirShows(req: Request, res: Response) {
    try {
      const { page = 1 } = req.query;
      const pageNumber = parseInt(page as string) || 1;

      const result = await TMDBService.getOnTheAirShows(pageNumber);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('TMDB get on the air shows error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get on the air shows',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 检查 TMDB 配置状态
   * GET /api/tmdb/status
   */
  static async getStatus(req: Request, res: Response) {
    try {
      const config = TMDBService.checkConfiguration();

      res.json({
        success: true,
        data: {
          configured: config.isConfigured,
          hasApiKey: config.hasApiKey,
          hasAccessToken: config.hasAccessToken,
          message: config.isConfigured 
            ? 'TMDB API is properly configured' 
            : 'TMDB API is not configured. Please set TMDB_API_KEY or TMDB_ACCESS_TOKEN environment variable.'
        }
      });
    } catch (error) {
      logger.error('TMDB status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check TMDB status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 