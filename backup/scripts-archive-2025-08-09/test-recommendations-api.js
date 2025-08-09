const axios = require('axios');

const API_BASE_URL = 'https://dramawordv2.onrender.com';

async function testRecommendationsAPI() {
  console.log('🧪 测试推荐内容API...');
  
  try {
    // 测试健康检查
    console.log('\n1. 测试健康检查...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ 健康检查:', healthResponse.data);
    
    // 测试推荐统计
    console.log('\n2. 测试推荐统计...');
    try {
      const statsResponse = await axios.get(`${API_BASE_URL}/api/recommendations/stats`);
      console.log('✅ 推荐统计:', statsResponse.data);
    } catch (error) {
      console.log('❌ 推荐统计失败:', error.response?.data || error.message);
    }
    
    // 测试获取推荐列表
    console.log('\n3. 测试获取推荐列表...');
    try {
      const listResponse = await axios.get(`${API_BASE_URL}/api/recommendations`);
      console.log('✅ 推荐列表:', listResponse.data);
    } catch (error) {
      console.log('❌ 推荐列表失败:', error.response?.data || error.message);
    }
    
    // 测试智能推荐
    console.log('\n4. 测试智能推荐...');
    try {
      const smartResponse = await axios.get(`${API_BASE_URL}/api/recommendations/smart?language=zh-CN&limit=5`);
      console.log('✅ 智能推荐:', smartResponse.data);
    } catch (error) {
      console.log('❌ 智能推荐失败:', error.response?.data || error.message);
    }
    
    // 测试创建推荐（不需要认证的测试）
    console.log('\n5. 测试创建推荐（无认证）...');
    try {
      const createResponse = await axios.post(`${API_BASE_URL}/api/recommendations`, {
        tmdbShowId: 999999,
        title: 'Test Show',
        originalTitle: 'Test Show',
        backdropUrl: 'https://example.com/backdrop.jpg',
        posterUrl: 'https://example.com/poster.jpg',
        recommendation: {
          text: '测试推荐内容',
          difficulty: 'medium',
          language: 'zh-CN',
          category: ['drama'],
          tags: ['测试']
        },
        metadata: {
          genre: [18],
          rating: 8.0,
          year: 2024,
          status: 'draft',
          priority: 5,
          views: 0,
          likes: 0
        }
      });
      console.log('✅ 创建推荐:', createResponse.data);
    } catch (error) {
      console.log('❌ 创建推荐失败:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testRecommendationsAPI(); 