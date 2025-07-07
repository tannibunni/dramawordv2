import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoginScreen } from './LoginScreen';
import { LoginData } from '../../types/auth';

export const AuthDemo: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [userData, setUserData] = useState<LoginData | null>(null);

  const handleLoginSuccess = (data: LoginData) => {
    setUserData(data);
    setShowLogin(false);
    Alert.alert(
      '登录成功',
      `欢迎回来，${data.userInfo.nickname || '用户'}！`,
      [{ text: '确定' }]
    );
  };

  const handleGuestLogin = () => {
    setUserData({
      type: 'guest',
      userInfo: {
        id: `guest_${Date.now()}`,
        nickname: '游客用户',
      },
    });
    setShowLogin(false);
    Alert.alert('游客模式', '已进入游客模式，数据将保存在本地。', [
      { text: '确定' },
    ]);
  };

  const handleLogout = () => {
    setUserData(null);
    Alert.alert('已登出', '您已成功登出。', [{ text: '确定' }]);
  };

  if (showLogin) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onGuestLogin={handleGuestLogin}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {userData ? (
          // 已登录状态
          <View style={styles.loggedInContainer}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons
                  name="person-circle-outline"
                  size={60}
                  color="#4F6DFF"
                />
              </View>
              <Text style={styles.welcomeText}>
                欢迎回来，{userData.userInfo.nickname}！
              </Text>
              <Text style={styles.loginTypeText}>
                登录方式：{getLoginTypeText(userData.type)}
              </Text>
              {userData.userInfo.phone && (
                <Text style={styles.phoneText}>
                  手机号：{userData.userInfo.phone}
                </Text>
              )}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#F76C6C" />
              <Text style={styles.logoutButtonText}>登出</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // 未登录状态
          <View style={styles.welcomeContainer}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons name="book-outline" size={48} color="#4F6DFF" />
              </View>
              <Text style={styles.appName}>剧词记</Text>
            </View>
            <Text style={styles.slogan}>看剧，记住真·有用的单词</Text>
            <Text style={styles.description}>
              这是一个登录页面的演示，点击下方按钮开始体验登录功能。
            </Text>

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setShowLogin(true)}
            >
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>开始登录</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const getLoginTypeText = (type: string) => {
  switch (type) {
    case 'phone':
      return '手机号登录';
    case 'wechat':
      return '微信登录';
    case 'apple':
      return 'Apple登录';
    case 'guest':
      return '游客模式';
    default:
      return '未知';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F6DFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginTypeText: {
    fontSize: 16,
    color: '#4F6DFF',
    marginBottom: 8,
  },
  phoneText: {
    fontSize: 14,
    color: '#888888',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F76C6C',
  },
  logoutButtonText: {
    color: '#F76C6C',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
}); 