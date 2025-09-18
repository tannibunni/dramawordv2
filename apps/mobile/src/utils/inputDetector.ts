// 输入类型检测工具
import * as wanakana from 'wanakana';

export type InputType = 'chinese' | 'japanese_kanji' | 'japanese_kana' | 'english' | 'romaji' | 'mixed';

export interface InputAnalysis {
  type: InputType;
  confidence: number;
  suggestions: {
    kana?: string;
    kanji?: string;
    romaji?: string;
  };
}

/**
 * 检测输入类型和提供建议
 */
export function analyzeInput(input: string): InputAnalysis {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      type: 'english',
      confidence: 0,
      suggestions: {}
    };
  }

  // 检测中文字符
  const chineseChars = (trimmed.match(/[\u4e00-\u9fff]/g) || []).length;
  const chineseRatio = chineseChars / trimmed.length;

  // 检测假名字符
  const kanaChars = (trimmed.match(/[\u3040-\u30ff]/g) || []).length;
  const kanaRatio = kanaChars / trimmed.length;

  // 检测英文字符
  const englishChars = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const englishRatio = englishChars / trimmed.length;

  // 检测数字和符号
  const otherChars = trimmed.length - chineseChars - kanaChars - englishChars;
  const otherRatio = otherChars / trimmed.length;

  console.log(`🔍 输入分析: "${trimmed}"`, {
    chineseChars,
    kanaChars,
    englishChars,
    otherChars,
    chineseRatio,
    kanaRatio,
    englishRatio,
    otherRatio
  });

  // 判断输入类型
  if (chineseRatio > 0.7) {
    // 主要是中文字符，可能是中文或日语汉字
    return {
      type: 'chinese',
      confidence: chineseRatio,
      suggestions: {
        kanji: trimmed
      }
    };
  }

  if (kanaRatio > 0.7) {
    // 主要是假名字符
    return {
      type: 'japanese_kana',
      confidence: kanaRatio,
      suggestions: {
        kana: trimmed
      }
    };
  }

  if (englishRatio > 0.7 && otherRatio < 0.3) {
    // 主要是英文字符，可能是英文或罗马音
    const isRomaji = isLikelyRomaji(trimmed);
    const isEnglishSentenceInput = isEnglishSentence(trimmed);
    
    if (isEnglishSentenceInput) {
      // 英文句子，直接翻译
      return {
        type: 'english',
        confidence: 0.9,
        suggestions: {
          romaji: trimmed
        }
      };
    } else if (isRomaji) {
      // 尝试转换为假名
      try {
        const kana = wanakana.toHiragana(trimmed);
        const kanji = wanakana.toKatakana(trimmed);
        
        return {
          type: 'romaji',
          confidence: 0.8,
          suggestions: {
            kana,
            kanji,
            romaji: trimmed
          }
        };
      } catch (error) {
        console.log(`❌ 罗马音转换失败: ${error}`);
        return {
          type: 'english',
          confidence: 0.6,
          suggestions: {
            romaji: trimmed
          }
        };
      }
    } else {
      return {
        type: 'english',
        confidence: 0.8,
        suggestions: {
          romaji: trimmed
        }
      };
    }
  }

  // 混合类型
  if (chineseChars > 0 && kanaChars > 0) {
    return {
      type: 'mixed',
      confidence: 0.5,
      suggestions: {
        kanji: trimmed,
        kana: trimmed
      }
    };
  }

  // 默认按英文处理
  return {
    type: 'english',
    confidence: 0.3,
    suggestions: {
      romaji: trimmed
    }
  };
}

/**
 * 判断是否为英文句子
 */
function isEnglishSentence(input: string): boolean {
  // 检查是否包含空格（句子特征）
  if (!input.includes(' ')) {
    return false;
  }
  
  // 检查是否包含英文句子特征
  const englishSentenceIndicators = [
    'I ', 'you ', 'he ', 'she ', 'we ', 'they ', 'am ', 'is ', 'are ', 'was ', 'were ',
    'have ', 'has ', 'had ', 'do ', 'does ', 'did ', 'will ', 'would ', 'can ', 'could ',
    'like ', 'love ', 'want ', 'need ', 'go ', 'come ', 'see ', 'know ', 'think ', 'feel ',
    'a ', 'an ', 'the ', 'and ', 'or ', 'but ', 'in ', 'on ', 'at ', 'to ', 'for ', 'of ',
    'with ', 'by ', 'from ', 'up ', 'down ', 'out ', 'off ', 'over ', 'under ', 'through '
  ];
  
  const lowerInput = input.toLowerCase();
  return englishSentenceIndicators.some(indicator => lowerInput.includes(indicator));
}

/**
 * 判断字符串是否可能是罗马音
 */
function isLikelyRomaji(input: string): boolean {
  // 罗马音特征：
  // 1. 只包含字母
  // 2. 长度适中（2-20字符）
  // 3. 不包含明显的英文单词模式
  
  if (!/^[a-zA-Z]+$/.test(input)) {
    return false;
  }

  if (input.length < 2 || input.length > 20) {
    return false;
  }

  // 检查是否包含明显的英文单词模式
  const commonEnglishWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall'
  ];

  const lowerInput = input.toLowerCase();
  if (commonEnglishWords.includes(lowerInput)) {
    return false;
  }

  // 检查罗马音特征模式
  const romajiPatterns = [
    /^[aeiou]/i, // 以元音开头
    /[aeiou]$/i, // 以元音结尾
    /^[kgsztdnhbpmyrw][aeiou]/i, // 辅音+元音开头
    /[kgsztdnhbpmyrw][aeiou]$/i, // 辅音+元音结尾
    /^[aeiou][kgsztdnhbpmyrw]/i, // 元音+辅音开头
    /[aeiou][kgsztdnhbpmyrw]$/i, // 元音+辅音结尾
  ];

  return romajiPatterns.some(pattern => pattern.test(input));
}

/**
 * 获取查询建议
 */
export function getQuerySuggestions(analysis: InputAnalysis): {
  dictionary: string[];
  translation: string[];
} {
  const suggestions = {
    dictionary: [] as string[],
    translation: [] as string[]
  };

  switch (analysis.type) {
    case 'chinese':
      // 中文输入：优先查日语词典，然后翻译
      if (analysis.suggestions.kanji) {
        suggestions.dictionary.push(analysis.suggestions.kanji);
      }
      suggestions.translation.push(analysis.suggestions.kanji || '');
      break;

    case 'japanese_kana':
      // 假名输入：查词典
      if (analysis.suggestions.kana) {
        suggestions.dictionary.push(analysis.suggestions.kana);
      }
      break;

    case 'japanese_kanji':
      // 日语汉字：查词典
      if (analysis.suggestions.kanji) {
        suggestions.dictionary.push(analysis.suggestions.kanji);
      }
      break;

    case 'romaji':
      // 罗马音：查词典（转换后的假名）
      if (analysis.suggestions.kana) {
        suggestions.dictionary.push(analysis.suggestions.kana);
      }
      break;

    case 'english':
      // 英文：翻译
      suggestions.translation.push(analysis.suggestions.romaji || '');
      break;

    case 'mixed':
      // 混合：都尝试
      if (analysis.suggestions.kanji) {
        suggestions.dictionary.push(analysis.suggestions.kanji);
      }
      if (analysis.suggestions.kana) {
        suggestions.dictionary.push(analysis.suggestions.kana);
      }
      suggestions.translation.push(analysis.suggestions.kanji || '');
      break;
  }

  return suggestions;
}
