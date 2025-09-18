// 翻译API服务
import axios from 'axios';
import { logger } from '../utils/logger';

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  error?: string;
}

export class TranslationService {
  private static instance: TranslationService;
  private cache = new Map<string, TranslationResult>();

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * 使用Google Translate API翻译文本
   */
  async translateText(text: string, targetLanguage: string, sourceLanguage: string = 'auto'): Promise<TranslationResult> {
    try {
      const cacheKey = `${text}_${sourceLanguage}_${targetLanguage}`;
      
      // 检查缓存
      if (this.cache.has(cacheKey)) {
        logger.info(`✅ 从缓存获取翻译结果: ${text}`);
        return this.cache.get(cacheKey)!;
      }

      logger.info(`🔍 调用Google Translate API: ${text} -> ${targetLanguage}`);

      // 使用Google Translate API
      const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
        params: {
          client: 'gtx',
          sl: sourceLanguage,
          tl: targetLanguage,
          dt: 't',
          q: text
        },
        timeout: 10000
      });

      if (response.data && response.data[0] && response.data[0][0]) {
        const translatedText = response.data[0][0][0];
        
        const result: TranslationResult = {
          success: true,
          translatedText: translatedText
        };

        // 缓存结果
        this.cache.set(cacheKey, result);
        
        logger.info(`✅ Google Translate成功: ${text} -> ${translatedText}`);
        return result;
      } else {
        throw new Error('Invalid response format from Google Translate');
      }

    } catch (error) {
      logger.error(`❌ Google Translate失败: ${text}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '翻译失败'
      };
    }
  }

  /**
   * 翻译日语词汇释义
   */
  async translateJapaneseDefinition(japaneseWord: string, targetLanguage: string): Promise<TranslationResult> {
    try {
      // 先尝试从Jotoba获取英文释义
      const jotobaResult = await this.getJotobaDefinition(japaneseWord);
      if (jotobaResult.success && jotobaResult.definition) {
        // 如果目标语言是中文，翻译英文释义
        if (targetLanguage === 'zh') {
          return await this.translateText(jotobaResult.definition, 'zh', 'en');
        } else {
          // 目标语言是英文，直接返回
          return {
            success: true,
            translatedText: jotobaResult.definition
          };
        }
      }

      // 如果Jotoba失败，直接翻译日语词汇
      return await this.translateText(japaneseWord, targetLanguage, 'ja');

    } catch (error) {
      logger.error(`❌ 翻译日语释义失败: ${japaneseWord}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '翻译失败'
      };
    }
  }

  /**
   * 从Jotoba获取英文释义
   */
  private async getJotobaDefinition(japaneseWord: string): Promise<{ success: boolean; definition?: string; error?: string }> {
    try {
      const response = await axios.post('https://jotoba.de/api/search', {
        query: japaneseWord,
        language: 'english',
        no_english: false,
        page_size: 1
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DramaWord/1.0'
        }
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const word = response.data[0];
        if (word.senses && word.senses.length > 0) {
          const sense = word.senses[0];
          if (sense.glosses && sense.glosses.length > 0) {
            return {
              success: true,
              definition: sense.glosses[0]
            };
          }
        }
      }

      return {
        success: false,
        error: 'No definition found in Jotoba'
      };

    } catch (error) {
      logger.error(`❌ Jotoba查询失败: ${japaneseWord}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Jotoba查询失败'
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
export const translationService = TranslationService.getInstance();
