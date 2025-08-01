import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
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
        'learningLanguages',
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
        const { DataSyncService } = require('../../services/dataSyncService');
        const dataSyncService = DataSyncService.getInstance();
        await dataSyncService.clearAllCache();
        
        // 额外清理：清除所有可能的共享数据
        await clearAllSharedData();
        
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
      
      console.log('💬 开始微信登录流程...');
      
      // 调用真正的微信登录流程
      const { WechatService } = require('../../services/wechatService');
      const result = await WechatService.performLogin();
      
      if (result.success && result.data) {
        // 保存用户信息到本地存储
        const userData = {
          id: result.data.user.id,
          nickname: result.data.user.nickname,
          avatar: result.data.user.avatar,
          loginType: 'wechat',
          token: result.data.token,
        };
        
        // 清除旧缓存，确保新用户看到正确的数据
        const { DataSyncService } = require('../../services/dataSyncService');
        const dataSyncService = DataSyncService.getInstance();
        await dataSyncService.clearAllCache();
        
        // 额外清理：清除所有可能的共享数据
        await clearAllSharedData();
        
        onLoginSuccess(userData);
      } else {
        throw new Error(result.message || '微信登录失败');
      }
    } catch (error: any) {
      console.error('❌ 微信登录失败:', error);
      
      if (error.message.includes('请先安装微信应用')) {
        Alert.alert('提示', '请先安装微信应用');
      } else if (error.message.includes('微信SDK注册失败')) {
        Alert.alert('登录失败', '微信SDK初始化失败，请重试');
      } else {
        Alert.alert('登录失败', error instanceof Error ? error.message : '微信登录失败，请重试');
      }
    } finally {
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
        email: credential.email,
        fullName: credential.fullName,
      };
      const result = await AppleService.login(loginData);
      
      if (result.success && result.data) {
        // 保存用户信息到本地存储
        const userData = {
          id: result.data.user.id,
          nickname: result.data.user.nickname,
          avatar: result.data.user.avatar,
          loginType: 'apple',
          token: result.data.token,
        };
        
        // 清除旧缓存，确保新用户看到正确的数据
        const { DataSyncService } = require('../../services/dataSyncService');
        const dataSyncService = DataSyncService.getInstance();
        await dataSyncService.clearAllCache();
        
        // 额外清理：清除所有可能的共享数据
        await clearAllSharedData();
        
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
        const { DataSyncService } = require('../../services/dataSyncService');
        const dataSyncService = DataSyncService.getInstance();
        await dataSyncService.clearAllCache();
        
        // 额外清理：清除所有可能的共享数据
        await clearAllSharedData();
        
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
    // TODO: 打开隐私政策页面
    Alert.alert('隐私政策', '这里将打开隐私政策页面');
  };

  const handleUserAgreement = () => {
    // TODO: 打开用户协议页面
    Alert.alert('用户协议', '这里将打开用户协议页面');
  };



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
          <LoginButton
            type="phone"
            onPress={handlePhoneLogin}
            loading={loading}
          />
          
          <LoginButton
            type="wechat"
            onPress={handleWechatLogin}
            loading={loading}
          />
          
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
}); 