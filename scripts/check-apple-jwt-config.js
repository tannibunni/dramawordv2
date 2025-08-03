const mongoose = require('mongoose');
require('dotenv').config({ path: './services/api/.env' });

// 连接到数据库
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// 检查 Apple 配置
function checkAppleConfig() {
  console.log('\n🍎 Apple 配置检查:');
  console.log('='.repeat(50));
  
  // 检查环境变量
  console.log('\n📋 环境变量:');
  console.log(`APPLE_CLIENT_ID: ${process.env.APPLE_CLIENT_ID || '未设置'}`);
  console.log(`APPLE_TEAM_ID: ${process.env.APPLE_TEAM_ID || '未设置'}`);
  console.log(`APPLE_KEY_ID: ${process.env.APPLE_KEY_ID || '未设置'}`);
  console.log(`APPLE_PRIVATE_KEY: ${process.env.APPLE_PRIVATE_KEY ? '已设置' : '未设置'}`);
  
  // 检查配置对象
  const appleConfig = {
    clientId: process.env.APPLE_CLIENT_ID || 'com.tannibunni.dramawordmobile',
    teamId: process.env.APPLE_TEAM_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
    privateKey: process.env.APPLE_PRIVATE_KEY || '',
    redirectUri: process.env.APPLE_REDIRECT_URI || 'dramaword://apple-login',
  };
  
  console.log('\n⚙️ 配置对象:');
  console.log(`clientId: ${appleConfig.clientId}`);
  console.log(`teamId: ${appleConfig.teamId}`);
  console.log(`keyId: ${appleConfig.keyId}`);
  console.log(`privateKey: ${appleConfig.privateKey ? '已设置' : '未设置'}`);
  console.log(`redirectUri: ${appleConfig.redirectUri}`);
  
  // 分析问题
  console.log('\n🔍 问题分析:');
  console.log('错误信息: "jwt audience invalid. expected: com.tannibunni.dramawordmobile"');
  console.log('这表明 Apple 返回的 JWT token 中的 audience 字段与后端期望的不匹配。');
  
  console.log('\n可能的原因:');
  console.log('1. APPLE_CLIENT_ID 环境变量未正确设置');
  console.log('2. Apple Developer Console 中的 App ID 配置问题');
  console.log('3. 后端服务需要重新部署');
  
  console.log('\n🔧 解决步骤:');
  console.log('1. 登录 Render 控制台 (https://dashboard.render.com)');
  console.log('2. 找到 dramaword-api 服务');
  console.log('3. 进入 Environment 标签页');
  console.log('4. 检查 APPLE_CLIENT_ID 环境变量');
  console.log('5. 确保值为: com.tannibunni.dramawordmobile');
  console.log('6. 如果值不正确，更新并重新部署');
  
  console.log('\n🍎 Apple Developer Console 检查:');
  console.log('1. 登录 https://developer.apple.com/account/');
  console.log('2. 进入 Certificates, Identifiers & Profiles');
  console.log('3. 选择 Identifiers');
  console.log('4. 找到 com.tannibunni.dramawordmobile');
  console.log('5. 确保 Sign In with Apple 功能已启用');
  
  console.log('\n📱 应用端检查:');
  console.log('1. 确认 app.json 中的 bundleIdentifier 正确');
  console.log('2. 确认 Apple 登录权限已配置');
  console.log('3. 重新构建应用');
  
  // 检查当前配置是否正确
  const expectedClientId = 'com.tannibunni.dramawordmobile';
  const actualClientId = appleConfig.clientId;
  
  console.log('\n✅ 配置验证:');
  if (actualClientId === expectedClientId) {
    console.log('✅ APPLE_CLIENT_ID 配置正确');
  } else {
    console.log('❌ APPLE_CLIENT_ID 配置错误');
    console.log(`   期望: ${expectedClientId}`);
    console.log(`   实际: ${actualClientId}`);
  }
  
  if (appleConfig.teamId) {
    console.log('✅ APPLE_TEAM_ID 已设置');
  } else {
    console.log('❌ APPLE_TEAM_ID 未设置');
  }
  
  if (appleConfig.keyId) {
    console.log('✅ APPLE_KEY_ID 已设置');
  } else {
    console.log('❌ APPLE_KEY_ID 未设置');
  }
  
  if (appleConfig.privateKey) {
    console.log('✅ APPLE_PRIVATE_KEY 已设置');
  } else {
    console.log('❌ APPLE_PRIVATE_KEY 未设置');
  }
}

// 生成修复建议
function generateFixRecommendations() {
  console.log('\n📋 修复建议:');
  console.log('1. 立即修复:');
  console.log('   - 在 Render 中设置正确的 APPLE_CLIENT_ID');
  console.log('   - 重新部署后端服务');
  
  console.log('\n2. 长期优化:');
  console.log('   - 添加环境变量验证');
  console.log('   - 改进错误处理和日志记录');
  console.log('   - 添加 Apple 登录配置测试');
  
  console.log('\n3. 监控建议:');
  console.log('   - 监控 Apple 登录成功率');
  console.log('   - 设置错误告警');
  console.log('   - 定期检查配置有效性');
}

// 主函数
async function main() {
  console.log('🚀 开始检查 Apple JWT 配置...');
  
  try {
    await connectDB();
    
    // 检查 Apple 配置
    checkAppleConfig();
    
    // 生成修复建议
    generateFixRecommendations();
    
    console.log('\n✅ 检查完成！');
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkAppleConfig,
  generateFixRecommendations
}; 