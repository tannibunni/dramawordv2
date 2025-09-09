import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { storageService } from '../services/storageService';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import Logger from '../utils/logger';

// 创建页面专用日志器
const logger = Logger.forPage('UserService');

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
      logger.log('开始保存用户登录信息', 'saveUserLoginInfo');
      
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
        logger.log('保存认证token', 'saveUserLoginInfo');
        const tokenResult = await storageService.setAuthToken(userData.token);
        if (!tokenResult.success) {
          throw new Error('认证token保存失败');
        }
        logger.log('认证token已保存', 'saveUserLoginInfo');
      } else {
        logger.warn('用户数据中没有token', 'saveUserLoginInfo');
      }
      
      logger.log('用户登录信息已保存到本地存储', 'saveUserLoginInfo');
    } catch (error) {
      logger.error('保存用户登录信息失败', 'saveUserLoginInfo');
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
      console.log('📝 开始更新用户资料...');
      console.log('📝 使用的token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      console.log('📝 响应状态:', response.status);
      console.log('📝 响应头:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📝 错误响应:', errorText);
        throw new Error(`更新用户资料失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ 用户资料更新成功:', result);
      return result;
    } catch (error) {
      console.error('❌ 更新用户资料失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // 上传头像
  async uploadAvatar(token: string, formData: FormData): Promise<{ success: boolean; data?: { avatar: string }; error?: string }> {
    try {
      console.log('📤 开始上传头像...');
      console.log('📤 使用的token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      const response = await fetch(`${API_BASE_URL}/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 不设置Content-Type，让FormData自动设置
        },
        body: formData,
      });

      console.log('📤 响应状态:', response.status);
      console.log('📤 响应头:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📤 错误响应:', errorText);
        throw new Error(`上传头像失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ 头像上传成功:', result);
      return result;
    } catch (error) {
      console.error('❌ 头像上传失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // 获取认证token
  async getAuthToken(): Promise<string | null> {
    try {
      const result = await storageService.getAuthToken();
      return result.success ? (result.data || null) : null;
    } catch (error) {
      console.error('❌ 获取认证token失败:', error);
      return null;
    }
  }

  // 注销账户
  async deleteAccount(token: string, confirmText: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🗑️ 开始注销账户...');
      console.log('🗑️ API URL:', `${API_BASE_URL}/users/account`);
      console.log('🗑️ 确认文本:', confirmText);
      
      const response = await axios.delete(`${API_BASE_URL}/users/account`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          confirmText
        }
      });

      console.log('🗑️ 后端响应:', response.data);

      if (response.data.success) {
        console.log('✅ 账户注销成功');
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.message || '注销失败');
      }
    } catch (error) {
      console.error('❌ 注销账户失败:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('❌ 错误详情:', (error as any).response?.data);
      }
      const errorMessage = errorHandler.handleError(error, { confirmText }, {
        type: ErrorType.NETWORK,
        userMessage: '注销账户失败，请重试'
      });
      return {
        success: false,
        error: typeof errorMessage === 'string' ? errorMessage : '未知错误'
      };
    }
  }
} 