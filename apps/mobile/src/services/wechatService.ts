import { API_BASE_URL } from '../constants/config';
import { Platform } from 'react-native';
import WechatSDK from './wechatSDK';

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
  private static appId = 'wxa225945508659eb8';
  private static universalLink = 'https://dramaword.com/app/';

  /**
   * 注册微信应用
   */
  static async registerApp(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // iOS 使用 universal link
        const result = await WechatSDK.registerApp(this.appId, this.universalLink);
        console.log('微信SDK注册结果:', result);
        return result;
      } else {
        // Android 使用包名
        const result = await WechatSDK.registerApp(this.appId, 'com.tannibunni.dramawordmobile');
        console.log('微信SDK注册结果:', result);
        return result;
      }
    } catch (error) {
      console.error('微信SDK注册失败:', error);
      return false;
    }
  }

  /**
   * 检查微信是否已安装
   */
  static async isWXInstalled(): Promise<boolean> {
    try {
      const installed = await WechatSDK.isWXAppInstalled();
      console.log('微信是否已安装:', installed);
      return installed;
    } catch (error) {
      console.error('检查微信安装状态失败:', error);
      return false;
    }
  }

  /**
   * 发送微信授权请求
   */
  static async sendAuthRequest(state: string): Promise<{ code: string; state: string }> {
    try {
      const scope = 'snsapi_userinfo';
      const result = await WechatSDK.sendAuthRequest(scope, state);
      console.log('微信授权请求结果:', result);
      return result;
    } catch (error) {
      console.error('微信授权请求失败:', error);
      throw error;
    }
  }

  /**
   * 处理微信回调URL
   */
  static async handleOpenURL(url: string): Promise<boolean> {
    try {
      return await WechatSDK.handleOpenURL(url);
    } catch (error) {
      console.error('处理微信回调URL失败:', error);
      return false;
    }
  }

  /**
   * 处理微信登录回调
   */
  static async handleCallback(url: string): Promise<WechatLoginResponse> {
    try {
      console.log('💬 处理微信登录回调:', url);
      
      // 解析回调URL中的参数
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      
      if (!code) {
        throw new Error('回调URL中缺少授权码');
      }
      
      console.log('💬 从回调URL解析到:', { code, state });
      
      // 使用授权码进行登录
      return await this.login(code, state || undefined);
    } catch (error) {
      console.error('💬 处理微信回调失败:', error);
      throw error;
    }
  }

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
    return `dramaword_wechat_login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证微信登录状态
   */
  static validateState(state: string): boolean {
    if (!state || typeof state !== 'string') {
      return false;
    }
    return state.startsWith('dramaword_wechat_login');
  }

  /**
   * 完整的微信登录流程
   */
  static async performLogin(): Promise<WechatLoginResponse> {
    try {
      // 1. 注册微信应用
      const registered = await this.registerApp();
      if (!registered) {
        console.log('微信SDK注册失败，尝试使用Mock模式');
        // 如果注册失败，直接使用Mock模式进行测试
        return await this.performMockLogin();
      }

      // 2. 检查微信是否已安装
      const installed = await this.isWXInstalled();
      if (!installed) {
        console.log('微信未安装，尝试使用Mock模式');
        return await this.performMockLogin();
      }

      // 3. 生成状态参数
      const state = this.generateState();

      // 4. 发送授权请求
      const authResult = await this.sendAuthRequest(state);

      // 5. 调用后端登录API
      const loginResult = await this.login(authResult.code, authResult.state);

      return loginResult;
    } catch (error) {
      console.error('微信登录流程失败，回退到Mock模式:', error);
      // 如果真实登录失败，回退到Mock模式
      return await this.performMockLogin();
    }
  }

  /**
   * Mock微信登录流程（用于测试）
   */
  private static async performMockLogin(): Promise<WechatLoginResponse> {
    try {
      console.log('使用Mock微信登录模式');
      
      // 生成Mock授权码
      const mockCode = `mock_wechat_code_${Date.now()}`;
      const state = this.generateState();
      
      // 调用后端登录API（后端会识别Mock码并返回Mock用户信息）
      const loginResult = await this.login(mockCode, state);
      
      return loginResult;
    } catch (error) {
      console.error('Mock微信登录失败:', error);
      throw new Error('微信登录失败，请稍后重试');
    }
  }
} 