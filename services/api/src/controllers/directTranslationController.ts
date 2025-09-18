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

    // 生成罗马音（仅对日语）
    let romaji = '';
    if (targetLanguage === 'ja') {
      try {
        // 使用Google翻译API获取罗马音
        const romajiResult = await translationService.translateText(translatedText, 'en', 'ja');
        if (romajiResult.success && romajiResult.translatedText) {
          // 简单的罗马音转换（这里可以集成更专业的罗马音转换库）
          romaji = romajiResult.translatedText.toLowerCase();
        }
      } catch (error) {
        logger.warn(`⚠️ 获取罗马音失败: ${error}`);
      }
    }

    // 生成TTS音频URL
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(translatedText)}&tl=${targetLanguage}&client=tw-ob`;

    // 构建返回数据
    const result = {
      success: true,
      data: {
        word: text, // 词卡标题显示用户搜索的原句
        language: targetLanguage,
        phonetic: romaji || translatedText, // 优先使用罗马音，否则使用翻译结果
        kana: targetLanguage === 'ja' ? translatedText : undefined, // 日语时kana为翻译结果
        romaji: romaji, // 添加罗马音字段
        definitions: [
          {
            partOfSpeech: 'sentence',
            definition: text, // 释义显示原句
            examples: [
              {
                japanese: translatedText,
                english: text // 例句中显示原文
              }
            ]
          }
        ],
        audioUrl: audioUrl,
        correctedWord: translatedText, // 翻译结果作为correctedWord
        slangMeaning: null,
        phraseExplanation: null,
        originalText: text, // 原文本字段
        translation: translatedText // 添加翻译结果字段
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
