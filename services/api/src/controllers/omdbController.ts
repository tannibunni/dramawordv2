import { Request, Response } from 'express';
import { OMDBService } from '../services/omdbService';
import { logger } from '../utils/logger';

export class OMDBController {
  /**
   * 搜索剧集
   * GET /api/omdb/search?query=剧集名&type=series
   */
  static async searchShows(req: Request, res: Response) {
    try {
      const { query, type = 'series' } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query parameter is required'
        });
      }

      const results = await OMDBService.searchShows(query, type as 'movie' | 'series' | 'episode');
      logger.info(`OMDb search successful: "${query}" - ${results.Search?.length || 0} results`);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('OMDb search failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search shows'
      });
    }
  }

  /**
   * 获取剧集详情
   * GET /api/omdb/shows/:imdbId
   */
  static async getShowDetails(req: Request, res: Response) {
    try {
      const { imdbId } = req.params;
      
      if (!imdbId) {
        return res.status(400).json({
          success: false,
          error: 'IMDB ID is required'
        });
      }

      const show = await OMDBService.getShowDetails(imdbId);
      
      res.json({
        success: true,
        data: show
      });
    } catch (error) {
      logger.error('OMDb show details failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get show details'
      });
    }
  }

  /**
   * 检查OMDb API状态
   * GET /api/omdb/status
   */
  static async checkStatus(req: Request, res: Response) {
    try {
      const status = await OMDBService.checkStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('OMDb status check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check OMDb status'
      });
    }
  }
}
