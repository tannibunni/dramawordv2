const axios = require('axios');

const API_BASE_URL = 'https://dramawordv2.onrender.com';

// 直接测试创建推荐内容（绕过认证）
async function createSimpleRecommendation() {
  console.log('🎬 创建简单推荐内容...');
  
  const recommendationData = {
    tmdbShowId: 1396,
    title: 'Breaking Bad',
    originalTitle: 'Breaking Bad',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w92/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    recommendation: {
      text: '这部剧真的绝了！学英语必备，强烈安利！犯罪剧巅峰之作，每一集都让人欲罢不能！',
      difficulty: 'hard',
      language: 'zh-CN',
      category: ['crime', 'drama'],
      tags: ['犯罪', '剧情', '经典']
    },
    metadata: {
      genre: [80, 18],
      rating: 9.5,
      year: 2008,
      status: 'active',
      priority: 10,
      views: 0,
      likes: 0
    },
    author: {
      id: 'system',
      name: 'System'
    }
  };

  try {
    // 尝试直接调用创建API
    const response = await axios.post(`${API_BASE_URL}/api/recommendations`, recommendationData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 创建成功:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ 创建失败:', error.response?.data || error.message);
    
    // 如果API不可用，尝试其他方法
    console.log('\n🔄 尝试其他方法...');
    
    // 测试其他已知的API端点
    try {
      const testResponse = await axios.get(`${API_BASE_URL}/api/users`);
      console.log('✅ 用户API可用:', testResponse.status);
    } catch (testError) {
      console.log('❌ 用户API也不可用:', testError.response?.data || testError.message);
    }
    
    return null;
  }
}

// 测试获取推荐内容
async function getRecommendations() {
  console.log('\n📋 获取推荐内容...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/recommendations`);
    console.log('✅ 获取成功:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ 获取失败:', error.response?.data || error.message);
    return null;
  }
}

// 主函数
async function main() {
  console.log('🎯 推荐内容管理系统 - 简单测试');
  console.log('================================');
  
  // 创建推荐内容
  const created = await createSimpleRecommendation();
  
  if (created) {
    // 获取推荐内容
    await getRecommendations();
  }
  
  console.log('\n✨ 测试完成！');
}

main().catch(console.error); 