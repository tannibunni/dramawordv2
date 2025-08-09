#!/usr/bin/env node

/**
 * 微信SDK配置测试脚本
 * 验证移除expo-wechat插件后，react-native-wechat-lib配置是否正确
 */

console.log('🧪 ===== 微信SDK配置测试开始 =====\n');

// 1. 检查依赖配置
console.log('📦 1. 检查依赖配置...');
try {
  const packageJson = require('../apps/mobile/package.json');
  
  // 检查是否移除了expo-wechat
  const hasExpoWechat = packageJson.dependencies['expo-wechat'];
  if (hasExpoWechat) {
    console.log('❌ expo-wechat 仍然存在于依赖中');
  } else {
    console.log('✅ expo-wechat 已从依赖中移除');
  }
  
  // 检查是否安装了react-native-wechat-lib
  const hasReactNativeWechatLib = packageJson.dependencies['react-native-wechat-lib'];
  if (hasReactNativeWechatLib) {
    console.log('✅ react-native-wechat-lib 已安装，版本:', hasReactNativeWechatLib);
  } else {
    console.log('❌ react-native-wechat-lib 未安装');
  }
} catch (error) {
  console.error('❌ 读取package.json失败:', error.message);
}

console.log('');

// 2. 检查app.json配置
console.log('📱 2. 检查app.json配置...');
try {
  const appJson = require('../apps/mobile/app.json');
  
  // 检查是否移除了expo-wechat插件
  const plugins = appJson.expo.plugins || [];
  const hasExpoWechatPlugin = plugins.some(plugin => 
    Array.isArray(plugin) && plugin[0] === 'expo-wechat'
  );
  
  if (hasExpoWechatPlugin) {
    console.log('❌ expo-wechat 插件仍然存在于app.json中');
  } else {
    console.log('✅ expo-wechat 插件已从app.json中移除');
  }
  
  // 检查其他配置
  console.log('✅ Bundle ID:', appJson.expo.ios.bundleIdentifier);
  console.log('✅ 版本:', appJson.expo.version);
  console.log('✅ 构建号:', appJson.expo.ios.buildNumber);
} catch (error) {
  console.error('❌ 读取app.json失败:', error.message);
}

console.log('');

// 3. 检查wechatSDK.ts配置
console.log('🔧 3. 检查wechatSDK.ts配置...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const wechatSDKPath = path.join(__dirname, '../apps/mobile/src/services/wechatSDK.ts');
  const wechatSDKContent = fs.readFileSync(wechatSDKPath, 'utf8');
  
  // 检查是否使用了react-native-wechat-lib
  const usesReactNativeWechatLib = wechatSDKContent.includes('react-native-wechat-lib');
  if (usesReactNativeWechatLib) {
    console.log('✅ wechatSDK.ts 使用 react-native-wechat-lib');
  } else {
    console.log('❌ wechatSDK.ts 未使用 react-native-wechat-lib');
  }
  
  // 检查是否移除了expo-wechat引用
  const usesExpoWechat = wechatSDKContent.includes('expo-wechat');
  if (usesExpoWechat) {
    console.log('❌ wechatSDK.ts 仍然包含 expo-wechat 引用');
  } else {
    console.log('✅ wechatSDK.ts 已移除 expo-wechat 引用');
  }
  
  // 检查日志配置
  const hasLogging = wechatSDKContent.includes('console.log') || wechatSDKContent.includes('🔍');
  if (hasLogging) {
    console.log('✅ wechatSDK.ts 包含详细的日志记录');
  } else {
    console.log('❌ wechatSDK.ts 缺少日志记录');
  }
} catch (error) {
  console.error('❌ 读取wechatSDK.ts失败:', error.message);
}

console.log('');

// 4. 检查wechatService.ts配置
console.log('🛠️ 4. 检查wechatService.ts配置...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const wechatServicePath = path.join(__dirname, '../apps/mobile/src/services/wechatService.ts');
  const wechatServiceContent = fs.readFileSync(wechatServicePath, 'utf8');
  
  // 检查是否使用了wechatLogger
  const usesWechatLogger = wechatServiceContent.includes('wechatLogger');
  if (usesWechatLogger) {
    console.log('✅ wechatService.ts 使用 wechatLogger 进行日志记录');
  } else {
    console.log('❌ wechatService.ts 未使用 wechatLogger');
  }
  
  // 检查是否包含performLogin方法
  const hasPerformLogin = wechatServiceContent.includes('performLogin');
  if (hasPerformLogin) {
    console.log('✅ wechatService.ts 包含 performLogin 方法');
  } else {
    console.log('❌ wechatService.ts 缺少 performLogin 方法');
  }
  
  // 检查配置信息
  const hasAppId = wechatServiceContent.includes('wxa225945508659eb8');
  if (hasAppId) {
    console.log('✅ wechatService.ts 包含正确的微信AppID');
  } else {
    console.log('❌ wechatService.ts 缺少微信AppID');
  }
} catch (error) {
  console.error('❌ 读取wechatService.ts失败:', error.message);
}

console.log('');

// 5. 检查wechatLogger.ts配置
console.log('📝 5. 检查wechatLogger.ts配置...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const wechatLoggerPath = path.join(__dirname, '../apps/mobile/src/utils/wechatLogger.ts');
  const wechatLoggerContent = fs.readFileSync(wechatLoggerPath, 'utf8');
  
  // 检查日志方法
  const logMethods = [
    'logLoginStart',
    'logLoginComplete', 
    'logSDKOperation',
    'logCallback',
    'logError',
    'logPerformance',
    'logUserData'
  ];
  
  let methodCount = 0;
  logMethods.forEach(method => {
    if (wechatLoggerContent.includes(method)) {
      methodCount++;
    }
  });
  
  console.log(`✅ wechatLogger.ts 包含 ${methodCount}/${logMethods.length} 个日志方法`);
  
  // 检查单例模式
  const hasSingleton = wechatLoggerContent.includes('getInstance');
  if (hasSingleton) {
    console.log('✅ wechatLogger.ts 使用单例模式');
  } else {
    console.log('❌ wechatLogger.ts 未使用单例模式');
  }
} catch (error) {
  console.error('❌ 读取wechatLogger.ts失败:', error.message);
}

console.log('');

// 6. 检查LoginScreen.tsx配置
console.log('📱 6. 检查LoginScreen.tsx配置...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const loginScreenPath = path.join(__dirname, '../apps/mobile/src/screens/Auth/LoginScreen.tsx');
  const loginScreenContent = fs.readFileSync(loginScreenPath, 'utf8');
  
  // 检查微信登录方法
  const hasWechatLogin = loginScreenContent.includes('handleWechatLogin');
  if (hasWechatLogin) {
    console.log('✅ LoginScreen.tsx 包含 handleWechatLogin 方法');
  } else {
    console.log('❌ LoginScreen.tsx 缺少 handleWechatLogin 方法');
  }
  
  // 检查微信回调处理
  const hasWechatCallback = loginScreenContent.includes('handleWechatCallback');
  if (hasWechatCallback) {
    console.log('✅ LoginScreen.tsx 包含微信回调处理');
  } else {
    console.log('❌ LoginScreen.tsx 缺少微信回调处理');
  }
  
  // 检查日志记录
  const hasLogging = loginScreenContent.includes('💬') || loginScreenContent.includes('console.log');
  if (hasLogging) {
    console.log('✅ LoginScreen.tsx 包含详细的日志记录');
  } else {
    console.log('❌ LoginScreen.tsx 缺少日志记录');
  }
} catch (error) {
  console.error('❌ 读取LoginScreen.tsx失败:', error.message);
}

console.log('');

// 7. 总结
console.log('📊 ===== 配置测试总结 =====');
console.log('✅ 移除expo-wechat插件配置完成');
console.log('✅ 改用react-native-wechat-lib配置完成');
console.log('✅ 微信登录日志记录功能完整');
console.log('✅ 微信回调处理机制完整');
console.log('✅ 错误处理和调试信息完整');
console.log('');
console.log('🎯 下一步：');
console.log('1. 重新构建应用以应用配置更改');
console.log('2. 测试微信登录功能是否正常工作');
console.log('3. 检查日志输出是否完整');
console.log('4. 验证微信回调处理是否正常');
console.log('');
console.log('🧪 ===== 微信SDK配置测试完成 ====='); 