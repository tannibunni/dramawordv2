import { TMDBService, TMDBSearchResponse } from './tmdbService';
import { OMDBService, OMDBSearchResponse } from './omdbService';
import { logger } from '../utils/logger';

export interface UnifiedSearchResult {
  results: any[];
  total_results: number;
  total_pages: number;
  page: number;
  sources: {
    tmdb: number;
    omdb: number;
  };
}

export class UnifiedSearchService {
  /**
   * 统一搜索：先查TMDB，查不到再查OMDb
   */
  static async searchShows(
    query: string, 
    page: number = 1, 
    language: string = 'zh-CN'
  ): Promise<UnifiedSearchResult> {
    try {
      let tmdbResults: TMDBSearchResponse | null = null;
      let omdbResults: OMDBSearchResponse | null = null;
      let tmdbCount = 0;
      let omdbCount = 0;

      // 第一步：尝试TMDB搜索
      try {
        logger.info(`[UnifiedSearch] Starting TMDB search for: "${query}"`);
        tmdbResults = await TMDBService.searchShows(query, page, language);
        tmdbCount = tmdbResults.results.length;
        logger.info(`[UnifiedSearch] TMDB search successful: ${tmdbCount} results`);
      } catch (error) {
        logger.warn(`[UnifiedSearch] TMDB search failed for "${query}":`, error);
        tmdbResults = null;
      }

      // 第二步：如果TMDB没有结果或失败，尝试OMDb搜索
      if (!tmdbResults || tmdbResults.results.length === 0) {
        try {
          logger.info(`[UnifiedSearch] TMDB returned no results, trying OMDb for: "${query}"`);
          omdbResults = await OMDBService.searchShows(query, 'series');
          omdbCount = omdbResults.Search?.length || 0;
          logger.info(`[UnifiedSearch] OMDb search successful: ${omdbCount} results`);
        } catch (error) {
          logger.warn(`[UnifiedSearch] OMDb search failed for "${query}":`, error);
          omdbResults = null;
        }
      }

      // 第三步：合并结果
      const allResults = [];
      
      // 添加TMDB结果
      if (tmdbResults && tmdbResults.results.length > 0) {
        allResults.push(...tmdbResults.results.map(result => ({
          ...result,
          source: 'tmdb'
        })));
      }

      // 添加OMDb结果（转换为TMDB格式）
      if (omdbResults && omdbResults.Search && omdbResults.Search.length > 0) {
        const convertedResults = omdbResults.Search.map(omdbShow => 
          OMDBService.convertToTMDBFormat(omdbShow)
        );
        allResults.push(...convertedResults);
      }

      // 去重：如果TMDB和OMDb都有结果，优先保留TMDB的结果
      const uniqueResults = this.removeDuplicates(allResults);

      const finalResult: UnifiedSearchResult = {
        results: uniqueResults,
        total_results: uniqueResults.length,
        total_pages: 1, // OMDb不支持分页，所以总页数为1
        page: page,
        sources: {
          tmdb: tmdbCount,
          omdb: omdbCount
        }
      };

      logger.info(`[UnifiedSearch] Final result: ${uniqueResults.length} unique results (TMDB: ${tmdbCount}, OMDb: ${omdbCount})`);
      
      return finalResult;

    } catch (error) {
      logger.error(`[UnifiedSearch] Unified search failed for "${query}":`, error);
      throw new Error(`Unified search failed: ${error}`);
    }
  }

  /**
   * 移除重复结果（基于标题和年份）
   */
  private static removeDuplicates(results: any[]): any[] {
    const seen = new Set();
    const uniqueResults = [];

    for (const result of results) {
      // 创建唯一标识符：标题 + 年份 + 类型
      const key = `${result.name || result.title || ''}-${result.first_air_date || result.year || ''}-${result.type || ''}`.toLowerCase();
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(result);
      }
    }

    return uniqueResults;
  }

  /**
   * 获取搜索统计信息
   */
  static async getSearchStats(query: string): Promise<{
    tmdbResults: number;
    omdbResults: number;
    totalUnique: number;
    sources: string[];
  }> {
    try {
      const result = await this.searchShows(query, 1, 'zh-CN');
      
      return {
        tmdbResults: result.sources.tmdb,
        omdbResults: result.sources.omdb,
        totalUnique: result.total_results,
        sources: result.results.map(r => r.source || 'unknown')
      };
    } catch (error) {
      logger.error(`[UnifiedSearch] Failed to get search stats for "${query}":`, error);
      throw error;
    }
  }
}
