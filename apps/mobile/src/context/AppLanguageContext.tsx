import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectSystemLanguage } from '../utils/languageDetector';
import { AppLanguage, APP_LANGUAGES } from '../constants/translations';

interface AppLanguageContextType {
  appLanguage: AppLanguage;
  setAppLanguage: (language: AppLanguage) => void;
  getCurrentAppLanguageConfig: () => typeof APP_LANGUAGES[AppLanguage];
  isAppLanguageSupported: (languageCode: string) => boolean;
  systemLanguage: string;
}

const AppLanguageContext = createContext<AppLanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app_language';

export const AppLanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appLanguage, setAppLanguageState] = useState<AppLanguage>('zh-CN');
  const [systemLanguage, setSystemLanguage] = useState<string>('');

  // 加载保存的应用语言设置
  useEffect(() => {
    loadAppLanguageSettings();
  }, []);

  const loadAppLanguageSettings = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (savedLanguage && isAppLanguageSupported(savedLanguage)) {
        // 如果用户之前手动设置过语言，使用保存的设置
        console.log('📱 使用用户保存的语言设置:', savedLanguage);
        setAppLanguageState(savedLanguage as AppLanguage);
      } else {
        // 如果用户没有手动设置过，根据系统语言自动设置
        const detectedLanguage = detectSystemLanguage();
        console.log('🌍 根据系统语言自动设置:', detectedLanguage);
        setAppLanguageState(detectedLanguage);
        // 保存自动检测的语言设置
        await AsyncStorage.setItem(STORAGE_KEY, detectedLanguage);
      }
      
      // 记录系统语言信息
      const systemInfo = detectSystemLanguage();
      setSystemLanguage(systemInfo);
    } catch (error) {
      console.error('Failed to load app language settings:', error);
      // 出错时使用系统语言检测
      const detectedLanguage = detectSystemLanguage();
      setAppLanguageState(detectedLanguage);
      setSystemLanguage(detectedLanguage);
    }
  };

  const setAppLanguage = async (language: AppLanguage) => {
    try {
      console.log('🔄 用户手动设置语言:', language);
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
    systemLanguage,
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