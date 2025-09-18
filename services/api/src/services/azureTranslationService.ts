// Azure翻译服务 - 支持中英文到日文翻译
import TranslatorClient from '@azure-rest/ai-translation-text';
import { AzureKeyCredential } from '@azure/core-auth';
import { logger } from '../utils/logger';

export interface AzureTranslationResult {
  success: boolean;
  translatedText?: string;
  sourceLanguage?: string;
  error?: string;
}

export interface AzureTransliterateResult {
  success: boolean;
  romaji?: string;
  error?: string;
}

export class AzureTranslationService {
  private static instance: AzureTranslationService;
  private translatorClient: any;
  private transliterateClient: any;
  private cache = new Map<string, any>();

  constructor() {
    const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
    const apiKey = process.env.AZURE_TRANSLATOR_KEY;
    
    if (!endpoint || !apiKey) {
      throw new Error('Azure Translator credentials not configured');
    }

    // 确保端点格式正确
    const normalizedEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    
    const credential = new AzureKeyCredential(apiKey);
    this.translatorClient = TranslatorClient(normalizedEndpoint, credential);
    this.transliterateClient = TranslatorClient(normalizedEndpoint, credential);
    
    logger.info(`✅ Azure Translator客户端初始化成功，端点: ${normalizedEndpoint}`);
  }

  static getInstance(): AzureTranslationService {
    if (!AzureTranslationService.instance) {
      AzureTranslationService.instance = new AzureTranslationService();
    }
    return AzureTranslationService.instance;
  }

  /**
   * 检测输入语言
   */
  private detectLanguage(text: string): string {
    // 检测中文字符
    if (/[\u4e00-\u9fff]/.test(text)) {
      return 'zh-Hans';
    }
    // 检测英文字符
    if (/^[a-zA-Z\s.,!?]+$/.test(text)) {
      return 'en';
    }
    // 默认英文
    return 'en';
  }

  /**
   * 翻译文本到日文
   */
  async translateToJapanese(text: string): Promise<AzureTranslationResult> {
    try {
      const cacheKey = `translate_${text}`;
      
      // 检查缓存
      if (this.cache.has(cacheKey)) {
        logger.info(`✅ 从缓存获取翻译结果: ${text}`);
        return this.cache.get(cacheKey);
      }

      // 检测源语言
      const sourceLanguage = this.detectLanguage(text);
      logger.info(`🔍 检测到源语言: ${sourceLanguage} for "${text}"`);

      // 调用Azure翻译API
      const response = await this.translatorClient.path('/translate').post({
        body: [
          {
            text: text
          }
        ],
        queryParameters: {
          'api-version': '3.0',
          from: sourceLanguage,
          to: 'ja'
        }
      });

      if (response.status !== 200) {
        throw new Error(`Azure Translator API returned status ${response.status}`);
      }

      const result = response.body as any;
      if (!result || !result[0] || !result[0].translations || !result[0].translations[0]) {
        throw new Error('Invalid response from Azure Translator API');
      }

      const translatedText = result[0].translations[0].text;
      const detectedLanguage = result[0].detectedLanguage?.language || sourceLanguage;

      const translationResult: AzureTranslationResult = {
        success: true,
        translatedText,
        sourceLanguage: detectedLanguage
      };

      // 缓存结果
      this.cache.set(cacheKey, translationResult);
      
      logger.info(`✅ Azure翻译成功: ${text} -> ${translatedText}`);
      return translationResult;

    } catch (error) {
      logger.error(`❌ Azure翻译失败: ${text}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '翻译失败'
      };
    }
  }

  /**
   * 获取日文罗马音
   */
  async transliterateToRomaji(japaneseText: string): Promise<AzureTransliterateResult> {
    try {
      const cacheKey = `transliterate_${japaneseText}`;
      
      // 检查缓存
      if (this.cache.has(cacheKey)) {
        logger.info(`✅ 从缓存获取罗马音: ${japaneseText}`);
        return this.cache.get(cacheKey);
      }

      // 调用Azure Transliterate API
      const response = await this.transliterateClient.path('/transliterate').post({
        body: [
          {
            text: japaneseText
          }
        ],
        queryParameters: {
          'api-version': '3.0',
          language: 'ja',
          fromScript: 'Jpan',
          toScript: 'Latn'
        }
      });

      if (response.status !== 200) {
        throw new Error(`Azure Transliterate API returned status ${response.status}`);
      }

      const result = response.body as any;
      if (!result || !result[0] || !result[0].text) {
        throw new Error('Invalid response from Azure Transliterate API');
      }

      const romaji = result[0].text;

      const transliterateResult: AzureTransliterateResult = {
        success: true,
        romaji
      };

      // 缓存结果
      this.cache.set(cacheKey, transliterateResult);
      
      logger.info(`✅ Azure罗马音成功: ${japaneseText} -> ${romaji}`);
      return transliterateResult;

    } catch (error) {
      logger.error(`❌ Azure罗马音失败: ${japaneseText}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '罗马音转换失败'
      };
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('✅ Azure翻译缓存已清理');
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}
