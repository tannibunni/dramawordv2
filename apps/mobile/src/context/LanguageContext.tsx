import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode, APP_CONFIG } from '../constants/config';

interface LanguageProgress {
  totalWords: number;
  masteredWords: number;
  currentStreak: number;
  lastStudyDate: string;
  level: number;
}

interface LanguageContextType {
  selectedLanguage: SupportedLanguageCode;
  setSelectedLanguage: (language: SupportedLanguageCode) => void;
  languageProgress: Record<SupportedLanguageCode, LanguageProgress>;
  updateLanguageProgress: (language: SupportedLanguageCode, progress: Partial<LanguageProgress>) => void;
  getCurrentLanguageConfig: () => typeof SUPPORTED_LANGUAGES[SupportedLanguageCode];
  isLanguageSupported: (languageCode: string) => boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const initialProgress: LanguageProgress = {
  totalWords: 0,
  masteredWords: 0,
  currentStreak: 0,
  lastStudyDate: new Date().toISOString(),
  level: 1,
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedLanguage, setSelectedLanguageState] = useState<SupportedLanguageCode>(
    APP_CONFIG.DEFAULT_LANGUAGE
  );
  const [languageProgress, setLanguageProgress] = useState<Record<SupportedLanguageCode, LanguageProgress>>({
    ENGLISH: { ...initialProgress },
    KOREAN: { ...initialProgress },
    JAPANESE: { ...initialProgress },
  });

  // 加载保存的语言设置
  useEffect(() => {
    loadLanguageSettings();
  }, []);

  // 监听学习语言变化，重新加载语言设置
  useEffect(() => {
    const checkLearningLanguages = async () => {
      const learningLanguages = await AsyncStorage.getItem('learningLanguages');
      if (learningLanguages) {
        try {
          const languages = JSON.parse(learningLanguages);
          if (languages.length > 0) {
            // 检查当前选择的语言是否在学习语言列表中
            const currentLang = SUPPORTED_LANGUAGES[selectedLanguage];
            if (!languages.includes(currentLang.code)) {
              // 如果当前语言不在学习列表中，切换到第一个可用的语言
              const firstLanguageCode = languages[0];
              const languageKey = getLanguageKeyByCode(firstLanguageCode);
              if (languageKey && languageKey !== selectedLanguage) {
                console.log('🎯 LanguageContext - 检测到学习语言变化，切换到:', firstLanguageCode, languageKey);
                setSelectedLanguageState(languageKey);
                await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.SELECTED_LANGUAGE, languageKey);
              }
            }
          }
        } catch (error) {
          console.error('解析学习语言设置失败:', error);
        }
      }
    };

    // 延迟检查，确保学习语言设置完成后再检查
    const timer = setTimeout(checkLearningLanguages, 2000);
    return () => clearTimeout(timer);
  }, [selectedLanguage]);

  const loadLanguageSettings = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.SELECTED_LANGUAGE);
      const savedProgress = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.LANGUAGE_PROGRESS);
      
      // 检查用户的学习语言设置
      const learningLanguages = await AsyncStorage.getItem('learningLanguages');
      let defaultLanguage = APP_CONFIG.DEFAULT_LANGUAGE;
      
      if (learningLanguages) {
        try {
          const languages = JSON.parse(learningLanguages);
          if (languages.length > 0) {
            // 使用用户选择的第一个语言作为默认语言
            const firstLanguageCode = languages[0];
            const languageKey = getLanguageKeyByCode(firstLanguageCode);
            if (languageKey) {
              defaultLanguage = languageKey;
              console.log('🎯 使用用户选择的第一个语言作为默认语言:', firstLanguageCode, languageKey);
            }
          }
        } catch (error) {
          console.error('解析学习语言设置失败:', error);
        }
      }
      
      if (savedLanguage && isLanguageSupported(savedLanguage)) {
        console.log('🎯 LanguageContext - 使用保存的语言设置:', savedLanguage);
        setSelectedLanguageState(savedLanguage as SupportedLanguageCode);
      } else {
        // 如果没有保存的语言设置，使用用户选择的第一个语言
        console.log('🎯 LanguageContext - 没有保存的语言设置，使用默认语言:', defaultLanguage);
        setSelectedLanguageState(defaultLanguage);
        console.log('🎯 设置默认语言为:', defaultLanguage);
      }
      
      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        setLanguageProgress(prev => ({
          ...prev,
          ...parsedProgress,
        }));
      }
    } catch (error) {
      console.error('Failed to load language settings:', error);
    }
  };

  const setSelectedLanguage = async (language: SupportedLanguageCode) => {
    try {
      console.log('🎯 LanguageContext - setSelectedLanguage被调用:', language);
      setSelectedLanguageState(language);
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.SELECTED_LANGUAGE, language);
      console.log('🎯 LanguageContext - 语言设置已保存到AsyncStorage:', language);
    } catch (error) {
      console.error('Failed to save selected language:', error);
    }
  };

  const updateLanguageProgress = async (
    language: SupportedLanguageCode,
    progress: Partial<LanguageProgress>
  ) => {
    try {
      const updatedProgress = {
        ...languageProgress,
        [language]: {
          ...languageProgress[language],
          ...progress,
        },
      };
      
      setLanguageProgress(updatedProgress);
      await AsyncStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.LANGUAGE_PROGRESS,
        JSON.stringify(updatedProgress)
      );
    } catch (error) {
      console.error('Failed to update language progress:', error);
    }
  };

  const getCurrentLanguageConfig = () => {
    return SUPPORTED_LANGUAGES[selectedLanguage];
  };

  const isLanguageSupported = (languageCode: string): languageCode is SupportedLanguageCode => {
    return languageCode in SUPPORTED_LANGUAGES;
  };

  // 根据language.code找到对应的SupportedLanguageCode
  const getLanguageKeyByCode = (code: string): SupportedLanguageCode | null => {
    const entry = Object.entries(SUPPORTED_LANGUAGES).find(([key, lang]) => lang.code === code);
    return entry ? (entry[0] as SupportedLanguageCode) : null;
  };

  const value: LanguageContextType = {
    selectedLanguage,
    setSelectedLanguage,
    languageProgress,
    updateLanguageProgress,
    getCurrentLanguageConfig,
    isLanguageSupported,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 