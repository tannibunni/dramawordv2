import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 微信SDK 接口定义
export interface WechatSDKInterface {
  registerApp(appId: string, universalLink: string): Promise<boolean>;
  isWXAppInstalled(): Promise<boolean>;
  sendAuthRequest(scope: string, state: string): Promise<{ code: string; state: string }>;
  handleOpenURL(url: string): Promise<boolean>;
}

// 检查是否在EXPO GO环境中
const isExpoGo = Constants.appOwnership === 'expo';

// 真实的微信SDK实现
class RealWechatSDK implements WechatSDKInterface {
  private appId: string = 'wxa225945508659eb8';
  private universalLink: string = 'https://dramaword.com/app/';

  async registerApp(appId: string, universalLink: string): Promise<boolean> {
    try {
      console.log('🔍 开始微信SDK注册流程...');
      console.log('🔍 参数检查:', { appId, universalLink });
      console.log('🔍 平台:', Platform.OS);
      console.log('🔍 运行环境:', isExpoGo ? 'EXPO GO' : 'Development Build');
      
      // 在EXPO GO中禁用微信登录
      if (isExpoGo) {
        console.error('🔍 微信登录在EXPO GO中不可用');
        console.error('🔍 请使用 expo run:ios 或 expo run:android 进行测试');
        throw new Error('微信登录在EXPO GO中不可用，请使用Development Build');
      }
      
      // 检查 react-native-wechat-lib 模块
      console.log('🔍 尝试加载 react-native-wechat-lib...');
      let Wechat;
      try {
        const wechatModule = require('react-native-wechat-lib');
        console.log('🔍 wechatModule 内容:', Object.keys(wechatModule));
        Wechat = wechatModule;
        console.log('🔍 Wechat 对象:', Wechat ? '存在' : '不存在');
        console.log('🔍 Wechat 类型:', typeof Wechat);
        console.log('🔍 Wechat 方法:', Wechat ? Object.keys(Wechat) : 'N/A');
      } catch (moduleError) {
        console.error('🔍 加载 react-native-wechat-lib 模块失败:', moduleError);
        console.error('🔍 模块错误详情:', {
          message: (moduleError as any).message || 'Unknown error',
          stack: (moduleError as any).stack || 'No stack trace',
          code: (moduleError as any).code || 'Unknown code'
        });
        throw new Error('微信SDK模块加载失败，请确保已正确安装react-native-wechat-lib');
      }
      
      // 检查 Wechat 对象是否存在
      if (!Wechat) {
        console.error('🔍 Wechat 对象不存在');
        throw new Error('微信SDK对象不存在');
      }
      
      if (typeof Wechat !== 'object') {
        console.error('🔍 Wechat 不是对象，类型:', typeof Wechat);
        throw new Error('微信SDK对象类型错误');
      }
      
      // react-native-wechat-lib 使用 registerApp 方法，但参数可能不同
      console.log('🔍 检查 registerApp 方法...');
      if (!Wechat.registerApp) {
        console.error('🔍 Wechat.registerApp 方法不存在');
        console.log('🔍 Wechat 可用方法:', Object.keys(Wechat));
        throw new Error('微信SDK registerApp方法不存在');
      }
      
      if (typeof Wechat.registerApp !== 'function') {
        console.error('🔍 Wechat.registerApp 不是函数，类型:', typeof Wechat.registerApp);
        throw new Error('微信SDK registerApp不是函数');
      }
      
      console.log('🔍 调用 Wechat.registerApp...');
      console.log('🔍 调用参数:', { appId, universalLink });
      
      // react-native-wechat-lib 可能只需要 appId 参数
      const result = await Wechat.registerApp(appId);
      console.log('🔍 微信SDK注册结果:', result);
      console.log('🔍 结果类型:', typeof result);
      
      return Boolean(result);
    } catch (error) {
      console.error('🔍 微信SDK注册失败:', error);
      console.error('🔍 错误详情:', {
        name: (error as any).name || 'Unknown',
        message: (error as any).message || 'Unknown error',
        stack: (error as any).stack || 'No stack trace',
        code: (error as any).code || 'Unknown code'
      });
      throw error;
    }
  }

  async isWXAppInstalled(): Promise<boolean> {
    try {
      console.log('🔍 开始检查微信安装状态...');
      
      // 在EXPO GO中禁用微信登录
      if (isExpoGo) {
        console.error('🔍 微信登录在EXPO GO中不可用');
        throw new Error('微信登录在EXPO GO中不可用，请使用Development Build');
      }
      
      const Wechat = require('react-native-wechat-lib');
      console.log('🔍 Wechat 对象检查:', Wechat ? '存在' : '不存在');
      
      if (!Wechat || typeof Wechat.isWXAppInstalled !== 'function') {
        console.error('🔍 Wechat.isWXAppInstalled 方法不可用');
        throw new Error('微信SDK isWXAppInstalled方法不可用');
      }
      
      const result = await Wechat.isWXAppInstalled();
      console.log('🔍 微信安装状态检查结果:', result);
      console.log('🔍 结果类型:', typeof result);
      
      return Boolean(result);
    } catch (error) {
      console.error('🔍 检查微信安装状态失败:', error);
      console.error('🔍 错误详情:', {
        name: (error as any).name || 'Unknown',
        message: (error as any).message || 'Unknown error',
        stack: (error as any).stack || 'No stack trace'
      });
      throw error;
    }
  }

  async sendAuthRequest(scope: string, state: string): Promise<{ code: string; state: string }> {
    try {
      console.log('🔍 开始微信授权请求...');
      
      // 在EXPO GO中禁用微信登录
      if (isExpoGo) {
        console.error('🔍 微信登录在EXPO GO中不可用');
        throw new Error('微信登录在EXPO GO中不可用，请使用Development Build');
      }
      
      const Wechat = require('react-native-wechat-lib');
      // react-native-wechat-lib 可能使用不同的方法名或参数
      const result = await Wechat.sendAuthRequest(scope, state);
      console.log('🔍 微信授权请求结果:', result);
      return result;
    } catch (error) {
      console.error('🔍 微信授权请求失败:', error);
      throw error;
    }
  }

  async handleOpenURL(url: string): Promise<boolean> {
    try {
      console.log('🔍 开始处理微信回调URL...');
      
      // 在EXPO GO中禁用微信登录
      if (isExpoGo) {
        console.error('🔍 微信登录在EXPO GO中不可用');
        throw new Error('微信登录在EXPO GO中不可用，请使用Development Build');
      }
      
      const Wechat = require('react-native-wechat-lib');
      // react-native-wechat-lib 可能使用不同的方法名
      const result = await Wechat.handleOpenURL(url);
      console.log('🔍 处理微信回调URL结果:', result);
      return result;
    } catch (error) {
      console.error('🔍 处理微信回调URL失败:', error);
      throw error;
    }
  }
}

// 导出真实SDK实现
const WechatSDK: WechatSDKInterface = new RealWechatSDK();

export default WechatSDK; 