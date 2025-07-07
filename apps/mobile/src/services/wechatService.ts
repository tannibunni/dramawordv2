import { API_BASE_URL } from '../constants/config';

// 微信登录响应接口
export interface WechatLoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      username: string;
      nickname: string;
      avatar?: string;
      loginType: string;
      learningStats: any;
      settings: any;
    };
  };
}

export interface WechatAuthUrlResponse {
  success: boolean;
  data: {
    authUrl: string;
    state: string;
  };
}

export interface WechatRefreshResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
}

// 微信登录服务类
export class WechatService {
  private static baseUrl = `${API_BASE_URL}/wechat`;

  /**
   * 微信登录
   */
  static async login(code: string, state?: string): Promise<WechatLoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '微信登录失败');
      }

      return data;
    } catch (error) {
      console.error('微信登录失败:', error);
      throw error;
    }
  }

  /**
   * 获取微信授权URL
   */
  static async getAuthUrl(redirectUri: string, state?: string): Promise<WechatAuthUrlResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ redirectUri, state }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取授权URL失败');
      }

      return data;
    } catch (error) {
      console.error('获取微信授权URL失败:', error);
      throw error;
    }
  }

  /**
   * 刷新微信token
   */
  static async refreshToken(refreshToken: string): Promise<WechatRefreshResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '刷新token失败');
      }

      return data;
    } catch (error) {
      console.error('刷新微信token失败:', error);
      throw error;
    }
  }

  /**
   * 检查微信token有效性
   */
  static async checkToken(accessToken: string, openid: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/check-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken, openid }),
      });

      const data = await response.json();

      if (!response.ok) {
        return false;
      }

      return data.data?.isValid || false;
    } catch (error) {
      console.error('检查微信token失败:', error);
      return false;
    }
  }

  /**
   * 解绑微信账号
   */
  static async unbind(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/unbind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '解绑失败');
      }
    } catch (error) {
      console.error('解绑微信账号失败:', error);
      throw error;
    }
  }

  /**
   * 生成微信登录状态
   */
  static generateState(): string {
    return `dramaword_wechat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证微信登录状态
   */
  static validateState(state: string): boolean {
    if (!state || typeof state !== 'string') {
      return false;
    }
    return state.startsWith('dramaword_wechat_');
  }
} 