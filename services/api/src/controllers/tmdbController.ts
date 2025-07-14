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

      const results = await TMDBService.searchShows(query, parseInt(page as string));
      logger.info(`TMDB search successful: "${query}" - ${results.results.length} results`);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('TMDB search failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search shows'
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
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Show ID is required'
        });
      }

      const showId = parseInt(id);
      if (isNaN(showId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid show ID'
        });
      }

      const show = await TMDBService.getShowDetails(showId);
      
      res.json({
        success: true,
        data: show
      });
    } catch (error) {
      logger.error('TMDB show details failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get show details'
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
      
      if (!id || !seasonNumber) {
        return res.status(400).json({
          success: false,
          error: 'Show ID and season number are required'
        });
      }

      const showId = parseInt(id);
      const season = parseInt(seasonNumber);
      
      if (isNaN(showId) || isNaN(season)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid show ID or season number'
        });
      }

      const seasonDetails = await TMDBService.getSeasonDetails(showId, season);
      
      res.json({
        success: true,
        data: seasonDetails
      });
    } catch (error) {
      logger.error('TMDB season details failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get season details'
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
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Show ID is required'
        });
      }

      const showId = parseInt(id);
      if (isNaN(showId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid show ID'
        });
      }

      const similarShows = await TMDBService.getSimilarShows(showId);
      
      res.json({
        success: true,
        data: similarShows
      });
    } catch (error) {
      logger.error('TMDB similar shows failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get similar shows'
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
      const results = await TMDBService.getPopularShows(parseInt(page as string));
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('TMDB popular shows failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get popular shows'
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
      const results = await TMDBService.getOnTheAirShows(parseInt(page as string));
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('TMDB on-the-air shows failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get on-the-air shows'
      });
    }
  }

  /**
   * 检查 TMDB 配置状态
   * GET /api/tmdb/status
   */
  static async getStatus(req: Request, res: Response) {
    try {
      const status = {
        configured: !!process.env.TMDB_API_KEY,
        apiKey: process.env.TMDB_API_KEY ? '***' + process.env.TMDB_API_KEY.slice(-4) : 'not set'
      };
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('TMDB status check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check TMDB status'
      });
    }
  }
} 