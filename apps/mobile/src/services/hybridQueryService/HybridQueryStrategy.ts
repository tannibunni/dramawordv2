// 混合查询策略
import { MultilingualQueryResult } from '../localDictionary/types/multilingual';
import { UnifiedQueryResult } from '../languageEnvironment/types';

export interface HybridQueryStrategy {
  /**
   * 决定查询策略
   */
  determineStrategy(
    input: string,
    targetLanguage: string,
    uiLanguage: string,
    hasLocalDictionary: boolean
  ): QueryStrategy;
}

export interface QueryStrategy {
  useLocalDictionary: boolean;
  useOnlineTranslation: boolean;
  useOpenAI: boolean;
  priority: 'local_first' | 'online_first' | 'hybrid';
  reason: string;
}

export interface CloudWordsIntegration {
  shouldQueryCloudWords: boolean;
  shouldStoreToCloudWords: boolean;
  mergeStrategy: 'local_definition_openai_examples' | 'openai_full' | 'local_full';
}

export class SmartHybridQueryStrategy implements HybridQueryStrategy {
  
  /**
   * 决定查询策略
   */
  determineStrategy(
    input: string,
    targetLanguage: string,
    uiLanguage: string,
    hasLocalDictionary: boolean
  ): QueryStrategy {
    
    // 1. 如果有本地词库，优先使用本地查询
    if (hasLocalDictionary) {
      return {
        useLocalDictionary: true,
        useOnlineTranslation: false,
        useOpenAI: true, // 用于补充例句
        priority: 'local_first',
        reason: '本地词库可用，优先本地释义+OpenAI例句'
      };
    }
    
    // 2. 如果没有本地词库，使用在线翻译
    return {
      useLocalDictionary: false,
      useOnlineTranslation: true,
      useOpenAI: true, // 用于完整翻译
      priority: 'online_first',
      reason: '无本地词库，使用在线翻译+OpenAI增强'
    };
  }

  /**
   * 决定CloudWords集成策略
   */
  determineCloudWordsStrategy(
    localResult: MultilingualQueryResult | null,
    onlineResult: UnifiedQueryResult | null,
    targetLanguage: string
  ): CloudWordsIntegration {
    
    // 如果有本地词库结果，只需要OpenAI补充例句
    if (localResult && localResult.success && localResult.candidates.length > 0) {
      return {
        shouldQueryCloudWords: true,
        shouldStoreToCloudWords: false, // 不存储，因为本地已有释义
        mergeStrategy: 'local_definition_openai_examples'
      };
    }
    
    // 如果只有在线翻译结果，需要OpenAI完整翻译并存储
    if (onlineResult && onlineResult.success && onlineResult.candidates.length > 0) {
      return {
        shouldQueryCloudWords: true,
        shouldStoreToCloudWords: true, // 存储到CloudWords
        mergeStrategy: 'openai_full'
      };
    }
    
    // 如果都没有结果，使用OpenAI完整翻译
    return {
      shouldQueryCloudWords: true,
      shouldStoreToCloudWords: true,
      mergeStrategy: 'openai_full'
    };
  }

  /**
   * 合并查询结果
   */
  mergeResults(
    localResult: MultilingualQueryResult | null,
    onlineResult: UnifiedQueryResult | null,
    cloudWordsResult: any | null,
    strategy: CloudWordsIntegration
  ): UnifiedQueryResult {
    
    if (strategy.mergeStrategy === 'local_definition_openai_examples') {
      // 本地释义 + OpenAI例句
      return this.mergeLocalWithOpenAI(localResult, cloudWordsResult);
    }
    
    if (strategy.mergeStrategy === 'openai_full') {
      // 完整的OpenAI结果
      return this.useOpenAIResult(cloudWordsResult);
    }
    
    // 默认使用在线翻译结果
    return this.useOnlineResult(onlineResult);
  }

  /**
   * 合并本地释义和OpenAI例句
   */
  private mergeLocalWithOpenAI(
    localResult: MultilingualQueryResult | null,
    cloudWordsResult: any | null
  ): UnifiedQueryResult {
    if (!localResult || !localResult.success) {
      return {
        success: false,
        candidates: [],
        source: 'none'
      };
    }

    const candidates = localResult.candidates.map(candidate => {
      // 从CloudWords获取例句
      const examples = cloudWordsResult?.definitions?.[0]?.examples || [];
      
      return {
        word: candidate.word,
        translation: candidate.translation,
        phonetic: candidate.phonetic,
        kana: candidate.kana,
        romaji: candidate.romaji,
        pinyin: candidate.pinyin,
        partOfSpeech: candidate.partOfSpeech,
        confidence: candidate.confidence,
        source: 'local_dictionary',
        examples: examples,
        allTranslations: candidate.allTranslations
      };
    });

    return {
      success: true,
      candidates: candidates.map(c => c.translation),
      source: 'local_dictionary',
      confidence: candidates[0]?.confidence || 0,
      wordData: {
        word: candidates[0]?.word,
        correctedWord: candidates[0]?.translation,
        translation: candidates[0]?.translation,
        phonetic: candidates[0]?.phonetic,
        kana: candidates[0]?.kana,
        romaji: candidates[0]?.romaji,
        pinyin: candidates[0]?.pinyin,
        partOfSpeech: candidates[0]?.partOfSpeech,
        examples: candidates[0]?.examples || [],
        definitions: [{
          definition: candidates[0]?.translation,
          partOfSpeech: candidates[0]?.partOfSpeech,
          examples: candidates[0]?.examples || []
        }],
        allTranslations: candidates[0]?.allTranslations
      }
    };
  }

  /**
   * 使用OpenAI完整结果
   */
  private useOpenAIResult(cloudWordsResult: any | null): UnifiedQueryResult {
    if (!cloudWordsResult) {
      return {
        success: false,
        candidates: [],
        source: 'none'
      };
    }

    return {
      success: true,
      candidates: [cloudWordsResult.correctedWord || cloudWordsResult.translation],
      source: 'openai',
      confidence: 0.9,
      wordData: cloudWordsResult
    };
  }

  /**
   * 使用在线翻译结果
   */
  private useOnlineResult(onlineResult: UnifiedQueryResult | null): UnifiedQueryResult {
    if (!onlineResult || !onlineResult.success) {
      return {
        success: false,
        candidates: [],
        source: 'none'
      };
    }

    return onlineResult;
  }

  /**
   * 判断是否需要查询CloudWords
   */
  shouldQueryCloudWords(
    localResult: MultilingualQueryResult | null,
    onlineResult: UnifiedQueryResult | null
  ): boolean {
    // 如果有本地结果，需要OpenAI补充例句
    if (localResult && localResult.success && localResult.candidates.length > 0) {
      return true;
    }
    
    // 如果只有在线结果，需要OpenAI增强
    if (onlineResult && onlineResult.success && onlineResult.candidates.length > 0) {
      return true;
    }
    
    // 如果都没有结果，需要OpenAI翻译
    return true;
  }

  /**
   * 判断是否需要存储到CloudWords
   */
  shouldStoreToCloudWords(
    localResult: MultilingualQueryResult | null,
    onlineResult: UnifiedQueryResult | null
  ): boolean {
    // 如果有本地结果，不需要存储（本地已有释义）
    if (localResult && localResult.success && localResult.candidates.length > 0) {
      return false;
    }
    
    // 如果只有在线结果或没有结果，需要存储
    return true;
  }
}
