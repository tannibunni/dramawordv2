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