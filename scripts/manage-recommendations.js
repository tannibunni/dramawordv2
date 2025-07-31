const axios = require('axios');

// 配置
const API_BASE_URL = 'https://dramawordv2.onrender.com';

// 🎯 开发者推荐内容管理脚本
// 你只需要在这里添加/修改推荐内容，然后运行脚本即可

const developerRecommendations = [
  // ===== 经典必看剧集 =====
  {
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
      tags: ['犯罪', '剧情', '经典', '必看']
    },
    metadata: {
      genre: [80, 18],
      rating: 9.5,
      year: 2008,
      status: 'active',
      priority: 10, // 最高优先级
      views: 0,
      likes: 0
    }
  },
  
  // ===== 新手友好剧集 =====
  {
    tmdbShowId: 1668,
    title: 'Friends',
    originalTitle: 'Friends',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/f496cm9enuEsZkSPzCwnTESEK5s.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w92/f496cm9enuEsZkSPzCwnTESEK5s.jpg',
    recommendation: {
      text: '学英语必看！对话简单清晰，新手友好，治愈系经典神剧！',
      difficulty: 'easy',
      language: 'zh-CN',
      category: ['comedy'],
      tags: ['喜剧', '友情', '经典', '新手友好']
    },
    metadata: {
      genre: [35],
      rating: 8.9,
      year: 1994,
      status: 'active',
      priority: 9,
      views: 0,
      likes: 0
    }
  },
  
  // ===== 职场英语剧集 =====
  {
    tmdbShowId: 13916,
    title: 'The Office',
    originalTitle: 'The Office',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/7Tr6r1sKaD0SIU8Yv1NfTbnc83t.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w92/7Tr6r1sKaD0SIU8Yv1NfTbnc83t.jpg',
    recommendation: {
      text: '商务英语必备，职场对话太实用了！轻松幽默的喜剧神作！',
      difficulty: 'medium',
      language: 'zh-CN',
      category: ['comedy'],
      tags: ['职场', '喜剧', '实用', '商务英语']
    },
    metadata: {
      genre: [35],
      rating: 8.9,
      year: 2005,
      status: 'active',
      priority: 8,
      views: 0,
      likes: 0
    }
  },
  
  // ===== 悬疑推理剧集 =====
  {
    tmdbShowId: 1398,
    title: 'Stranger Things',
    originalTitle: 'Stranger Things',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w92/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    recommendation: {
      text: '这部剧拯救了我的英语听力，强烈推荐！悬疑氛围感拉满，紧张刺激的剧情！',
      difficulty: 'medium',
      language: 'zh-CN',
      category: ['sci-fi', 'mystery'],
      tags: ['科幻', '悬疑', '青春', '听力训练']
    },
    metadata: {
      genre: [878, 9648],
      rating: 8.7,
      year: 2016,
      status: 'active',
      priority: 7,
      views: 0,
      likes: 0
    }
  },
  
  // ===== 治愈系剧集 =====
  {
    tmdbShowId: 13917,
    title: 'Parks and Recreation',
    originalTitle: 'Parks and Recreation',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/7Tr6r1sKaD0SIU8Yv1NfTbnc83t.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w92/7Tr6r1sKaD0SIU8Yv1NfTbnc83t.jpg',
    recommendation: {
      text: '被这部剧治愈了，顺便还学了超多实用词汇！温暖人心的故事！',
      difficulty: 'easy',
      language: 'zh-CN',
      category: ['comedy'],
      tags: ['治愈', '喜剧', '温暖', '实用词汇']
    },
    metadata: {
      genre: [35],
      rating: 8.6,
      year: 2009,
      status: 'active',
      priority: 7,
      views: 0,
      likes: 0
    }
  },
  
  // ===== 历史剧情剧集 =====
  {
    tmdbShowId: 13918,
    title: 'The Crown',
    originalTitle: 'The Crown',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/7Tr6r1sKaD0SIU8Yv1NfTbnc83t.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w92/7Tr6r1sKaD0SIU8Yv1NfTbnc83t.jpg',
    recommendation: {
      text: '经典神作，看完后久久不能平静！剧情深度探讨人性！',
      difficulty: 'hard',
      language: 'zh-CN',
      category: ['drama'],
      tags: ['历史', '剧情', '经典', '深度']
    },
    metadata: {
      genre: [18],
      rating: 8.7,
      year: 2016,
      status: 'active',
      priority: 8,
      views: 0,
      likes: 0
    }
  },
  
  // ===== 哲学思考剧集 =====
  {
    tmdbShowId: 13919,
    title: 'The Good Place',
    originalTitle: 'The Good Place',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/7Tr6r1sKaD0SIU8Yv1NfTbnc83t.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w92/7Tr6r1sKaD0SIU8Yv1NfTbnc83t.jpg',
    recommendation: {
      text: '治愈系必看剧集，轻松愉快的下饭剧！智慧与正义的较量！',
      difficulty: 'medium',
      language: 'zh-CN',
      category: ['comedy', 'drama'],
      tags: ['治愈', '哲学', '喜剧', '思考']
    },
    metadata: {
      genre: [35, 18],
      rating: 8.2,
      year: 2016,
      status: 'active',
      priority: 6,
      views: 0,
      likes: 0
    }
  }
];

// 批量导入函数
async function batchImportRecommendations(recommendations) {
  try {
    console.log(`🚀 开始批量导入 ${recommendations.length} 个推荐内容...`);
    
    const response = await axios.post(`${API_BASE_URL}/api/recommendations/batch-import`, {
      recommendations
    });
    
    if (response.data.success) {
      console.log('✅ 批量导入成功！');
      console.log(`📊 导入结果:`, response.data.data);
      return response.data.data;
    } else {
      console.error('❌ 批量导入失败:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ 批量导入出错:', error.response?.data || error.message);
    return null;
  }
}

// 获取推荐统计
async function getRecommendationStats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/recommendations/stats`);
    
    if (response.data.success) {
      console.log('📊 推荐内容统计:');
      console.log(response.data.data);
      return response.data.data;
    }
  } catch (error) {
    console.error('❌ 获取统计失败:', error.response?.data || error.message);
  }
}

// 清空所有推荐内容（谨慎使用）
async function clearAllRecommendations() {
  try {
    console.log('⚠️  警告：这将删除所有推荐内容！');
    console.log('请确认是否继续...');
    
    // 这里可以添加确认逻辑
    const response = await axios.delete(`${API_BASE_URL}/api/recommendations/clear-all`);
    
    if (response.data.success) {
      console.log('✅ 所有推荐内容已清空');
    }
  } catch (error) {
    console.error('❌ 清空失败:', error.response?.data || error.message);
  }
}

// 主函数
async function main() {
  console.log('🎬 推荐内容管理系统 - 开发者管理工具');
  console.log('=====================================');
  
  // 检查现有统计
  console.log('\n📊 检查现有推荐内容...');
  await getRecommendationStats();
  
  // 开始批量导入
  console.log('\n🚀 开始批量导入推荐内容...');
  const result = await batchImportRecommendations(developerRecommendations);
  
  if (result) {
    console.log(`\n✅ 成功导入 ${result.imported} 个推荐内容`);
    if (result.errors > 0) {
      console.log(`⚠️  有 ${result.errors} 个错误，可能是重复内容`);
    }
  }
  
  // 导入后再次检查统计
  console.log('\n📊 导入后统计:');
  await getRecommendationStats();
  
  console.log('\n✨ 开发者管理工具执行完成！');
  console.log('\n💡 提示：');
  console.log('1. 修改 developerRecommendations 数组来添加/修改推荐内容');
  console.log('2. 重新运行此脚本来更新云端数据');
  console.log('3. 用户APP会自动从云端获取最新推荐内容');
  console.log('4. 数据不会打包在APP中，不会影响安装包大小');
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  developerRecommendations,
  batchImportRecommendations,
  getRecommendationStats,
  clearAllRecommendations
}; 