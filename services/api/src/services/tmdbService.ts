import axios from 'axios';
import { logger } from '../utils/logger';

// TMDB API 配置
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;

// TMDB API 响应接口
export interface TMDBShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date: string;
  last_air_date: string;
  status: string;
  type: string;
  genres: Array<{ id: number; name: string }>;
  networks: Array<{ id: number; name: string }>;
  production_companies: Array<{ id: number; name: string }>;
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_path: string;
  backdrop_path: string;
  original_language: string;
  origin_country: string[];
  created_by: Array<{ id: number; name: string; profile_path: string }>;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBShow[];
  total_pages: number;
  total_results: number;
}

export interface TMDBSimilarResponse {
  page: number;
  results: TMDBShow[];
  total_pages: number;
  total_results: number;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  episode_number: number;
  season_number: number;
  still_path: string;
  vote_average: number;
  vote_count: number;
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  season_number: number;
  poster_path: string;
  episodes: TMDBEpisode[];
}

export class TMDBService {
  private static getAuthHeaders() {
    if (TMDB_ACCESS_TOKEN) {
      return {
        'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      };
    } else if (TMDB_API_KEY) {
      return {
        'Content-Type': 'application/json'
      };
    } else {
      throw new Error('TMDB API credentials not configured');
    }
  }

  private static getAuthParams() {
    if (TMDB_API_KEY) {
      return { api_key: TMDB_API_KEY };
    }
    return {};
  }

  /**
   * 搜索剧集
   */
  static async searchShows(query: string, page: number = 1): Promise<TMDBSearchResponse> {
    try {
      const params = new URLSearchParams({
        query,
        page: page.toString(),
        include_adult: 'false',
        language: 'zh-CN',
        ...this.getAuthParams()
      });

      const response = await axios.get(
        `${TMDB_BASE_URL}/search/tv?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );

      const data = response.data as TMDBSearchResponse;
      logger.info(`TMDB search successful: "${query}" - ${data.results.length} results`);
      return data;
    } catch (error) {
      logger.error('TMDB search failed:', error);
      throw new Error(`Failed to search shows: ${error}`);
    }
  }

  /**
   * 获取剧集详情
   */
  static async getShowDetails(showId: number): Promise<TMDBShow> {
    try {
      const params = new URLSearchParams({
        language: 'zh-CN',
        ...this.getAuthParams()
      });

      const response = await axios.get(
        `${TMDB_BASE_URL}/tv/${showId}?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );

      logger.info(`TMDB show details retrieved: ID ${showId}`);
      return response.data as TMDBShow;
    } catch (error) {
      logger.error(`TMDB get show details failed for ID ${showId}:`, error);
      throw new Error(`Failed to get show details: ${error}`);
    }
  }

  /**
   * 获取剧集季数信息
   */
  static async getSeasonDetails(showId: number, seasonNumber: number): Promise<TMDBSeason> {
    try {
      const params = new URLSearchParams({
        language: 'zh-CN',
        ...this.getAuthParams()
      });

      const response = await axios.get(
        `${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );

      logger.info(`TMDB season details retrieved: Show ${showId}, Season ${seasonNumber}`);
      return response.data as TMDBSeason;
    } catch (error) {
      logger.error(`TMDB get season details failed: Show ${showId}, Season ${seasonNumber}:`, error);
      throw new Error(`Failed to get season details: ${error}`);
    }
  }

  /**
   * 获取相似剧集
   */
  static async getSimilarShows(showId: number, page: number = 1): Promise<TMDBSimilarResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        language: 'zh-CN',
        ...this.getAuthParams()
      });

      const response = await axios.get(
        `${TMDB_BASE_URL}/tv/${showId}/similar?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );

      const data = response.data as TMDBSimilarResponse;
      logger.info(`TMDB similar shows retrieved: Show ${showId} - ${data.results.length} results`);
      return data;
    } catch (error) {
      logger.error(`TMDB get similar shows failed for ID ${showId}:`, error);
      throw new Error(`Failed to get similar shows: ${error}`);
    }
  }

  /**
   * 获取热门剧集
   */
  static async getPopularShows(page: number = 1): Promise<TMDBSearchResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        language: 'zh-CN',
        ...this.getAuthParams()
      });

      const response = await axios.get(
        `${TMDB_BASE_URL}/tv/popular?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );

      const data = response.data as TMDBSearchResponse;
      logger.info(`TMDB popular shows retrieved: ${data.results.length} results`);
      return data;
    } catch (error) {
      logger.error('TMDB get popular shows failed:', error);
      throw new Error(`Failed to get popular shows: ${error}`);
    }
  }

  /**
   * 获取正在播放的剧集
   */
  static async getOnTheAirShows(page: number = 1): Promise<TMDBSearchResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        language: 'zh-CN',
        ...this.getAuthParams()
      });

      const response = await axios.get(
        `${TMDB_BASE_URL}/tv/on_the_air?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );

      const data = response.data as TMDBSearchResponse;
      logger.info(`TMDB on the air shows retrieved: ${data.results.length} results`);
      return data;
    } catch (error) {
      logger.error('TMDB get on the air shows failed:', error);
      throw new Error(`Failed to get on the air shows: ${error}`);
    }
  }

  /**
   * 获取剧集图片 URL
   */
  static getImageUrl(path: string, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  /**
   * 检查 TMDB API 配置
   */
  static checkConfiguration(): { hasApiKey: boolean; hasAccessToken: boolean; isConfigured: boolean } {
    const hasApiKey = !!TMDB_API_KEY;
    const hasAccessToken = !!TMDB_ACCESS_TOKEN;
    const isConfigured = hasApiKey || hasAccessToken;

    logger.info(`TMDB Configuration: API Key=${hasApiKey}, Access Token=${hasAccessToken}, Configured=${isConfigured}`);
    
    return { hasApiKey, hasAccessToken, isConfigured };
  }
} 