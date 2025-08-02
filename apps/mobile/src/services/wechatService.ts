import { API_BASE_URL } from '../constants/config';
import { Platform } from 'react-native';
import WechatSDK from './wechatSDK';
import { wechatLogger } from '../utils/wechatLogger';

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
    const maxRetries = 3;
    let lastError: any;
    
    console.log('🔧 开始微信SDK注册流程...');
    console.log('🔧 平台:', Platform.OS);
    console.log('🔧 配置:', {
      appId: this.appId,
      universalLink: this.universalLink
    });
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔧 微信SDK注册尝试 ${attempt}/${maxRetries}`);
        
        if (Platform.OS === 'ios') {
          // iOS 使用 universal link
          console.log('🔧 iOS平台，使用Universal Link注册');
          const result = await WechatSDK.registerApp(this.appId, this.universalLink);
          console.log('🔧 微信SDK注册结果:', result);
          console.log('🔧 结果类型:', typeof result);
          
          if (result) {
            console.log('🔧 微信SDK注册成功');
            return true;
          } else {
            console.log('🔧 微信SDK注册返回false，重试中...');
          }
        } else {
          // Android 使用包名
          console.log('🔧 Android平台，使用包名注册');
          const result = await WechatSDK.registerApp(this.appId, 'com.tannibunni.dramawordmobile');
          console.log('🔧 微信SDK注册结果:', result);
          console.log('🔧 结果类型:', typeof result);
          
          if (result) {
            console.log('🔧 微信SDK注册成功');
            return true;
          } else {
            console.log('🔧 微信SDK注册返回false，重试中...');
          }
        }
      } catch (error) {
        console.error(`🔧 微信SDK注册失败 (尝试 ${attempt}/${maxRetries}):`, error);
        console.error('🔧 错误详情:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        lastError = error;
        
        if (attempt < maxRetries) {
          console.log(`🔧 等待1秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.error('🔧 微信SDK注册失败，已尝试所有重试次数');
    console.error('🔧 最后一次错误:', lastError);
    return false;
  }

  /**
   * 检查微信是否已安装
   */
  static async isWXInstalled(): Promise<boolean> {
    try {
      console.log('📱 开始检查微信安装状态...');
      const installed = await WechatSDK.isWXAppInstalled();
      console.log('📱 微信是否已安装:', installed);
      console.log('📱 结果类型:', typeof installed);
      return installed;
    } catch (error) {
      console.error('📱 检查微信安装状态失败:', error);
      console.error('📱 错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
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
    const startTime = Date.now();
    
    try {
      wechatLogger.logCallback(url, true, { step: '开始处理' });
      
      // 解析回调URL中的参数
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      
      wechatLogger.logSDKOperation('解析回调URL', { code, state });
      
      if (!code) {
        wechatLogger.logError(new Error('回调URL中缺少授权码'), 'handleCallback');
        throw new Error('回调URL中缺少授权码');
      }
      
      // 使用授权码进行登录
      const result = await this.login(code, state || undefined);
      
      // 记录回调处理完成
      const endTime = Date.now();
      wechatLogger.logPerformance('微信回调处理', startTime, endTime);
      wechatLogger.logCallback(url, true, { 
        success: result.success,
        hasData: !!result.data,
        hasUser: !!result.data?.user,
        hasToken: !!result.data?.token
      });
      
      return result;
    } catch (error) {
      // 记录错误信息
      wechatLogger.logError(error, 'handleCallback');
      
      // 记录性能信息
      const endTime = Date.now();
      wechatLogger.logPerformance('微信回调处理(失败)', startTime, endTime);
      wechatLogger.logCallback(url, false, { error: error.message });
      
      throw error;
    }
  }

  /**
   * 微信登录
   */
  static async login(code: string, state?: string): Promise<WechatLoginResponse> {
    const startTime = Date.now();
    
    try {
      // 记录网络请求
      wechatLogger.logNetworkRequest(`${this.baseUrl}/login`, 'POST', { code, state });
      
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();
      const endTime = Date.now();

      // 记录网络响应
      wechatLogger.logNetworkResponse(data, endTime - startTime);

      if (!response.ok) {
        wechatLogger.logError(new Error(data.message || '微信登录失败'), 'login');
        throw new Error(data.message || '微信登录失败');
      }

      return data;
    } catch (error) {
      // 记录错误信息
      wechatLogger.logError(error, 'login');
      
      // 记录性能信息
      const endTime = Date.now();
      wechatLogger.logPerformance('微信登录API调用(失败)', startTime, endTime);
      
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
    const startTime = Date.now();
    
    try {
      // 记录登录流程开始
      wechatLogger.logLoginStart('performLogin');
      
      // 记录配置信息
      wechatLogger.logConfig({
        appId: this.appId,
        universalLink: this.universalLink,
        baseUrl: this.baseUrl
      });
      
      // 1. 注册微信应用
      wechatLogger.logSDKOperation('注册微信应用', { step: 1 });
      const registered = await this.registerApp();
      wechatLogger.logSDKOperation('注册结果', { success: registered });
      
      if (!registered) {
        wechatLogger.logError(new Error('微信SDK注册失败'), 'registerApp');
        throw new Error('微信SDK初始化失败，请重试。如果问题持续，请检查：1. 设备是否安装了微信应用 2. 网络连接是否正常');
      }

      // 2. 检查微信是否已安装
      wechatLogger.logSDKOperation('检查微信安装状态', { step: 2 });
      const installed = await this.isWXInstalled();
      wechatLogger.logSDKOperation('安装检查结果', { installed });
      
      if (!installed) {
        wechatLogger.logError(new Error('微信未安装'), 'isWXInstalled');
        throw new Error('请先安装微信应用，然后重试');
      }

      // 3. 生成状态参数
      wechatLogger.logSDKOperation('生成状态参数', { step: 3 });
      const state = this.generateState();
      wechatLogger.logSDKOperation('生成的状态', { state });

      // 4. 发送授权请求
      wechatLogger.logSDKOperation('发送授权请求', { step: 4 });
      const authResult = await this.sendAuthRequest(state);
      wechatLogger.logSDKOperation('授权请求结果', authResult);

      // 5. 调用后端登录API
      wechatLogger.logSDKOperation('调用后端登录API', { step: 5 });
      const loginResult = await this.login(authResult.code, authResult.state);
      wechatLogger.logSDKOperation('登录API结果', {
        success: loginResult.success,
        hasData: !!loginResult.data,
        hasUser: !!loginResult.data?.user,
        hasToken: !!loginResult.data?.token
      });

      // 记录登录流程完成
      const endTime = Date.now();
      wechatLogger.logPerformance('微信登录流程', startTime, endTime);
      wechatLogger.logLoginComplete(true, 'performLogin');
      
      return loginResult;
    } catch (error) {
      // 记录错误信息
      wechatLogger.logError(error, 'performLogin');
      
      // 记录性能信息
      const endTime = Date.now();
      wechatLogger.logPerformance('微信登录流程(失败)', startTime, endTime);
      wechatLogger.logLoginComplete(false, 'performLogin');
      
      // 提供更详细的错误信息
      if (error.message.includes('SDK')) {
        throw new Error('微信SDK初始化失败，请重试。如果问题持续，请检查：1. 设备是否安装了微信应用 2. 网络连接是否正常 3. 微信应用是否最新版本');
      }
      
      throw error;
    }
  }

  /**
   * Mock微信登录流程（已禁用）
   */
  private static async performMockLogin(): Promise<WechatLoginResponse> {
    throw new Error('Mock模式已禁用，请使用真实微信登录');
  }
} 