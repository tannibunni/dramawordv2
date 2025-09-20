// Jotoba API 服务 - 日语词典查询
import { API_BASE_URL } from '../constants/config';

export interface JotobaWord {
  id: number;
  reading: string;
  kanji: string;
  senses: Array<{
    glosses: string[];
    pos: string[];
    language: string;
  }>;
  frequency?: number;
}

export interface JotobaSearchResult {
  success: boolean;
  data?: JotobaWord[];
  error?: string;
}

export class JotobaService {
  private static instance: JotobaService;
  private cache = new Map<string, JotobaSearchResult>();

  static getInstance(): JotobaService {
    if (!JotobaService.instance) {
      JotobaService.instance = new JotobaService();
    }
    return JotobaService.instance;
  }

  /**
   * 搜索日语词汇
   */
  async searchWord(query: string): Promise<JotobaSearchResult> {
    try {
      console.log(`🔍 Jotoba搜索: ${query}`);

      // 检查缓存
      const cacheKey = query.toLowerCase().trim();
      if (this.cache.has(cacheKey)) {
        console.log(`✅ 从缓存获取Jotoba结果: ${query}`);
        return this.cache.get(cacheKey)!;
      }

      // 调用Jotoba API
      const response = await fetch(`${API_BASE_URL}/jotoba/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          language: 'english' // 返回英文释义
        })
      });

      if (!response.ok) {
        throw new Error(`Jotoba API error: ${response.status}`);
      }

      const result = await response.json();
      
      // 缓存结果
      this.cache.set(cacheKey, result);
      
      console.log(`✅ Jotoba搜索结果: ${query} -> ${result.data?.length || 0} 个结果`);
      return result;

    } catch (error) {
      console.error(`❌ Jotoba搜索失败: ${query}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '搜索失败'
      };
    }
  }

  /**
   * 搜索多个查询词
   */
  async searchMultiple(queries: string[]): Promise<JotobaSearchResult[]> {
    const results = await Promise.all(
      queries.map(query => this.searchWord(query))
    );
    return results;
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// 导出单例实例
export const jotobaService = JotobaService.getInstance();
