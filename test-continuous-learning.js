const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001';

async function testContinuousLearning() {
  try {
    console.log('🧪 测试连续学习功能...');
    
    // 模拟用户登录获取 token（这里需要真实的 token）
    const token = 'your-test-token-here';
    
    // 测试1: 更新连续学习
    console.log('\n📝 测试1: 更新连续学习...');
    const response1 = await fetch(`${API_BASE_URL}/users/stats`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        totalReviews: 1,
        updateContinuousLearning: true
      }),
    });
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ 连续学习更新成功:', data1.data);
    } else {
      const error1 = await response1.text();
      console.log('❌ 连续学习更新失败:', error1);
    }
    
    // 测试2: 获取用户统计
    console.log('\n📊 测试2: 获取用户统计...');
    const response2 = await fetch(`${API_BASE_URL}/users/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ 获取用户统计成功:', data2.data);
    } else {
      const error2 = await response2.text();
      console.log('❌ 获取用户统计失败:', error2);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testContinuousLearning(); 