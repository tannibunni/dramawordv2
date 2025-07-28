// 微信登录配置测试脚本
const axios = require('axios');

// 测试配置
const config = {
  appId: 'wxa225945508659eb8',
  appSecret: process.env.WECHAT_APP_SECRET || 'YOUR_WECHAT_APP_SECRET',
  bundleId: 'com.tannibunni.dramawordmobile',
  universalLinks: 'https://dramaword.com/app/',
  apiBaseUrl: 'https://dramawordv2.onrender.com'
};

console.log('🧪 微信登录配置测试');
console.log('=====================================');
console.log('App ID:', config.appId);
console.log('Bundle ID:', config.bundleId);
console.log('Universal Links:', config.universalLinks);
console.log('API Base URL:', config.apiBaseUrl);
console.log('App Secret:', config.appSecret ? '已配置' : '未配置');
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

// 测试微信配置
async function testWechatConfig() {
  try {
    console.log('\n🔍 测试微信配置...');
    const response = await axios.get(`${config.apiBaseUrl}/api/wechat/config`);
    console.log('✅ 微信配置检查成功:', response.data);
    return true;
  } catch (error) {
    console.log('❌ 微信配置检查失败:', error.message);
    return false;
  }
}

// 测试微信登录流程
async function testWechatLogin() {
  try {
    console.log('\n🔍 测试微信登录流程...');
    
    // 模拟授权码（实际应该从微信SDK获取）
    const mockCode = 'test_wechat_code_' + Date.now();
    
    const response = await axios.post(`${config.apiBaseUrl}/api/wechat/login`, {
      code: mockCode,
      state: 'test_state'
    });
    
    console.log('✅ 微信登录API调用成功:', response.status);
    return true;
  } catch (error) {
    console.log('❌ 微信登录API调用失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行测试
async function runTests() {
  console.log('开始运行微信登录测试...\n');
  
  const backendOk = await testBackendConnection();
  const configOk = await testWechatConfig();
  const loginOk = await testWechatLogin();
  
  console.log('\n=====================================');
  console.log('测试结果总结:');
  console.log('后端API连接:', backendOk ? '✅ 成功' : '❌ 失败');
  console.log('微信配置检查:', configOk ? '✅ 成功' : '❌ 失败');
  console.log('微信登录API:', loginOk ? '✅ 成功' : '❌ 失败');
  console.log('=====================================');
  
  if (!backendOk) {
    console.log('\n💡 建议: 检查后端服务是否正常运行');
  }
  
  if (!configOk) {
    console.log('\n💡 建议: 检查微信App ID和App Secret配置');
  }
  
  if (!loginOk) {
    console.log('\n💡 建议: 检查微信开发者平台配置和Bundle ID');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 