import axios from 'axios';
import { logger } from '../utils/logger';

// OMDb API 配置
const OMDB_BASE_URL = 'http://www.omdbapi.com';
const OMDB_API_KEY = '47668551'; // 使用提供的API key

// OMDb API 响应接口
export interface OMDBShow {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Poster: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

export interface OMDBSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OMDBSearchResponse {
  Search: OMDBSearchResult[];
  totalResults: string;
  Response: string;
}

export class OMDBService {
  /**
   * 搜索电影和剧集
   */
  static async searchShows(query: string, type: 'movie' | 'series' | 'episode' = 'series'): Promise<OMDBSearchResponse> {
    try {
      const params = new URLSearchParams({
        s: query,
        type,
        apikey: OMDB_API_KEY
      });

      const response = await axios.get(`${OMDB_BASE_URL}/?${params.toString()}`);
      const data = response.data;

      if (data.Response === 'False') {
        logger.warn(`OMDb search failed for "${query}": ${data.Error}`);
        return {
          Search: [],
          totalResults: '0',
          Response: 'False'
        };
      }

      logger.info(`OMDb search successful: "${query}" - ${data.Search?.length || 0} results`);
      return data as OMDBSearchResponse;
    } catch (error) {
      logger.error('OMDb search failed:', error);
      throw new Error(`Failed to search OMDb: ${error}`);
    }
  }

  /**
   * 根据IMDB ID获取详细信息
   */
  static async getShowDetails(imdbId: string): Promise<OMDBShow> {
    try {
      const params = new URLSearchParams({
        i: imdbId,
        apikey: OMDB_API_KEY
      });

      const response = await axios.get(`${OMDB_BASE_URL}/?${params.toString()}`);
      const data = response.data;

      if (data.Response === 'False') {
        throw new Error(data.Error || 'Show not found');
      }

      logger.info(`OMDb show details retrieved: ${imdbId}`);
      return data as OMDBShow;
    } catch (error) {
      logger.error(`OMDb get show details failed for ID ${imdbId}:`, error);
      throw new Error(`Failed to get OMDb show details: ${error}`);
    }
  }

  /**
   * 将OMDb结果转换为TMDB格式以保持兼容性
   */
  static convertToTMDBFormat(omdbShow: OMDBSearchResult): any {
    return {
      id: parseInt(omdbShow.imdbID.replace('tt', '')),
      name: omdbShow.Title,
      original_name: omdbShow.Title,
      overview: '',
      first_air_date: omdbShow.Year,
      last_air_date: omdbShow.Year,
      status: 'unknown',
      type: omdbShow.Type === 'series' ? 'tv' : omdbShow.Type,
      genres: omdbShow.Genre ? omdbShow.Genre.split(', ').map((genre, index) => ({ id: 1000 + index, name: genre })) : [],
      genre_ids: [],
      networks: [],
      production_companies: [],
      episode_run_time: [],
      number_of_seasons: 0,
      number_of_episodes: 0,
      vote_average: 0,
      vote_count: 0,
      popularity: 0,
      poster_path: omdbShow.Poster !== 'N/A' ? omdbShow.Poster : '',
      backdrop_path: '',
      original_language: 'en',
      origin_country: [],
      created_by: [],
      // 添加OMDb特有字段
      omdb_id: omdbShow.imdbID,
      omdb_year: omdbShow.Year,
      omdb_type: omdbShow.Type,
      source: 'omdb'
    };
  }

  /**
   * 检查OMDb API状态
   */
  static async checkStatus(): Promise<{ configured: boolean; message: string }> {
    try {
      const response = await axios.get(`${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&s=test`);
      const isConfigured = response.data.Response !== 'False' || response.data.Error !== 'Invalid API key!';
      
      logger.info(`OMDb Configuration: Configured=${isConfigured}`);
      
      return {
        configured: isConfigured,
        message: isConfigured ? 'OMDb API is working' : 'OMDb API configuration issue'
      };
    } catch (error) {
      logger.error('OMDb status check failed:', error);
      return {
        configured: false,
        message: 'OMDb API check failed'
      };
    }
  }
}
