const axios = require('axios');

// 配置
const API_BASE_URL = 'https://dramawordv2.onrender.com/api';
const JWT_SECRET = process.env.JWT_SECRET || 'dramaword_jwt_secret';

console.log('🔍 开始诊断JWT Token验证问题...\n');

async function testJWTTokenIssue() {
  try {
    // 1. 测试后端健康状态
    console.log('1️⃣ 测试后端健康状态...');
    const healthResponse = await axios.get('https://dramawordv2.onrender.com/health');
    console.log('✅ 后端服务正常:', healthResponse.status);
    
    // 2. 使用模拟token进行测试
    console.log('\n2️⃣ 使用模拟Token进行测试...');
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImlhdCI6MTczMzQ0NzI0NCwiZXhwIjoxNzM0MDUyMDQ0fQ.example';
    console.log('✅ 使用模拟Token:', testToken.substring(0, 50) + '...');
    
    // 3. 测试带token的API请求
    console.log('\n3️⃣ 测试带Token的API请求...');
    try {
      const authResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ 带Token请求成功:', authResponse.status);
    } catch (error) {
      console.log('❌ 带Token请求失败:', error.response?.status, error.response?.data?.message);
    }
    
    // 4. 测试不带token的API请求
    console.log('\n4️⃣ 测试不带Token的API请求...');
    try {
      const noAuthResponse = await axios.get(`${API_BASE_URL}/users/profile`);
      console.log('❌ 不应该成功:', noAuthResponse.status);
    } catch (error) {
      console.log('✅ 正确拒绝无Token请求:', error.response?.status, error.response?.data?.message);
    }
    
    // 5. 测试无效token
    console.log('\n5️⃣ 测试无效Token...');
    try {
      const invalidResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': 'Bearer invalid_token_here',
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ 不应该成功:', invalidResponse.status);
    } catch (error) {
      console.log('✅ 正确拒绝无效Token:', error.response?.status, error.response?.data?.message);
    }
    
    // 6. 测试同步端点
    console.log('\n6️⃣ 测试同步端点...');
    try {
      const syncResponse = await axios.post(`${API_BASE_URL}/users/batch-sync`, {
        data: [],
        timestamp: Date.now(),
        syncStrategy: 'local-first',
        deviceId: 'test-device'
      }, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ 同步端点响应:', syncResponse.status);
    } catch (error) {
      console.log('❌ 同步端点失败:', error.response?.status, error.response?.data?.message);
    }
    
    console.log('\n🎯 诊断完成！');
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行诊断
testJWTTokenIssue(); 