// 统一查询服务 - 处理多种输入类型的查询
import { analyzeInput, getQuerySuggestions, InputAnalysis } from '../utils/inputDetector';
import { wordService } from './wordService';
import { directTranslationService, DirectTranslationResult } from './directTranslationService';
import { 
  LanguageEnvironmentFactory, 
  LanguageEnvironment, 
  UnifiedQueryResult
} from './languageEnvironment';

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
  private environmentFactory: LanguageEnvironmentFactory;

  constructor() {
    this.environmentFactory = LanguageEnvironmentFactory.getInstance();
  }

  static getInstance(): UnifiedQueryService {
    if (!UnifiedQueryService.instance) {
      UnifiedQueryService.instance = new UnifiedQueryService();
    }
    return UnifiedQueryService.instance;
  }

  /**
   * 转换语言环境结果为查询结果
   */
  private convertLanguageResultToQueryResult(
    result: UnifiedQueryResult, 
    input: string, 
    targetLanguage: string
  ): QueryResult | AmbiguousResult {
    if (!result.success || !result.candidates || result.candidates.length === 0) {
      return {
        type: 'translation',
        data: {
          word: input,
          correctedWord: input,
          translation: '',
          translationSource: 'none',
          candidates: [],
          language: targetLanguage
        }
      };
    }

    // 🔧 拼音结果特殊处理：candidates 是对象数组 {chinese, english}
    if (result.isPinyinResult && Array.isArray(result.candidates)) {
      const pinyinCandidates = result.candidates as any[];
      
      if (pinyinCandidates.length === 1) {
        // 单个拼音结果
        return {
          type: 'translation',
          data: {
            word: input,
            correctedWord: pinyinCandidates[0].chinese,
            translation: pinyinCandidates[0].chinese,
            translationSource: result.source || 'pinyin_api',
            candidates: [pinyinCandidates[0].chinese],  // 🔧 确保candidates是字符串数组
            language: targetLanguage,
            ...result.wordData
          }
        };
      } else {
        // 多个拼音候选词，显示为选项列表
        return {
          type: 'ambiguous',
          options: pinyinCandidates.map((candidate: any) => ({
            type: 'translation' as const,
            title: `${candidate.chinese} - ${candidate.english}`,  // 显示格式：杯子 - cup
            description: `拼音: ${input}`,
            data: {
              word: input,
              correctedWord: candidate.chinese,
              translation: candidate.chinese,
              translationSource: result.source || 'pinyin_api',
              candidates: pinyinCandidates,  // 🔧 保留完整的候选词对象数组，包含audioUrl
              language: targetLanguage,
              pinyin: input,
              phonetic: input,  // 添加phonetic字段
              audioUrl: candidate.audioUrl,  // 🔧 添加audioUrl
              definitions: [{
                definition: candidate.english,
                examples: []
              }]
            }
          }))
        };
      }
    }

    // 普通翻译结果处理
    if (result.candidates.length === 1) {
      // 单个结果
      return {
        type: 'translation',
        data: {
          word: input,
          correctedWord: result.candidates[0],
          translation: result.candidates[0],
          translationSource: result.source || 'unknown',
          candidates: result.candidates,
          language: targetLanguage,
          // 🔧 包含增强的wordData信息（拼音、audioUrl、definitions等）
          ...result.wordData
        }
      };
    } else {
      // 多个结果，返回歧义选择
      return {
        type: 'ambiguous',
        options: result.candidates.map((candidate: string) => ({
          type: 'translation' as const,
          title: candidate,
          description: `翻译结果: ${candidate}`,
          data: {
            word: input,
            correctedWord: candidate,
            translation: candidate,
            translationSource: result.source || 'unknown',
            candidates: [candidate],
            language: targetLanguage
          }
        }))
      };
    }
  }

  /**
   * 统一查询入口
   */
  async query(input: string, uiLanguage: string = 'en-US', targetLanguage: string = 'ja'): Promise<QueryResult | AmbiguousResult> {
    try {
      console.log(`🔍 统一查询: "${input}" (UI: ${uiLanguage}, Target: ${targetLanguage})`);

      // 1. 获取语言环境
      const environment = this.environmentFactory.createEnvironment(uiLanguage, targetLanguage);
      
      // 2. 分析输入
      const analysis = environment.analyzeInput(input);
      console.log(`🔍 输入分析结果:`, analysis);

      // 3. 选择查询策略
      const strategy = environment.selectQueryStrategy(input, analysis);
      console.log(`🔍 查询策略:`, strategy);

      // 4. 执行查询
      let result: UnifiedQueryResult;
      
      switch (strategy) {
        case 'local_only':
          result = await environment.queryLocalDictionary(input, analysis);
          break;
        case 'online_only':
          result = await environment.queryOnlineTranslation(input, analysis);
          break;
        case 'hybrid':
          result = await environment.queryHybrid(input, analysis);
          break;
        default:
          throw new Error(`Unknown query strategy: ${strategy}`);
      }

      // 5. 转换结果格式
      return this.convertLanguageResultToQueryResult(result, input, targetLanguage);

    } catch (error) {
      console.error('❌ 统一查询失败:', error);
      throw error;
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
