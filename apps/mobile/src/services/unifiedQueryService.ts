// 统一查询服务 - 处理多种输入类型的查询
import { analyzeInput, getQuerySuggestions, InputAnalysis } from '../utils/inputDetector';
import { jotobaService, JotobaSearchResult } from './jotobaService';
import { wordService } from './wordService';
import { directTranslationService, DirectTranslationResult } from './directTranslationService';

export interface QueryResult {
  type: 'dictionary' | 'translation' | 'ambiguous';
  data: any;
  suggestions?: {
    dictionary?: JotobaSearchResult;
    translation?: any;
  };
}

export interface AmbiguousResult {
  type: 'ambiguous';
  options: Array<{
    type: 'dictionary' | 'translation';
    title: string;
    description: string;
    data: any;
  }>;
}

export class UnifiedQueryService {
  private static instance: UnifiedQueryService;

  static getInstance(): UnifiedQueryService {
    if (!UnifiedQueryService.instance) {
      UnifiedQueryService.instance = new UnifiedQueryService();
    }
    return UnifiedQueryService.instance;
  }

  /**
   * 统一查询入口
   */
  async query(input: string, uiLanguage: string = 'en-US', targetLanguage: string = 'ja'): Promise<QueryResult | AmbiguousResult> {
    try {
      console.log(`🔍 统一查询: "${input}"`);

      // 分析输入类型
      const analysis = analyzeInput(input);
      console.log(`🔍 输入分析结果:`, analysis);

      // 获取查询建议
      const suggestions = getQuerySuggestions(analysis);
      console.log(`🔍 查询建议:`, suggestions);

      // 检查是否为英文句子，如果是则直接翻译
      if (analysis.type === 'english_sentence') {
        const directResult = await directTranslationService.translateEnglishSentence(input, uiLanguage, targetLanguage);
        if (directResult.success && directResult.data) {
          return {
            type: 'translation',
            data: directResult.data
          };
        }
      }

      // 并行执行查询
      const [dictionaryResults, translationResults] = await Promise.all([
        this.queryDictionary(suggestions.dictionary),
        this.queryTranslation(suggestions.translation, uiLanguage, targetLanguage)
      ]);

      // 判断结果类型
      const hasDictionaryResults = dictionaryResults.some(result => result.success && result.data && result.data.length > 0);
      const hasTranslationResults = translationResults.some(result => result.success && result.candidates && result.candidates.length > 0);

      console.log(`🔍 查询结果:`, {
        hasDictionaryResults,
        hasTranslationResults,
        dictionaryCount: dictionaryResults.filter(r => r.success).length,
        translationCount: translationResults.filter(r => r.success).length
      });

      // 处理结果
      if (hasDictionaryResults && hasTranslationResults) {
        // 歧义情况：返回选择卡片
        return this.createAmbiguousResult(dictionaryResults, translationResults, input);
      } else if (hasDictionaryResults) {
        // 只有词典结果
        return {
          type: 'dictionary',
          data: this.mergeDictionaryResults(dictionaryResults)
        };
      } else if (hasTranslationResults) {
        // 只有翻译结果
        return {
          type: 'translation',
          data: this.mergeTranslationResults(translationResults)
        };
      } else {
        // 没有结果
        return {
          type: 'dictionary',
          data: []
        };
      }

    } catch (error) {
      console.error(`❌ 统一查询失败: ${input}`, error);
      return {
        type: 'dictionary',
        data: []
      };
    }
  }

  /**
   * 查询词典
   */
  private async queryDictionary(queries: string[]): Promise<JotobaSearchResult[]> {
    if (queries.length === 0) {
      return [];
    }

    try {
      const results = await jotobaService.searchMultiple(queries);
      return results;
    } catch (error) {
      console.error(`❌ 词典查询失败:`, error);
      return queries.map(() => ({
        success: false,
        error: '查询失败'
      }));
    }
  }

  /**
   * 查询翻译
   */
  private async queryTranslation(queries: string[], uiLanguage: string, targetLanguage: string): Promise<any[]> {
    if (queries.length === 0) {
      return [];
    }

    try {
      const results = await Promise.all(
        queries.map(async (query) => {
          if (!query) return { success: false, error: '空查询' };
          
          // 尝试中文翻译到目标语言
          const chineseResult = await wordService.translateChineseToTargetLanguage(query, targetLanguage);
          if (chineseResult.success) {
            return chineseResult;
          }

          // 尝试英文翻译到目标语言
          const englishResult = await wordService.translateEnglishToTargetLanguage(query, targetLanguage);
          if (englishResult.success) {
            return englishResult;
          }

          return { success: false, error: '翻译失败' };
        })
      );

      return results;
    } catch (error) {
      console.error(`❌ 翻译查询失败:`, error);
      return queries.map(() => ({
        success: false,
        error: '查询失败'
      }));
    }
  }

  /**
   * 创建歧义结果
   */
  private createAmbiguousResult(
    dictionaryResults: JotobaSearchResult[],
    translationResults: any[],
    input: string
  ): AmbiguousResult {
    const options = [];

    // 词典选项
    const dictionaryData = this.mergeDictionaryResults(dictionaryResults);
    if (dictionaryData && dictionaryData.length > 0) {
      options.push({
        type: 'dictionary' as const,
        title: 'Dictionary',
        description: `Search for "${input}" in Japanese dictionary`,
        data: dictionaryData
      });
    }

    // 翻译选项
    const translationData = this.mergeTranslationResults(translationResults);
    if (translationData && translationData.length > 0) {
      options.push({
        type: 'translation' as const,
        title: 'Translation',
        description: `Translate "${input}" to Japanese`,
        data: translationData
      });
    }

    return {
      type: 'ambiguous',
      options
    };
  }

  /**
   * 合并词典结果
   */
  private mergeDictionaryResults(results: JotobaSearchResult[]): any[] {
    const merged = [];
    for (const result of results) {
      if (result.success && result.data) {
        merged.push(...result.data);
      }
    }
    return merged;
  }

  /**
   * 合并翻译结果
   */
  private mergeTranslationResults(results: any[]): string[] {
    const merged = [];
    for (const result of results) {
      if (result.success && result.candidates) {
        merged.push(...result.candidates);
      }
    }
    return [...new Set(merged)]; // 去重
  }
}

// 导出单例实例
export const unifiedQueryService = UnifiedQueryService.getInstance();
