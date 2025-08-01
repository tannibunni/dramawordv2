#!/usr/bin/env node

/**
 * 环境变量检查脚本
 * 检查当前环境中的关键配置变量
 */

console.log('🔍 环境变量检查\n');

// 检查关键环境变量
function checkEnvironmentVariables() {
  console.log('📋 检查关键环境变量:');
  
  const envVars = [
    'APPLE_CLIENT_ID',
    'APPLE_TEAM_ID', 
    'APPLE_KEY_ID',
    'WECHAT_APP_ID',
    'WECHAT_APP_SECRET',
    'WECHAT_BUNDLE_ID',
    'NODE_ENV',
    'MONGODB_URI',
    'JWT_SECRET'
  ];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // 隐藏敏感信息
      const displayValue = varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PRIVATE') 
        ? `${value.substring(0, 8)}...` 
        : value;
      console.log(`  ✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`  ❌ ${varName}: 未设置`);
    }
  });
  
  console.log('');
}

// 检查 Apple 配置
function checkAppleConfig() {
  console.log('🍎 Apple 配置检查:');
  
  const appleClientId = process.env.APPLE_CLIENT_ID;
  const expectedClientId = 'com.tannibunni.dramawordmobile';
  
  if (appleClientId === expectedClientId) {
    console.log(`  ✅ APPLE_CLIENT_ID 正确: ${appleClientId}`);
  } else {
    console.log(`  🔴 APPLE_CLIENT_ID 不匹配:`);
    console.log(`     当前值: ${appleClientId || '未设置'}`);
    console.log(`     期望值: ${expectedClientId}`);
  }
  
  const hasTeamId = !!process.env.APPLE_TEAM_ID;
  const hasKeyId = !!process.env.APPLE_KEY_ID;
  const hasPrivateKey = !!process.env.APPLE_PRIVATE_KEY;
  
  console.log(`  ${hasTeamId ? '✅' : '❌'} APPLE_TEAM_ID: ${hasTeamId ? '已设置' : '未设置'}`);
  console.log(`  ${hasKeyId ? '✅' : '❌'} APPLE_KEY_ID: ${hasKeyId ? '已设置' : '未设置'}`);
  console.log(`  ${hasPrivateKey ? '✅' : '❌'} APPLE_PRIVATE_KEY: ${hasPrivateKey ? '已设置' : '未设置'}`);
  
  console.log('');
}

// 检查微信配置
function checkWechatConfig() {
  console.log('💬 微信配置检查:');
  
  const wechatAppId = process.env.WECHAT_APP_ID;
  const expectedAppId = 'wxa225945508659eb8';
  
  if (wechatAppId === expectedAppId) {
    console.log(`  ✅ WECHAT_APP_ID 正确: ${wechatAppId}`);
  } else {
    console.log(`  🔴 WECHAT_APP_ID 不匹配:`);
    console.log(`     当前值: ${wechatAppId || '未设置'}`);
    console.log(`     期望值: ${expectedAppId}`);
  }
  
  const hasAppSecret = !!process.env.WECHAT_APP_SECRET;
  const hasBundleId = !!process.env.WECHAT_BUNDLE_ID;
  
  console.log(`  ${hasAppSecret ? '✅' : '❌'} WECHAT_APP_SECRET: ${hasAppSecret ? '已设置' : '未设置'}`);
  console.log(`  ${hasBundleId ? '✅' : '❌'} WECHAT_BUNDLE_ID: ${hasBundleId ? '已设置' : '未设置'}`);
  
  console.log('');
}

// 生成报告
function generateReport() {
  console.log('📊 环境变量状态报告');
  console.log('================================');
  
  const appleClientId = process.env.APPLE_CLIENT_ID;
  const expectedClientId = 'com.tannibunni.dramawordmobile';
  const appleConfigOk = appleClientId === expectedClientId;
  
  const wechatAppId = process.env.WECHAT_APP_ID;
  const expectedAppId = 'wxa225945508659eb8';
  const wechatConfigOk = wechatAppId === expectedAppId;
  
  console.log('\n🎯 配置状态:');
  console.log(`  Apple 配置: ${appleConfigOk ? '✅ 正确' : '🔴 需要修复'}`);
  console.log(`  微信配置: ${wechatConfigOk ? '✅ 正确' : '🔴 需要修复'}`);
  console.log(`  数据库配置: ${process.env.MONGODB_URI ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`  JWT 配置: ${process.env.JWT_SECRET ? '✅ 已设置' : '❌ 未设置'}`);
  
  console.log('\n💡 建议:');
  if (!appleConfigOk) {
    console.log('  🔴 需要修复 Apple 配置');
    console.log('  💡 在 Render 控制台更新 APPLE_CLIENT_ID');
  }
  if (!wechatConfigOk) {
    console.log('  🔴 需要修复微信配置');
    console.log('  💡 在 Render 控制台更新微信相关配置');
  }
  if (appleConfigOk && wechatConfigOk) {
    console.log('  🟢 所有配置看起来都正确');
    console.log('  💡 如果仍有问题，可能需要强制重新部署');
  }
  
  console.log('');
}

// 主函数
function main() {
  try {
    checkEnvironmentVariables();
    checkAppleConfig();
    checkWechatConfig();
    generateReport();
    
    console.log('🎉 环境变量检查完成！');
    
  } catch (error) {
    console.error('\n❌ 检查过程中出现错误:', error.message);
  }
}

// 运行检查
main(); 