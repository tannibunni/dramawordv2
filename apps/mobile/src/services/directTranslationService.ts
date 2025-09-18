// 直接翻译服务 - 跳过OpenAI，直接使用Google翻译
import { API_BASE_URL } from '../constants/config';

export interface DirectTranslationResult {
  success: boolean;
  data?: {
    word: string;
    language: string;
    phonetic: string;
    kana?: string;
    definitions: Array<{
      partOfSpeech: string;
      definition: string;
      examples: Array<{
        japanese: string;
        english: string;
      }>;
    }>;
    audioUrl: string;
    correctedWord: string;
    slangMeaning: null;
    phraseExplanation: null;
  };
  error?: string;
}

export class DirectTranslationService {
  private static instance: DirectTranslationService;
  private cache = new Map<string, DirectTranslationResult>();

  static getInstance(): DirectTranslationService {
    if (!DirectTranslationService.instance) {
      DirectTranslationService.instance = new DirectTranslationService();
    }
    return DirectTranslationService.instance;
  }

  /**
   * 直接翻译英文句子到日语
   */
  async translateEnglishSentence(englishSentence: string, uiLanguage: string = 'en-US'): Promise<DirectTranslationResult> {
    try {
      console.log(`🔍 直接翻译英文句子: ${englishSentence}`);

      // 检查缓存
      const cacheKey = `direct_${englishSentence}_${uiLanguage}`;
      if (this.cache.has(cacheKey)) {
        console.log(`✅ 从缓存获取直接翻译结果: ${englishSentence}`);
        return this.cache.get(cacheKey)!;
      }

      // 调用后端直接翻译API
      const response = await fetch(`${API_BASE_URL}/words/direct-translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: englishSentence,
          uiLanguage: uiLanguage
        })
      });

      if (!response.ok) {
        throw new Error(`Direct translation failed: ${response.status}`);
      }

      const result = await response.json();
      
      // 缓存结果
      this.cache.set(cacheKey, result);
      
      console.log(`✅ 直接翻译成功: ${englishSentence} -> ${result.data?.correctedWord}`);
      return result;

    } catch (error) {
      console.error(`❌ 直接翻译失败: ${englishSentence}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '翻译失败'
      };
    }
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
export const directTranslationService = DirectTranslationService.getInstance();
