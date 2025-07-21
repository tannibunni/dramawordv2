const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001';

async function testReviewCount() {
  try {
    console.log('🧪 测试复习次数更新 API...');
    
    // 模拟用户登录获取 token（这里需要真实的 token）
    const token = 'your-test-token-here';
    
    // 测试更新复习次数
    const response = await fetch(`${API_BASE_URL}/users/stats`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        totalReviews: 1 // 增加1次复习
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 复习次数更新成功:', data);
    } else {
      const error = await response.text();
      console.log('❌ 复习次数更新失败:', error);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testReviewCount(); 