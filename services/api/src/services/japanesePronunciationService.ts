// 日文发音服务 - 获取完整的发音信息
import { logger } from '../utils/logger';
import axios from 'axios';

export interface PronunciationInfo {
  romaji: string;
  hiragana: string;
  katakana: string;
  audioUrl: string;
  pitchAccent?: string; // 音调信息
}


export class JapanesePronunciationService {
  private static instance: JapanesePronunciationService;
  private cache = new Map<string, PronunciationInfo>();

  static getInstance(): JapanesePronunciationService {
    if (!JapanesePronunciationService.instance) {
      JapanesePronunciationService.instance = new JapanesePronunciationService();
    }
    return JapanesePronunciationService.instance;
  }

  /**
   * 获取日文文本的完整发音信息
   */
  async getPronunciationInfo(japaneseText: string): Promise<PronunciationInfo> {
    try {
      logger.info(`🔍 获取日文发音信息: ${japaneseText}`);

      // 检查缓存
      const cacheKey = `pronunciation_${japaneseText}`;
      if (this.cache.has(cacheKey)) {
        logger.info(`✅ 从缓存获取发音信息: ${japaneseText}`);
        return this.cache.get(cacheKey)!;
      }

      // 尝试多种方法获取发音信息
      let pronunciationInfo: PronunciationInfo;


      // 方法1: 检查OpenAI API密钥是否配置
      const hasOpenAIKey = process.env.OPENAI_API_KEY;
      
      if (hasOpenAIKey) {
        try {
          pronunciationInfo = await this.getFromOpenAI(japaneseText);
          if (pronunciationInfo.romaji) {
            logger.info(`✅ OpenAI获取发音成功: ${japaneseText} -> ${pronunciationInfo.romaji}`);
            this.cache.set(cacheKey, pronunciationInfo);
            return pronunciationInfo;
          }
        } catch (error) {
          logger.warn(`⚠️ OpenAI获取发音失败: ${error.message}`);
        }
      } else {
        logger.info(`⚠️ OpenAI API密钥未配置，跳过OpenAI发音服务`);
      }

      // 方法2: 使用wanakana降级方案
      pronunciationInfo = await this.getFromWanakana(japaneseText);
      logger.info(`✅ Wanakana降级方案: ${japaneseText} -> ${pronunciationInfo.romaji}`);
      
      this.cache.set(cacheKey, pronunciationInfo);
      return pronunciationInfo;

    } catch (error) {
      logger.error(`❌ 获取发音信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 判断是否可能是单词（而不是句子）
   */
  private isLikelyWord(text: string): boolean {
    // 简单判断：长度较短且不包含空格
    return text.length <= 10 && !text.includes(' ');
  }


  /**
   * 使用OpenAI生成罗马音
   */
  private async getFromOpenAI(japaneseText: string): Promise<PronunciationInfo> {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const prompt = `请将以下日文文本转换为罗马音（romaji），只返回罗马音，不要其他内容：

日文：${japaneseText}
罗马音：`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是日文发音助手，专门将日文转换为罗马音。只返回罗马音，不要其他内容。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 100
      });

      const romaji = completion.choices[0]?.message?.content?.trim() || '';
      
      if (!romaji) {
        throw new Error('OpenAI未返回罗马音');
      }

      return {
        romaji: romaji,
        hiragana: '',
        katakana: '',
        audioUrl: this.generateAudioUrl(japaneseText)
      };
    } catch (error) {
      logger.error(`❌ OpenAI罗马音生成失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 使用wanakana降级方案
   */
  private async getFromWanakana(japaneseText: string): Promise<PronunciationInfo> {
    try {
      const wanakana = require('wanakana');
      
      // 检查是否包含汉字
      const hasKanji = /[一-龯]/.test(japaneseText);
      
      let romaji = '';
      let hiragana = '';
      
      if (hasKanji) {
        // 包含汉字，需要分词处理
        const words = japaneseText.split(/([一-龯]+|[ひらがな]+|[カタカナ]+)/);
        
        for (const word of words) {
          if (!word.trim()) continue;
          
          if (/[一-龯]/.test(word)) {
            // 汉字部分 - 使用简单映射
            romaji += this.getKanjiRomaji(word);
          } else if (wanakana.isJapanese(word)) {
            // 假名部分
            romaji += wanakana.toRomaji(word);
            hiragana += word;
          } else {
            // 其他字符
            romaji += word;
          }
        }
      } else {
        // 纯假名
        romaji = wanakana.toRomaji(japaneseText);
        hiragana = japaneseText;
      }

      return {
        romaji: romaji,
        hiragana: hiragana,
        katakana: '',
        audioUrl: this.generateAudioUrl(japaneseText)
      };
    } catch (error) {
      logger.error(`❌ Wanakana降级方案失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 汉字到罗马音的映射
   */
  private getKanjiRomaji(kanji: string): string {
    const kanjiMap: Record<string, string> = {
      '愛': 'ai',
      '新': 'shin',
      '聞': 'bun',
      '欲': 'hoshii',
      '食': 'tabe',
      '飲': 'nomi',
      '行': 'iki',
      '来': 'ki',
      '見': 'mi',
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
  private generateAudioUrl(japaneseText: string): string {
    const encodedText = encodeURIComponent(japaneseText);
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ja&client=tw-ob`;
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
