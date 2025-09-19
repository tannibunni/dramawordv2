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
      logger.info(`🔍 尝试Azure翻译: ${text}`);
      logger.info(`🔍 Azure环境变量检查: AZURE_TRANSLATOR_ENDPOINT=${process.env.AZURE_TRANSLATOR_ENDPOINT ? '已配置' : '未配置'}, AZURE_TRANSLATOR_KEY=${process.env.AZURE_TRANSLATOR_KEY ? '已配置' : '未配置'}`);
      
      const japaneseService = JapaneseTranslationService.getInstance();
      logger.info(`🔍 JapaneseTranslationService实例创建成功`);
      
      translationResult = await japaneseService.translateToJapanese(text);
      logger.info(`🔍 Azure翻译调用完成:`, translationResult);
      
      if (!translationResult.success || !translationResult.data) {
        throw new Error(translationResult.error || 'Azure翻译失败');
      }
      
      logger.info(`✅ Azure翻译成功: ${text} -> ${translationResult.data.japaneseText}`);
    } catch (azureError) {
      logger.error(`❌ Azure翻译失败，使用降级方案: ${azureError.message}`);
      
      // 降级方案：使用Google翻译
      try {
        logger.info(`🔍 尝试Google翻译降级: ${text}`);
        const { translationService } = await import('../services/translationService');
        const targetLanguage = uiLanguage === 'zh-CN' ? 'zh' : 'ja';
        logger.info(`🔍 目标语言: ${targetLanguage}`);
        
        const fallbackResult = await translationService.translateText(text, targetLanguage, 'en');
        logger.info(`🔍 Google翻译结果:`, fallbackResult);
        
        if (!fallbackResult.success || !fallbackResult.translatedText) {
          throw new Error('Google翻译服务不可用');
        }
        
        // 构建降级结果 - 添加罗马音和音频
        const japaneseText = fallbackResult.translatedText;
        const romaji = generateFallbackRomaji(japaneseText);
        const audioUrl = generateAudioUrl(japaneseText);
        
        translationResult = {
          success: true,
          data: {
            japaneseText: japaneseText,
            romaji: romaji,
            hiragana: '',
            sourceLanguage: 'en',
            audioUrl: audioUrl
          }
        };
        
        logger.info(`✅ 降级翻译成功: ${text} -> ${fallbackResult.translatedText}`);
      } catch (googleError) {
        logger.error(`❌ Google翻译也失败: ${googleError.message}`);
        throw new Error('所有翻译服务都不可用');
      }
    }

    // 构建返回数据 - Azure句子翻译显示日文翻译
    const result = {
      success: true,
      data: {
        word: text, // 词卡标题显示用户搜索的原句
        language: 'ja', // 改为日文，因为显示翻译结果
        phonetic: translationResult.data.romaji || '', // 显示罗马音
        kana: translationResult.data.hiragana || '', // 显示假名
        romaji: translationResult.data.romaji || '', // 显示罗马音
        definitions: [
          {
            partOfSpeech: 'sentence',
            definition: text, // 释义显示原句
            examples: [] // 不显示例句
          }
        ],
        audioUrl: translationResult.data.audioUrl || '', // 显示发音
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

/**
 * 生成备用罗马音（改进实现）
 */
function generateFallbackRomaji(japaneseText: string): string {
  try {
    // 使用wanakana库进行假名到罗马音转换
    const wanakana = require('wanakana');
    
    // 先尝试直接转换
    if (wanakana.isJapanese(japaneseText)) {
      const romaji = wanakana.toRomaji(japaneseText);
      logger.info(`✅ Wanakana转换成功: ${japaneseText} -> ${romaji}`);
      return romaji;
    }
    
    // 如果包含汉字，尝试分词后转换
    const words = japaneseText.split(/([一-龯]+|[ひらがな]+|[カタカナ]+)/);
    let result = '';
    
    for (const word of words) {
      if (wanakana.isJapanese(word)) {
        result += wanakana.toRomaji(word);
      } else if (word.trim()) {
        // 对于汉字，使用简单映射
        result += getKanjiRomaji(word);
      }
    }
    
    logger.info(`✅ 分词转换成功: ${japaneseText} -> ${result}`);
    return result;
    
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
    '愛': 'ai',
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
