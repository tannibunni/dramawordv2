import { apiClient } from './apiClient';

export interface RecommendationCard {
  _id?: string;
  tmdbShowId: number;
  title: string;
  originalTitle: string;
  backdropUrl: string;
  posterUrl: string;
  recommendation: {
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    language: 'zh-CN' | 'en-US';
    category: string[];
    tags: string[];
  };
  metadata: {
    genre: string[];
    rating: number;
    year: number;
    status: 'active' | 'inactive' | 'draft';
    priority: number;
    views: number;
    likes: number;
  };
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationQuery {
  page?: number;
  limit?: number;
  language?: string;
  difficulty?: string;
  category?: string | string[];
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SmartRecommendationQuery {
  language?: string;
  limit?: number;
  userPreferences?: {
    difficulty?: string;
    categories?: string[];
  };
}

export class RecommendationService {
  // 获取推荐列表
  static async getRecommendations(query: RecommendationQuery = {}) {
    const params = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const response = await apiClient.get(`/recommendations?${params.toString()}`);
    return response.data;
  }

  // 获取智能推荐
  static async getSmartRecommendations(query: SmartRecommendationQuery = {}) {
    const params = new URLSearchParams();
    
    if (query.language) params.append('language', query.language);
    if (query.limit) params.append('limit', String(query.limit));
    if (query.userPreferences) {
      params.append('userPreferences', JSON.stringify(query.userPreferences));
    }

    const response = await apiClient.get(`/recommendations/smart?${params.toString()}`);
    return response.data;
  }

  // 获取推荐统计
  static async getRecommendationStats() {
    const response = await apiClient.get('/recommendations/stats');
    return response.data;
  }

  // 获取单个推荐详情
  static async getRecommendationById(id: string) {
    const response = await apiClient.get(`/recommendations/${id}`);
    return response.data;
  }

  // 创建推荐内容（需要认证）
  static async createRecommendation(data: Partial<RecommendationCard>) {
    const response = await apiClient.post('/recommendations', data);
    return response.data;
  }

  // 更新推荐内容（需要认证）
  static async updateRecommendation(id: string, data: Partial<RecommendationCard>) {
    const response = await apiClient.put(`/recommendations/${id}`, data);
    return response.data;
  }

  // 删除推荐内容（需要认证）
  static async deleteRecommendation(id: string) {
    const response = await apiClient.delete(`/recommendations/${id}`);
    return response.data;
  }

  // 批量导入推荐内容（需要认证）
  static async batchImportRecommendations(recommendations: Partial<RecommendationCard>[]) {
    const response = await apiClient.post('/recommendations/batch-import', {
      recommendations
    });
    return response.data;
  }

  // 从TMDB数据创建推荐内容
  static async createFromTMDBShow(tmdbShow: any, recommendationText: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    const recommendationData = {
      tmdbShowId: tmdbShow.id,
      title: tmdbShow.name,
      originalTitle: tmdbShow.original_name,
      backdropUrl: tmdbShow.backdrop_path ? `https://image.tmdb.org/t/p/w780${tmdbShow.backdrop_path}` : '',
      posterUrl: tmdbShow.poster_path ? `https://image.tmdb.org/t/p/w92${tmdbShow.poster_path}` : '',
      recommendation: {
        text: recommendationText,
        difficulty,
        language: 'zh-CN',
        category: tmdbShow.genre_ids?.map((id: number) => {
          const genreMap: { [key: number]: string } = {
            35: 'comedy',
            18: 'drama',
            80: 'crime',
            9648: 'mystery',
            10749: 'romance',
            28: 'action',
            878: 'sci-fi',
            27: 'horror',
            99: 'documentary'
          };
          return genreMap[id] || 'drama';
        }) || ['drama'],
        tags: []
      },
      metadata: {
        genre: tmdbShow.genre_ids || [],
        rating: tmdbShow.vote_average || 0,
        year: tmdbShow.first_air_date ? new Date(tmdbShow.first_air_date).getFullYear() : 0,
        status: 'draft',
        priority: 5,
        views: 0,
        likes: 0
      }
    };

    return this.createRecommendation(recommendationData);
  }
} 