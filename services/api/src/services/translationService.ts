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
      // 直接翻译日语词汇
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
   * 翻译日语句子或短语
   */
  async translateJapaneseSentence(japaneseText: string, targetLanguage: string): Promise<TranslationResult> {
    try {
      logger.info(`🔍 翻译日语句子: ${japaneseText} -> ${targetLanguage}`);
      
      // 直接使用Google Translate翻译句子
      const result = await this.translateText(japaneseText, targetLanguage, 'ja');
      
      if (result.success) {
        logger.info(`✅ 日语句子翻译成功: ${japaneseText} -> ${result.translatedText}`);
      } else {
        logger.warn(`⚠️ 日语句子翻译失败: ${japaneseText}`);
      }
      
      return result;

    } catch (error) {
      logger.error(`❌ 翻译日语句子失败: ${japaneseText}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '翻译失败'
      };
    }
  }

  /**
   * 智能翻译：自动判断是单词还是句子
   */
  async smartTranslateJapanese(input: string, targetLanguage: string): Promise<TranslationResult> {
    try {
      // 判断输入类型
      const isSentence = this.isJapaneseSentence(input);
      
      if (isSentence) {
        // 句子或短语，直接翻译
        return await this.translateJapaneseSentence(input, targetLanguage);
      } else {
        // 单词，使用词汇翻译逻辑
        return await this.translateJapaneseDefinition(input, targetLanguage);
      }

    } catch (error) {
      logger.error(`❌ 智能翻译失败: ${input}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '翻译失败'
      };
    }
  }

  /**
   * 判断是否为句子（支持多种语言）
   */
  private isJapaneseSentence(text: string): boolean {
    // 检查是否包含句子特征
    const sentenceIndicators = [
      // 日语特征
      '。', '！', '？', 'です', 'ます', 'だ', 'である', 'です。', 'ます。', 'だ。', 'である。',
      'を', 'が', 'に', 'で', 'と', 'は', 'も', 'の', 'か', 'ね', 'よ', 'わ',
      // 英文特征
      'I ', 'you ', 'he ', 'she ', 'we ', 'they ', 'am ', 'is ', 'are ', 'was ', 'were ',
      'have ', 'has ', 'had ', 'do ', 'does ', 'did ', 'will ', 'would ', 'can ', 'could ',
      'like ', 'love ', 'want ', 'need ', 'go ', 'come ', 'see ', 'know ', 'think ', 'feel ',
      'a ', 'an ', 'the ', 'and ', 'or ', 'but ', 'in ', 'on ', 'at ', 'to ', 'for ', 'of ',
      'with ', 'by ', 'from ', 'up ', 'down ', 'out ', 'off ', 'over ', 'under ', 'through '
    ];
    
    // 如果包含句子标点符号、助词或英文句子特征，认为是句子
    return sentenceIndicators.some(indicator => text.includes(indicator)) || text.length > 10;
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
