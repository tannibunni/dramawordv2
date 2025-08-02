import axios from 'axios';
import { wechatConfig, wechatErrorCodes } from '../config/wechat';
import { logger } from '../utils/logger';

// 微信登录响应接口
export interface WechatAccessTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatUserInfoResponse {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatTokenCheckResponse {
  errcode: number;
  errmsg: string;
}

// 微信登录服务类
export class WechatService {
  /**
   * 获取微信授权URL
   */
  static getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      appid: wechatConfig.appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: wechatConfig.scope,
      state: state || wechatConfig.state,
    });
    
    return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
  }

  /**
   * 通过授权码获取access_token
   */
  static async getAccessToken(code: string): Promise<WechatAccessTokenResponse> {
    try {
      logger.info(`💬 开始获取微信 access_token`);
      logger.info(`💬 使用的 AppID: ${wechatConfig.appId}`);
      logger.info(`💬 AppSecret 状态: ${wechatConfig.appSecret ? '已设置' : '未设置'}`);
      logger.info(`💬 授权码长度: ${code.length}`);
      
      // 检查是否为开发模式的模拟授权码
      if (code.startsWith('mock_wechat_code_')) {
        logger.info(`💬 检测到开发模式模拟授权码，使用模拟响应`);
        
        // 返回模拟的微信登录响应
        const mockResponse: WechatAccessTokenResponse = {
          access_token: 'mock_access_token_' + Date.now(),
          expires_in: 7200,
          refresh_token: 'mock_refresh_token_' + Date.now(),
          openid: 'mock_openid_' + Date.now(),
          scope: 'snsapi_userinfo',
          unionid: 'mock_unionid_' + Date.now()
        };
        
        logger.info(`💬 返回模拟 access_token 响应: openid=${mockResponse.openid}`);
        return mockResponse;
      }
      
      const params = new URLSearchParams({
        appid: wechatConfig.appId,
        secret: wechatConfig.appSecret,
        code: code,
        grant_type: 'authorization_code',
      });

      logger.info(`💬 请求微信 API: ${wechatConfig.api.accessToken}`);
      
      const response = await axios.get(`${wechatConfig.api.accessToken}?${params.toString()}`);
      const data = response.data as WechatAccessTokenResponse;

      logger.info(`💬 微信 API 响应状态: ${response.status}`);
      logger.info(`💬 响应数据:`, data);

      if (data.errcode) {
        const errorMessage = wechatErrorCodes[String(data.errcode) as keyof typeof wechatErrorCodes] || data.errmsg || '未知错误';
        logger.error(`💬 微信获取access_token失败: ${data.errcode} - ${errorMessage}`);
        logger.error(`💬 错误详情:`, data);
        throw new Error(`微信登录失败: ${errorMessage}`);
      }

      logger.info(`💬 微信获取access_token成功: openid=${data.openid}`);
      logger.info(`💬 access_token 长度: ${data.access_token ? data.access_token.length : 0}`);
      logger.info(`💬 expires_in: ${data.expires_in}`);
      return data;
    } catch (error) {
      logger.error('💬 微信获取access_token异常:', error);
      throw new Error('微信登录服务异常');
    }
  }

  /**
   * 获取微信用户信息
   */
  static async getUserInfo(accessToken: string, openid: string): Promise<WechatUserInfoResponse> {
    try {
      // 检查是否为开发模式的模拟 token
      if (accessToken.startsWith('mock_access_token_')) {
        logger.info(`💬 检测到开发模式模拟 access_token，使用模拟用户信息`);
        
        // 返回模拟的用户信息
        const mockUserInfo: WechatUserInfoResponse = {
          openid: openid,
          nickname: '微信用户_' + Math.random().toString(36).substr(2, 6),
          sex: 1,
          province: '北京',
          city: '北京',
          country: '中国',
          headimgurl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKxrqss1Y4GxM/132',
          privilege: [],
          unionid: openid.replace('mock_openid_', 'mock_unionid_')
        };
        
        logger.info(`💬 返回模拟用户信息: nickname=${mockUserInfo.nickname}`);
        return mockUserInfo;
      }
      
      const params = new URLSearchParams({
        access_token: accessToken,
        openid: openid,
        lang: 'zh_CN',
      });

      const response = await axios.get(`${wechatConfig.api.userInfo}?${params.toString()}`);
      const data = response.data as WechatUserInfoResponse;

      if (data.errcode) {
        const errorMessage = wechatErrorCodes[String(data.errcode) as keyof typeof wechatErrorCodes] || data.errmsg || '未知错误';
        logger.error(`💬 微信获取用户信息失败: ${data.errcode} - ${errorMessage}`);
        throw new Error(`获取用户信息失败: ${errorMessage}`);
      }

      logger.info(`💬 微信获取用户信息成功: nickname=${data.nickname}`);
      return data;
    } catch (error) {
      logger.error('💬 微信获取用户信息异常:', error);
      throw new Error('获取用户信息异常');
    }
  }

  /**
   * 刷新access_token
   */
  static async refreshAccessToken(refreshToken: string): Promise<WechatAccessTokenResponse> {
    try {
      const params = new URLSearchParams({
        appid: wechatConfig.appId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const response = await axios.get(`${wechatConfig.api.refreshToken}?${params.toString()}`);
      const data = response.data as WechatAccessTokenResponse;

      if (data.errcode) {
        const errorMessage = wechatErrorCodes[String(data.errcode) as keyof typeof wechatErrorCodes] || data.errmsg || '未知错误';
        logger.error(`微信刷新access_token失败: ${data.errcode} - ${errorMessage}`);
        throw new Error(`刷新token失败: ${errorMessage}`);
      }

      logger.info(`微信刷新access_token成功: openid=${data.openid}`);
      return data;
    } catch (error) {
      logger.error('微信刷新access_token异常:', error);
      throw new Error('刷新token异常');
    }
  }

  /**
   * 检查access_token是否有效
   */
  static async checkAccessToken(accessToken: string, openid: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        openid: openid,
      });

      const response = await axios.get(`${wechatConfig.api.checkToken}?${params.toString()}`);
      const data = response.data as WechatTokenCheckResponse;

      if (data.errcode === 0) {
        logger.info(`微信access_token有效: openid=${openid}`);
        return true;
      } else {
        logger.warn(`微信access_token无效: ${data.errcode} - ${data.errmsg}`);
        return false;
      }
    } catch (error) {
      logger.error('微信检查access_token异常:', error);
      return false;
    }
  }

  /**
   * 完整的微信登录流程
   */
  static async login(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    openid: string;
    unionid?: string;
    userInfo: WechatUserInfoResponse;
    expires_in: number;
  }> {
    try {
      logger.info(`💬 开始微信登录流程`);
      logger.info(`💬 步骤 1: 获取 access_token`);
      
      // 1. 获取access_token
      const tokenResponse = await this.getAccessToken(code);
      
      logger.info(`💬 步骤 2: 获取用户信息`);
      logger.info(`💬 使用 access_token 获取用户信息: openid=${tokenResponse.openid}`);
      
      // 2. 获取用户信息
      const userInfo = await this.getUserInfo(tokenResponse.access_token, tokenResponse.openid);
      
      logger.info(`💬 微信登录流程完成`);
      logger.info(`💬 最终结果: openid=${tokenResponse.openid}, nickname=${userInfo.nickname}`);
      logger.info(`💬 用户信息详情:`, {
        openid: userInfo.openid,
        nickname: userInfo.nickname,
        headimgurl: userInfo.headimgurl ? '已获取' : '未获取',
        sex: userInfo.sex,
        country: userInfo.country,
        province: userInfo.province,
        city: userInfo.city
      });
      
      return {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        openid: tokenResponse.openid,
        unionid: tokenResponse.unionid || undefined,
        userInfo,
        expires_in: tokenResponse.expires_in,
      };
    } catch (error) {
      logger.error('💬 微信登录流程异常:', error);
      throw error;
    }
  }

  /**
   * 验证微信登录参数
   */
  static validateLoginParams(code: string): boolean {
    if (!code || typeof code !== 'string' || code.length === 0) {
      return false;
    }
    return true;
  }

  /**
   * 生成微信登录状态
   */
  static generateState(): string {
    return `${wechatConfig.state}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证微信登录状态
   */
  static validateState(state: string): boolean {
    if (!state || typeof state !== 'string') {
      return false;
    }
    return state.startsWith(wechatConfig.state);
  }
} 