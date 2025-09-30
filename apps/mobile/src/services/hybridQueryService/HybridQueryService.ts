// 混合查询服务
import { DictionaryManager } from '../dictionaryManager/DictionaryManager';
import { LanguageEnvironmentFactory } from '../languageEnvironment';
import { UnifiedQueryResult } from '../languageEnvironment/types';
import { LocalQueryResult } from '../localDictionary/types';
import { MultilingualQueryResult } from '../localDictionary/types/multilingual';
import { SmartHybridQueryStrategy, CloudWordsIntegration } from './HybridQueryStrategy';

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
  private strategy: SmartHybridQueryStrategy;

  constructor() {
    this.dictionaryManager = DictionaryManager.getInstance();
    this.environmentFactory = LanguageEnvironmentFactory.getInstance();
    this.strategy = new SmartHybridQueryStrategy();
  }

  static getInstance(): HybridQueryService {
    if (!HybridQueryService.instance) {
      HybridQueryService.instance = new HybridQueryService();
    }
    return HybridQueryService.instance;
  }

  /**
   * 智能混合查询
   */
  async query(
    input: string, 
    uiLanguage: string, 
    targetLanguage: string,
    options: Partial<HybridQueryOptions> = {}
  ): Promise<UnifiedQueryResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 智能混合查询: "${input}" (${uiLanguage} -> ${targetLanguage})`);

      // 1. 检查本地词库可用性
      const hasLocalDictionary = await this.dictionaryManager.isDictionaryAvailable(
        this.getDictionaryProviderName(targetLanguage)
      );

      // 2. 决定查询策略
      const queryStrategy = this.strategy.determineStrategy(
        input, 
        targetLanguage, 
        uiLanguage, 
        hasLocalDictionary
      );

      console.log(`📋 查询策略: ${queryStrategy.reason}`);

      let localResult: MultilingualQueryResult | null = null;
      let onlineResult: UnifiedQueryResult | null = null;
      let cloudWordsResult: any | null = null;

      // 3. 执行本地词库查询
      if (queryStrategy.useLocalDictionary) {
        try {
          localResult = await this.queryLocalMultilingualDictionary(input, targetLanguage, uiLanguage);
          console.log(`📚 本地词库查询结果: ${localResult.candidates.length} 个候选词`);
        } catch (error) {
          console.error('❌ 本地词库查询失败:', error);
        }
      }

      // 4. 执行在线翻译查询
      if (queryStrategy.useOnlineTranslation) {
        try {
          onlineResult = await this.queryOnlineTranslation(input, uiLanguage, targetLanguage);
          console.log(`🌐 在线翻译查询结果: ${onlineResult.candidates.length} 个候选词`);
        } catch (error) {
          console.error('❌ 在线翻译查询失败:', error);
        }
      }

      // 5. 决定CloudWords集成策略
      const cloudWordsStrategy = this.strategy.determineCloudWordsStrategy(
        localResult, 
        onlineResult, 
        targetLanguage
      );

      console.log(`☁️ CloudWords策略: ${cloudWordsStrategy.mergeStrategy}`);

      // 6. 查询CloudWords (OpenAI)
      if (cloudWordsStrategy.shouldQueryCloudWords) {
        try {
          cloudWordsResult = await this.queryCloudWords(input, targetLanguage, uiLanguage);
          console.log(`🤖 CloudWords查询结果: ${cloudWordsResult ? '成功' : '失败'}`);
        } catch (error) {
          console.error('❌ CloudWords查询失败:', error);
        }
      }

      // 7. 合并结果
      const mergedResult = this.strategy.mergeResults(
        localResult, 
        onlineResult, 
        cloudWordsResult, 
        cloudWordsStrategy
      );
      
      console.log(`✅ 智能混合查询完成: ${mergedResult.candidates.length} 个候选词`);
      return mergedResult;

    } catch (error) {
      console.error('❌ 智能混合查询失败:', error);
      return {
        success: false,
        candidates: [],
        source: 'error',
        confidence: 0
      };
    }
  }

  /**
   * 多语言本地词库查询
   */
  private async queryLocalMultilingualDictionary(
    input: string, 
    targetLanguage: string,
    uiLanguage: string
  ): Promise<MultilingualQueryResult> {
    try {
      const result = await this.dictionaryManager.queryMultilingual(input, targetLanguage, uiLanguage);
      
      if (result.success) {
        console.log(`✅ 多语言本地词库查询成功: ${result.candidates.length} 个候选词`);
      } else {
        console.log('❌ 多语言本地词库查询失败');
      }
      
      return result;
    } catch (error) {
      console.error('❌ 多语言本地词库查询异常:', error);
      throw error;
    }
  }

  /**
   * 本地词库查询 (兼容性方法)
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
   * CloudWords查询 (OpenAI)
   */
  private async queryCloudWords(
    input: string,
    targetLanguage: string,
    uiLanguage: string
  ): Promise<any | null> {
    try {
      // 这里应该调用后端API查询CloudWords
      // 暂时返回null，实际实现需要调用后端
      console.log(`🤖 CloudWords查询: "${input}" (${targetLanguage})`);
      
      // TODO: 实现CloudWords查询逻辑
      // const response = await fetch(`/api/cloudwords/query`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ input, targetLanguage, uiLanguage })
      // });
      // return await response.json();
      
      return null;
    } catch (error) {
      console.error('❌ CloudWords查询失败:', error);
      return null;
    }
  }

  /**
   * 获取词库提供者名称
   */
  private getDictionaryProviderName(targetLanguage: string): string {
    switch (targetLanguage) {
      case 'zh':
        return 'ccedict';
      case 'ja':
        return 'jmdict';
      case 'ko':
        return 'korean';
      default:
        return 'ccedict';
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
