import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

export interface UserProfile {
  id: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  loginType?: 'wechat' | 'apple' | 'phone' | 'guest';
  createdAt?: string;
  updatedAt?: string;
}

export interface UserServiceResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}

export class UserService {
  private static instance: UserService;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  // 保存用户登录信息到本地存储
  async saveUserLoginInfo(userData: any, loginType: string): Promise<void> {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('loginType', loginType);
      // 保存认证token
      if (userData.token) {
        await AsyncStorage.setItem('authToken', userData.token);
        console.log('✅ 认证token已保存');
      }
      console.log('✅ 用户登录信息已保存到本地存储');
    } catch (error) {
      console.error('❌ 保存用户登录信息失败:', error);
    }
  }

  // 从本地存储获取用户信息
  async getUserLoginInfo(): Promise<{ userData: any; loginType: string } | null> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const loginType = await AsyncStorage.getItem('loginType');
      
      if (userData && loginType) {
        return {
          userData: JSON.parse(userData),
          loginType,
        };
      }
      return null;
    } catch (error) {
      console.error('❌ 获取用户登录信息失败:', error);
      return null;
    }
  }

  // 清除用户登录信息
  async clearUserLoginInfo(): Promise<void> {
    try {
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('loginType');
      await AsyncStorage.removeItem('authToken');
      console.log('✅ 用户登录信息已清除');
    } catch (error) {
      console.error('❌ 清除用户登录信息失败:', error);
    }
  }

  // 获取用户资料（API调用）
  async getProfile(token: string): Promise<UserServiceResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`获取用户资料失败: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ 获取用户资料失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // 更新用户资料
  async updateProfile(token: string, profileData: Partial<UserProfile>): Promise<UserServiceResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error(`更新用户资料失败: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ 更新用户资料失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }
} 