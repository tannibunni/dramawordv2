import { Request, Response } from 'express';
import { UnifiedSearchService } from '../services/unifiedSearchService';
import { logger } from '../utils/logger';

export class UnifiedSearchController {
  /**
   * 统一搜索：先查TMDB，查不到再查OMDb
   * GET /api/search/unified?query=剧集名&page=1&language=zh-CN
   */
  static async searchShows(req: Request, res: Response) {
    try {
      const { query, page = 1, language = 'zh-CN' } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query parameter is required'
        });
      }

      const results = await UnifiedSearchService.searchShows(
        query, 
        parseInt(page as string), 
        language as string
      );
      
      logger.info(`Unified search successful: "${query}" - ${results.total_results} total results (TMDB: ${results.sources.tmdb}, OMDb: ${results.sources.omdb})`);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Unified search failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search shows'
      });
    }
  }

  /**
   * 获取搜索统计信息
   * GET /api/search/stats?query=剧集名
   */
  static async getSearchStats(req: Request, res: Response) {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query parameter is required'
        });
      }

      const stats = await UnifiedSearchService.getSearchStats(query);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get search stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get search stats'
      });
    }
  }
}
