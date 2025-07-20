import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage, APP_LANGUAGES } from '../constants/translations';

interface AppLanguageContextType {
  appLanguage: AppLanguage;
  setAppLanguage: (language: AppLanguage) => void;
  getCurrentAppLanguageConfig: () => typeof APP_LANGUAGES[AppLanguage];
  isAppLanguageSupported: (languageCode: string) => boolean;
}

const AppLanguageContext = createContext<AppLanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app_language';

export const AppLanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appLanguage, setAppLanguageState] = useState<AppLanguage>('zh-CN');

  // 加载保存的应用语言设置
  useEffect(() => {
    loadAppLanguageSettings();
  }, []);

  const loadAppLanguageSettings = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage && isAppLanguageSupported(savedLanguage)) {
        setAppLanguageState(savedLanguage as AppLanguage);
      }
    } catch (error) {
      console.error('Failed to load app language settings:', error);
    }
  };

  const setAppLanguage = async (language: AppLanguage) => {
    try {
      setAppLanguageState(language);
      await AsyncStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      console.error('Failed to save app language:', error);
    }
  };

  const getCurrentAppLanguageConfig = () => {
    return APP_LANGUAGES[appLanguage];
  };

  const isAppLanguageSupported = (languageCode: string): languageCode is AppLanguage => {
    return languageCode in APP_LANGUAGES;
  };

  const value: AppLanguageContextType = {
    appLanguage,
    setAppLanguage,
    getCurrentAppLanguageConfig,
    isAppLanguageSupported,
  };

  return (
    <AppLanguageContext.Provider value={value}>
      {children}
    </AppLanguageContext.Provider>
  );
};

export const useAppLanguage = (): AppLanguageContextType => {
  const context = useContext(AppLanguageContext);
  if (context === undefined) {
    throw new Error('useAppLanguage must be used within an AppLanguageProvider');
  }
  return context;
}; 