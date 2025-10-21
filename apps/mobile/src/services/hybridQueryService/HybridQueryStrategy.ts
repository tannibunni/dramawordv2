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
  mergeStrategy: 'cloudwords_complete' | 'local_definition_openai_examples' | 'openai_full' | 'local_full';
}

export class SmartHybridQueryStrategy implements HybridQueryStrategy {
  
  /**
   * 决定查询策略
   * 
   * 🔧 已禁用本地词典功能，始终使用在线翻译+OpenAI
   */
  determineStrategy(
    input: string,
    targetLanguage: string,
    uiLanguage: string,
    hasLocalDictionary: boolean
  ): QueryStrategy {
    
    // 🚫 本地词典功能已禁用
    // 始终使用在线翻译（谷歌）+ OpenAI 增强
    return {
      useLocalDictionary: false,
      useOnlineTranslation: true,
      useOpenAI: true,
      priority: 'online_first',
      reason: '使用谷歌翻译+OpenAI增强（本地词典已禁用）'
    };
  }

  /**
   * 决定CloudWords集成策略
   * 
   * 🔧 本地词典已禁用，仅使用在线翻译+OpenAI
   */
  determineCloudWordsStrategy(
    localResult: MultilingualQueryResult | null,
    onlineResult: UnifiedQueryResult | null,
    cloudWordsResult: any | null,
    targetLanguage: string
  ): CloudWordsIntegration {
    
    // 如果CloudWords已有完整数据，直接使用
    if (cloudWordsResult && this.isCloudWordsComplete(cloudWordsResult)) {
      return {
        shouldQueryCloudWords: false,
        shouldStoreToCloudWords: false,
        mergeStrategy: 'cloudwords_complete'
      };
    }
    
    // 🚫 本地词典已禁用，始终使用 OpenAI 完整翻译并存储
    return {
      shouldQueryCloudWords: true,
      shouldStoreToCloudWords: true,
      mergeStrategy: 'openai_full'
    };
  }

  /**
   * 检查CloudWords数据是否完整
   */
  private isCloudWordsComplete(cloudWordsResult: any): boolean {
    return cloudWordsResult && 
           cloudWordsResult.word && 
           cloudWordsResult.translation && 
           cloudWordsResult.definitions && 
           cloudWordsResult.definitions.length > 0 &&
           cloudWordsResult.definitions[0].examples &&
           cloudWordsResult.definitions[0].examples.length > 0;
  }

  /**
   * 合并查询结果
   * 
   * 🔧 本地词典已禁用，仅处理在线翻译和OpenAI结果
   */
  mergeResults(
    localResult: MultilingualQueryResult | null,
    onlineResult: UnifiedQueryResult | null,
    cloudWordsResult: any | null,
    strategy: CloudWordsIntegration
  ): UnifiedQueryResult {
    
    if (strategy.mergeStrategy === 'cloudwords_complete') {
      // CloudWords完整数据，直接使用
      return this.useCloudWordsResult(cloudWordsResult);
    }
    
    if (strategy.mergeStrategy === 'openai_full') {
      // 完整的OpenAI结果
      return this.useOpenAIResult(cloudWordsResult);
    }
    
    // 默认使用在线翻译结果（谷歌翻译）
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
   * 使用CloudWords完整结果
   */
  private useCloudWordsResult(cloudWordsResult: any | null): UnifiedQueryResult {
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
      source: 'cloudwords',
      confidence: 1.0, // CloudWords数据最可靠
      wordData: cloudWordsResult
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
   * 
   * 🔧 本地词典已禁用，始终使用OpenAI增强
   */
  shouldQueryCloudWords(
    localResult: MultilingualQueryResult | null,
    onlineResult: UnifiedQueryResult | null
  ): boolean {
    // 🚫 本地词典已禁用
    // 始终需要OpenAI增强翻译结果
    return true;
  }

  /**
   * 判断是否需要存储到CloudWords
   * 
   * 🔧 本地词典已禁用，始终存储OpenAI结果
   */
  shouldStoreToCloudWords(
    localResult: MultilingualQueryResult | null,
    onlineResult: UnifiedQueryResult | null
  ): boolean {
    // 🚫 本地词典已禁用
    // 始终需要存储OpenAI翻译结果
    return true;
  }
}
