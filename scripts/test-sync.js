const axios = require('axios');

const API_BASE_URL = 'https://dramawordv2.onrender.com';

// 测试数据
const testSyncData = {
  type: 'learning_record',
  userId: 'test_user_123',
  data: [
    {
      word: 'hello',
      mastery: 80,
      reviewCount: 5,
      correctCount: 4,
      incorrectCount: 1,
      lastReviewDate: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      interval: 24,
      easeFactor: 2.5,
      consecutiveCorrect: 3,
      consecutiveIncorrect: 0,
      totalStudyTime: 240,
      averageResponseTime: 3,
      confidence: 4,
      notes: '',
      tags: ['basic', 'greeting']
    }
  ]
};

async function testSync() {
  console.log('🔍 开始测试同步功能...');
  
  try {
    // 1. 测试健康检查
    console.log('\n1️⃣ 测试服务器健康状态...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ 服务器健康状态:', healthResponse.data);
    
    // 2. 测试同步测试端点
    console.log('\n2️⃣ 测试同步测试端点...');
    try {
      const syncTestResponse = await axios.post(`${API_BASE_URL}/api/sync/test`, testSyncData, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Test-Sync-Script/1.0'
        },
        timeout: 10000 // 10秒超时
      });
      console.log('✅ 同步测试端点正常:', syncTestResponse.data);
    } catch (error) {
      console.log('❌ 同步测试端点失败:');
      console.log('   状态码:', error.response?.status);
      console.log('   错误信息:', error.response?.data || error.message);
    }
    
    // 3. 测试需要认证的同步端点
    console.log('\n3️⃣ 测试需要认证的同步端点...');
    try {
      const syncResponse = await axios.post(`${API_BASE_URL}/api/sync/batch`, testSyncData, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Test-Sync-Script/1.0'
        },
        timeout: 10000 // 10秒超时
      });
      console.log('✅ 同步测试成功:', syncResponse.data);
    } catch (error) {
      console.log('❌ 同步测试失败:');
      console.log('   状态码:', error.response?.status);
      console.log('   错误信息:', error.response?.data || error.message);
      console.log('   错误详情:', error.response?.data?.error || error.message);
      
      if (error.response?.status === 401) {
        console.log('   💡 需要认证token，这是正常的');
      } else if (error.response?.status === 500) {
        console.log('   🔍 服务器内部错误，检查日志');
      }
    }
    
    // 4. 测试数据库连接（通过调试端点）
    console.log('\n4️⃣ 测试数据库连接...');
    try {
      const dbTestResponse = await axios.post(`${API_BASE_URL}/api/debug/sync-test`, testSyncData, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Test-Sync-Script/1.0'
        },
        timeout: 10000
      });
      console.log('✅ 数据库连接测试成功:', dbTestResponse.data);
    } catch (error) {
      console.log('❌ 数据库连接测试失败:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testSync().then(() => {
  console.log('\n🎉 测试完成');
}).catch((error) => {
  console.error('❌ 测试失败:', error);
}); 