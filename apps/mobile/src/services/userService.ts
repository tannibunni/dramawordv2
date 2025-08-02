import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { storageService } from '../services/storageService';
import { errorHandler, ErrorType } from '../utils/errorHandler';

export interface UserProfile {
  id: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  loginType?: 'wechat' | 'apple' | 'phone' | 'guest';
  contributedWords?: number;
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
      const results = await Promise.all([
        storageService.setUserData(userData),
        storageService.setLoginType(loginType)
      ]);

      // 检查存储结果
      const hasError = results.some(result => !result.success);
      if (hasError) {
        throw new Error('部分用户数据保存失败');
      }

      // 保存认证token
      if (userData.token) {
        const tokenResult = await storageService.setAuthToken(userData.token);
        if (!tokenResult.success) {
          throw new Error('认证token保存失败');
        }
        console.log('✅ 认证token已保存');
      }
      
      console.log('✅ 用户登录信息已保存到本地存储');
    } catch (error) {
      errorHandler.handleError(error, { userData, loginType }, {
        type: ErrorType.STORAGE,
        userMessage: '用户信息保存失败，请重试'
      });
      throw error;
    }
  }

  // 从本地存储获取用户信息
  async getUserLoginInfo(): Promise<{ userData: any; loginType: string } | null> {
    try {
      const [userDataResult, loginTypeResult] = await Promise.all([
        storageService.getUserData(),
        storageService.getLoginType()
      ]);

      if (userDataResult.success && loginTypeResult.success && 
          userDataResult.data && loginTypeResult.data) {
        return {
          userData: userDataResult.data,
          loginType: loginTypeResult.data,
        };
      }
      return null;
    } catch (error) {
      errorHandler.handleError(error, {}, {
        type: ErrorType.STORAGE,
        userMessage: '获取用户信息失败'
      });
      return null;
    }
  }

  // 清除用户登录信息
  async clearUserLoginInfo(): Promise<void> {
    try {
      const result = await storageService.clearUserData();
      if (!result.success) {
        throw new Error('清除用户数据失败');
      }
      console.log('✅ 用户登录信息已清除');
    } catch (error) {
      errorHandler.handleError(error, {}, {
        type: ErrorType.STORAGE,
        userMessage: '清除用户信息失败'
      });
    }
  }

  // 获取用户资料（API调用）
  async getProfile(token: string): Promise<UserServiceResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
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
      errorHandler.handleError(error, { token }, {
        type: ErrorType.NETWORK,
        userMessage: '获取用户资料失败，请检查网络连接'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // 更新用户资料
  async updateProfile(token: string, profileData: Partial<UserProfile>): Promise<UserServiceResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
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