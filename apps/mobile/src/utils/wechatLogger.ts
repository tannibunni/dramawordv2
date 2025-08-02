/**
 * 微信登录日志工具
 * 用于统一管理和记录微信登录相关的日志
 */

export class WechatLogger {
  private static instance: WechatLogger;
  private logPrefix = '💬 [WeChat]';
  private isDebugMode = __DEV__;

  private constructor() {}

  static getInstance(): WechatLogger {
    if (!WechatLogger.instance) {
      WechatLogger.instance = new WechatLogger();
    }
    return WechatLogger.instance;
  }

  /**
   * 记录微信登录流程开始
   */
  logLoginStart(context: string = '') {
    this.log('===== 微信登录流程开始 =====');
    this.log('时间戳:', new Date().toISOString());
    this.log('上下文:', context);
  }

  /**
   * 记录微信登录流程完成
   */
  logLoginComplete(success: boolean, context: string = '') {
    this.log('===== 微信登录流程完成 =====');
    this.log('结果:', success ? '成功' : '失败');
    this.log('上下文:', context);
    this.log('时间戳:', new Date().toISOString());
  }

  /**
   * 记录微信SDK相关操作
   */
  logSDKOperation(operation: string, details: any = {}) {
    this.log(`SDK操作: ${operation}`);
    this.log('详情:', details);
  }

  /**
   * 记录微信回调处理
   */
  logCallback(url: string, success: boolean, details: any = {}) {
    this.log('===== 微信回调处理 =====');
    this.log('URL:', url);
    this.log('结果:', success ? '成功' : '失败');
    this.log('详情:', details);
  }

  /**
   * 记录错误信息
   */
  logError(error: any, context: string = '') {
    this.log('===== 微信登录错误 =====');
    this.log('上下文:', context);
    this.log('错误类型:', error?.constructor?.name || 'Unknown');
    this.log('错误消息:', error?.message || 'Unknown error');
    this.log('错误堆栈:', error?.stack || 'No stack trace');
    this.log('错误详情:', {
      name: error?.name,
      code: error?.code,
      cause: error?.cause
    });
  }

  /**
   * 记录性能信息
   */
  logPerformance(operation: string, startTime: number, endTime: number) {
    const duration = endTime - startTime;
    this.log(`性能: ${operation}`);
    this.log('耗时:', `${duration}ms`);
    this.log('开始时间:', new Date(startTime).toISOString());
    this.log('结束时间:', new Date(endTime).toISOString());
  }

  /**
   * 记录用户数据
   */
  logUserData(userData: any, context: string = '') {
    this.log('===== 用户数据 =====');
    this.log('上下文:', context);
    this.log('用户ID:', userData?.id);
    this.log('昵称:', userData?.nickname);
    this.log('登录类型:', userData?.loginType);
    this.log('有头像:', !!userData?.avatar);
    this.log('有Token:', !!userData?.token);
  }

  /**
   * 记录网络请求
   */
  logNetworkRequest(url: string, method: string, data: any = {}) {
    this.log('===== 网络请求 =====');
    this.log('URL:', url);
    this.log('方法:', method);
    this.log('数据:', data);
  }

  /**
   * 记录网络响应
   */
  logNetworkResponse(response: any, duration: number) {
    this.log('===== 网络响应 =====');
    this.log('状态:', response?.success ? '成功' : '失败');
    this.log('耗时:', `${duration}ms`);
    this.log('响应数据:', {
      hasData: !!response?.data,
      hasUser: !!response?.data?.user,
      hasToken: !!response?.data?.token,
      message: response?.message
    });
  }

  /**
   * 记录设备信息
   */
  logDeviceInfo(deviceInfo: any) {
    this.log('===== 设备信息 =====');
    this.log('设备名称:', deviceInfo?.deviceName);
    this.log('设备型号:', deviceInfo?.modelName);
    this.log('系统版本:', deviceInfo?.osVersion);
    this.log('平台:', deviceInfo?.platform);
  }

  /**
   * 记录配置信息
   */
  logConfig(config: any) {
    this.log('===== 配置信息 =====');
    this.log('AppID:', config?.appId);
    this.log('Universal Link:', config?.universalLink);
    this.log('Bundle ID:', config?.bundleId);
  }

  /**
   * 通用日志方法
   */
  log(message: string, data?: any) {
    if (this.isDebugMode) {
      if (data !== undefined) {
        console.log(this.logPrefix, message, data);
      } else {
        console.log(this.logPrefix, message);
      }
    }
  }

  /**
   * 警告日志
   */
  warn(message: string, data?: any) {
    if (this.isDebugMode) {
      if (data !== undefined) {
        console.warn(this.logPrefix, message, data);
      } else {
        console.warn(this.logPrefix, message);
      }
    }
  }

  /**
   * 错误日志
   */
  error(message: string, data?: any) {
    if (this.isDebugMode) {
      if (data !== undefined) {
        console.error(this.logPrefix, message, data);
      } else {
        console.error(this.logPrefix, message);
      }
    }
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled: boolean) {
    this.isDebugMode = enabled;
  }

  /**
   * 获取调试模式状态
   */
  getDebugMode(): boolean {
    return this.isDebugMode;
  }
}

// 导出单例实例
export const wechatLogger = WechatLogger.getInstance(); 