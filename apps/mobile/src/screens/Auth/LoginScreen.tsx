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
import { WechatService } from '../../services/wechatService';
import { AppleService } from '../../services/appleService';
import * as AppleAuthentication from 'expo-apple-authentication';
import { colors } from '../../constants/colors';

interface LoginScreenProps {
  onLoginSuccess: (userData: any) => void;
  onGuestLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGuestLogin,
}) => {
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhoneLogin = () => {
    setPhoneModalVisible(true);
  };

  const handleWechatLogin = async () => {
    setLoading(true);
    try {
      // 检查是否在开发环境
      const isDevelopment = __DEV__;
      
      if (isDevelopment) {
        // 开发环境：使用模拟登录
        console.log('开发环境：使用模拟微信登录');
        
        // 生成微信登录状态
        const state = WechatService.generateState();
        console.log('微信登录状态:', state);
        
        // 模拟微信登录成功
        const mockUserData = {
          type: 'wechat',
          userInfo: {
            id: 'wechat_user_' + Date.now(),
            username: 'wechat_user',
            nickname: '微信用户',
            avatar: 'https://via.placeholder.com/100',
            loginType: 'wechat',
          },
          token: 'mock_wechat_token_' + Date.now(),
        };
        
        // 模拟登录延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 登录成功
        onLoginSuccess(mockUserData);
      } else {
        // 生产环境：使用真实的微信SDK
        console.log('生产环境：使用真实微信登录');
        
        // 执行完整的微信登录流程
        const loginResult = await WechatService.performLogin();
        
        if (loginResult.success) {
          onLoginSuccess({
            type: 'wechat',
            userInfo: loginResult.data.user,
            token: loginResult.data.token,
          });
        } else {
          throw new Error(loginResult.message || '微信登录失败');
        }
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('微信登录失败:', message);
      Alert.alert('登录失败', message || '微信登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      // 在开发环境中，跳过真实的 Apple Authentication
      // TODO: 在生产环境中使用真实的 Apple Authentication
      console.log('苹果登录开始');
      
      // 模拟 Apple Authentication 过程
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟苹果登录成功
      const mockUserData = {
        type: 'apple',
        userInfo: {
          id: 'apple_user_' + Date.now(),
          username: 'apple_user',
          nickname: 'Apple用户',
          avatar: 'https://via.placeholder.com/100',
          loginType: 'apple',
        },
        token: 'mock_apple_token_' + Date.now(),
      };
      
      // 登录成功
      onLoginSuccess(mockUserData);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('苹果登录失败:', message);
      Alert.alert('登录失败', '苹果登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    Alert.alert(
      '游客模式',
      '游客模式下，您的学习数据将保存在本地，建议登录以同步数据。',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '继续',
          onPress: () => {
            onGuestLogin();
          },
        },
      ]
    );
  };

  const handlePhoneLoginSuccess = (phone: string) => {
    onLoginSuccess({
      type: 'phone',
      userInfo: {
        phone,
        nickname: `用户${phone.slice(-4)}`,
      },
    });
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
            <Text style={styles.appName}>剧词记</Text>
          </View>
          <Text style={styles.slogan}>看剧，记住真·有用的单词</Text>
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
            登录即代表你同意
            <Text style={styles.link} onPress={handleUserAgreement}>
              《用户协议》
            </Text>
            和
            <Text style={styles.link} onPress={handlePrivacyPolicy}>
              《隐私政策》
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