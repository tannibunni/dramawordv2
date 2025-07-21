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
import { Ionicons } from '@expo/vector-icons';
import { LoginButton } from '../../components/auth/LoginButton';
import { PhoneLoginModal } from '../../components/auth/PhoneLoginModal';
import { WelcomeModal } from '../../components/auth/WelcomeModal';
import { WechatService } from '../../services/wechatService';
import { AppleService } from '../../services/appleService';
import * as AppleAuthentication from 'expo-apple-authentication';
import { colors } from '../../constants/colors';
import { t } from '../../constants/translations';
import { useAppLanguage } from '../../context/AppLanguageContext';

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
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginUserData, setLoginUserData] = useState<any>(null);

  // 测试登录功能 - 从 ProfileScreen 同步过来
  const testLogin = async (loginType: 'wechat' | 'apple' | 'phone' | 'guest') => {
    try {
      setLoading(true);
      
      // 生成唯一的测试ID
      const now = Date.now().toString();
      const shortId = now.slice(-6);
      const username = `t_${loginType}_${shortId}`.slice(0, 20);
      const nickname = `${loginType === 'wechat' ? '微信' : loginType === 'apple' ? 'Apple' : loginType === 'phone' ? '手机' : '游客'}用户`;
      
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
        
        // 如果是游客登录，显示欢迎页面
        if (loginType === 'guest') {
          setLoginUserData(userData);
          setWelcomeModalVisible(true);
        } else {
          onLoginSuccess(userData);
        }
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
    await testLogin('wechat');
  };

  const handleAppleLogin = async () => {
    await testLogin('apple');
  };

  const handleGuestLogin = () => {
    testLogin('guest');
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

  const handleWelcomeClose = () => {
    setWelcomeModalVisible(false);
    setLoginUserData(null);
  };

  const handleStartTrial = () => {
    if (loginUserData) {
      onLoginSuccess(loginUserData);
    }
    setWelcomeModalVisible(false);
    setLoginUserData(null);
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
        </View>

        {/* 登录按钮 */}
        <View style={styles.loginButtons}>
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

      {/* 手机号登录模态框 */}
      <PhoneLoginModal
        visible={phoneModalVisible}
        onClose={() => setPhoneModalVisible(false)}
        onLoginSuccess={handlePhoneLoginSuccess}
      />

      {/* 欢迎页面模态框 */}
      <WelcomeModal
        visible={welcomeModalVisible}
        onClose={handleWelcomeClose}
        onStartTrial={handleStartTrial}
        userData={loginUserData}
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