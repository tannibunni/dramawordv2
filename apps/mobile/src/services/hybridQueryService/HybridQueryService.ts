// 混合查询服务
import { DictionaryManager } from '../dictionaryManager/DictionaryManager';
import { LanguageEnvironmentFactory } from '../languageEnvironment';
import { UnifiedQueryResult } from '../languageEnvironment/types';
import { LocalQueryResult } from '../localDictionary/types';

export interface HybridQueryOptions {
  enableLocalDictionary: boolean;
  enableOnlineTranslation: boolean;
  localFirst: boolean;
  maxCandidates: number;
  minConfidence: number;
}

export class HybridQueryService {
  private static instance: HybridQueryService;
  private dictionaryManager: DictionaryManager;
  private environmentFactory: LanguageEnvironmentFactory;

  constructor() {
    this.dictionaryManager = DictionaryManager.getInstance();
    this.environmentFactory = LanguageEnvironmentFactory.getInstance();
  }

  static getInstance(): HybridQueryService {
    if (!HybridQueryService.instance) {
      HybridQueryService.instance = new HybridQueryService();
    }
    return HybridQueryService.instance;
  }

  /**
   * 混合查询
   */
  async query(
    input: string, 
    uiLanguage: string, 
    targetLanguage: string,
    options: Partial<HybridQueryOptions> = {}
  ): Promise<UnifiedQueryResult> {
    const startTime = Date.now();
    
    try {
      const defaultOptions: HybridQueryOptions = {
        enableLocalDictionary: true,
        enableOnlineTranslation: true,
        localFirst: true,
        maxCandidates: 10,
        minConfidence: 0.3
      };

      const finalOptions = { ...defaultOptions, ...options };
      
      console.log(`🔍 混合查询: "${input}" (${uiLanguage} -> ${targetLanguage})`);

      let localResult: LocalQueryResult | null = null;
      let onlineResult: UnifiedQueryResult | null = null;

      // 1. 本地词库查询
      if (finalOptions.enableLocalDictionary) {
        try {
          localResult = await this.queryLocalDictionary(input, targetLanguage);
          console.log(`📚 本地词库查询结果: ${localResult.candidates.length} 个候选词`);
        } catch (error) {
          console.error('❌ 本地词库查询失败:', error);
        }
      }

      // 2. 在线翻译查询
      if (finalOptions.enableOnlineTranslation) {
        try {
          onlineResult = await this.queryOnlineTranslation(input, uiLanguage, targetLanguage);
          console.log(`🌐 在线翻译查询结果: ${onlineResult.candidates.length} 个候选词`);
        } catch (error) {
          console.error('❌ 在线翻译查询失败:', error);
        }
      }

      // 3. 合并结果
      const mergedResult = this.mergeResults(localResult, onlineResult, finalOptions);
      
      console.log(`✅ 混合查询完成: ${mergedResult.candidates.length} 个候选词`);
      return mergedResult;

    } catch (error) {
      console.error('❌ 混合查询失败:', error);
      return {
        success: false,
        candidates: [],
        source: 'error',
        confidence: 0
      };
    }
  }

  /**
   * 本地词库查询
   */
  private async queryLocalDictionary(
    input: string, 
    targetLanguage: string
  ): Promise<LocalQueryResult> {
    try {
      return await this.dictionaryManager.query(input, targetLanguage);
    } catch (error) {
      console.error('❌ 本地词库查询失败:', error);
      return {
        success: false,
        candidates: [],
        totalCount: 0,
        queryTime: 0
      };
    }
  }

  /**
   * 在线翻译查询
   */
  private async queryOnlineTranslation(
    input: string, 
    uiLanguage: string, 
    targetLanguage: string
  ): Promise<UnifiedQueryResult> {
    try {
      const environment = this.environmentFactory.createEnvironment(uiLanguage, targetLanguage);
      const analysis = environment.analyzeInput(input);
      
      // 根据分析结果选择查询策略
      const strategy = environment.selectQueryStrategy(input, analysis);
      
      switch (strategy) {
        case 'online_only':
          return await environment.queryOnlineTranslation(input, analysis);
        case 'hybrid':
          return await environment.queryHybrid(input, analysis);
        default:
          return await environment.queryOnlineTranslation(input, analysis);
      }
    } catch (error) {
      console.error('❌ 在线翻译查询失败:', error);
      return {
        success: false,
        candidates: [],
        source: 'error',
        confidence: 0
      };
    }
  }

  /**
   * 合并查询结果
   */
  private mergeResults(
    localResult: LocalQueryResult | null,
    onlineResult: UnifiedQueryResult | null,
    options: HybridQueryOptions
  ): UnifiedQueryResult {
    const allCandidates: Array<{
      word: string;
      translation: string;
      confidence: number;
      source: string;
    }> = [];

    // 添加本地词库结果
    if (localResult && localResult.success) {
      localResult.candidates.forEach(candidate => {
        allCandidates.push({
          word: candidate.word,
          translation: candidate.translation,
          confidence: candidate.confidence,
          source: `local_${candidate.source}`
        });
      });
    }

    // 添加在线翻译结果
    if (onlineResult && onlineResult.success) {
      onlineResult.candidates.forEach(candidate => {
        allCandidates.push({
          word: candidate,
          translation: candidate,
          confidence: 0.8, // 在线翻译默认置信度
          source: onlineResult.source || 'online'
        });
      });
    }

    // 过滤低置信度结果
    const filteredCandidates = allCandidates.filter(
      candidate => candidate.confidence >= options.minConfidence
    );

    // 去重
    const uniqueCandidates = this.deduplicateCandidates(filteredCandidates);

    // 按置信度排序
    uniqueCandidates.sort((a, b) => b.confidence - a.confidence);

    // 限制候选词数量
    const finalCandidates = uniqueCandidates.slice(0, options.maxCandidates);

    // 确定主要来源
    const primarySource = this.determinePrimarySource(localResult, onlineResult, options);

    return {
      success: finalCandidates.length > 0,
      candidates: finalCandidates.map(c => c.translation),
      source: primarySource,
      confidence: finalCandidates.length > 0 ? finalCandidates[0].confidence : 0
    };
  }

  /**
   * 去重候选词
   */
  private deduplicateCandidates(candidates: Array<{
    word: string;
    translation: string;
    confidence: number;
    source: string;
  }>): Array<{
    word: string;
    translation: string;
    confidence: number;
    source: string;
  }> {
    const seen = new Set<string>();
    return candidates.filter(candidate => {
      const key = `${candidate.word}-${candidate.translation}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 确定主要来源
   */
  private determinePrimarySource(
    localResult: LocalQueryResult | null,
    onlineResult: UnifiedQueryResult | null,
    options: HybridQueryOptions
  ): string {
    if (options.localFirst && localResult && localResult.success && localResult.candidates.length > 0) {
      return 'local_dictionary';
    }
    
    if (onlineResult && onlineResult.success && onlineResult.candidates.length > 0) {
      return onlineResult.source || 'online_translation';
    }
    
    if (localResult && localResult.success && localResult.candidates.length > 0) {
      return 'local_dictionary';
    }
    
    return 'none';
  }

  /**
   * 获取查询统计信息
   */
  async getQueryStats(): Promise<{
    localDictionaryAvailable: boolean;
    onlineTranslationAvailable: boolean;
    totalLocalEntries: number;
    storageSize: number;
  }> {
    try {
      const localAvailable = await this.dictionaryManager.isDictionaryAvailable('ccedict');
      const storageStats = await this.dictionaryManager.getStorageStats();
      
      return {
        localDictionaryAvailable: localAvailable,
        onlineTranslationAvailable: true, // 假设在线翻译总是可用
        totalLocalEntries: 0, // TODO: 从词库管理器获取
        storageSize: storageStats.totalSize
      };
    } catch (error) {
      console.error('❌ 获取查询统计失败:', error);
      return {
        localDictionaryAvailable: false,
        onlineTranslationAvailable: false,
        totalLocalEntries: 0,
        storageSize: 0
      };
    }
  }

  /**
   * 初始化混合查询服务
   */
  async initialize(): Promise<void> {
    try {
      await this.dictionaryManager.initialize();
      console.log('✅ 混合查询服务初始化完成');
    } catch (error) {
      console.error('❌ 混合查询服务初始化失败:', error);
      throw error;
    }
  }
}
