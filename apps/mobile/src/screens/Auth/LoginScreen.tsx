import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import * as Device from 'expo-device';
import { Ionicons } from '@expo/vector-icons';
import { LoginButton } from '../../components/auth/LoginButton';
import { PhoneLoginModal } from '../../components/auth/PhoneLoginModal';

import { WechatService } from '../../services/wechatService';
import { AppleService } from '../../services/appleService';
import * as AppleAuthentication from 'expo-apple-authentication';
import { colors } from '../../constants/colors';
import { t } from '../../constants/translations';
import { useAppLanguage } from '../../context/AppLanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { unifiedSyncService } from '../../services/unifiedSyncService';
import { API_BASE_URL } from '../../constants/config';

interface LoginScreenProps {
  onLoginSuccess: (userData: any) => void;
  onGuestLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGuestLogin,
}) => {
  const { appLanguage } = useAppLanguage();
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  // 下载用户云端数据
  const downloadUserData = async (userId: string, loginType?: string) => {
    try {
      // 游客登录跳过数据下载
      if (loginType === 'guest') {
        console.log('👤 游客登录，跳过云端数据下载');
        return;
      }
      
      console.log('📥 开始下载用户云端数据...');
      
      // 获取认证token
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        console.warn('⚠️ 未找到用户数据，跳过数据下载');
        return;
      }
      
      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token;
      
      if (!token) {
        console.warn('⚠️ 未找到认证token，跳过数据下载');
        return;
      }
      
      // 调用强制同步接口（上传+下载）
      const response = await fetch(`${API_BASE_URL}/users/sync/force`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          // 发送空的同步数据，只触发下载
          learningRecords: [],
          searchHistory: [],
          userSettings: {}
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ 用户云端数据下载成功');
          
          // 将下载的数据保存到本地存储
          if (result.data && result.data.download) {
            const downloadData = result.data.download;
            
            // 保存学习记录
            if (downloadData.learningRecords) {
              await AsyncStorage.setItem('learningRecords', JSON.stringify(downloadData.learningRecords));
            }
            
            // 保存搜索历史
            if (downloadData.searchHistory) {
              await AsyncStorage.setItem('searchHistory', JSON.stringify(downloadData.searchHistory));
            }
            
            // 保存用户设置
            if (downloadData.userSettings) {
              await AsyncStorage.setItem('userSettings', JSON.stringify(downloadData.userSettings));
            }
            
            // 保存剧单数据
            if (downloadData.shows) {
              await AsyncStorage.setItem('user_shows', JSON.stringify(downloadData.shows));
            }
          }
        } else {
          console.warn('⚠️ 数据下载返回失败:', result.message);
        }
      } else {
        console.warn('⚠️ 数据下载请求失败:', response.status);
      }
    } catch (error) {
      console.error('❌ 下载用户数据失败:', error);
      // 不抛出错误，避免影响登录流程
    }
  };

  // 清理所有共享数据的函数
  const clearAllSharedData = async () => {
    try {
      console.log('🧹 清理所有共享数据...');
      
      // 清理所有可能的AsyncStorage键
      const keysToRemove = [
        'userData',
        'searchHistory',
        'vocabulary',
        'learningRecords',
        'userStats',
        'badges',
        'last_sync_time',
        'user_stats_cache',
        'user_vocabulary_cache',
        'badges_cache',
        'selectedLanguage',
        // 'learningLanguages', // 不移除学习语言设置，保持用户选择
        'appLanguage',
        'initialLanguageSetup'
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ 共享数据清理完成');
    } catch (error) {
      console.error('❌ 清理共享数据失败:', error);
    }
  };

  // 测试登录功能 - 从 ProfileScreen 同步过来
  const testLogin = async (loginType: 'wechat' | 'apple' | 'phone' | 'guest') => {
    try {
      setLoading(true);
      
      // 生成唯一的测试ID - 增强唯一性
      const now = Date.now().toString();
      const random = Math.random().toString(36).substr(2, 4); // 4位随机字符
      const deviceId = Device.deviceName || Device.modelName || 'unknown';
      const deviceHash = deviceId.split('').reduce((a, b) => a + b.charCodeAt(0), 0).toString(36).slice(-3);
      const shortId = now.slice(-6) + random + deviceHash; // 6位时间戳 + 4位随机字符 + 3位设备哈希
      const username = `t_${loginType}_${shortId}`.slice(0, 20);
      const nickname = loginType === 'guest' ? shortId : `${loginType === 'wechat' ? '微信' : loginType === 'apple' ? 'Apple' : loginType === 'phone' ? '手机' : '游客'}用户`;
      
      // 准备注册数据
      const registerData: any = {
        loginType,
        username,
        nickname,
      };
      
      // 根据登录类型添加对应字段
      switch (loginType) {
        case 'phone':
          registerData.phoneNumber = '13800138000';
          break;
        case 'wechat':
          registerData.wechatId = shortId;
          break;
        case 'apple':
          registerData.appleId = shortId;
          break;
        case 'guest':
          registerData.guestId = shortId;
          break;
      }
      
      console.log('🔐 开始注册用户:', registerData);
      
      // 调用后端注册API
      const response = await fetch('https://dramawordv2.onrender.com/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 注册失败:', response.status, errorText);
        throw new Error(`注册失败: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ 注册成功:', result);
      
      // 新增：打印 token 并校验
      console.log('注册/登录返回的 token:', result.data && result.data.token);
      if (!result.data || !result.data.token || typeof result.data.token !== 'string' || result.data.token.length < 10) {
        Alert.alert('注册失败', '未获取到有效的登录凭证（token），请重试或联系管理员。');
        setLoading(false);
        return;
      }
      
      if (result.success && result.data) {
        // 保存用户信息到本地存储
        const userData = {
          id: result.data.user.id,
          nickname: result.data.user.nickname,
          avatar: result.data.user.avatar,
          loginType: loginType,
          token: result.data.token,
        };
        
        // 清除旧缓存，确保新用户看到正确的数据
        await unifiedSyncService.clearSyncQueue();
        
        // 额外清理：清除所有可能的共享数据
        await clearAllSharedData();
        
        // 新增：下载新用户的云端数据
        await downloadUserData(userData.id, loginType);
        
        // 游客登录直接进入主应用，跳过欢迎页面
        onLoginSuccess(userData);
      } else {
        throw new Error(result.message || '注册失败');
      }
    } catch (error) {
      console.error('❌ 测试登录失败:', error);
      Alert.alert('登录失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = () => {
    setPhoneModalVisible(true);
  };

  const handleWechatLogin = async () => {
    try {
      setLoading(true);
      
      console.log('💬 ===== 微信登录流程开始 =====');
      console.log('💬 时间戳:', new Date().toISOString());
      console.log('💬 平台:', Platform.OS);
      console.log('💬 设备信息:', {
        deviceName: Device.deviceName,
        modelName: Device.modelName,
        osVersion: Device.osVersion
      });
      
      // 检查网络连接状态
      console.log('💬 检查网络连接...');
      
      // 调用真正的微信登录流程
      console.log('💬 调用 WechatService.performLogin()...');
      const { WechatService } = require('../../services/wechatService');
      
      const startTime = Date.now();
      const result = await WechatService.performLogin();
      const endTime = Date.now();
      
      console.log('💬 微信登录API调用完成');
      console.log('💬 API调用耗时:', endTime - startTime, 'ms');
      console.log('💬 返回结果:', {
        success: result.success,
        hasData: !!result.data,
        hasUser: !!result.data?.user,
        hasToken: !!result.data?.token,
        message: result.message
      });
      
      if (result.success && result.data) {
        console.log('💬 微信登录成功，处理用户数据...');
        
        // 保存用户信息到本地存储
        const userData = {
          id: result.data.user.id,
          nickname: result.data.user.nickname,
          avatar: result.data.user.avatar,
          loginType: 'wechat',
          token: result.data.token,
        };
        
        console.log('💬 用户数据:', {
          id: userData.id,
          nickname: userData.nickname,
          hasAvatar: !!userData.avatar,
          loginType: userData.loginType,
          hasToken: !!userData.token
        });
        
        // 清除旧缓存，确保新用户看到正确的数据
        console.log('💬 清除旧缓存...');
        await unifiedSyncService.clearSyncQueue();
        
        // 额外清理：清除所有可能的共享数据
        console.log('💬 清除共享数据...');
        await clearAllSharedData();
        
        // 新增：下载新用户的云端数据
        await downloadUserData(userData.id, 'wechat');
        
        console.log('💬 调用 onLoginSuccess...');
        onLoginSuccess(userData);
        
        console.log('💬 ===== 微信登录流程完成 =====');
      } else {
        console.error('💬 微信登录返回失败结果:', result);
        throw new Error(result.message || '微信登录失败');
      }
    } catch (error: any) {
      console.error('💬 ===== 微信登录流程失败 =====');
      console.error('💬 错误类型:', error.constructor.name);
      console.error('💬 错误消息:', error.message);
      console.error('💬 错误堆栈:', error.stack);
      console.error('💬 错误详情:', {
        name: error.name,
        code: error.code,
        cause: error.cause
      });
      
      // 根据错误类型显示不同的提示
      if (error.message.includes('EXPO GO中不可用')) {
        console.log('💬 显示EXPO GO不可用提示');
        Alert.alert(
          '微信登录不可用', 
          '微信登录在EXPO GO中不可用。\n\n请使用以下方式测试：\n• expo run:ios\n• expo run:android\n\n或使用其他登录方式。',
          [
            { text: '知道了', style: 'default' },
            { text: '使用游客登录', onPress: handleGuestLogin }
          ]
        );
      } else if (error.message.includes('请先安装微信应用')) {
        console.log('💬 显示"请先安装微信应用"提示');
        Alert.alert('提示', '请先安装微信应用');
      } else if (error.message.includes('微信SDK注册失败') || error.message.includes('SDK初始化失败')) {
        console.log('💬 显示"微信SDK初始化失败"提示');
        Alert.alert('登录失败', '微信SDK初始化失败，请重试');
      } else {
        console.log('💬 显示通用错误提示');
        Alert.alert('登录失败', error instanceof Error ? error.message : '微信登录失败，请重试');
      }
    } finally {
      console.log('💬 设置 loading 状态为 false');
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      
      // 检查苹果登录是否可用
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('提示', '您的设备不支持苹果登录');
        return;
      }

      console.log('🍎 开始苹果登录流程...');
      
      // 执行苹果登录
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        // 注意：Apple 不直接提供头像，需要用户手动上传
      });

      console.log('🍎 苹果登录成功，获取到凭证:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        hasIdentityToken: !!credential.identityToken
      });

      if (!credential.identityToken) {
        throw new Error('未获取到身份令牌');
      }

      // 调用后端登录API，传递完整的用户信息
      const loginData = {
        idToken: credential.identityToken,
        email: credential.email || undefined,
        fullName: credential.fullName ? {
          givenName: credential.fullName.givenName || undefined,
          familyName: credential.fullName.familyName || undefined,
        } : undefined,
      };
      const result = await AppleService.login(loginData);
      
      console.log('🍎 Apple登录API响应:', result);
      
      if (result.success && result.data) {
        console.log('🍎 Apple登录成功，获取到token:', result.data.token ? '有token' : '无token');
        
        // 保存用户信息到本地存储
        const userData = {
          id: result.data.user.id,
          nickname: result.data.user.nickname,
          email: result.data.user.email,
          avatar: result.data.user.avatar,
          loginType: 'apple',
          token: result.data.token,
        };
        
        console.log('🍎 准备保存的用户数据:', {
          id: userData.id,
          nickname: userData.nickname,
          loginType: userData.loginType,
          hasToken: !!userData.token
        });
        
        // 清除旧缓存，确保新用户看到正确的数据
        await unifiedSyncService.clearSyncQueue();
        
        // 额外清理：清除所有可能的共享数据
        await clearAllSharedData();
        
        // 新增：下载新用户的云端数据
        await downloadUserData(userData.id, 'apple');
        
        onLoginSuccess(userData);
      } else {
        throw new Error(result.message || '苹果登录失败');
      }
    } catch (error: any) {
      console.error('❌ 苹果登录失败:', error);
      
      if (error.code === 'ERR_CANCELED') {
        console.log('用户取消了苹果登录');
        return;
      }
      
      Alert.alert('登录失败', error instanceof Error ? error.message : '苹果登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    // 检查是否已有自动生成的游客ID
    const existingUserData = await AsyncStorage.getItem('userData');
    if (existingUserData) {
      try {
        const parsedData = JSON.parse(existingUserData);
        if (parsedData.isAutoGenerated && parsedData.loginType === 'guest') {
          console.log('🔍 发现自动生成的游客ID，直接使用:', parsedData.id);
          // 使用现有的游客ID进行登录
          const guestId = parsedData.id;
          await testLoginWithExistingId('guest', guestId);
          return;
        }
      } catch (error) {
        console.error('❌ 解析现有用户数据失败:', error);
      }
    }
    
    // 如果没有自动生成的ID，创建新的
    testLogin('guest');
  };

  const testLoginWithExistingId = async (loginType: 'guest', existingGuestId: string) => {
    try {
      setLoading(true);
      
      const username = `t_${loginType}_${existingGuestId}`.slice(0, 20);
      const nickname = existingGuestId;
      
      // 准备注册数据
      const registerData: any = {
        loginType,
        username,
        nickname,
        guestId: existingGuestId,
      };
      
      console.log('🔐 使用现有游客ID登录:', registerData);
      
      // 调用后端注册API
      const response = await fetch('https://dramawordv2.onrender.com/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 登录失败:', response.status, errorText);
        throw new Error(`登录失败: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ 登录成功:', result);
      
      if (result.success && result.data) {
        // 保存用户信息到本地存储
        const userData = {
          id: result.data.user.id,
          nickname: result.data.user.nickname,
          avatar: result.data.user.avatar,
          loginType: loginType,
          token: result.data.token,
        };
        
        // 清除旧缓存，确保新用户看到正确的数据
        await unifiedSyncService.clearSyncQueue();
        
        // 额外清理：清除所有可能的共享数据
        await clearAllSharedData();
        
        // 新增：下载新用户的云端数据
        await downloadUserData(userData.id, loginType);
        
        // 游客登录直接进入主应用，跳过欢迎页面
        onLoginSuccess(userData);
      } else {
        throw new Error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('❌ 使用现有ID登录失败:', error);
      Alert.alert('登录失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLoginSuccess = (phone: string) => {
    testLogin('phone');
  };

  const handlePrivacyPolicy = () => {
    setPrivacyVisible(true);
  };

  const handleUserAgreement = () => {
    setTermsVisible(true);
  };

  // 微信登录回调处理
  useEffect(() => {
    const handleWechatCallback = async (url: string) => {
      console.log('💬 ===== 微信回调处理开始 =====');
      console.log('💬 回调URL:', url);
      console.log('💬 时间戳:', new Date().toISOString());
      
      // 检查是否是微信回调
      const isWechatCallback = url.includes('wxa225945508659eb8') || url.includes('weixin');
      console.log('💬 是否为微信回调:', isWechatCallback);
      
      if (isWechatCallback) {
        try {
          console.log('💬 开始处理微信回调...');
          
          // 处理微信回调
          const { WechatService } = require('../../services/wechatService');
          const startTime = Date.now();
          const result = await WechatService.handleCallback(url);
          const endTime = Date.now();
          
          console.log('💬 微信回调处理完成');
          console.log('💬 处理耗时:', endTime - startTime, 'ms');
          console.log('💬 处理结果:', {
            success: result.success,
            hasData: !!result.data,
            hasUser: !!result.data?.user,
            hasToken: !!result.data?.token,
            message: result.message
          });
          
          if (result.success && result.data) {
            console.log('💬 微信回调处理成功，准备用户数据...');
            
            // 保存用户信息到本地存储
            const userData = {
              id: result.data.user.id,
              nickname: result.data.user.nickname,
              avatar: result.data.user.avatar,
              loginType: 'wechat',
              token: result.data.token,
            };
            
            console.log('💬 用户数据:', {
              id: userData.id,
              nickname: userData.nickname,
              hasAvatar: !!userData.avatar,
              loginType: userData.loginType,
              hasToken: !!userData.token
            });
            
            // 清除旧缓存
            console.log('💬 清除旧缓存...');
            await unifiedSyncService.clearSyncQueue();
            await clearAllSharedData();
            
            // 新增：下载新用户的云端数据
            await downloadUserData(userData.id, 'wechat');
            
            console.log('💬 调用 onLoginSuccess...');
            onLoginSuccess(userData);
            
            console.log('💬 ===== 微信回调处理完成 =====');
          } else {
            console.error('💬 微信回调处理返回失败结果:', result);
          }
        } catch (error) {
          console.error('💬 ===== 微信回调处理失败 =====');
          console.error('💬 错误类型:', (error as any).constructor?.name || 'Unknown');
          console.error('💬 错误消息:', (error as any).message || 'Unknown error');
          console.error('💬 错误堆栈:', (error as any).stack || 'No stack trace');
          Alert.alert('登录失败', '微信登录回调处理失败');
        }
      } else {
        console.log('💬 非微信回调，忽略处理');
      }
    };

    // 监听应用启动时的URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleWechatCallback(url);
      }
    });

    // 监听URL变化
    const subscription = Linking.addEventListener('url', (event) => {
      handleWechatCallback(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }, [onLoginSuccess]);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo和Slogan */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="book-outline" size={48} color={colors.primary[500]} />
            </View>
            <Text style={styles.appName}>{t('app_name', appLanguage)}</Text>
          </View>
          <Text style={styles.slogan}>{t('app_slogan', appLanguage)}</Text>
          <Text style={styles.versionInfo}>当前版本：免费体验版</Text>
        </View>

        {/* 登录按钮 */}
        <View style={styles.loginButtons}>
          {/* 恢复所有登录方式 */}
          {false && (
            <LoginButton
              type="phone"
              onPress={handlePhoneLogin}
              loading={loading}
            />
          )}
          
          {false && (
            <LoginButton
              type="wechat"
              onPress={() => {
                console.log('💬 微信登录按钮被点击');
                console.log('💬 当前loading状态:', loading);
                console.log('💬 点击时间:', new Date().toISOString());
                handleWechatLogin();
              }}
              loading={loading}
            />
          )}
          
          {Platform.OS === 'ios' && (
            <LoginButton
              type="apple"
              onPress={handleAppleLogin}
              loading={loading}
            />
          )}
          
          <LoginButton
            type="guest"
            onPress={handleGuestLogin}
            loading={loading}
          />
        </View>

        {/* 隐私政策 */}
        <View style={styles.privacyContainer}>
          <Text style={styles.privacyText}>
            {t('login_agreement', appLanguage)}
            <Text style={styles.link} onPress={handleUserAgreement}>
              {t('user_agreement', appLanguage)}
            </Text>
            {appLanguage === 'zh-CN' ? '和' : ' and '}
            <Text style={styles.link} onPress={handlePrivacyPolicy}>
              {t('privacy_policy', appLanguage)}
            </Text>
          </Text>
        </View>
      </View>

      {/* 手机号登录模态框 - 已恢复 */}
      <PhoneLoginModal
        visible={phoneModalVisible}
        onClose={() => setPhoneModalVisible(false)}
        onLoginSuccess={handlePhoneLoginSuccess}
      />

      {/* 用户协议 Modal */}
      <Modal
        visible={termsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTermsVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { paddingHorizontal: 20 }]}> 
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitleText}>{t('user_agreement', appLanguage)}</Text>
            <TouchableOpacity onPress={() => setTermsVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.legalParagraph}>
              {appLanguage === 'zh-CN' ?
                '欢迎使用本应用。使用本应用即表示你同意遵守本《用户协议》。请你在使用前仔细阅读：\n\n1. 使用范围：本应用仅用于个人学习与交流，不得用于商业目的。\n2. 账户与安全：请妥善保管你的账户信息，对账户下的所有活动负责。\n3. 内容与版权：本应用中的推荐内容与元数据来自 TMDB 等第三方来源，版权归其原作者所有。\n4. 数据与隐私：我们遵循《隐私政策》处理你的数据，请同时阅读并同意。\n5. 禁止行为：不得进行任何违法、侵权或破坏系统安全的行为。\n6. 变更与终止：我们可能根据需要更新本协议或终止服务，请留意应用内通知。' :
                'Welcome to our app. By using this app, you agree to this User Agreement. Please read carefully before use:\n\n1. Scope: The app is for personal learning and communication only, not for commercial use.\n2. Account & Security: Keep your account credentials safe and be responsible for activities under your account.\n3. Content & Copyright: Recommendations and metadata come from TMDB and other third parties; copyrights belong to their owners.\n4. Data & Privacy: We process your data under the Privacy Policy; please read and agree to it as well.\n5. Prohibited Conduct: Do not engage in illegal, infringing, or security-threatening activities.\n6. Changes & Termination: We may update this agreement or terminate the service; watch for in-app notices.'}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 隐私政策 Modal */}
      <Modal
        visible={privacyVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { paddingHorizontal: 20 }]}> 
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitleText}>{t('privacy_policy', appLanguage)}</Text>
            <TouchableOpacity onPress={() => setPrivacyVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.legalParagraph}>
              {appLanguage === 'zh-CN' ?
                '我们重视你的隐私。本《隐私政策》说明我们如何收集、使用与保护你的信息：\n\n1. 收集范围：账号信息、学习记录、搜索历史等为提供服务所需的数据。\n2. 使用目的：用于提供与改进服务、个性化推荐与同步功能。\n3. 存储与安全：数据采用加密传输与存储，采取必要的安全措施。\n4. 第三方：可能使用第三方服务（如 TMDB、云服务）以完成内容获取与数据同步。\n5. 权利：你有权访问、更正或删除你的数据。\n6. 变更：我们可能更新本政策，重大变更会在应用内提示。' :
                'We value your privacy. This Privacy Policy explains how we collect, use and protect your data:\n\n1. Data Collected: Account info, learning records, search history required to provide services.\n2. Purpose: To provide/improve services, personalize recommendations, and enable sync.\n3. Storage & Security: Data is transmitted and stored securely with necessary safeguards.\n4. Third Parties: We may use third-party services (e.g., TMDB, cloud) for content and sync.\n5. Your Rights: You can access, correct, or delete your data.\n6. Changes: We may update this policy and will notify you in-app for material changes.'}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.025,
  },
  slogan: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  versionInfo: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '400',
  },
  loginButtons: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  privacyContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  privacyText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: colors.primary[500],
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalCloseBtn: {
    padding: 8,
    marginLeft: 8,
  },
  legalParagraph: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.primary,
    whiteSpace: 'pre-wrap',
  },
}); 