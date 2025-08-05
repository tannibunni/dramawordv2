import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginScreen from '../../screens/Auth/LoginScreen';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loginType, isAuthenticated, getAuthToken } = useAuth();
  const [hasValidToken, setHasValidToken] = useState<boolean | null>(null);
  const [showLogin, setShowLogin] = useState(false);

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

  // 如果正在检查认证状态，显示加载状态
  if (hasValidToken === null) {
    return null; // 或者显示加载指示器
  }

  // 如果需要登录，显示登录界面
  if (showLogin) {
    return <LoginScreen />;
  }

  // 认证有效，显示子组件
  return <>{children}</>;
}; 