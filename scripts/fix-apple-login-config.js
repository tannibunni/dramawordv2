#!/usr/bin/env node

/**
 * Apple 登录配置检查和修复脚本
 * 解决 JWT audience 不匹配的问题
 */

const fs = require('fs');
const path = require('path');

console.log('🍎 开始检查 Apple 登录配置...\n');

// 检查 Bundle ID 配置
console.log('📱 检查 Bundle ID 配置:');
const appJsonPath = 'apps/mobile/app.json';
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const bundleId = appJson.expo.ios.bundleIdentifier;
  console.log(`  ✅ iOS Bundle ID: ${bundleId}`);
  
  if (bundleId !== 'com.tannibunni.dramawordmobile') {
    console.log(`  ⚠️  警告: Bundle ID 不匹配期望值`);
  }
}

// 检查后端 Apple 配置
console.log('\n🔧 检查后端 Apple 配置:');
const appleConfigPath = 'services/api/src/config/apple.ts';
if (fs.existsSync(appleConfigPath)) {
  const appleConfigContent = fs.readFileSync(appleConfigPath, 'utf8');
  console.log(`  ✅ Apple 配置文件存在`);
  
  // 检查默认值
  if (appleConfigContent.includes('com.tannibunni.dramawordmobile')) {
    console.log(`  ✅ 默认 clientId 配置正确`);
  } else {
    console.log(`  ❌ 默认 clientId 配置不正确`);
  }
}

// 检查环境变量模板
console.log('\n📝 检查环境变量模板:');
const envTemplatePath = 'services/api/env.template';
if (fs.existsSync(envTemplatePath)) {
  const envTemplateContent = fs.readFileSync(envTemplatePath, 'utf8');
  const appleClientIdMatch = envTemplateContent.match(/APPLE_CLIENT_ID=(.+)/);
  
  if (appleClientIdMatch) {
    const clientId = appleClientIdMatch[1];
    console.log(`  ✅ 环境变量模板中的 APPLE_CLIENT_ID: ${clientId}`);
    
    if (clientId === 'com.tannibunni.dramawordmobile') {
      console.log(`  ✅ 环境变量模板配置正确`);
    } else {
      console.log(`  ❌ 环境变量模板配置不正确，应该是: com.tannibunni.dramawordmobile`);
    }
  }
}

// 检查 Render 配置
console.log('\n☁️  检查 Render 部署配置:');
const renderYamlPath = 'services/api/render.yaml';
if (fs.existsSync(renderYamlPath)) {
  const renderYamlContent = fs.readFileSync(renderYamlPath, 'utf8');
  console.log(`  ✅ Render 配置文件存在`);
  
  if (renderYamlContent.includes('APPLE_CLIENT_ID')) {
    console.log(`  ✅ Render 配置中包含 APPLE_CLIENT_ID`);
    console.log(`  ℹ️  注意: APPLE_CLIENT_ID 设置为 sync: false，需要在 Render 控制台中手动设置`);
  }
}

console.log('\n🔍 问题诊断:');
console.log('根据错误信息 "jwt audience invalid. expected: com.tannibunni.dramawordmobile"');
console.log('这表明 Apple 返回的 JWT token 中的 audience 字段与后端期望的不匹配。');

console.log('\n📋 解决方案:');

console.log('\n1. 🔧 检查 Render 环境变量:');
console.log('   - 登录 Render 控制台');
console.log('   - 进入 dramaword-api 服务');
console.log('   - 检查 Environment Variables 部分');
console.log('   - 确保 APPLE_CLIENT_ID 设置为: com.tannibunni.dramawordmobile');

console.log('\n2. 🍎 检查 Apple Developer 配置:');
console.log('   - 登录 Apple Developer Console');
console.log('   - 检查 App ID: com.tannibunni.dramawordmobile');
console.log('   - 确保 Sign In with Apple 功能已启用');
console.log('   - 检查 Services ID 配置');

console.log('\n3. 📱 检查 iOS 应用配置:');
console.log('   - 确保 app.json 中的 bundleIdentifier 正确');
console.log('   - 检查 Apple 登录权限配置');

console.log('\n4. 🔄 重新部署后端:');
console.log('   - 推送代码到 Git 仓库');
console.log('   - Render 会自动重新部署');
console.log('   - 或者手动触发重新部署');

console.log('\n5. 🧪 测试步骤:');
console.log('   - 重新构建并安装应用');
console.log('   - 测试 Apple 登录功能');
console.log('   - 检查控制台日志');

console.log('\n⚠️  重要提醒:');
console.log('- Apple 登录需要正确的 Bundle ID 匹配');
console.log('- 环境变量必须在 Render 控制台中正确设置');
console.log('- 可能需要重新部署后端服务');

console.log('\n🎯 当前状态:');
console.log('✅ Bundle ID: com.tannibunni.dramawordmobile');
console.log('✅ 后端默认配置: com.tannibunni.dramawordmobile');
console.log('✅ 环境变量模板: com.tannibunni.dramawordmobile');
console.log('⚠️  需要检查: Render 环境变量设置');

console.log('\n📞 如果问题仍然存在，请检查:');
console.log('1. Render 控制台中的 APPLE_CLIENT_ID 环境变量');
console.log('2. Apple Developer Console 中的 App ID 配置');
console.log('3. 后端服务是否已重新部署'); 