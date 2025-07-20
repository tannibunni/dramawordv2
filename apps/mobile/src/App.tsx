import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainLayout from './components/navigation/MainLayout';
import { ShowListProvider } from './context/ShowListContext';
import { VocabularyProvider } from './context/VocabularyContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLanguageProvider } from './context/AppLanguageContext';
import { Audio } from 'expo-av';
import { InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av/build/Audio.types';

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
        <AuthProvider>
          <LanguageProvider>
            <ShowListProvider>
              <VocabularyProvider>
                <MainLayout />
              </VocabularyProvider>
            </ShowListProvider>
          </LanguageProvider>
        </AuthProvider>
      </AppLanguageProvider>
    </GestureHandlerRootView>
  );
} 