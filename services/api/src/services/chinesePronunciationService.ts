import { logger } from '../utils/logger';

export interface ChinesePronunciationInfo {
  pinyin: string;
  toneMarks: string; // 带声调的拼音
  audioUrl: string;
  wordSegmentation?: string; // 分词结果
}

export class ChinesePronunciationService {
  private static instance: ChinesePronunciationService;
  private cache = new Map<string, ChinesePronunciationInfo>();

  static getInstance(): ChinesePronunciationService {
    if (!ChinesePronunciationService.instance) {
      ChinesePronunciationService.instance = new ChinesePronunciationService();
    }
    return ChinesePronunciationService.instance;
  }

  /**
   * 获取中文文本的完整发音信息
   */
  async getPronunciationInfo(chineseText: string): Promise<ChinesePronunciationInfo> {
    try {
      logger.info(`🔍 获取中文发音信息: ${chineseText}`);

      // 检查缓存
      const cacheKey = `chinese_pronunciation_${chineseText}`;
      if (this.cache.has(cacheKey)) {
        logger.info(`✅ 从缓存获取中文发音信息: ${chineseText}`);
        return this.cache.get(cacheKey)!;
      }

      // 尝试多种方法获取发音信息
      let pronunciationInfo: ChinesePronunciationInfo;

      // 方法1: 检查OpenAI API密钥是否配置
      const hasOpenAIKey = process.env.OPENAI_API_KEY;
      
      if (hasOpenAIKey) {
        try {
          pronunciationInfo = await this.getFromOpenAI(chineseText);
          if (pronunciationInfo.pinyin) {
            logger.info(`✅ OpenAI获取拼音成功: ${chineseText} -> ${pronunciationInfo.pinyin}`);
            this.cache.set(cacheKey, pronunciationInfo);
            return pronunciationInfo;
          }
        } catch (error) {
          logger.warn(`⚠️ OpenAI获取拼音失败: ${error.message}`);
        }
      } else {
        logger.info(`⚠️ OpenAI API密钥未配置，跳过OpenAI拼音服务`);
      }

      // 方法2: 使用简单拼音映射降级方案
      pronunciationInfo = await this.getFromSimpleMapping(chineseText);
      logger.info(`✅ 简单拼音映射降级方案: ${chineseText} -> ${pronunciationInfo.pinyin}`);
      
      this.cache.set(cacheKey, pronunciationInfo);
      return pronunciationInfo;

    } catch (error) {
      logger.error(`❌ 获取中文发音信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 使用OpenAI生成拼音
   */
  private async getFromOpenAI(chineseText: string): Promise<ChinesePronunciationInfo> {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const prompt = `请将以下中文文本转换为拼音，只返回拼音，不要其他内容：

中文：${chineseText}
拼音：`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是中文拼音助手，专门将中文转换为拼音。只返回拼音，不要其他内容。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 100
      });

      const pinyin = completion.choices[0]?.message?.content?.trim() || '';
      
      if (!pinyin) {
        throw new Error('OpenAI未返回拼音');
      }

      return {
        pinyin: pinyin,
        toneMarks: pinyin, // 简化处理，假设OpenAI返回的就是带声调的拼音
        audioUrl: this.generateAudioUrl(chineseText)
      };
    } catch (error) {
      logger.error(`❌ OpenAI拼音生成失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 使用简单拼音映射降级方案
   */
  private async getFromSimpleMapping(chineseText: string): Promise<ChinesePronunciationInfo> {
    try {
      // 简单的拼音映射表（常用字符）
      const pinyinMap: Record<string, string> = {
        '我': 'wǒ',
        '你': 'nǐ',
        '他': 'tā',
        '她': 'tā',
        '是': 'shì',
        '的': 'de',
        '了': 'le',
        '在': 'zài',
        '有': 'yǒu',
        '和': 'hé',
        '不': 'bù',
        '要': 'yào',
        '去': 'qù',
        '来': 'lái',
        '上': 'shàng',
        '下': 'xià',
        '中': 'zhōng',
        '国': 'guó',
        '人': 'rén',
        '学': 'xué',
        '生': 'shēng',
        '工': 'gōng',
        '作': 'zuò',
        '吃': 'chī',
        '喝': 'hē',
        '睡': 'shuì',
        '觉': 'jiào',
        '好': 'hǎo',
        '大': 'dà',
        '小': 'xiǎo',
        '多': 'duō',
        '少': 'shǎo',
        '一': 'yī',
        '二': 'èr',
        '三': 'sān',
        '四': 'sì',
        '五': 'wǔ',
        '六': 'liù',
        '七': 'qī',
        '八': 'bā',
        '九': 'jiǔ',
        '十': 'shí',
        '家': 'jiā',
        '学校': 'xuéxiào',
        '工作': 'gōngzuò',
        '朋友': 'péngyou',
        '时间': 'shíjiān',
        '今天': 'jīntiān',
        '明天': 'míngtiān',
        '昨天': 'zuótiān',
        '现在': 'xiànzài',
        '什么': 'shénme',
        '哪里': 'nǎlǐ',
        '怎么': 'zěnme',
        '为什么': 'wèishénme',
        '对不起': 'duìbuqǐ',
        '谢谢': 'xièxie',
        '再见': 'zàijiàn',
        '你好': 'nǐhǎo',
        '请问': 'qǐngwèn',
        '没关系': 'méiguānxi'
      };

      let pinyin = '';
      
      // 先尝试完整匹配（多字符词）
      for (let len = Math.min(chineseText.length, 4); len >= 2; len--) {
        for (let i = 0; i <= chineseText.length - len; i++) {
          const substr = chineseText.substring(i, i + len);
          if (pinyinMap[substr]) {
            pinyin += pinyinMap[substr] + ' ';
            // 标记已处理的字符
            chineseText = chineseText.substring(0, i) + ' '.repeat(len) + chineseText.substring(i + len);
            break;
          }
        }
      }

      // 处理剩余的单字符
      for (let i = 0; i < chineseText.length; i++) {
        const char = chineseText[i];
        if (char !== ' ') {
          pinyin += pinyinMap[char] || char;
          if (i < chineseText.length - 1) {
            pinyin += ' ';
          }
        }
      }

      return {
        pinyin: pinyin.trim(),
        toneMarks: pinyin.trim(),
        audioUrl: this.generateAudioUrl(chineseText)
      };
    } catch (error) {
      logger.error(`❌ 简单拼音映射失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 生成TTS音频URL
   */
  private generateAudioUrl(chineseText: string): string {
    const encodedText = encodeURIComponent(chineseText);
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=zh&client=tw-ob`;
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}
