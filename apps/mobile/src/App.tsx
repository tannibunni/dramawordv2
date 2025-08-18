import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainLayout from './components/navigation/MainLayout';
import { ShowListProvider } from './context/ShowListContext';
import { VocabularyProvider } from './context/VocabularyContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLanguageProvider } from './context/AppLanguageContext';
import { NavigationProvider } from './components/navigation/NavigationContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { Audio } from 'expo-av';
import { InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av/build/Audio.types';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { unifiedSyncService } from './services/unifiedSyncService';

import { guestModeService } from './services/guestModeService';
import { tokenValidationService } from './services/tokenValidationService';
import { guestIdService } from './services/guestIdService';
import { subscriptionService } from './services/subscriptionService';

// 内部组件：移除自动通知初始化
const AppContent = () => {

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 应用初始化开始...');
      
      // 1. 检查初始语言设置
      await checkInitialLanguageSetup();
      
      // 2. 清理可能的共享数据
      await clearSharedDataOnStartup();
      
      // 3. 自动生成游客ID
      await autoGenerateGuestId();
      
      // 4. 初始化统一同步服务
      await initializeUnifiedSync();
      
      // 5. 初始化订阅服务
      await initializeSubscriptionService();
      
      console.log('✅ 应用初始化完成');
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
    }
  };

  const initializeUnifiedSync = async () => {
    try {
      console.log('🔄 初始化统一同步服务...');
      
      // 迁移旧同步数据
      await unifiedSyncService.migrateOldSyncData();
      
      // 配置同步服务
      unifiedSyncService.updateConfig({
        wifiSyncInterval: 2 * 60 * 1000, // 2分钟
        mobileSyncInterval: 5 * 60 * 1000, // 5分钟
        enableRealTimeSync: true,
        enableOfflineFirst: true
      });
      
      console.log('✅ 统一同步服务初始化完成');
    } catch (error) {
      console.error('❌ 统一同步服务初始化失败:', error);
    }
  };

  const initializeSubscriptionService = async () => {
    try {
      console.log('💎 初始化订阅服务...');
      
      await subscriptionService.initialize();
      
      console.log('✅ 订阅服务初始化完成');
    } catch (error) {
      console.error('❌ 订阅服务初始化失败:', error);
    }
  };



  const checkInitialLanguageSetup = async () => {
    try {
      const hasSetup = await AsyncStorage.getItem('initialLanguageSetup');
      // 移除自动显示语言选择窗口的逻辑，改为在登录成功后检查
      console.log('🔍 检查初始语言设置状态:', hasSetup ? '已设置' : '未设置');
    } catch (error) {
      console.error('检查初始语言设置失败:', error);
    }
  };

  const clearSharedDataOnStartup = async () => {
    try {
      console.log('🚀 应用启动时清理共享数据...');
      
      // 检查是否有用户数据
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        // 如果没有用户数据，清理可能存在的共享数据
        const keysToRemove = [
          'searchHistory',
          'vocabulary',
          'learningRecords',
          'userStats',
          'badges'
        ];
        
        await AsyncStorage.multiRemove(keysToRemove);
        console.log('✅ 启动时共享数据清理完成');
      }
    } catch (error) {
      console.error('❌ 启动时清理共享数据失败:', error);
    }
  };

    // 自动生成游客用户ID
  const autoGenerateGuestId = async () => {
    try {
      console.log('🔍 检查是否需要自动生成游客ID...');
      
      // 检查是否已有用户数据
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        console.log('✅ 用户数据已存在，跳过自动生成');
        return;
      }

      console.log('🚀 开始自动生成游客ID...');
      
      // 使用统一的游客ID服务
      const guestId = await guestIdService.getGuestId();
      console.log('✅ 游客ID生成成功:', guestId);
      
      // 初始化游客模式服务
      await guestModeService.isGuestMode();
    } catch (error) {
      console.error('❌ 自动生成游客ID失败:', error);
    }
  };

  const setupReauthCallback = () => {
    // 设置导航回调，当token失效时直接导航到登录页面
    tokenValidationService.setNavigationCallback((screen) => {
      console.log(`🔄 导航到页面: ${screen}`);
      // 这里可以通过全局状态管理来实现导航
      // 暂时使用Alert提示用户
      if (screen === 'login') {
        Alert.alert(
          '登录已过期',
          '您的登录已过期，请重新登录',
          [
            {
              text: '重新登录',
              onPress: () => {
                console.log('用户确认重新登录');
                // 可以通过全局状态管理或事件系统来实现导航到登录页面
              }
            }
          ]
        );
      }
    });
  };



  return (
    <AuthProvider>
      <LanguageProvider>
        <ShowListProvider>
          <VocabularyProvider>
            <NavigationProvider>
              <AuthGuard>
                <MainLayout />
              </AuthGuard>

            </NavigationProvider>
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