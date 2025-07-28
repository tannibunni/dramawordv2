// 苹果登录配置测试脚本
const axios = require('axios');

// 测试配置
const config = {
  clientId: 'com.tannibunni.dramawordmobile',
  teamId: process.env.APPLE_TEAM_ID || 'YOUR_APPLE_TEAM_ID',
  keyId: process.env.APPLE_KEY_ID || 'YOUR_APPLE_KEY_ID',
  privateKey: process.env.APPLE_PRIVATE_KEY || 'YOUR_APPLE_PRIVATE_KEY',
  redirectUri: 'dramaword://apple-login',
  apiBaseUrl: 'https://dramawordv2.onrender.com'
};

console.log('🍎 苹果登录配置测试');
console.log('=====================================');
console.log('Client ID:', config.clientId);
console.log('Team ID:', config.teamId);
console.log('Key ID:', config.keyId);
console.log('Private Key:', config.privateKey ? '已配置' : '未配置');
console.log('Redirect URI:', config.redirectUri);
console.log('API Base URL:', config.apiBaseUrl);
console.log('=====================================');

// 测试后端API连接
async function testBackendConnection() {
  try {
    console.log('\n🔍 测试后端API连接...');
    const response = await axios.get(`${config.apiBaseUrl}/health`);
    console.log('✅ 后端API连接成功:', response.status);
    return true;
  } catch (error) {
    console.log('❌ 后端API连接失败:', error.message);
    return false;
  }
}

// 测试苹果配置
async function testAppleConfig() {
  try {
    console.log('\n🔍 测试苹果配置...');
    const response = await axios.get(`${config.apiBaseUrl}/api/apple/config`);
    console.log('✅ 苹果配置检查成功:', response.data);
    return true;
  } catch (error) {
    console.log('❌ 苹果配置检查失败:', error.message);
    return false;
  }
}

// 测试苹果登录流程
async function testAppleLogin() {
  try {
    console.log('\n🔍 测试苹果登录流程...');
    
    // 模拟idToken（实际应该从Apple Authentication获取）
    const mockIdToken = 'mock_apple_id_token_' + Date.now();
    
    const response = await axios.post(`${config.apiBaseUrl}/api/apple/login`, {
      idToken: mockIdToken
    });
    
    console.log('✅ 苹果登录API调用成功:', response.status);
    return true;
  } catch (error) {
    console.log('❌ 苹果登录API调用失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行测试
async function runTests() {
  console.log('开始运行苹果登录测试...\n');
  
  const backendOk = await testBackendConnection();
  const configOk = await testAppleConfig();
  const loginOk = await testAppleLogin();
  
  console.log('\n=====================================');
  console.log('测试结果总结:');
  console.log('后端API连接:', backendOk ? '✅ 成功' : '❌ 失败');
  console.log('苹果配置检查:', configOk ? '✅ 成功' : '❌ 失败');
  console.log('苹果登录API:', loginOk ? '✅ 成功' : '❌ 失败');
  console.log('=====================================');
  
  if (!backendOk) {
    console.log('\n💡 建议: 检查后端服务是否正常运行');
  }
  
  if (!configOk) {
    console.log('\n💡 建议: 检查苹果Team ID、Key ID和Private Key配置');
  }
  
  if (!loginOk) {
    console.log('\n💡 建议: 检查苹果开发者账号配置和Bundle ID');
  }
  
  console.log('\n📋 苹果登录配置检查清单:');
  console.log('1. ✅ Bundle ID: com.tannibunni.dramawordmobile');
  console.log('2. ⚠️  Team ID: 需要在Apple Developer Portal配置');
  console.log('3. ⚠️  Key ID: 需要生成Auth Key');
  console.log('4. ⚠️  Private Key: 需要下载.p8文件');
  console.log('5. ⚠️  Sign in with Apple: 需要在App ID中启用');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 