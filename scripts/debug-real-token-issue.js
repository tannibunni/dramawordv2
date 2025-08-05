const axios = require('axios');
const crypto = require('crypto');

// 配置
const API_BASE_URL = 'https://dramawordv2.onrender.com/api';

console.log('🔍 深入调试JWT Token验证问题...\n');

async function debugRealTokenIssue() {
  try {
    // 1. 测试后端健康状态
    console.log('1️⃣ 测试后端健康状态...');
    const healthResponse = await axios.get('https://dramawordv2.onrender.com/health');
    console.log('✅ 后端服务正常:', healthResponse.status);
    
    // 2. 测试用户注册/登录流程
    console.log('\n2️⃣ 测试用户注册/登录流程...');
    
    // 生成随机用户信息
    const testUserId = `test_guest_${Date.now()}`.slice(0, 20);
    const guestId = `guest_${Date.now()}`;
    const testUserData = {
      username: testUserId,
      nickname: guestId,
      loginType: 'guest',
      guestId: guestId
    };
    
    console.log('📝 测试用户信息:', testUserData);
    
    // 尝试注册新用户
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/users/register`, {
        username: testUserData.username,
        nickname: testUserData.nickname,
        loginType: testUserData.loginType,
        guestId: testUserData.guestId
      });
      
      console.log('✅ 用户注册成功:', registerResponse.status);
      console.log('📋 注册响应:', JSON.stringify(registerResponse.data, null, 2));
      
      if (registerResponse.data.success && registerResponse.data.data && registerResponse.data.data.token) {
        const realToken = registerResponse.data.data.token;
        console.log('🎯 获取到真实Token:', realToken.substring(0, 50) + '...');
        
        // 3. 使用真实token测试API
        console.log('\n3️⃣ 使用真实Token测试API...');
        
        // 测试用户资料端点
        try {
          const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
            headers: {
              'Authorization': `Bearer ${realToken}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ 用户资料请求成功:', profileResponse.status);
        } catch (error) {
          console.log('❌ 用户资料请求失败:', error.response?.status, error.response?.data?.message);
        }
        
        // 测试同步端点
        try {
          const syncResponse = await axios.post(`${API_BASE_URL}/users/batch-sync`, {
            data: [{
              type: 'vocabulary',
              data: [{
                word: 'test',
                translation: '测试',
                userId: registerResponse.data.data.user.id
              }],
              timestamp: Date.now(),
              userId: registerResponse.data.data.user.id,
              operation: 'create',
              priority: 'medium'
            }],
            timestamp: Date.now(),
            syncStrategy: 'local-first',
            deviceId: 'test-device'
          }, {
            headers: {
              'Authorization': `Bearer ${realToken}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ 同步端点请求成功:', syncResponse.status);
          console.log('📋 同步响应:', JSON.stringify(syncResponse.data, null, 2));
        } catch (error) {
          console.log('❌ 同步端点请求失败:', error.response?.status, error.response?.data?.message);
          if (error.response?.data) {
            console.log('📋 错误详情:', JSON.stringify(error.response.data, null, 2));
          }
        }
        
      } else {
        console.log('❌ 注册响应中没有找到token');
        console.log('📋 完整响应:', JSON.stringify(registerResponse.data, null, 2));
      }
      
    } catch (error) {
      console.log('❌ 用户注册失败:', error.response?.status, error.response?.data?.message);
      if (error.response?.data) {
        console.log('📋 错误详情:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // 4. 分析token格式
    console.log('\n4️⃣ 分析Token格式问题...');
    
    // 检查常见的token问题
    const commonTokenIssues = [
      'Token格式不正确',
      'Token过期',
      'Token签名无效',
      'Token中的用户ID不存在',
      'Token缺少必要字段'
    ];
    
    console.log('🔍 可能的Token问题:');
    commonTokenIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
    
    // 5. 测试不同的认证端点
    console.log('\n5️⃣ 测试不同的认证端点...');
    
    const authEndpoints = [
      { path: '/users/login', method: 'POST', name: '用户登录' },
      { path: '/auth/guest', method: 'POST', name: '游客认证' },
      { path: '/users/register', method: 'POST', name: '用户注册' }
    ];
    
    for (const endpoint of authEndpoints) {
      try {
        console.log(`\n🔍 测试端点: ${endpoint.name} (${endpoint.path})`);
        
        const guestId = `guest_${Date.now()}`;
        const username = `test_guest_${Date.now()}`.slice(0, 20);
        
        const response = await axios({
          method: endpoint.method,
          url: `${API_BASE_URL}${endpoint.path}`,
          data: {
            username: username,
            nickname: guestId,
            loginType: 'guest',
            guestId: guestId
          },
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ ${endpoint.name}成功:`, response.status);
        if (response.data && response.data.data && response.data.data.token) {
          console.log(`🎯 获取到Token: ${response.data.data.token.substring(0, 30)}...`);
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint.name}失败:`, error.response?.status, error.response?.data?.message);
      }
    }
    
    console.log('\n🎯 深入调试完成！');
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行调试
debugRealTokenIssue(); 