import { API_BASE_URL } from '../constants/config';
import { Platform } from 'react-native';
import WechatSDK from './wechatSDK';
import { wechatLogger } from '../utils/wechatLogger';
import Constants from 'expo-constants';

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
   * 检查是否在EXPO GO环境中
   */
  private static isExpoGo(): boolean {
    return Constants.appOwnership === 'expo';
  }

  /**
   * 注册微信应用
   */
  static async registerApp(): Promise<boolean> {
    const maxRetries = 3;
    let lastError: any;
    
    console.log('🔧 开始微信SDK注册流程...');
    console.log('🔧 平台:', Platform.OS);
    console.log('🔧 运行环境:', this.isExpoGo() ? 'EXPO GO' : 'Development Build');
    console.log('🔧 配置:', {
      appId: this.appId,
      universalLink: this.universalLink
    });
    
    // 在EXPO GO中禁用微信登录
    if (this.isExpoGo()) {
      console.error('🔧 微信登录在EXPO GO中不可用');
      console.error('🔧 请使用 expo run:ios 或 expo run:android 进行测试');
      throw new Error('微信登录在EXPO GO中不可用，请使用Development Build');
    }
    
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
          console.log(`🔧 等待 ${attempt * 1000}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }
    
    console.error('🔧 微信SDK注册失败，已达到最大重试次数');
    throw lastError || new Error('微信SDK注册失败');
  }

  /**
   * 检查微信是否已安装
   */
  static async isWXInstalled(): Promise<boolean> {
    try {
      console.log('🔧 检查微信是否已安装...');
      
      // 在EXPO GO中禁用微信登录
      if (this.isExpoGo()) {
        console.error('🔧 微信登录在EXPO GO中不可用');
        throw new Error('微信登录在EXPO GO中不可用，请使用Development Build');
      }
      
      const result = await WechatSDK.isWXAppInstalled();
      console.log('🔧 微信安装状态:', result);
      return result;
    } catch (error) {
      console.error('🔧 检查微信安装状态失败:', error);
      throw error;
    }
  }

  /**
   * 发送微信授权请求
   */
  static async sendAuthRequest(state: string): Promise<{ code: string; state: string }> {
    try {
      console.log('🔧 发送微信授权请求...');
      
      // 在EXPO GO中禁用微信登录
      if (this.isExpoGo()) {
        console.error('🔧 微信登录在EXPO GO中不可用');
        throw new Error('微信登录在EXPO GO中不可用，请使用Development Build');
      }
      
      const scope = 'snsapi_userinfo';
      const result = await WechatSDK.sendAuthRequest(scope, state);
      console.log('🔧 微信授权请求结果:', result);
      return result;
    } catch (error) {
      console.error('🔧 微信授权请求失败:', error);
      throw error;
    }
  }

  /**
   * 处理微信回调URL
   */
  static async handleOpenURL(url: string): Promise<boolean> {
    try {
      console.log('🔧 处理微信回调URL:', url);
      
      // 在EXPO GO中禁用微信登录
      if (this.isExpoGo()) {
        console.error('🔧 微信登录在EXPO GO中不可用');
        throw new Error('微信登录在EXPO GO中不可用，请使用Development Build');
      }
      
      const result = await WechatSDK.handleOpenURL(url);
      console.log('🔧 处理微信回调URL结果:', result);
      return result;
    } catch (error) {
      console.error('🔧 处理微信回调URL失败:', error);
      throw error;
    }
  }

  /**
   * 处理微信登录回调
   */
  static async handleCallback(url: string): Promise<WechatLoginResponse> {
    try {
      console.log('🔧 处理微信登录回调:', url);
      
      // 在EXPO GO中禁用微信登录
      if (this.isExpoGo()) {
        console.error('🔧 微信登录在EXPO GO中不可用');
        throw new Error('微信登录在EXPO GO中不可用，请使用Development Build');
      }
      
      // 解析URL中的code和state
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      
      if (!code) {
        throw new Error('未找到授权码');
      }
      
      console.log('🔧 解析到授权码:', code.substring(0, 10) + '...');
      console.log('🔧 解析到状态:', state);
      
      // 调用后端登录API
      return await this.login(code, state);
    } catch (error) {
      console.error('🔧 处理微信登录回调失败:', error);
      throw error;
    }
  }

  /**
   * 微信登录
   */
  static async login(code: string, state?: string): Promise<WechatLoginResponse> {
    try {
      console.log('🔧 开始微信登录...');
      
      // 在EXPO GO中禁用微信登录
      if (this.isExpoGo()) {
        console.error('🔧 微信登录在EXPO GO中不可用');
        throw new Error('微信登录在EXPO GO中不可用，请使用Development Build');
      }
      
      const loginData = {
        code: code,
        state: state || 'dramaword_wechat_login'
      };
      
      console.log('🔧 登录数据:', {
        code: code.substring(0, 10) + '...',
        state: loginData.state
      });
      
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      
      const result = await response.json();
      console.log('🔧 微信登录结果:', {
        success: result.success,
        hasData: !!result.data,
        message: result.message
      });
      
      return result;
    } catch (error) {
      console.error('🔧 微信登录失败:', error);
      throw error;
    }
  }

  /**
   * 获取微信授权URL
   */
  static async getAuthUrl(redirectUri: string, state?: string): Promise<WechatAuthUrlResponse> {
    try {
      console.log('🔧 获取微信授权URL...');
      
      const response = await fetch(`${this.baseUrl}/auth-url?redirectUri=${encodeURIComponent(redirectUri)}&state=${state || 'dramaword_wechat_login'}`);
      const result = await response.json();
      
      console.log('🔧 授权URL结果:', result);
      return result;
    } catch (error) {
      console.error('🔧 获取微信授权URL失败:', error);
      throw error;
    }
  }

  /**
   * 刷新微信Token
   */
  static async refreshToken(refreshToken: string): Promise<WechatRefreshResponse> {
    try {
      console.log('🔧 刷新微信Token...');
      
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      const result = await response.json();
      console.log('🔧 Token刷新结果:', result);
      return result;
    } catch (error) {
      console.error('🔧 刷新微信Token失败:', error);
      throw error;
    }
  }

  /**
   * 检查微信Token有效性
   */
  static async checkToken(accessToken: string, openid: string): Promise<boolean> {
    try {
      console.log('🔧 检查微信Token有效性...');
      
      const response = await fetch(`${this.baseUrl}/check-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken, openid }),
      });
      
      const result = await response.json();
      console.log('🔧 Token检查结果:', result);
      return result.valid;
    } catch (error) {
      console.error('🔧 检查微信Token失败:', error);
      throw error;
    }
  }

  /**
   * 解绑微信账号
   */
  static async unbind(token: string): Promise<void> {
    try {
      console.log('🔧 解绑微信账号...');
      
      const response = await fetch(`${this.baseUrl}/unbind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      console.log('🔧 解绑结果:', result);
    } catch (error) {
      console.error('🔧 解绑微信账号失败:', error);
      throw error;
    }
  }

  /**
   * 生成状态参数
   */
  static generateState(): string {
    return `dramaword_wechat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证状态参数
   */
  static validateState(state: string): boolean {
    return state && state.startsWith('dramaword_wechat_');
  }

  /**
   * 执行微信登录流程
   */
  static async performLogin(): Promise<WechatLoginResponse> {
    try {
      console.log('🔧 开始执行微信登录流程...');
      
      // 在EXPO GO中禁用微信登录
      if (this.isExpoGo()) {
        console.error('🔧 微信登录在EXPO GO中不可用');
        throw new Error('微信登录在EXPO GO中不可用，请使用Development Build');
      }
      
      // 1. 注册微信应用
      console.log('🔧 步骤1: 注册微信应用');
      await this.registerApp();
      
      // 2. 检查微信是否已安装
      console.log('🔧 步骤2: 检查微信是否已安装');
      const isInstalled = await this.isWXInstalled();
      if (!isInstalled) {
        throw new Error('微信未安装，请先安装微信应用');
      }
      
      // 3. 生成状态参数
      console.log('🔧 步骤3: 生成状态参数');
      const state = this.generateState();
      
      // 4. 发送授权请求
      console.log('🔧 步骤4: 发送授权请求');
      const authResult = await this.sendAuthRequest(state);
      
      // 5. 调用后端登录API
      console.log('🔧 步骤5: 调用后端登录API');
      const loginResult = await this.login(authResult.code, authResult.state);
      
      console.log('🔧 微信登录流程完成');
      return loginResult;
    } catch (error) {
      console.error('🔧 微信登录流程失败:', error);
      throw error;
    }
  }
} 