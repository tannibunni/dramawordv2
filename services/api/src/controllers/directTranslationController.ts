// 直接翻译控制器 - 使用Google翻译+OpenAI罗马音/拼音
import { Request, Response } from 'express';
import { JapanesePronunciationService } from '../services/japanesePronunciationService';
import { ChinesePronunciationService } from '../services/chinesePronunciationService';
import { CloudWord } from '../models/CloudWord';
import { logger } from '../utils/logger';

export const directTranslate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, uiLanguage = 'en-US', targetLanguage = 'ja' } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({
        success: false,
        error: '文本参数无效'
      });
      return;
    }

    logger.info(`🔍 直接翻译请求: ${text}, UI语言: ${uiLanguage}, 目标语言: ${targetLanguage}`);

    // 使用Google翻译+OpenAI罗马音方案
    let translationResult;
    try {
      logger.info(`🔍 使用Google翻译+OpenAI罗马音: ${text} -> ${targetLanguage}`);
      
      // 使用Google翻译
      const { translationService } = await import('../services/translationService');
      const translationResponse = await translationService.translateText(text, targetLanguage, 'auto');
      logger.info(`🔍 Google翻译结果:`, translationResponse);
      
      if (!translationResponse.success || !translationResponse.translatedText) {
        throw new Error('Google翻译服务不可用');
      }
      
      const translatedText = translationResponse.translatedText;
      
      if (targetLanguage === 'ja') {
        // 日文翻译使用专业发音服务
        const pronunciationService = JapanesePronunciationService.getInstance();
        const pronunciationInfo = await pronunciationService.getPronunciationInfo(translatedText);
        
        translationResult = {
          success: true,
          data: {
            japaneseText: translatedText,
            romaji: pronunciationInfo.romaji,
            hiragana: pronunciationInfo.hiragana,
            sourceLanguage: 'auto',
            audioUrl: pronunciationInfo.audioUrl
          },
          translationSource: 'google_translation'
        };
      } else if (targetLanguage === 'zh') {
        // 中文翻译使用专业发音服务
        const pronunciationService = ChinesePronunciationService.getInstance();
        const pronunciationInfo = await pronunciationService.getPronunciationInfo(translatedText);
        
        translationResult = {
          success: true,
          data: {
            translatedText: translatedText,
            sourceLanguage: 'auto',
            audioUrl: pronunciationInfo.audioUrl,
            pinyin: pronunciationInfo.pinyin,
            toneMarks: pronunciationInfo.toneMarks
          },
          translationSource: 'google_translation'
        };
      } else {
        // 其他语言使用通用结果
        translationResult = {
          success: true,
          data: {
            translatedText: translatedText,
            sourceLanguage: 'auto',
            audioUrl: generateAudioUrlForLanguage(translatedText, targetLanguage)
          },
          translationSource: 'google_translation'
        };
      }
      
      logger.info(`✅ Google翻译成功: ${text} -> ${translatedText}`);
      
    } catch (error) {
      logger.error(`❌ 翻译失败: ${error.message}`);
      throw new Error('翻译服务不可用');
    }

    // 构建返回数据 - 根据目标语言构建不同的结果
    let result;
    
    if (targetLanguage === 'ja') {
      // 日文翻译结果
      result = {
        success: true,
        data: {
          word: text, // 词卡标题显示用户搜索的原句
          language: 'ja', // 目标语言
          phonetic: translationResult.data.romaji || '', // 显示罗马音
          kana: translationResult.data.hiragana || '', // 显示假名
          romaji: translationResult.data.romaji || '', // 显示罗马音
          definitions: [
            {
              partOfSpeech: getPartOfSpeech(text, targetLanguage),
              definition: text, // 释义显示原句
              examples: [] // 不显示例句
            }
          ],
          audioUrl: translationResult.data.audioUrl || '', // 显示发音
          correctedWord: translationResult.data.japaneseText, // 显示翻译结果
          slangMeaning: null,
          phraseExplanation: null,
          originalText: text, // 原文本字段
          translation: translationResult.data.japaneseText, // 翻译结果存储在translation字段
          translationSource: translationResult.translationSource || 'azure_translation' // 翻译来源
        }
      };
      logger.info(`✅ 日文翻译完成: ${text} -> ${translationResult.data.japaneseText}`);
    } else if (targetLanguage === 'zh') {
      // 中文翻译结果
      result = {
        success: true,
        data: {
          word: text, // 词卡标题显示用户搜索的原句
          language: 'zh', // 目标语言
          phonetic: translationResult.data.pinyin || '', // 显示拼音
          pinyin: translationResult.data.pinyin || '', // 显示拼音
          kana: '', // 中文无假名
          romaji: '', // 中文无罗马音
          definitions: [
            {
              partOfSpeech: getPartOfSpeech(text, targetLanguage),
              definition: text, // 释义显示原句
              examples: [] // 不显示例句
            }
          ],
          audioUrl: translationResult.data.audioUrl || '', // 使用翻译结果中的音频URL
          correctedWord: translationResult.data.translatedText, // 显示翻译结果
          slangMeaning: null,
          phraseExplanation: null,
          originalText: text, // 原文本字段
          translation: translationResult.data.translatedText, // 翻译结果存储在translation字段
          translationSource: translationResult.translationSource || 'google_translation' // 翻译来源
        }
      };
      logger.info(`✅ 中文翻译完成: ${text} -> ${translationResult.data.translatedText}`);
    } else {
      // 其他语言翻译结果
      result = {
        success: true,
        data: {
          word: text, // 词卡标题显示用户搜索的原句
          language: targetLanguage, // 目标语言
          phonetic: '', // 其他语言暂无音标
          kana: '', // 其他语言暂无假名
          romaji: '', // 其他语言暂无罗马音
          definitions: [
            {
              partOfSpeech: getPartOfSpeech(text, targetLanguage),
              definition: text, // 释义显示原句
              examples: [] // 不显示例句
            }
          ],
          audioUrl: translationResult.data.audioUrl || '', // 使用翻译结果中的音频URL
          correctedWord: translationResult.data.translatedText, // 显示翻译结果
          slangMeaning: null,
          phraseExplanation: null,
          originalText: text, // 原文本字段
          translation: translationResult.data.translatedText, // 翻译结果存储在translation字段
          translationSource: translationResult.translationSource || 'google_translation' // 翻译来源
        }
      };
      logger.info(`✅ ${targetLanguage}翻译完成: ${text} -> ${translationResult.data.translatedText}`);
    }
    
    // 存储翻译结果到CloudWords
    const translatedText = targetLanguage === 'ja' ? translationResult.data.japaneseText : translationResult.data.translatedText;
    await saveTranslationToCloudWords(text, result.data, uiLanguage, targetLanguage);
    
    res.json(result);

  } catch (error) {
    logger.error(`❌ 直接翻译失败:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '翻译失败'
    });
  }
};

/**
 * 生成备用罗马音（改进实现）
 */
function generateFallbackRomaji(japaneseText: string): string {
  try {
    // 使用wanakana库进行假名到罗马音转换
    const wanakana = require('wanakana');
    
    logger.info(`🔍 开始转换罗马音: ${japaneseText}`);
    
    // 检查是否包含汉字
    const hasKanji = /[一-龯]/.test(japaneseText);
    logger.info(`🔍 包含汉字: ${hasKanji}`);
    
    if (hasKanji) {
      // 包含汉字，需要分词处理
      logger.info(`🔍 分词处理汉字文本: ${japaneseText}`);
      
      // 使用更精确的分词正则表达式
      const words = japaneseText.split(/([一-龯]+|[ひらがな]+|[カタカナ]+)/);
      logger.info(`🔍 分词结果:`, words);
      
      let result = '';
      
      for (const word of words) {
        if (!word.trim()) continue;
        
        logger.info(`🔍 处理单词: "${word}"`);
        
        if (/[一-龯]/.test(word)) {
          // 汉字部分
          const kanjiRomaji = getKanjiRomaji(word);
          logger.info(`🔍 汉字转换: "${word}" -> "${kanjiRomaji}"`);
          result += kanjiRomaji;
        } else if (wanakana.isJapanese(word)) {
          // 假名部分
          const kanaRomaji = wanakana.toRomaji(word);
          logger.info(`🔍 假名转换: "${word}" -> "${kanaRomaji}"`);
          result += kanaRomaji;
        } else {
          // 其他字符（标点等）
          result += word;
        }
      }
      
      logger.info(`✅ 分词转换成功: ${japaneseText} -> ${result}`);
      return result;
    } else {
      // 纯假名，直接转换
      const romaji = wanakana.toRomaji(japaneseText);
      logger.info(`✅ Wanakana直接转换成功: ${japaneseText} -> ${romaji}`);
      return romaji;
    }
    
  } catch (error) {
    logger.error(`❌ Wanakana转换失败，使用简单映射: ${error.message}`);
    
    // 降级到简单映射
    const romajiMap: Record<string, string> = {
      'これ': 'kore',
      'が': 'ga',
      '欲しい': 'hoshii',
      'です': 'desu',
      'は': 'wa',
      'を': 'wo',
      'に': 'ni',
      'の': 'no',
      'と': 'to',
      'で': 'de',
      'だ': 'da',
      'ます': 'masu',
      'ニュース': 'nyuusu',
      'あり': 'ari'
    };
    
    let romaji = japaneseText;
    for (const [japanese, romanji] of Object.entries(romajiMap)) {
      romaji = romaji.replace(new RegExp(japanese, 'g'), romanji);
    }
    
    return romaji;
  }
}

/**
 * 汉字到罗马音的简单映射
 */
function getKanjiRomaji(kanji: string): string {
  const kanjiMap: Record<string, string> = {
    '愛': 'ai',
    '新': 'shin',
    '欲': 'hoshii',
    '食': 'tabe',
    '飲': 'nomi',
    '行': 'iki',
    '来': 'ki',
    '見': 'mi',
    '聞': 'ki',
    '話': 'hana',
    '読': 'yomi',
    '書': 'kaki',
    '買': 'kai',
    '売': 'uri',
    '作': 'tsukuri',
    '使': 'tsukai',
    '持': 'mochi',
    '取': 'tori',
    '出': 'de',
    '入': 'iri',
    '上': 'ue',
    '下': 'shita',
    '前': 'mae',
    '後': 'ato',
    '左': 'hidari',
    '右': 'migi',
    '中': 'naka',
    '外': 'soto',
    '内': 'uchi',
    '大': 'oo',
    '小': 'chii',
    '高': 'takai',
    '低': 'hikui',
    '長': 'nagai',
    '短': 'mijikai',
    '古': 'furui',
    '好': 'suki',
    '悪': 'warui',
    '美': 'utsukushii',
    '醜': 'minikui',
    '強': 'tsuyoi',
    '弱': 'yowai',
    '早': 'hayai',
    '遅': 'osoi',
    '多': 'ooi',
    '少': 'sukunai',
    '全': 'zenbu',
    '部': 'bubun',
    '分': 'wakar',
    '知': 'shiri',
    '思': 'omoi',
    '感': 'kanji',
    '気': 'ki',
    '心': 'kokoro',
    '体': 'karada',
    '頭': 'atama',
    '目': 'me',
    '耳': 'mimi',
    '口': 'kuchi',
    '手': 'te',
    '足': 'ashi',
    '家': 'ie',
    '人': 'hito',
    '男': 'otoko',
    '女': 'onna',
    '子': 'ko',
    '親': 'oya',
    '友': 'tomodachi',
    '恋': 'koi',
    '幸': 'shiawase',
    '悲': 'kanashii',
    '楽': 'tanoshii',
    '苦': 'kurushii',
    '痛': 'itai',
    '病': 'byouki',
    '死': 'shi',
    '生': 'sei',
    '命': 'inochi',
    '時': 'toki',
    '日': 'hi',
    '月': 'tsuki',
    '年': 'toshi',
    '今': 'ima',
    '昔': 'mukashi',
    '未来': 'mirai',
    '過去': 'kako',
    '現在': 'genzai',
    '朝': 'asa',
    '昼': 'hiru',
    '夜': 'yoru',
    '春': 'haru',
    '夏': 'natsu',
    '秋': 'aki',
    '冬': 'fuyu',
    '天': 'ten',
    '地': 'chi',
    '山': 'yama',
    '川': 'kawa',
    '海': 'umi',
    '空': 'sora',
    '風': 'kaze',
    '雨': 'ame',
    '雪': 'yuki',
    '火': 'hi',
    '水': 'mizu',
    '木': 'ki',
    '金': 'kin',
    '土': 'tsuchi',
    '石': 'ishi',
    '鉄': 'tetsu',
    '銀': 'gin',
    '銅': 'dou',
    '紙': 'kami',
    '布': 'nuno',
    '皮': 'kawa',
    '肉': 'niku',
    '魚': 'sakana',
    '鳥': 'tori',
    '犬': 'inu',
    '猫': 'neko',
    '馬': 'uma',
    '牛': 'ushi',
    '豚': 'buta',
    '羊': 'hitsuji',
    '鶏': 'niwatori',
    '卵': 'tamago',
    '米': 'kome',
    '麦': 'mugi',
    '豆': 'mame',
    '野菜': 'yasai',
    '果物': 'kudamono',
    '花': 'hana',
    '草': 'kusa',
    '葉': 'ha',
    '根': 'ne',
    '種': 'tane',
    '実': 'mi',
    '色': 'iro',
    '赤': 'aka',
    '青': 'ao',
    '黄': 'kiiro',
    '緑': 'midori',
    '紫': 'murasaki',
    '白': 'shiro',
    '黒': 'kuro',
    '灰': 'hai',
    '茶': 'cha',
    '数': 'kazu',
    '一': 'ichi',
    '二': 'ni',
    '三': 'san',
    '四': 'yon',
    '五': 'go',
    '六': 'roku',
    '七': 'nana',
    '八': 'hachi',
    '九': 'kyuu',
    '十': 'juu',
    '百': 'hyaku',
    '千': 'sen',
    '万': 'man',
    '億': 'oku',
    '兆': 'chou'
  };
  
  return kanjiMap[kanji] || kanji;
}

/**
 * 生成TTS音频URL
 */
function generateAudioUrl(japaneseText: string): string {
  const encodedText = encodeURIComponent(japaneseText);
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ja&client=tw-ob`;
}

/**
 * 保存翻译结果到CloudWords
 */
async function saveTranslationToCloudWords(originalText: string, wordData: any, uiLanguage: string, targetLanguage: string): Promise<void> {
  try {
    logger.info(`💾 保存翻译结果到CloudWords: ${originalText} -> ${wordData.correctedWord}`);
    
    // 检查是否已存在
    const existingWord = await CloudWord.findOne({ 
      word: originalText.toLowerCase(), 
      language: targetLanguage, 
      uiLanguage: uiLanguage 
    });
    
    if (existingWord) {
      // 更新搜索次数和完整数据
      await CloudWord.updateOne(
        { _id: existingWord._id },
        { 
          $inc: { searchCount: 1 },
          $set: { 
            lastSearched: new Date(),
            correctedWord: wordData.correctedWord,
            phonetic: wordData.phonetic,
            pinyin: wordData.pinyin,
            audioUrl: wordData.audioUrl,
            translation: wordData.translation,
            translationSource: wordData.translationSource,
            definitions: wordData.definitions
          }
        }
      );
      logger.info(`✅ 更新现有CloudWord: ${originalText}`);
      return;
    }
    
    // 创建新的CloudWord记录
    const cloudWord = new CloudWord({
      word: originalText.toLowerCase(),
      language: targetLanguage,
      uiLanguage: uiLanguage,
      phonetic: wordData.phonetic || '',
      pinyin: wordData.pinyin || '',
      kana: wordData.kana || '',
      romaji: wordData.romaji || '',
      definitions: wordData.definitions || [
        {
          partOfSpeech: getPartOfSpeech(originalText, targetLanguage),
          definition: originalText,
          examples: []
        }
      ],
      audioUrl: wordData.audioUrl || '',
      correctedWord: wordData.correctedWord || originalText,
      slangMeaning: wordData.slangMeaning || null,
      phraseExplanation: wordData.phraseExplanation || null,
      searchCount: 1,
      lastSearched: new Date(),
      // 添加翻译相关字段
      translation: wordData.translation || wordData.correctedWord,
      translationSource: wordData.translationSource || 'google_translation'
    });
    
    await cloudWord.save();
    logger.info(`✅ 创建新CloudWord: ${originalText} -> ${wordData.correctedWord}`);
    
  } catch (error) {
    logger.error(`❌ 保存翻译结果到CloudWords失败:`, error);
    // 不抛出错误，避免影响翻译功能
  }
}

/**
 * 智能判断词性
 */
function getPartOfSpeech(text: string, targetLanguage: string): string {
  // 简单判断：如果包含空格，可能是句子或短语
  if (text.includes(' ')) {
    return 'phrase';
  }
  
  // 根据目标语言设置默认词性
  switch (targetLanguage) {
    case 'zh':
      // 中文：大多数单词是名词
      return '名词';
    case 'ja':
      // 日语：大多数单词是名词
      return '名詞';
    case 'ko':
      // 韩语：大多数单词是名词
      return '명사';
    case 'fr':
      // 法语：大多数单词是名词
      return 'nom';
    case 'es':
      // 西班牙语：大多数单词是名词
      return 'sustantivo';
    default:
      // 默认英文词性
      return 'noun';
  }
}

/**
 * 生成对应语言的TTS音频URL
 */
function generateAudioUrlForLanguage(text: string, targetLanguage: string): string {
  try {
    const encodedText = encodeURIComponent(text);
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${targetLanguage}&client=tw-ob`;
  } catch (error) {
    logger.error(`❌ 生成${targetLanguage}音频URL失败:`, error);
    return '';
  }
}
