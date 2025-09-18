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
    const japaneseService = JapaneseTranslationService.getInstance();
    const translationResult = await japaneseService.translateToJapanese(text);

    if (!translationResult.success || !translationResult.data) {
      throw new Error(translationResult.error || '翻译失败');
    }

    const { japaneseText, romaji, hiragana, katakana, audioUrl } = translationResult.data;
    logger.info(`✅ Azure翻译成功: ${text} -> ${japaneseText}`);

    // 构建返回数据
    const result = {
      success: true,
      data: {
        word: text, // 词卡标题显示用户搜索的原句
        language: 'ja',
        phonetic: romaji, // Azure罗马音
        kana: hiragana, // Azure假名
        katakana: katakana, // Azure片假名
        romaji: romaji, // Azure罗马音字段
        definitions: [
          {
            partOfSpeech: 'sentence',
            definition: text, // 释义显示原句
            examples: [
              {
                japanese: japaneseText,
                english: text // 例句中显示原文
              }
            ]
          }
        ],
        audioUrl: audioUrl, // Azure TTS音频URL
        correctedWord: japaneseText, // 翻译结果作为correctedWord
        slangMeaning: null,
        phraseExplanation: null,
        originalText: text, // 原文本字段
        translation: japaneseText // 添加翻译结果字段
      }
    };

    logger.info(`✅ 直接翻译完成: ${text} -> ${japaneseText}`);
    res.json(result);

  } catch (error) {
    logger.error(`❌ 直接翻译失败:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '翻译失败'
    });
  }
};
