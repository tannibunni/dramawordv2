// Kuromoji分词服务 - 将日文转换为假名
import * as kuromoji from 'kuromoji';
import { logger } from '../utils/logger';

export interface KuromojiResult {
  success: boolean;
  hiragana?: string;
  katakana?: string;
  error?: string;
}

export class KuromojiService {
  private static instance: KuromojiService;
  private tokenizer: any = null;
  private initialized = false;

  constructor() {
    this.initializeTokenizer();
  }

  static getInstance(): KuromojiService {
    if (!KuromojiService.instance) {
      KuromojiService.instance = new KuromojiService();
    }
    return KuromojiService.instance;
  }

  /**
   * 初始化Kuromoji分词器
   */
  private async initializeTokenizer(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      logger.info('🔧 初始化Kuromoji分词器...');
      
      kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tokenizer) => {
        if (err) {
          logger.error('❌ Kuromoji初始化失败:', err);
          return;
        }
        
        this.tokenizer = tokenizer;
        this.initialized = true;
        logger.info('✅ Kuromoji分词器初始化成功');
      });
    } catch (error) {
      logger.error('❌ Kuromoji初始化异常:', error);
    }
  }

  /**
   * 等待分词器初始化完成
   */
  private async waitForInitialization(): Promise<boolean> {
    let attempts = 0;
    const maxAttempts = 50; // 5秒超时
    
    while (!this.initialized && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    return this.initialized;
  }

  /**
   * 将日文转换为假名
   */
  async convertToKana(japaneseText: string): Promise<KuromojiResult> {
    try {
      // 等待分词器初始化
      const isReady = await this.waitForInitialization();
      if (!isReady) {
        throw new Error('Kuromoji分词器初始化超时');
      }

      if (!this.tokenizer) {
        throw new Error('Kuromoji分词器未初始化');
      }

      logger.info(`🔍 开始分词: ${japaneseText}`);

      // 分词
      const tokens = this.tokenizer.tokenize(japaneseText);
      
      if (!tokens || tokens.length === 0) {
        throw new Error('分词结果为空');
      }

      // 提取读音并转换为假名
      let hiraganaText = '';
      let katakanaText = '';

      for (const token of tokens) {
        const reading = token.reading || token.surface_form;
        if (reading) {
          // 转换为平假名
          const hiragana = this.convertToHiragana(reading);
          hiraganaText += hiragana;
          
          // 转换为片假名
          const katakana = this.convertToKatakana(reading);
          katakanaText += katakana;
        } else {
          // 如果没有读音，使用原字符
          hiraganaText += token.surface_form;
          katakanaText += token.surface_form;
        }
      }

      logger.info(`✅ 分词完成: ${japaneseText} -> ${hiraganaText}`);

      return {
        success: true,
        hiragana: hiraganaText,
        katakana: katakanaText
      };

    } catch (error) {
      logger.error(`❌ Kuromoji分词失败: ${japaneseText}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '分词失败'
      };
    }
  }

  /**
   * 转换为平假名
   */
  private convertToHiragana(text: string): string {
    return text
      .replace(/[ァ-ヶ]/g, (char) => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code - 0x60);
      })
      .replace(/[ア-ン]/g, (char) => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code - 0x60);
      });
  }

  /**
   * 转换为片假名
   */
  private convertToKatakana(text: string): string {
    return text
      .replace(/[ぁ-ん]/g, (char) => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code + 0x60);
      })
      .replace(/[あ-ん]/g, (char) => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code + 0x60);
      });
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
