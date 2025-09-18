// 直接翻译控制器 - 跳过OpenAI，直接使用Google翻译
import { Request, Response } from 'express';
import { translationService } from '../services/translationService';
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

    // 使用Google翻译直接翻译
    const targetLanguage = uiLanguage === 'zh-CN' ? 'zh' : 'ja';
    const translationResult = await translationService.translateText(text, targetLanguage, 'en');

    if (!translationResult.success || !translationResult.translatedText) {
      throw new Error('翻译失败');
    }

    const translatedText = translationResult.translatedText;
    logger.info(`✅ 直接翻译成功: ${text} -> ${translatedText}`);

    // 生成TTS音频URL
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(translatedText)}&tl=${targetLanguage}&client=tw-ob`;

    // 构建返回数据
    const result = {
      success: true,
      data: {
        word: text,
        language: targetLanguage,
        phonetic: translatedText, // 对于句子，phonetic就是翻译结果
        kana: undefined,
        definitions: [
          {
            partOfSpeech: 'sentence',
            definition: translatedText,
            examples: [
              {
                japanese: translatedText,
                english: text
              }
            ]
          }
        ],
        audioUrl: audioUrl,
        correctedWord: translatedText,
        slangMeaning: null,
        phraseExplanation: null
      }
    };

    logger.info(`✅ 直接翻译完成: ${text} -> ${translatedText}`);
    res.json(result);

  } catch (error) {
    logger.error(`❌ 直接翻译失败:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '翻译失败'
    });
  }
};
