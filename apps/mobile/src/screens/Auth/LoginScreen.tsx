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
      // 生成微信登录状态
      const state = WechatService.generateState();
      
      // 获取微信授权URL（这里需要根据实际情况调整）
      const redirectUri = 'dramaword://wechat-login';
      const authUrlResponse = await WechatService.getAuthUrl(redirectUri, state);
      
      // TODO: 打开微信授权页面
      // 这里需要集成微信SDK或使用WebView
      console.log('微信授权URL:', authUrlResponse.data.authUrl);
      
      // 模拟获取授权码
      const mockCode = 'mock_wechat_code_' + Date.now();
      
      // 调用后端微信登录API
      const loginResponse = await WechatService.login(mockCode, state);
      
      // 登录成功
      onLoginSuccess({
        type: 'wechat',
        userInfo: loginResponse.data.user,
        token: loginResponse.data.token,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('微信登录失败:', message);
      Alert.alert('登录失败', '微信登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('未获取到Apple身份凭证');
      const res = await AppleService.login(credential.identityToken);
      if (res.success) {
        onLoginSuccess({
          type: 'apple',
          userInfo: res.data.user,
          token: res.data.token,
        });
      } else {
        throw new Error(res.message || 'Apple登录失败');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('登录失败', message || 'Apple登录失败，请重试');
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
              <Ionicons name="book-outline" size={48} color="#4F6DFF" />
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
    backgroundColor: '#F9F9FB',
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
    backgroundColor: '#FFFFFF',
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
    color: '#2D2D2D',
    letterSpacing: -0.025,
  },
  slogan: {
    fontSize: 16,
    color: '#888888',
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
    color: '#888888',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#4F6DFF',
    textDecorationLine: 'underline',
  },
}); 