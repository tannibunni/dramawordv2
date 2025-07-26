import * as Localization from 'expo-localization';
import { AppLanguage } from '../constants/translations';

/**
 * 检测系统语言并返回对应的应用语言
 * @returns 应用语言代码
 */
export const detectSystemLanguage = (): AppLanguage => {
  try {
    const systemLocale = Localization.getLocales()[0]?.languageCode || 'en';
    console.log('🌍 系统语言检测:', systemLocale);
    
    // 如果是中文系统，返回中文
    if (systemLocale === 'zh') {
      console.log('✅ 检测到中文系统，设置界面为中文');
      return 'zh-CN';
    }
    
    // 其他语言统一返回英文
    console.log('✅ 检测到非中文系统，设置界面为英文');
    return 'en-US';
  } catch (error) {
    console.error('❌ 系统语言检测失败:', error);
    // 默认返回中文
    return 'zh-CN';
  }
};

/**
 * 检查是否为中文系统
 * @returns 是否为中文系统
 */
export const isChineseSystem = (): boolean => {
  try {
    const systemLocale = Localization.getLocales()[0]?.languageCode || 'en';
    return systemLocale === 'zh';
  } catch (error) {
    console.error('❌ 检查中文系统失败:', error);
    return true; // 默认返回true
  }
}; 

// 简单的语言检测规则
const LANGUAGE_PATTERNS = {
  // 中文
  zh: {
    pattern: /[\u4e00-\u9fff]/,
    name: '中文',
    flag: '🇨🇳'
  },
  // 日文
  ja: {
    pattern: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/,
    name: '日文',
    flag: '🇯🇵'
  },
  // 韩文
  ko: {
    pattern: /[\uac00-\ud7af]/,
    name: '韩文',
    flag: '🇰🇷'
  },
  // 英文 - 修复：只要包含英文字母就认为是英文
  en: {
    pattern: /[a-zA-Z]/,
    name: '英文',
    flag: '🇺🇸'
  },
  // 法文
  fr: {
    pattern: /[àâäéèêëïîôöùûüÿç]/,
    name: '法文',
    flag: '🇫🇷'
  },
  // 西班牙文
  es: {
    pattern: /[ñáéíóúü]/,
    name: '西班牙文',
    flag: '🇪🇸'
  }
};

export interface DetectedLanguage {
  code: string;
  name: string;
  flag: string;
  confidence: number;
}

/**
 * 检测文本语言
 * @param text 要检测的文本
 * @returns 检测到的语言信息
 */
export const detectLanguage = (text: string): DetectedLanguage | null => {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const cleanText = text.trim();
  const results: Array<{ code: string; name: string; flag: string; confidence: number }> = [];

  // 检查每种语言模式
  Object.entries(LANGUAGE_PATTERNS).forEach(([code, lang]) => {
    const matches = cleanText.match(lang.pattern);
    if (matches) {
      // 计算置信度：匹配字符数 / 总字符数
      const confidence = matches.length / cleanText.length;
      results.push({
        code,
        name: lang.name,
        flag: lang.flag,
        confidence
      });
    }
  });

  // 按置信度排序，返回最高置信度的语言
  if (results.length > 0) {
    results.sort((a, b) => b.confidence - a.confidence);
    return results[0];
  }

  // 如果没有匹配到特定模式，默认为英文
  return {
    code: 'en',
    name: '英文',
    flag: '🇺🇸',
    confidence: 0.5
  };
};

/**
 * 检查是否需要显示语言切换提醒
 * @param inputText 用户输入的文本
 * @param currentLanguage 当前选择的语言
 * @returns 是否需要提醒
 */
export const shouldShowLanguageReminder = (
  inputText: string,
  currentLanguage: string
): { shouldShow: boolean; detectedLanguage?: DetectedLanguage } => {
  const detected = detectLanguage(inputText);
  
  if (!detected) {
    return { shouldShow: false };
  }

  // 将当前语言代码转换为标准格式进行比较
  // currentLanguage 可能是 'KOREAN', 'JAPANESE' 等，需要转换为 'ko', 'ja' 等
  let currentLanguageCode = currentLanguage;
  
  // 如果 currentLanguage 是 SupportedLanguageCode 格式，转换为标准代码
  if (currentLanguage === 'KOREAN') currentLanguageCode = 'ko';
  else if (currentLanguage === 'JAPANESE') currentLanguageCode = 'ja';
  else if (currentLanguage === 'ENGLISH') currentLanguageCode = 'en';
  else if (currentLanguage === 'CHINESE') currentLanguageCode = 'zh';
  else if (currentLanguage === 'FRENCH') currentLanguageCode = 'fr';
  else if (currentLanguage === 'SPANISH') currentLanguageCode = 'es';

  console.log('🔍 语言检测调试:', {
    inputText,
    currentLanguage,
    currentLanguageCode,
    detectedCode: detected.code,
    detectedConfidence: detected.confidence,
    shouldShow: detected.code !== currentLanguageCode && detected.confidence > 0.3
  });

  // 如果检测到的语言与当前语言不同，且置信度较高
  if (detected.code !== currentLanguageCode && detected.confidence > 0.3) {
    return {
      shouldShow: true,
      detectedLanguage: detected
    };
  }

  return { shouldShow: false };
};

/**
 * 生成语言切换提醒消息
 * @param inputText 用户输入的文本
 * @param detectedLanguage 检测到的语言
 * @param currentLanguage 当前语言
 * @param appLanguage 应用界面语言
 * @returns 提醒消息
 */
export const generateLanguageReminderMessage = (
  inputText: string,
  detectedLanguage: DetectedLanguage,
  currentLanguage: string,
  appLanguage: string
): { title: string; message: string } => {
  // 将当前语言代码转换为标准格式来获取语言信息
  let currentLanguageCode = currentLanguage;
  
  // 如果 currentLanguage 是 SupportedLanguageCode 格式，转换为标准代码
  if (currentLanguage === 'KOREAN') currentLanguageCode = 'ko';
  else if (currentLanguage === 'JAPANESE') currentLanguageCode = 'ja';
  else if (currentLanguage === 'ENGLISH') currentLanguageCode = 'en';
  else if (currentLanguage === 'CHINESE') currentLanguageCode = 'zh';
  else if (currentLanguage === 'FRENCH') currentLanguageCode = 'fr';
  else if (currentLanguage === 'SPANISH') currentLanguageCode = 'es';
  
  const currentLangInfo = LANGUAGE_PATTERNS[currentLanguageCode as keyof typeof LANGUAGE_PATTERNS];
  
  if (appLanguage === 'zh-CN') {
    return {
      title: '检测到语言不匹配',
      message: `你当前在查${currentLangInfo?.name || '当前语言'}词，但输入的是${detectedLanguage.name}词「${inputText}」，是否切换到 ${detectedLanguage.flag} ${detectedLanguage.name}环境？`
    };
  } else {
    return {
      title: 'Language Mismatch Detected',
      message: `You are currently searching for ${currentLangInfo?.name || 'current language'} words, but you entered a ${detectedLanguage.name} word "${inputText}". Would you like to switch to ${detectedLanguage.flag} ${detectedLanguage.name} environment?`
    };
  }
}; 