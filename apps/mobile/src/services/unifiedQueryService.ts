// 统一查询服务 - 处理多种输入类型的查询
import { analyzeInput, getQuerySuggestions, InputAnalysis } from '../utils/inputDetector';
import { wordService } from './wordService';
import { directTranslationService, DirectTranslationResult } from './directTranslationService';

export interface QueryResult {
  type: 'dictionary' | 'translation' | 'ambiguous';
  data: any;
  suggestions?: {
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

      // 执行翻译查询
      const translationResults = await this.queryTranslation(suggestions.translation, uiLanguage, targetLanguage);

      // 判断结果类型
      const hasTranslationResults = translationResults.some(result => result.success && result.candidates && result.candidates.length > 0);

      console.log(`🔍 查询结果:`, {
        hasTranslationResults,
        translationCount: translationResults.filter(r => r.success).length
      });

      // 处理结果
      if (hasTranslationResults) {
        // 只有翻译结果
        const mergedResult = this.mergeTranslationResults(translationResults);
        
        // 检查是否有完整的wordData（来自direct-translate API）
        const wordDataResult = translationResults.find(result => result.wordData);
        if (wordDataResult && wordDataResult.wordData) {
          return {
            type: 'translation',
            data: wordDataResult.wordData
          };
        }
        
        // 否则创建WordData对象
        const wordData = {
          word: input,
          correctedWord: mergedResult.candidates[0] || '', // 显示翻译结果
          translation: mergedResult.candidates[0] || '',
          candidates: mergedResult.candidates,
          definitions: [{
            partOfSpeech: 'translation',
            definition: input, // 显示原文
            examples: []
          }],
          language: targetLanguage,
          translationSource: mergedResult.source
        };
        return {
          type: 'translation',
          data: wordData
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
   * 合并翻译结果
   */
  private mergeTranslationResults(results: any[]): { candidates: string[], source: string } {
    const merged = [];
    let source = 'unknown';
    
    for (const result of results) {
      if (result.success && result.candidates) {
        merged.push(...result.candidates);
        // 使用第一个成功的翻译来源
        if (source === 'unknown' && result.source) {
          source = result.source;
        }
      }
    }
    
    return {
      candidates: [...new Set(merged)], // 去重
      source: source
    };
  }
}

// 导出单例实例
export const unifiedQueryService = UnifiedQueryService.getInstance();
