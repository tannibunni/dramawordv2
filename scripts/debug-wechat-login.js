#!/usr/bin/env node

/**
 * 微信登录调试脚本
 * 诊断 40029 - 不合法的oauth_code 错误
 */

const fs = require('fs');

console.log('🔍 微信登录调试诊断\n');

// 检查微信配置
function checkWechatConfig() {
  console.log('📋 检查微信配置...');
  
  const wechatConfigPath = 'services/api/src/config/wechat.ts';
  if (fs.existsSync(wechatConfigPath)) {
    const content = fs.readFileSync(wechatConfigPath, 'utf8');
    
    // 检查配置项
    const hasAppId = content.includes('appId: process.env.WECHAT_APP_ID');
    const hasAppSecret = content.includes('appSecret: process.env.WECHAT_APP_SECRET');
    const hasBundleId = content.includes('bundleId: process.env.WECHAT_BUNDLE_ID');
    const hasScope = content.includes('scope: \'snsapi_userinfo\'');
    
    console.log(`  ✅ AppID 配置: ${hasAppId ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ AppSecret 配置: ${hasAppSecret ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ BundleID 配置: ${hasBundleId ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 授权作用域: ${hasScope ? '正确' : '❌ 缺失'}`);
    
    return hasAppId && hasAppSecret && hasBundleId && hasScope;
  } else {
    console.log('  ❌ 微信配置文件不存在');
    return false;
  }
}

// 检查环境变量模板
function checkEnvTemplate() {
  console.log('\n📋 检查环境变量模板...');
  
  const envTemplatePath = 'services/api/env.template';
  if (fs.existsSync(envTemplatePath)) {
    const content = fs.readFileSync(envTemplatePath, 'utf8');
    
    const hasWechatAppId = content.includes('WECHAT_APP_ID=');
    const hasWechatAppSecret = content.includes('WECHAT_APP_SECRET=');
    const hasWechatBundleId = content.includes('WECHAT_BUNDLE_ID=');
    
    console.log(`  ✅ WECHAT_APP_ID: ${hasWechatAppId ? '已定义' : '❌ 缺失'}`);
    console.log(`  ✅ WECHAT_APP_SECRET: ${hasWechatAppSecret ? '已定义' : '❌ 缺失'}`);
    console.log(`  ✅ WECHAT_BUNDLE_ID: ${hasWechatBundleId ? '已定义' : '❌ 缺失'}`);
    
    return hasWechatAppId && hasWechatAppSecret && hasWechatBundleId;
  } else {
    console.log('  ❌ 环境变量模板文件不存在');
    return false;
  }
}

// 检查 Render 部署配置
function checkRenderConfig() {
  console.log('\n📋 检查 Render 部署配置...');
  
  const renderYamlPath = 'services/api/render.yaml';
  if (fs.existsSync(renderYamlPath)) {
    const content = fs.readFileSync(renderYamlPath, 'utf8');
    
    const hasWechatAppId = content.includes('WECHAT_APP_ID');
    const hasWechatAppSecret = content.includes('WECHAT_APP_SECRET');
    const hasWechatBundleId = content.includes('WECHAT_BUNDLE_ID');
    const hasSyncFalse = content.includes('sync: false');
    
    console.log(`  ✅ WECHAT_APP_ID 配置: ${hasWechatAppId ? '已定义' : '❌ 缺失'}`);
    console.log(`  ✅ WECHAT_APP_SECRET 配置: ${hasWechatAppSecret ? '已定义' : '❌ 缺失'}`);
    console.log(`  ✅ WECHAT_BUNDLE_ID 配置: ${hasWechatBundleId ? '已定义' : '❌ 缺失'}`);
    console.log(`  ⚠️  环境变量同步: ${hasSyncFalse ? '手动配置 (sync: false)' : '自动同步'}`);
    
    return hasWechatAppId && hasWechatAppSecret && hasWechatBundleId;
  } else {
    console.log('  ❌ Render 配置文件不存在');
    return false;
  }
}

// 检查微信登录实现
function checkWechatLoginImplementation() {
  console.log('\n📋 检查微信登录实现...');
  
  const wechatControllerPath = 'services/api/src/controllers/wechatController.ts';
  const wechatServicePath = 'services/api/src/services/wechatService.ts';
  
  if (fs.existsSync(wechatControllerPath) && fs.existsSync(wechatServicePath)) {
    const controllerContent = fs.readFileSync(wechatControllerPath, 'utf8');
    const serviceContent = fs.readFileSync(wechatServicePath, 'utf8');
    
    // 检查控制器
    const hasCodeValidation = controllerContent.includes('validateLoginParams(code)');
    const hasStateValidation = controllerContent.includes('validateState(state)');
    const hasWechatServiceCall = controllerContent.includes('WechatService.login(code)');
    
    // 检查服务
    const hasGetAccessToken = serviceContent.includes('getAccessToken(code: string)');
    const hasErrorHandling = serviceContent.includes('wechatErrorCodes') && serviceContent.includes('errcode');
    const hasParamValidation = serviceContent.includes('validateLoginParams');
    
    console.log(`  ✅ 授权码验证: ${hasCodeValidation ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 状态参数验证: ${hasStateValidation ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 微信服务调用: ${hasWechatServiceCall ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 获取访问令牌: ${hasGetAccessToken ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 错误处理: ${hasErrorHandling ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 参数验证: ${hasParamValidation ? '正确' : '❌ 缺失'}`);
    
    return hasCodeValidation && hasWechatServiceCall && hasGetAccessToken && hasErrorHandling;
  } else {
    console.log('  ❌ 微信登录实现文件不存在');
    return false;
  }
}

// 分析 40029 错误原因
function analyze40029Error() {
  console.log('\n🔍 分析 40029 错误原因...');
  
  console.log('📝 错误码 40029 - "不合法的oauth_code" 可能原因:');
  console.log('');
  console.log('1. 🔑 授权码已过期');
  console.log('   - 微信授权码有效期通常为 5 分钟');
  console.log('   - 如果用户操作时间过长，授权码会失效');
  console.log('');
  console.log('2. 🔄 授权码已被使用');
  console.log('   - 每个授权码只能使用一次');
  console.log('   - 重复使用会导致此错误');
  console.log('');
  console.log('3. ⚙️  微信应用配置问题');
  console.log('   - AppID 或 AppSecret 不正确');
  console.log('   - 应用未在微信开放平台正确配置');
  console.log('   - Bundle ID 不匹配');
  console.log('');
  console.log('4. 🌐 网络或服务器问题');
  console.log('   - 网络连接不稳定');
  console.log('   - 微信服务器临时故障');
  console.log('');
  console.log('5. 📱 客户端问题');
  console.log('   - 微信 SDK 版本过旧');
  console.log('   - 客户端获取授权码失败');
  console.log('');
}

// 提供解决方案
function provideSolutions() {
  console.log('\n💡 解决方案建议:');
  console.log('');
  console.log('1. 🔧 检查微信开放平台配置');
  console.log('   - 确认 AppID 和 AppSecret 正确');
  console.log('   - 检查应用状态是否为"已上线"');
  console.log('   - 验证 Bundle ID 配置');
  console.log('');
  console.log('2. 🔄 检查 Render 环境变量');
  console.log('   - 登录 Render 控制台');
  console.log('   - 检查 dramaword-api 服务的环境变量');
  console.log('   - 确保 WECHAT_APP_ID, WECHAT_APP_SECRET 正确设置');
  console.log('');
  console.log('3. 📱 客户端调试');
  console.log('   - 检查微信 SDK 是否正确初始化');
  console.log('   - 验证授权码获取流程');
  console.log('   - 确保在开发模式下使用正确的配置');
  console.log('');
  console.log('4. 🧪 测试步骤');
  console.log('   - 清除应用缓存');
  console.log('   - 重新安装应用');
  console.log('   - 使用不同的微信账号测试');
  console.log('   - 检查网络连接');
  console.log('');
}

// 生成调试报告
function generateDebugReport(configOk, envOk, renderOk, implOk) {
  console.log('\n📊 微信登录调试报告');
  console.log('================================');
  
  const totalChecks = 4;
  const passedChecks = [configOk, envOk, renderOk, implOk].filter(Boolean).length;
  
  console.log(`\n✅ 通过检测: ${passedChecks}/${totalChecks}`);
  
  console.log('\n📋 详细检测结果:');
  console.log(`  微信配置: ${configOk ? '✅' : '❌'}`);
  console.log(`  环境变量模板: ${envOk ? '✅' : '❌'}`);
  console.log(`  Render 配置: ${renderOk ? '✅' : '❌'}`);
  console.log(`  登录实现: ${implOk ? '✅' : '❌'}`);
  
  console.log('\n🎯 诊断结果:');
  
  if (passedChecks === totalChecks) {
    console.log('  🟢 配置正确 - 问题可能在于运行时环境');
    console.log('  💡 建议检查 Render 环境变量和微信开放平台配置');
  } else if (passedChecks >= 3) {
    console.log('  🟡 大部分配置正确 - 需要修复小问题');
    console.log('  💡 建议检查缺失的配置项');
  } else {
    console.log('  🔴 配置问题较多 - 需要全面修复');
    console.log('  💡 建议按照解决方案逐步修复');
  }
  
  return passedChecks === totalChecks;
}

// 主函数
function main() {
  try {
    const configOk = checkWechatConfig();
    const envOk = checkEnvTemplate();
    const renderOk = checkRenderConfig();
    const implOk = checkWechatLoginImplementation();
    
    analyze40029Error();
    provideSolutions();
    
    const allPassed = generateDebugReport(configOk, envOk, renderOk, implOk);
    
    console.log(`\n🎉 调试完成！微信登录配置: ${allPassed ? '✅ 正常' : '❌ 需要修复'}`);
    
  } catch (error) {
    console.error('\n❌ 调试过程中出现错误:', error.message);
  }
}

// 运行调试
main(); 