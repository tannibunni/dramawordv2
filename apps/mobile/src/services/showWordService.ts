import { API_BASE_URL } from '../constants/config';

export interface WordStats {
  totalUniqueWords: number;
  totalAssociations: number;
  userCount: number;
  difficultyLevel: string;
  estimatedLearningTime: number;
  wordCategories: {
    nouns: number;
    verbs: number;
    adjectives: number;
    adverbs: number;
  };
}

export interface PopularWord {
  word: string;
  frequency: number;
  definitions: string[];
  difficulty: string;
}

export interface ShowInfo {
  posterUrl?: string;
  description?: string;
  totalEpisodes?: number;
  averageEpisodeLength?: number;
  rating?: number;
}

export interface ShowWordPreview {
  showId: string;
  showName: string;
  originalTitle?: string;
  language: string;
  genre: string[];
  year?: number;
  wordStats: WordStats;
  popularWords: PopularWord[];
  showInfo: ShowInfo;
}

export interface WordPackage {
  packageId: string;
  showId: string;
  showName: string;
  words: Array<{
    wordId: string;
    word: string;
    definitions: string[];
    phonetic?: string;
    examples: Array<{
      english: string;
      chinese: string;
      context?: string;
    }>;
    difficulty: string;
    tags: string[];
  }>;
  packageInfo: {
    name: string;
    description: string;
    wordCount: number;
    estimatedStudyTime: number;
    difficulty: string;
    tags: string[];
  };
  downloadInfo: {
    downloadedAt: string;
    lastAccessed: string;
    studyProgress: number;
    completedWords: number;
    totalWords: number;
  };
}

class ShowWordService {
  private baseUrl = `${API_BASE_URL}/show-words`;

  /**
   * 获取剧集单词预览
   */
  async getShowPreview(showId: string): Promise<ShowWordPreview> {
    try {
      const response = await fetch(`${this.baseUrl}/preview/${showId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || '获取剧集预览失败');
      }
      
      return result.data;
    } catch (error) {
      console.error('[ShowWordService] 获取剧集预览失败:', error);
      throw error;
    }
  }

  /**
   * 生成剧集单词包
   */
  async generateWordPackage(
    showId: string,
    userId: string,
    packageType: 'essential' | 'complete' | 'beginner' = 'essential'
  ): Promise<WordPackage> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-package`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showId,
          userId,
          packageType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '生成单词包失败');
      }

      return result.data;
    } catch (error) {
      console.error('[ShowWordService] 生成单词包失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的单词包列表
   */
  async getUserWordPackages(userId: string): Promise<WordPackage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/user-packages/${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '获取用户单词包失败');
      }

      return result.data;
    } catch (error) {
      console.error('[ShowWordService] 获取用户单词包失败:', error);
      throw error;
    }
  }

  /**
   * 更新单词包学习进度
   */
  async updatePackageProgress(
    packageId: string,
    userId: string,
    completedWords: number
  ): Promise<WordPackage> {
    try {
      const response = await fetch(`${this.baseUrl}/update-progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          userId,
          completedWords,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '更新单词包进度失败');
      }

      return result.data;
    } catch (error) {
      console.error('[ShowWordService] 更新单词包进度失败:', error);
      throw error;
    }
  }

  /**
   * 搜索剧集单词预览
   */
  async searchShowPreviews(
    query: string = '',
    language?: string,
    limit: number = 20
  ): Promise<ShowWordPreview[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (language) params.append('language', language);
      params.append('limit', limit.toString());

      const response = await fetch(`${this.baseUrl}/search?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '搜索剧集预览失败');
      }

      return result.data;
    } catch (error) {
      console.error('[ShowWordService] 搜索剧集预览失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门剧集（按单词数量排序）
   */
  async getPopularShows(limit: number = 20, language?: string): Promise<ShowWordPreview[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (language) params.append('language', language);

      const response = await fetch(`${this.baseUrl}/popular?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '获取热门剧集失败');
      }

      return result.data;
    } catch (error) {
      console.error('[ShowWordService] 获取热门剧集失败:', error);
      throw error;
    }
  }

  /**
   * 创建或更新剧集单词预览（管理员功能）
   */
  async createOrUpdatePreview(showId: string): Promise<ShowWordPreview> {
    try {
      const response = await fetch(`${this.baseUrl}/preview/${showId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '创建剧集预览失败');
      }

      return result.data;
    } catch (error) {
      console.error('[ShowWordService] 创建剧集预览失败:', error);
      throw error;
    }
  }
}

export const showWordService = new ShowWordService();
export default showWordService;
