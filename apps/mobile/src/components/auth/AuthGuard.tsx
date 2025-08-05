import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginScreen } from '../../screens/Auth/LoginScreen';
import { InitialLanguageModal } from '../common/InitialLanguageModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loginType, isAuthenticated, getAuthToken, login } = useAuth();
  const [hasValidToken, setHasValidToken] = useState<boolean | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, [user, loginType, isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      // 如果有用户信息但没有认证状态，检查token
      if (user && loginType && !isAuthenticated) {
        console.log('🔍 检查认证token状态...');
        const token = await getAuthToken();
        
        if (!token) {
          console.log('❌ 没有有效的认证token，需要重新登录');
          setHasValidToken(false);
          setShowLogin(true);
          return;
        }
        
        console.log('✅ 找到有效的认证token');
        setHasValidToken(true);
        setShowLogin(false);
      } else if (!user || !loginType) {
        // 没有用户信息，显示登录界面
        console.log('❌ 没有用户信息，需要登录');
        setHasValidToken(false);
        setShowLogin(true);
      } else if (isAuthenticated) {
        // 已认证，检查token是否有效
        const token = await getAuthToken();
        if (!token) {
          console.log('❌ 认证状态为true但没有token，需要重新登录');
          setHasValidToken(false);
          setShowLogin(true);
        } else {
          console.log('✅ 认证状态正常');
          setHasValidToken(true);
          setShowLogin(false);
        }
      }
    } catch (error) {
      console.error('❌ 检查认证状态失败:', error);
      setHasValidToken(false);
      setShowLogin(true);
    }
  };

  const checkLanguageSetupAfterLogin = async () => {
    try {
      const hasSetup = await AsyncStorage.getItem('initialLanguageSetup');
      if (!hasSetup) {
        console.log('🔍 用户首次登录，显示语言选择窗口');
        setShowLanguageModal(true);
      } else {
        console.log('🔍 用户已设置过语言，跳过语言选择');
      }
    } catch (error) {
      console.error('❌ 检查语言设置失败:', error);
    }
  };

  const handleLoginSuccess = async (userData: any) => {
    try {
      console.log('🔐 AuthGuard 处理登录成功:', userData);
      await login(userData, userData.loginType || 'apple');
      setShowLogin(false);
      setHasValidToken(true);
      
      // 登录成功后检查语言设置
      await checkLanguageSetupAfterLogin();
    } catch (error) {
      console.error('❌ AuthGuard 登录处理失败:', error);
    }
  };

  const handleGuestLogin = async () => {
    try {
      console.log('👤 AuthGuard 处理游客登录');
      // 游客登录逻辑
      setShowLogin(false);
      setHasValidToken(true);
      
      // 游客登录后也检查语言设置
      await checkLanguageSetupAfterLogin();
    } catch (error) {
      console.error('❌ AuthGuard 游客登录处理失败:', error);
    }
  };

  const handleLanguageModalComplete = () => {
    setShowLanguageModal(false);
  };

  // 如果正在检查认证状态，显示加载状态
  if (hasValidToken === null) {
    return null; // 或者显示加载指示器
  }

  // 如果需要登录，显示登录界面
  if (showLogin) {
    return (
      <LoginScreen 
        onLoginSuccess={handleLoginSuccess}
        onGuestLogin={handleGuestLogin}
      />
    );
  }

  // 认证有效，显示子组件和语言选择窗口
  return (
    <>
      {children}
      <InitialLanguageModal
        visible={showLanguageModal}
        onComplete={handleLanguageModalComplete}
      />
    </>
  );
}; 