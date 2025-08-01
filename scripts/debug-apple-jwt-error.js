#!/usr/bin/env node

/**
 * Apple JWT Audience 错误调试脚本
 * 分析为什么即使APPLE_CLIENT_ID正确仍然出现错误
 */

const fs = require('fs');

console.log('🍎 Apple JWT Audience 错误调试\n');

// 分析可能的原因
function analyzePossibleCauses() {
  console.log('🔍 分析 JWT Audience 错误可能原因:');
  console.log('');
  
  console.log('1. 🔄 环境变量缓存问题');
  console.log('   - Render 可能还在使用旧的缓存值');
  console.log('   - 需要重新部署服务');
  console.log('');
  
  console.log('2. 🏗️  构建缓存问题');
  console.log('   - TypeScript 编译可能使用了旧的环境变量');
  console.log('   - 需要清除构建缓存');
  console.log('');
  
  console.log('3. 🔧 Apple 服务配置问题');
  console.log('   - AppleService 可能没有正确读取环境变量');
  console.log('   - 需要检查 AppleService 的实现');
  console.log('');
  
  console.log('4. 📱 客户端配置问题');
  console.log('   - 客户端可能发送了错误的 audience');
  console.log('   - 需要检查 Apple 登录的客户端实现');
  console.log('');
  
  console.log('5. 🎯 Bundle ID 不匹配');
  console.log('   - 应用的 Bundle ID 可能与 Apple 配置不匹配');
  console.log('   - 需要检查 app.json 中的配置');
  console.log('');
}

// 检查应用配置
function checkAppConfig() {
  console.log('📋 检查应用配置...');
  
  const appJsonPath = 'apps/mobile/app.json';
  if (fs.existsSync(appJsonPath)) {
    const content = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(content);
    
    const bundleId = appJson.expo?.ios?.bundleIdentifier;
    console.log(`  ✅ Bundle ID: ${bundleId || '未设置'}`);
    
    if (bundleId === 'com.tannibunni.dramawordmobile') {
      console.log('  🟢 Bundle ID 匹配正确');
    } else {
      console.log('  🔴 Bundle ID 不匹配，需要修复');
    }
  }
  
  console.log('');
}

// 检查 Apple 服务实现
function checkAppleService() {
  console.log('📋 检查 Apple 服务实现...');
  
  const appleServicePath = 'services/api/src/services/appleService.ts';
  if (fs.existsSync(appleServicePath)) {
    const content = fs.readFileSync(appleServicePath, 'utf8');
    
    const hasClientId = content.includes('clientId');
    const hasAudience = content.includes('audience');
    const hasVerifyIdToken = content.includes('verifyIdToken');
    
    console.log(`  ✅ 客户端ID配置: ${hasClientId ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ Audience 配置: ${hasAudience ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ ID Token 验证: ${hasVerifyIdToken ? '正确' : '❌ 缺失'}`);
  }
  
  console.log('');
}

// 提供解决方案
function provideSolutions() {
  console.log('💡 解决方案建议:');
  console.log('');
  
  console.log('🚨 立即尝试的解决方案:');
  console.log('1. 强制重新部署 Render 服务');
  console.log('   - 在 Render 控制台点击 "Manual Deploy"');
  console.log('   - 选择 "Clear build cache & deploy"');
  console.log('');
  
  console.log('2. 检查 Apple 开发者账户配置');
  console.log('   - 确认 App ID 配置正确');
  console.log('   - 检查 Sign in with Apple 是否启用');
  console.log('   - 验证 Team ID 和 Key ID 正确');
  console.log('');
  
  console.log('3. 检查客户端 Apple 登录配置');
  console.log('   - 确认 app.json 中的 Bundle ID 正确');
  console.log('   - 检查 AppleAuthentication 配置');
  console.log('');
  
  console.log('4. 调试步骤');
  console.log('   - 在 Apple 登录时添加更多日志');
  console.log('   - 检查发送给后端的 idToken 内容');
  console.log('   - 验证 Apple 服务接收到的参数');
  console.log('');
}

// 生成调试报告
function generateDebugReport() {
  console.log('📊 Apple JWT 错误调试报告');
  console.log('================================');
  
  console.log('\n🎯 当前状态:');
  console.log('  ✅ APPLE_CLIENT_ID: 已正确设置');
  console.log('  🔴 JWT Audience: 仍然报错');
  console.log('  🔍 需要进一步调试');
  console.log('');
  
  console.log('🔧 调试优先级:');
  console.log('  1. 强制重新部署 Render 服务');
  console.log('  2. 检查 Apple 开发者账户配置');
  console.log('  3. 验证客户端 Bundle ID');
  console.log('  4. 添加详细日志调试');
  console.log('');
  
  console.log('📱 测试建议:');
  console.log('  - 重新部署后立即测试 Apple 登录');
  console.log('  - 检查后端日志中的详细错误信息');
  console.log('  - 验证 Apple 登录流程的每个步骤');
  console.log('');
}

// 主函数
function main() {
  try {
    analyzePossibleCauses();
    checkAppConfig();
    checkAppleService();
    provideSolutions();
    generateDebugReport();
    
    console.log('🎉 调试分析完成！');
    console.log('💡 建议先尝试强制重新部署 Render 服务');
    
  } catch (error) {
    console.error('\n❌ 调试过程中出现错误:', error.message);
  }
}

// 运行调试
main(); 