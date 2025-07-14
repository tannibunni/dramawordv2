import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserService } from '../services/userService';

interface UserInfo {
  id: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  loginType?: 'wechat' | 'apple' | 'phone' | 'guest';
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: UserInfo | null;
  loginType: string | null;
  isAuthenticated: boolean;
  login: (userData: UserInfo, type: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<UserInfo>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loginType, setLoginType] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const userService = UserService.getInstance();

  // 初始化时加载用户信息
  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      console.log('🔍 AuthContext loadUserInfo 开始');
      const userLoginInfo = await userService.getUserLoginInfo();
      if (userLoginInfo) {
        console.log('🔍 AuthContext loadUserInfo 找到用户数据:', userLoginInfo);
        setUser(userLoginInfo.userData);
        setLoginType(userLoginInfo.loginType);
        setIsAuthenticated(true);
      } else {
        console.log('🔍 AuthContext loadUserInfo 没有找到用户数据');
      }
    } catch (error) {
      console.error('❌ AuthContext loadUserInfo 失败:', error);
    }
  };

  const login = async (userData: UserInfo, type: string) => {
    try {
      console.log('🔐 AuthContext login 开始:', { userData, type });
      await userService.saveUserLoginInfo(userData, type);
      console.log('🔐 AuthContext login 保存到本地存储完成');
      
      setUser(userData);
      setLoginType(type);
      setIsAuthenticated(true);
      
      console.log('🔐 AuthContext login 状态更新完成:', { 
        user: userData, 
        loginType: type, 
        isAuthenticated: true 
      });
    } catch (error) {
      console.error('❌ AuthContext login 失败:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await userService.clearUserLoginInfo();
      setUser(null);
      setLoginType(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const updateUser = (userData: Partial<UserInfo>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loginType, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}; 