import axios from 'axios';
import { logger } from '../utils/logger';

// OMDb API 配置
const OMDB_BASE_URL = process.env.OMDB_BASE_URL || 'http://www.omdbapi.com';
const OMDB_API_KEY = process.env.OMDB_API_KEY || '47668551'; // 使用提供的API key作为默认值

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

// Type guard functions
function isOMDBSearchResponse(data: unknown): data is OMDBSearchResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'Response' in data &&
    'Search' in data &&
    Array.isArray((data as any).Search)
  );
}

function isOMDBShow(data: unknown): data is OMDBShow {
  return (
    typeof data === 'object' &&
    data !== null &&
    'Response' in data &&
    'Title' in data &&
    'imdbID' in data
  );
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

      // Type-safe property access
      if (typeof data === 'object' && data !== null && 'Response' in data) {
        const responseData = data as { Response: string; Error?: string; Search?: OMDBSearchResult[] };
        
        if (responseData.Response === 'False') {
          const errorMessage = responseData.Error || 'Unknown error';
          logger.warn(`OMDb search failed for "${query}": ${errorMessage}`);
          return {
            Search: [],
            totalResults: '0',
            Response: 'False'
          };
        }

        if (responseData.Search && Array.isArray(responseData.Search)) {
          logger.info(`OMDb search successful: "${query}" - ${responseData.Search.length} results`);
          return {
            Search: responseData.Search,
            totalResults: responseData.Search.length.toString(),
            Response: 'True'
          };
        }
      }

      // Fallback for unexpected response format
      logger.warn(`OMDb search returned unexpected format for "${query}"`);
      return {
        Search: [],
        totalResults: '0',
        Response: 'False'
      };
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

      // Type-safe property access
      if (typeof data === 'object' && data !== null && 'Response' in data) {
        const responseData = data as { Response: string; Error?: string } & OMDBShow;
        
        if (responseData.Response === 'False') {
          const errorMessage = responseData.Error || 'Show not found';
          throw new Error(errorMessage);
        }

        if (isOMDBShow(data)) {
          logger.info(`OMDb show details retrieved: ${imdbId}`);
          return data;
        }
      }

      throw new Error('Invalid response format from OMDb API');
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
      genres: [],
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
      const data = response.data;
      
      // Type-safe property access
      let responseValue: string | undefined;
      let errorValue: string | undefined;
      
      if (typeof data === 'object' && data !== null) {
        if ('Response' in data) {
          responseValue = (data as any).Response;
        }
        if ('Error' in data) {
          errorValue = (data as any).Error;
        }
      }
      
      const isConfigured = responseValue !== 'False' || errorValue !== 'Invalid API key!';
      
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
