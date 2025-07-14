import { API_BASE_URL } from '../constants/config';

// TMDB 剧集接口
export interface TMDBShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date: string;
  last_air_date: string;
  status: string;
  type: string;
  genres?: Array<{ id: number; name: string }>;
  genre_ids?: number[];
  networks?: Array<{ id: number; name: string }>;
  production_companies?: Array<{ id: number; name: string }>;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_path: string;
  backdrop_path: string;
  original_language: string;
  origin_country: string[];
  created_by?: Array<{ id: number; name: string; profile_path: string }>;
}

export interface TMDBSearchResponse {
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
  private static baseUrl = `${API_BASE_URL}/tmdb`;

  // Genre ID 到 Genre Name 的映射
  private static genreMap: { [key: number]: string } = {
    10759: '动作冒险',
    16: '动画',
    35: '喜剧',
    80: '犯罪',
    99: '纪录片',
    18: '剧情',
    10751: '家庭',
    10762: '儿童',
    9648: '悬疑',
    10763: '新闻',
    10764: '真人秀',
    10765: '科幻奇幻',
    10766: '肥皂剧',
    10767: '脱口秀',
    10768: '战争政治',
    37: '西部'
  };

  /**
   * 根据 genre_ids 获取 genre 名称
   */
  static getGenreNames(genreIds: number[]): string[] {
    return genreIds.map(id => this.genreMap[id] || '未知类型');
  }

  /**
   * 根据 genre_ids 获取 genre 对象数组
   */
  static getGenresFromIds(genreIds: number[]): Array<{ id: number; name: string }> {
    return genreIds.map(id => ({
      id,
      name: this.genreMap[id] || '未知类型'
    }));
  }

  /**
   * 搜索剧集
   */
  static async searchShows(query: string, page: number = 1): Promise<TMDBSearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(query)}&page=${page}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }
      
      return data.data;
    } catch (error) {
      console.error('TMDB search shows error:', error);
      throw error;
    }
  }

  /**
   * 获取剧集详情
   */
  static async getShowDetails(showId: number): Promise<TMDBShow> {
    try {
      const response = await fetch(`${this.baseUrl}/shows/${showId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Get show details failed');
      }
      
      return data.data;
    } catch (error) {
      console.error('TMDB get show details error:', error);
      throw error;
    }
  }

  /**
   * 获取剧集季数信息
   */
  static async getSeasonDetails(showId: number, seasonNumber: number): Promise<TMDBSeason> {
    try {
      const response = await fetch(`${this.baseUrl}/shows/${showId}/seasons/${seasonNumber}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Get season details failed');
      }
      
      return data.data;
    } catch (error) {
      console.error('TMDB get season details error:', error);
      throw error;
    }
  }

  /**
   * 获取相似剧集
   */
  static async getSimilarShows(showId: number, page: number = 1): Promise<TMDBSearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/shows/${showId}/similar?page=${page}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Get similar shows failed');
      }
      
      return data.data;
    } catch (error) {
      console.error('TMDB get similar shows error:', error);
      throw error;
    }
  }

  /**
   * 获取热门剧集
   */
  static async getPopularShows(page: number = 1): Promise<TMDBSearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/shows/popular?page=${page}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Get popular shows failed');
      }
      
      return data.data;
    } catch (error) {
      console.error('TMDB get popular shows error:', error);
      throw error;
    }
  }

  /**
   * 获取正在播放的剧集
   */
  static async getOnTheAirShows(page: number = 1): Promise<TMDBSearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/shows/on-the-air?page=${page}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Get on the air shows failed');
      }
      
      return data.data;
    } catch (error) {
      console.error('TMDB get on the air shows error:', error);
      throw error;
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
   * 检查 TMDB API 状态
   */
  static async checkStatus(): Promise<{ configured: boolean; hasApiKey: boolean; hasAccessToken: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Status check failed');
      }
      
      return data.data;
    } catch (error) {
      console.error('TMDB status check error:', error);
      throw error;
    }
  }
} 