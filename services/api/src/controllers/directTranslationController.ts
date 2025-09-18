// 直接翻译控制器 - 使用Azure翻译服务
import { Request, Response } from 'express';
import { JapaneseTranslationService } from '../services/japaneseTranslationService';
import { logger } from '../utils/logger';

export const directTranslate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, uiLanguage = 'en-US' } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({
        success: false,
        error: '文本参数无效'
      });
      return;
    }

    logger.info(`🔍 直接翻译请求: ${text}, UI语言: ${uiLanguage}`);

    // 使用Azure日文翻译服务
    let translationResult;
    try {
      const japaneseService = JapaneseTranslationService.getInstance();
      translationResult = await japaneseService.translateToJapanese(text);
      
      if (!translationResult.success || !translationResult.data) {
        throw new Error(translationResult.error || 'Azure翻译失败');
      }
      
      logger.info(`✅ Azure翻译成功: ${text} -> ${translationResult.data.japaneseText}`);
    } catch (azureError) {
      logger.error(`❌ Azure翻译失败，使用降级方案: ${azureError.message}`);
      
      // 降级方案：使用Google翻译
      const { translationService } = await import('../services/translationService');
      const targetLanguage = uiLanguage === 'zh-CN' ? 'zh' : 'ja';
      const fallbackResult = await translationService.translateText(text, targetLanguage, 'en');
      
      if (!fallbackResult.success || !fallbackResult.translatedText) {
        throw new Error('翻译服务不可用');
      }
      
      // 构建降级结果
      translationResult = {
        success: true,
        data: {
          japaneseText: fallbackResult.translatedText,
          romaji: '',
          hiragana: '',
          audioUrl: ''
        }
      };
      
      logger.info(`✅ 降级翻译成功: ${text} -> ${fallbackResult.translatedText}`);
    }

    // 构建返回数据 - Azure句子翻译只显示英文原句
    const result = {
      success: true,
      data: {
        word: text, // 词卡标题显示用户搜索的原句
        language: 'en', // 改为英文，因为只显示原句
        phonetic: '', // 不显示发音
        kana: '', // 不显示假名
        romaji: '', // 不显示罗马音
        definitions: [
          {
            partOfSpeech: 'sentence',
            definition: text, // 释义显示原句
            examples: [] // 不显示例句
          }
        ],
        audioUrl: '', // 不显示发音
        correctedWord: text, // 原句作为correctedWord
        slangMeaning: null,
        phraseExplanation: null,
        originalText: text, // 原文本字段
        translation: translationResult.data.japaneseText // 翻译结果存储在translation字段（不显示）
      }
    };

    logger.info(`✅ 直接翻译完成: ${text} -> ${translationResult.data.japaneseText}`);
    res.json(result);

  } catch (error) {
    logger.error(`❌ 直接翻译失败:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '翻译失败'
    });
  }
};
