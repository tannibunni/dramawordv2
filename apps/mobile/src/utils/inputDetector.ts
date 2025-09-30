// 输入类型检测工具
import * as wanakana from 'wanakana';

export type InputType = 'chinese' | 'japanese_kanji' | 'japanese_kana' | 'english' | 'english_sentence' | 'romaji' | 'pinyin' | 'mixed';

export interface InputAnalysis {
  type: InputType;
  confidence: number;
  suggestions: {
    kana?: string;
    kanji?: string;
    romaji?: string;
    pinyin?: string;
  };
}

/**
 * 检测输入类型和提供建议
 */
export function analyzeInput(input: string, targetLanguage?: string): InputAnalysis {
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

  // 语言环境隔离：根据目标语言应用不同的识别规则
  return analyzeByTargetLanguage(trimmed, {
    chineseChars,
    kanaChars,
    englishChars,
    otherChars,
    chineseRatio,
    kanaRatio,
    englishRatio,
    otherRatio
  }, targetLanguage);

}

/**
 * 根据目标语言分析输入类型（语言环境隔离）
 */
function analyzeByTargetLanguage(
  input: string, 
  stats: {
    chineseChars: number;
    kanaChars: number;
    englishChars: number;
    otherChars: number;
    chineseRatio: number;
    kanaRatio: number;
    englishRatio: number;
    otherRatio: number;
  },
  targetLanguage?: string
): InputAnalysis {
  const { chineseChars, kanaChars, englishChars, otherChars, chineseRatio, kanaRatio, englishRatio, otherRatio } = stats;

  // 日语环境 (JA) - 优先识别日语相关输入
  if (targetLanguage === 'ja') {
    return analyzeForJapaneseEnvironment(input, stats);
  }
  
  // 中文环境 (CN) - 优先识别中文相关输入
  if (targetLanguage === 'zh') {
    return analyzeForChineseEnvironment(input, stats);
  }
  
  // 其他语言环境 - 使用通用规则
  return analyzeForOtherLanguages(input, stats);
}

/**
 * 日语环境分析规则
 * 规则：罗马音 → 日语词，中英文 → 翻译成日语，日语词 → 日语词典查询
 */
function analyzeForJapaneseEnvironment(
  input: string,
  stats: {
    chineseChars: number;
    kanaChars: number;
    englishChars: number;
    otherChars: number;
    chineseRatio: number;
    kanaRatio: number;
    englishRatio: number;
    otherRatio: number;
  }
): InputAnalysis {
  const { chineseChars, kanaChars, englishChars, chineseRatio, kanaRatio, englishRatio, otherRatio } = stats;

  // 1. 日语假名 - 最高优先级
  if (kanaRatio > 0.7) {
    return {
      type: 'japanese_kana',
      confidence: kanaRatio,
      suggestions: {
        kana: input
      }
    };
  }

  // 2. 日语汉字 - 第二优先级
  if (chineseRatio > 0.7) {
    return {
      type: 'japanese_kanji',
      confidence: chineseRatio,
      suggestions: {
        kanji: input
      }
    };
  }

  // 3. 英文字符 - 可能是罗马音或英文
  if (englishRatio > 0.7 && otherRatio < 0.3) {
    const isEnglishSentenceInput = isEnglishSentence(input);
    
    if (isEnglishSentenceInput) {
      // 英文句子，翻译成日语
      return {
        type: 'english_sentence',
        confidence: 0.9,
        suggestions: {
          romaji: input
        }
      };
    } else {
      // 检查是否为罗马音
      const isRomaji = isLikelyRomaji(input);
      
      if (isRomaji) {
        // 罗马音，转换为日语
        try {
          const kana = wanakana.toHiragana(input);
          const kanji = wanakana.toKatakana(input);
          
          return {
            type: 'romaji',
            confidence: 0.8,
            suggestions: {
              kana,
              kanji,
              romaji: input
            }
          };
        } catch (error) {
          console.log(`❌ 罗马音转换失败: ${error}`);
          return {
            type: 'english',
            confidence: 0.6,
            suggestions: {
              romaji: input
            }
          };
        }
      } else {
        // 英文单词，翻译成日语
        return {
          type: 'english',
          confidence: 0.8,
          suggestions: {
            romaji: input
          }
        };
      }
    }
  }

  // 4. 混合类型 - 中英混合，翻译成日语
  if (chineseChars > 0 && englishChars > 0) {
    return {
      type: 'mixed',
      confidence: 0.5,
      suggestions: {
        kanji: input,
        romaji: input
      }
    };
  }

  // 5. 默认 - 翻译成日语
  return {
    type: 'english',
    confidence: 0.5,
    suggestions: {
      romaji: input
    }
  };
}

/**
 * 中文环境分析规则
 * 规则：拼音 → 中文词，中文词语和句子 → 中文分析，英文 → 翻译成中文
 */
function analyzeForChineseEnvironment(
  input: string,
  stats: {
    chineseChars: number;
    kanaChars: number;
    englishChars: number;
    otherChars: number;
    chineseRatio: number;
    kanaRatio: number;
    englishRatio: number;
    otherRatio: number;
  }
): InputAnalysis {
  const { chineseChars, kanaChars, englishChars, chineseRatio, kanaRatio, englishRatio, otherRatio } = stats;

  // 1. 中文字符 - 最高优先级
  if (chineseRatio > 0.7) {
    return {
      type: 'chinese',
      confidence: chineseRatio,
      suggestions: {
        kanji: input
      }
    };
  }

  // 2. 英文字符 - 可能是拼音或英文
  if (englishRatio > 0.7 && otherRatio < 0.3) {
    // 在中文环境中，优先检查拼音
    const isPinyin = isLikelyPinyin(input);
    
    if (isPinyin) {
      // 拼音，转换为中文
      return {
        type: 'pinyin',
        confidence: 0.8,
        suggestions: {
          pinyin: input
        }
      };
    } else {
      // 检查是否为英文句子
      const isEnglishSentenceInput = isEnglishSentence(input);
      
      if (isEnglishSentenceInput) {
        // 英文句子，翻译成中文
        return {
          type: 'english_sentence',
          confidence: 0.9,
          suggestions: {
            pinyin: input
          }
        };
      } else {
        // 英文单词，翻译成中文
        return {
          type: 'english',
          confidence: 0.8,
          suggestions: {
            pinyin: input
          }
        };
      }
    }
  }

  // 3. 混合类型 - 中英混合，中文分析
  if (chineseChars > 0 && englishChars > 0) {
    return {
      type: 'mixed',
      confidence: 0.5,
      suggestions: {
        kanji: input,
        pinyin: input
      }
    };
  }

  // 4. 默认 - 翻译成中文
  return {
    type: 'english',
    confidence: 0.5,
    suggestions: {
      pinyin: input
    }
  };
}

/**
 * 其他语言环境分析规则（通用规则）
 */
function analyzeForOtherLanguages(
  input: string,
  stats: {
    chineseChars: number;
    kanaChars: number;
    englishChars: number;
    otherChars: number;
    chineseRatio: number;
    kanaRatio: number;
    englishRatio: number;
    otherRatio: number;
  }
): InputAnalysis {
  const { chineseChars, kanaChars, englishChars, chineseRatio, kanaRatio, englishRatio, otherRatio } = stats;

  // 1. 中文字符
  if (chineseRatio > 0.7) {
    return {
      type: 'chinese',
      confidence: chineseRatio,
      suggestions: {
        kanji: input
      }
    };
  }

  // 2. 假名字符
  if (kanaRatio > 0.7) {
    return {
      type: 'japanese_kana',
      confidence: kanaRatio,
      suggestions: {
        kana: input
      }
    };
  }

  // 3. 英文字符
  if (englishRatio > 0.7 && otherRatio < 0.3) {
    const isEnglishSentenceInput = isEnglishSentence(input);
    
    if (isEnglishSentenceInput) {
      return {
        type: 'english_sentence',
        confidence: 0.9,
        suggestions: {
          romaji: input
        }
      };
    } else {
      return {
        type: 'english',
        confidence: 0.8,
        suggestions: {
          romaji: input
        }
      };
    }
  }

  // 4. 混合类型
  if (chineseChars > 0 && kanaChars > 0) {
    return {
      type: 'mixed',
      confidence: 0.5,
      suggestions: {
        kanji: input,
        kana: input
      }
    };
  }

  // 5. 默认
  return {
    type: 'english',
    confidence: 0.5,
    suggestions: {
      romaji: input
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
    'with ', 'by ', 'from ', 'up ', 'down ', 'out ', 'off ', 'over ', 'under ', 'through ',
    'hello ', 'world ', 'good ', 'bad ', 'nice ', 'beautiful ', 'wonderful ', 'amazing '
  ];
  
  const lowerInput = input.toLowerCase();
  return englishSentenceIndicators.some(indicator => lowerInput.includes(indicator));
}

/**
 * 判断字符串是否可能是拼音
 */
function isLikelyPinyin(input: string): boolean {
  // 拼音特征：
  // 1. 只包含小写字母和空格
  // 2. 不包含大写字母
  // 3. 长度适中（2-50字符）
  // 4. 不包含明显的英文单词模式
  
  if (!/^[a-z\s]+$/.test(input)) {
    return false;
  }
  
  if (input.length < 2 || input.length > 50) {
    return false;
  }
  
  // 检查是否包含明显的英文单词模式
  const commonEnglishWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
    'rice', 'food', 'water', 'house', 'car', 'book', 'time', 'day', 'night', 'year',
    'hello', 'world', 'good', 'bad', 'nice', 'beautiful', 'wonderful', 'amazing',
    'thank', 'please', 'sorry', 'yes', 'no', 'ok', 'okay', 'fine', 'great', 'cool',
    'tomorrow', 'today', 'yesterday', 'morning', 'afternoon', 'evening', 'monday',
    'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january',
    'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september',
    'october', 'november', 'december', 'spring', 'summer', 'autumn', 'winter',
    'family', 'friend', 'mother', 'father', 'sister', 'brother', 'child', 'children',
    'school', 'work', 'home', 'office', 'hospital', 'restaurant', 'hotel', 'airport',
    'money', 'dollar', 'euro', 'pound', 'computer', 'phone', 'internet', 'email',
    'music', 'movie', 'film', 'television', 'radio', 'newspaper', 'magazine',
    'sport', 'football', 'basketball', 'tennis', 'swimming', 'running', 'cycling',
    'travel', 'trip', 'vacation', 'holiday', 'passport', 'visa', 'ticket', 'flight',
    'coffee', 'tea', 'milk', 'bread', 'meat', 'fish', 'chicken', 'beef', 'apple',
    'banana', 'orange', 'grape', 'strawberry', 'watermelon', 'pineapple', 'red',
    'blue', 'green', 'yellow', 'black', 'white', 'brown', 'purple', 'pink', 'big',
    'small', 'large', 'little', 'tall', 'short', 'long', 'wide', 'narrow', 'fast',
    'slow', 'quick', 'easy', 'difficult', 'hard', 'soft', 'heavy', 'light', 'happy',
    'sad', 'angry', 'excited', 'tired', 'sleepy', 'hungry', 'thirsty', 'love',
    'like', 'hate', 'want', 'need', 'hope', 'wish', 'dream', 'think', 'know',
    'see', 'hear', 'smell', 'taste', 'touch', 'feel', 'look', 'watch', 'listen',
    'walk', 'run', 'jump', 'sit', 'stand', 'sleep', 'wake', 'eat', 'drink', 'cook',
    'read', 'write', 'speak', 'talk', 'say', 'tell', 'ask', 'answer', 'question',
    'learn', 'study', 'teach', 'understand', 'remember', 'forget', 'practice',
    'play', 'game', 'fun', 'enjoy', 'relax', 'rest', 'business', 'problem',
    'solution', 'help', 'support', 'care', 'worry', 'fear', 'danger', 'safe',
    'dangerous', 'important', 'necessary', 'possible', 'impossible', 'real',
    'true', 'false', 'right', 'wrong', 'correct', 'incorrect', 'same', 'different',
    'new', 'old', 'young', 'fresh', 'clean', 'dirty', 'hot', 'cold', 'warm'
  ];
  
  const inputWords = input.toLowerCase().split(/\s+/);
  for (const word of inputWords) {
    if (commonEnglishWords.includes(word)) {
      return false;
    }
  }
  
  // 检查是否包含拼音特征
  const pinyinPatterns = [
    /^[a-z]+[aeiou][a-z]*$/, // 单音节拼音
    /^[a-z]+[aeiou][a-z]*\s+[a-z]+[aeiou][a-z]*$/, // 双音节拼音
    /^[a-z]+[aeiou][a-z]*\s+[a-z]+[aeiou][a-z]*\s+[a-z]+[aeiou][a-z]*$/, // 三音节拼音
  ];
  
  // 检查是否匹配拼音模式
  const matchesPinyinPattern = pinyinPatterns.some(pattern => pattern.test(input));
  
  // 额外的拼音特征检查：包含常见的拼音声母和韵母组合
  const pinyinConsonants = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'z', 'c', 's', 'zh', 'ch', 'sh', 'r', 'y', 'w'];
  const pinyinVowels = ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe', 'er', 'an', 'en', 'in', 'un', 'ün', 'ang', 'eng', 'ing', 'ong'];
  
  let hasPinyinFeatures = false;
  
  for (const word of inputWords) {
    // 检查是否包含拼音声母
    const hasConsonant = pinyinConsonants.some(consonant => word.startsWith(consonant));
    // 检查是否包含拼音韵母
    const hasVowel = pinyinVowels.some(vowel => word.includes(vowel));
    
    if (hasConsonant || hasVowel) {
      hasPinyinFeatures = true;
      break;
    }
  }
  
  return matchesPinyinPattern || hasPinyinFeatures;
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
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
    'rice', 'food', 'water', 'house', 'car', 'book', 'time', 'day', 'night', 'year',
    'hello', 'world', 'good', 'bad', 'nice', 'beautiful', 'wonderful', 'amazing',
    'thank', 'please', 'sorry', 'yes', 'no', 'ok', 'okay', 'fine', 'great', 'cool'
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
export function getQuerySuggestions(analysis: InputAnalysis, targetLanguage?: string): {
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
      // 英文：根据目标语言决定处理方式
      if (targetLanguage === 'zh') {
        // 目标语言是中文时，优先翻译
        suggestions.translation.push(analysis.suggestions.romaji || '');
      } else {
        // 其他语言时，也优先翻译
        suggestions.translation.push(analysis.suggestions.romaji || '');
      }
      break;

    case 'english_sentence':
      // 英文句子：直接翻译
      suggestions.translation.push(analysis.suggestions.romaji || '');
      break;

    case 'pinyin':
      // 拼音：直接翻译
      suggestions.translation.push(analysis.suggestions.pinyin || '');
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
