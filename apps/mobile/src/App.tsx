import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainLayout from './components/navigation/MainLayout';
import { ShowListProvider } from './context/ShowListContext';
import { VocabularyProvider } from './context/VocabularyContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLanguageProvider } from './context/AppLanguageContext';
import { Audio } from 'expo-av';
import { InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av/build/Audio.types';
import { InitialLanguageModal } from './components/common/InitialLanguageModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 内部组件：移除自动通知初始化
const AppContent = () => {
  const [showInitialLanguageModal, setShowInitialLanguageModal] = useState(false);

  useEffect(() => {
    checkInitialLanguageSetup();
  }, []);

  const checkInitialLanguageSetup = async () => {
    try {
      const hasSetup = await AsyncStorage.getItem('initialLanguageSetup');
      if (!hasSetup) {
        setShowInitialLanguageModal(true);
      }
    } catch (error) {
      console.error('检查初始语言设置失败:', error);
      setShowInitialLanguageModal(true);
    }
  };

  const handleInitialLanguageComplete = () => {
    setShowInitialLanguageModal(false);
  };

  return (
    <AuthProvider>
      <LanguageProvider>
        <ShowListProvider>
          <VocabularyProvider>
            <MainLayout />
            <InitialLanguageModal
              visible={showInitialLanguageModal}
              onComplete={handleInitialLanguageComplete}
            />
          </VocabularyProvider>
        </ShowListProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default function App() {
  useEffect(() => {
    // 设置音频模式，确保 iOS 静音拨片下也能播放
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true, // 关键设置
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppLanguageProvider>
        <AppContent />
      </AppLanguageProvider>
    </GestureHandlerRootView>
  );
} 