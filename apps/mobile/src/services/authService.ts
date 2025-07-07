import {
  LoginRequest,
  LoginResponse,
  SendVerificationCodeRequest,
  SendVerificationCodeResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  LoginData,
} from '../types/auth';
import { API_BASE_URL } from '../constants/config';

class AuthService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }

      return data;
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }

  // 发送验证码
  async sendVerificationCode(
    request: SendVerificationCodeRequest
  ): Promise<SendVerificationCodeResponse> {
    return this.request<SendVerificationCodeResponse>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 验证验证码
  async verifyCode(request: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    return this.request<VerifyCodeResponse>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 手机号登录
  async phoneLogin(request: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/phone-login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 微信登录
  async wechatLogin(request: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/wechat-login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Apple登录
  async appleLogin(request: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/apple-login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 刷新token
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // 登出
  async logout(token: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // 模拟API调用（开发阶段使用）
  async mockLogin(type: 'phone' | 'wechat' | 'apple' | 'guest'): Promise<LoginData> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockData: Record<string, LoginData> = {
      phone: {
        type: 'phone',
        userInfo: {
          id: 'phone_123456',
          phone: '13800138000',
          nickname: '用户3800',
        },
        token: 'mock_phone_token',
        refreshToken: 'mock_phone_refresh_token',
      },
      wechat: {
        type: 'wechat',
        userInfo: {
          id: 'wx_123456',
          nickname: '微信用户',
          avatar: 'https://example.com/avatar.jpg',
        },
        token: 'mock_wechat_token',
        refreshToken: 'mock_wechat_refresh_token',
      },
      apple: {
        type: 'apple',
        userInfo: {
          id: 'apple_123456',
          email: 'user@example.com',
          nickname: 'Apple用户',
        },
        token: 'mock_apple_token',
        refreshToken: 'mock_apple_refresh_token',
      },
      guest: {
        type: 'guest',
        userInfo: {
          id: `guest_${Date.now()}`,
          nickname: '游客用户',
        },
      },
    };

    return mockData[type];
  }

  async mockSendVerificationCode(phone: string): Promise<SendVerificationCodeResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: '验证码已发送',
    };
  }

  async mockVerifyCode(phone: string, code: string): Promise<VerifyCodeResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (code === '123456') {
      return {
        success: true,
        data: {
          token: 'mock_phone_token',
          refreshToken: 'mock_phone_refresh_token',
          user: {
            id: 'phone_123456',
            phone,
            nickname: `用户${phone.slice(-4)}`,
          },
        },
      };
    } else {
      throw new Error('验证码错误');
    }
  }
}

export const authService = new AuthService(); 