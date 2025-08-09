/**
 * 微信登录日志功能测试脚本
 * 用于验证微信登录相关的日志记录功能
 */

// 模拟微信日志工具类
class WechatLogger {
  constructor() {
    this.logPrefix = '💬 [WeChat]';
    this.isDebugMode = true;
  }

  log(message, data) {
    if (this.isDebugMode) {
      if (data !== undefined) {
        console.log(this.logPrefix, message, data);
      } else {
        console.log(this.logPrefix, message);
      }
    }
  }

  warn(message, data) {
    if (this.isDebugMode) {
      if (data !== undefined) {
        console.warn(this.logPrefix, message, data);
      } else {
        console.warn(this.logPrefix, message);
      }
    }
  }

  error(message, data) {
    if (this.isDebugMode) {
      if (data !== undefined) {
        console.error(this.logPrefix, message, data);
      } else {
        console.error(this.logPrefix, message);
      }
    }
  }

  logLoginStart(context = '') {
    this.log('===== 微信登录流程开始 =====');
    this.log('时间戳:', new Date().toISOString());
    this.log('上下文:', context);
  }

  logLoginComplete(success, context = '') {
    this.log('===== 微信登录流程完成 =====');
    this.log('结果:', success ? '成功' : '失败');
    this.log('上下文:', context);
    this.log('时间戳:', new Date().toISOString());
  }

  logSDKOperation(operation, details = {}) {
    this.log(`SDK操作: ${operation}`);
    this.log('详情:', details);
  }

  logCallback(url, success, details = {}) {
    this.log('===== 微信回调处理 =====');
    this.log('URL:', url);
    this.log('结果:', success ? '成功' : '失败');
    this.log('详情:', details);
  }

  logError(error, context = '') {
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

  logPerformance(operation, startTime, endTime) {
    const duration = endTime - startTime;
    this.log(`性能: ${operation}`);
    this.log('耗时:', `${duration}ms`);
    this.log('开始时间:', new Date(startTime).toISOString());
    this.log('结束时间:', new Date(endTime).toISOString());
  }

  logUserData(userData, context = '') {
    this.log('===== 用户数据 =====');
    this.log('上下文:', context);
    this.log('用户ID:', userData?.id);
    this.log('昵称:', userData?.nickname);
    this.log('登录类型:', userData?.loginType);
    this.log('有头像:', !!userData?.avatar);
    this.log('有Token:', !!userData?.token);
  }

  logNetworkRequest(url, method, data = {}) {
    this.log('===== 网络请求 =====');
    this.log('URL:', url);
    this.log('方法:', method);
    this.log('数据:', data);
  }

  logNetworkResponse(response, duration) {
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

  logDeviceInfo(deviceInfo) {
    this.log('===== 设备信息 =====');
    this.log('设备名称:', deviceInfo?.deviceName);
    this.log('设备型号:', deviceInfo?.modelName);
    this.log('系统版本:', deviceInfo?.osVersion);
    this.log('平台:', deviceInfo?.platform);
  }

  logConfig(config) {
    this.log('===== 配置信息 =====');
    this.log('AppID:', config?.appId);
    this.log('Universal Link:', config?.universalLink);
    this.log('Bundle ID:', config?.bundleId);
  }

  setDebugMode(enabled) {
    this.isDebugMode = enabled;
  }

  getDebugMode() {
    return this.isDebugMode;
  }
}

const wechatLogger = new WechatLogger();

console.log('🧪 开始测试微信登录日志功能...\n');

// 测试1: 基本日志功能
console.log('📝 测试1: 基本日志功能');
wechatLogger.log('测试日志消息');
wechatLogger.warn('测试警告消息');
wechatLogger.error('测试错误消息');
console.log('✅ 基本日志功能测试完成\n');

// 测试2: 登录流程日志
console.log('📝 测试2: 登录流程日志');
wechatLogger.logLoginStart('测试登录');
wechatLogger.logLoginComplete(true, '测试登录');
wechatLogger.logLoginComplete(false, '测试登录失败');
console.log('✅ 登录流程日志测试完成\n');

// 测试3: SDK操作日志
console.log('📝 测试3: SDK操作日志');
wechatLogger.logSDKOperation('注册应用', { appId: 'test_app_id', platform: 'ios' });
wechatLogger.logSDKOperation('检查安装', { installed: true });
wechatLogger.logSDKOperation('发送授权请求', { state: 'test_state' });
console.log('✅ SDK操作日志测试完成\n');

// 测试4: 回调处理日志
console.log('📝 测试4: 回调处理日志');
wechatLogger.logCallback('https://test.com/callback?code=123&state=456', true, { 
  success: true, 
  hasData: true 
});
wechatLogger.logCallback('https://test.com/callback?error=40029', false, { 
  error: '40029' 
});
console.log('✅ 回调处理日志测试完成\n');

// 测试5: 错误日志
console.log('📝 测试5: 错误日志');
const testError = new Error('测试错误消息');
testError.code = '40029';
testError.cause = '网络错误';
wechatLogger.logError(testError, '测试上下文');
console.log('✅ 错误日志测试完成\n');

// 测试6: 性能日志
console.log('📝 测试6: 性能日志');
const startTime = Date.now();
setTimeout(() => {
  const endTime = Date.now();
  wechatLogger.logPerformance('测试操作', startTime, endTime);
  console.log('✅ 性能日志测试完成\n');
}, 100);

// 测试7: 用户数据日志
console.log('📝 测试7: 用户数据日志');
const testUserData = {
  id: 'user_123',
  nickname: '测试用户',
  loginType: 'wechat',
  avatar: 'https://test.com/avatar.jpg',
  token: 'test_token_123'
};
wechatLogger.logUserData(testUserData, '测试用户数据');
console.log('✅ 用户数据日志测试完成\n');

// 测试8: 网络请求日志
console.log('📝 测试8: 网络请求日志');
wechatLogger.logNetworkRequest('https://api.test.com/login', 'POST', { 
  code: 'auth_code_123', 
  state: 'state_456' 
});
wechatLogger.logNetworkResponse({ 
  success: true, 
  data: { user: { id: '123' }, token: 'token_123' } 
}, 1500);
console.log('✅ 网络请求日志测试完成\n');

// 测试9: 设备信息日志
console.log('📝 测试9: 设备信息日志');
wechatLogger.logDeviceInfo({
  deviceName: 'iPhone 15',
  modelName: 'iPhone15,2',
  osVersion: '17.0',
  platform: 'ios'
});
console.log('✅ 设备信息日志测试完成\n');

// 测试10: 配置信息日志
console.log('📝 测试10: 配置信息日志');
wechatLogger.logConfig({
  appId: 'wxa225945508659eb8',
  universalLink: 'https://dramaword.com/app/',
  bundleId: 'com.tannibunni.dramawordmobile'
});
console.log('✅ 配置信息日志测试完成\n');

// 测试11: 调试模式控制
console.log('📝 测试11: 调试模式控制');
console.log('当前调试模式:', wechatLogger.getDebugMode());
wechatLogger.setDebugMode(false);
console.log('关闭调试模式后:', wechatLogger.getDebugMode());
wechatLogger.log('这条日志不应该显示');
wechatLogger.setDebugMode(true);
console.log('重新开启调试模式后:', wechatLogger.getDebugMode());
wechatLogger.log('这条日志应该显示');
console.log('✅ 调试模式控制测试完成\n');

console.log('🎉 所有微信登录日志功能测试完成！');
console.log('📊 测试覆盖了以下功能:');
console.log('   - 基本日志记录 (log, warn, error)');
console.log('   - 登录流程日志');
console.log('   - SDK操作日志');
console.log('   - 回调处理日志');
console.log('   - 错误信息记录');
console.log('   - 性能监控');
console.log('   - 用户数据记录');
console.log('   - 网络请求日志');
console.log('   - 设备信息记录');
console.log('   - 配置信息记录');
console.log('   - 调试模式控制'); 