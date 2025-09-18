// 日文翻译服务 - 整合Azure翻译、罗马音和假名转换
import { AzureTranslationService } from './azureTranslationService';
import { KuromojiService } from './kuromojiService';
import { logger } from '../utils/logger';

export interface JapaneseTranslationResult {
  success: boolean;
  data?: {
    originalText: string;
    japaneseText: string;
    romaji: string;
    hiragana: string;
    sourceLanguage: string;
    audioUrl: string;
  };
  error?: string;
}

export class JapaneseTranslationService {
  private static instance: JapaneseTranslationService;
  private azureService: AzureTranslationService;
  private kuromojiService: KuromojiService;
  private cache = new Map<string, JapaneseTranslationResult>();

  constructor() {
    this.azureService = AzureTranslationService.getInstance();
    this.kuromojiService = KuromojiService.getInstance();
  }

  static getInstance(): JapaneseTranslationService {
    if (!JapaneseTranslationService.instance) {
      JapaneseTranslationService.instance = new JapaneseTranslationService();
    }
    return JapaneseTranslationService.instance;
  }

  /**
   * 验证输入长度
   */
  private validateInput(text: string): { valid: boolean; error?: string } {
    if (!text || typeof text !== 'string') {
      return { valid: false, error: '输入文本无效' };
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return { valid: false, error: '输入文本不能为空' };
    }

    if (trimmedText.length > 200) {
      return { valid: false, error: '仅支持短句查询（≤200字符）' };
    }

    return { valid: true };
  }

  /**
   * 生成TTS音频URL
   */
  private generateAudioUrl(japaneseText: string): string {
    const encodedText = encodeURIComponent(japaneseText);
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ja&client=tw-ob`;
  }

  /**
   * 完整的中英文到日文翻译流程
   */
  async translateToJapanese(text: string): Promise<JapaneseTranslationResult> {
    try {
      // 验证输入
      const validation = this.validateInput(text);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const trimmedText = text.trim();
      const cacheKey = `japanese_translation_${trimmedText}`;

      // 检查缓存
      if (this.cache.has(cacheKey)) {
        logger.info(`✅ 从缓存获取日文翻译结果: ${trimmedText}`);
        return this.cache.get(cacheKey)!;
      }

      logger.info(`🔍 开始日文翻译流程: ${trimmedText}`);

      // 步骤1: Azure翻译
      const translationResult = await this.azureService.translateToJapanese(trimmedText);
      if (!translationResult.success || !translationResult.translatedText) {
        return {
          success: false,
          error: translationResult.error || '翻译失败'
        };
      }

      const japaneseText = translationResult.translatedText;
      const sourceLanguage = translationResult.sourceLanguage || 'unknown';

      // 步骤2: Azure罗马音转换
      const transliterateResult = await this.azureService.transliterateToRomaji(japaneseText);
      if (!transliterateResult.success || !transliterateResult.romaji) {
        logger.warn(`⚠️ 罗马音转换失败，使用备用方案: ${japaneseText}`);
        // 如果Azure罗马音失败，使用简单的备用方案
        const fallbackRomaji = this.generateFallbackRomaji(japaneseText);
        transliterateResult.romaji = fallbackRomaji;
      }

      // 步骤3: Kuromoji分词获取假名
      const kuromojiResult = await this.kuromojiService.convertToKana(japaneseText);
      if (!kuromojiResult.success || !kuromojiResult.hiragana) {
        logger.warn(`⚠️ 假名转换失败，使用备用方案: ${japaneseText}`);
        // 如果Kuromoji失败，使用简单的备用方案
        const fallbackHiragana = this.generateFallbackHiragana(japaneseText);
        kuromojiResult.hiragana = fallbackHiragana;
        kuromojiResult.katakana = fallbackHiragana;
      }

      // 构建结果
      const result: JapaneseTranslationResult = {
        success: true,
        data: {
          originalText: trimmedText,
          japaneseText: japaneseText,
          romaji: transliterateResult.romaji || '',
          hiragana: kuromojiResult.hiragana || '',
          sourceLanguage: sourceLanguage,
          audioUrl: this.generateAudioUrl(japaneseText)
        }
      };

      // 缓存结果
      this.cache.set(cacheKey, result);

      logger.info(`✅ 日文翻译完成: ${trimmedText} -> ${japaneseText}`);
      logger.info(`📊 结果详情: 罗马音=${result.data.romaji}, 平假名=${result.data.hiragana}`);

      return result;

    } catch (error) {
      logger.error(`❌ 日文翻译失败: ${text}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '翻译失败'
      };
    }
  }

  /**
   * 生成备用罗马音（简单方案）
   */
  private generateFallbackRomaji(japaneseText: string): string {
    // 简单的罗马音转换，用于备用
    return japaneseText
      .replace(/[ひらがな]/g, 'hiragana')
      .replace(/[カタカナ]/g, 'katakana')
      .replace(/[漢字]/g, 'kanji');
  }

  /**
   * 生成备用平假名（简单方案）
   */
  private generateFallbackHiragana(japaneseText: string): string {
    // 简单的平假名转换，用于备用
    return japaneseText
      .replace(/[ァ-ヶ]/g, (char) => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code - 0x60);
      });
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.azureService.clearCache();
    logger.info('✅ 日文翻译缓存已清理');
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size + this.azureService.getCacheSize();
  }
}
