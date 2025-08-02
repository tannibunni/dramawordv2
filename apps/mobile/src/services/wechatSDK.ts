import { Platform } from 'react-native';

// 微信SDK 接口定义
export interface WechatSDKInterface {
  registerApp(appId: string, universalLink: string): Promise<boolean>;
  isWXAppInstalled(): Promise<boolean>;
  sendAuthRequest(scope: string, state: string): Promise<{ code: string; state: string }>;
  handleOpenURL(url: string): Promise<boolean>;
}

// 真实的微信SDK实现
class RealWechatSDK implements WechatSDKInterface {
  private appId: string = 'wxa225945508659eb8';
  private universalLink: string = 'https://dramaword.com/app/';

  async registerApp(appId: string, universalLink: string): Promise<boolean> {
    try {
      console.log('🔍 开始微信SDK注册流程...');
      console.log('🔍 参数检查:', { appId, universalLink });
      console.log('🔍 平台:', Platform.OS);
      
      // 检查 expo-wechat 模块
      console.log('🔍 尝试加载 expo-wechat...');
      let Wechat;
      try {
        const wechatModule = require('expo-wechat');
        console.log('🔍 wechatModule 内容:', Object.keys(wechatModule));
        Wechat = wechatModule;
        console.log('🔍 Wechat 对象:', Wechat ? '存在' : '不存在');
        console.log('🔍 Wechat 类型:', typeof Wechat);
        console.log('🔍 Wechat 方法:', Wechat ? Object.keys(Wechat) : 'N/A');
      } catch (moduleError) {
        console.error('🔍 加载 expo-wechat 模块失败:', moduleError);
        console.error('🔍 模块错误详情:', {
          message: moduleError.message,
          stack: moduleError.stack,
          code: moduleError.code
        });
        return false;
      }
      
      // 检查 Wechat 对象是否存在
      if (!Wechat) {
        console.error('🔍 Wechat 对象不存在');
        return false;
      }
      
      if (typeof Wechat !== 'object') {
        console.error('🔍 Wechat 不是对象，类型:', typeof Wechat);
        return false;
      }
      
      // 检查 registerApp 方法
      console.log('🔍 检查 registerApp 方法...');
      if (!Wechat.registerApp) {
        console.error('🔍 Wechat.registerApp 方法不存在');
        console.log('🔍 Wechat 可用方法:', Object.keys(Wechat));
        return false;
      }
      
      if (typeof Wechat.registerApp !== 'function') {
        console.error('🔍 Wechat.registerApp 不是函数，类型:', typeof Wechat.registerApp);
        return false;
      }
      
      console.log('🔍 调用 Wechat.registerApp...');
      console.log('🔍 调用参数:', { appId, universalLink });
      
      const result = await Wechat.registerApp(appId, universalLink);
      console.log('🔍 微信SDK注册结果:', result);
      console.log('🔍 结果类型:', typeof result);
      
      return Boolean(result);
    } catch (error) {
      console.error('🔍 微信SDK注册失败:', error);
      console.error('🔍 错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      return false;
    }
  }

  async isWXAppInstalled(): Promise<boolean> {
    try {
      console.log('🔍 开始检查微信安装状态...');
      
      const Wechat = require('expo-wechat');
      console.log('🔍 Wechat 对象检查:', Wechat ? '存在' : '不存在');
      
      if (!Wechat || typeof Wechat.isWXAppInstalled !== 'function') {
        console.error('🔍 Wechat.isWXAppInstalled 方法不可用');
        return false;
      }
      
      const result = await Wechat.isWXAppInstalled();
      console.log('🔍 微信安装状态检查结果:', result);
      console.log('🔍 结果类型:', typeof result);
      
      return Boolean(result);
    } catch (error) {
      console.error('🔍 检查微信安装状态失败:', error);
      console.error('🔍 错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  async sendAuthRequest(scope: string, state: string): Promise<{ code: string; state: string }> {
    try {
      const Wechat = require('expo-wechat');
      const result = await Wechat.sendAuthRequest(scope, state);
      console.log('微信授权请求结果:', result);
      return result;
    } catch (error) {
      console.error('微信授权请求失败:', error);
      throw error;
    }
  }

  async handleOpenURL(url: string): Promise<boolean> {
    try {
      const Wechat = require('expo-wechat');
      const result = await Wechat.handleOpenURL(url);
      console.log('处理微信回调URL结果:', result);
      return result;
    } catch (error) {
      console.error('处理微信回调URL失败:', error);
      return false;
    }
  }
}

// 开发环境模拟SDK
class MockWechatSDK implements WechatSDKInterface {
  async registerApp(appId: string, universalLink: string): Promise<boolean> {
    console.log('模拟注册微信应用:', { appId, universalLink });
    return true;
  }

  async isWXAppInstalled(): Promise<boolean> {
    console.log('模拟检查微信安装状态');
    return true;
  }

  async sendAuthRequest(scope: string, state: string): Promise<{ code: string; state: string }> {
    console.log('模拟微信授权请求:', { scope, state });
    return {
      code: 'mock_wechat_code_' + Date.now(),
      state: state,
    };
  }

  async handleOpenURL(url: string): Promise<boolean> {
    console.log('模拟处理微信回调URL:', url);
    return true;
  }
}

// 根据环境选择SDK实现
// 强制使用真实SDK进行测试
const WechatSDK: WechatSDKInterface = new RealWechatSDK();

export default WechatSDK; 