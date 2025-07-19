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

  const loadLanguageSettings = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.SELECTED_LANGUAGE);
      const savedProgress = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.LANGUAGE_PROGRESS);
      
      if (savedLanguage && isLanguageSupported(savedLanguage)) {
        setSelectedLanguageState(savedLanguage as SupportedLanguageCode);
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
      setSelectedLanguageState(language);
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.SELECTED_LANGUAGE, language);
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