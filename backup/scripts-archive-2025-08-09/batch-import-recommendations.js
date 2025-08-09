const axios = require('axios');

// 配置
const API_BASE_URL = 'https://dramawordv2.onrender.com';
const BATCH_SIZE = 10; // 每次批量导入的数量

// 示例推荐内容数据
const sampleRecommendations = [
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
    }
  },
  {
    tmdbShowId: 1399,
    title: 'Game of Thrones',
    originalTitle: 'Game of Thrones',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w92/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
    recommendation: {
      text: '看完后我的英语口语突飞猛进，姐妹们冲！史诗级奇幻巨作，每一集都让人欲罢不能！',
      difficulty: 'hard',
      language: 'zh-CN',
      category: ['drama', 'action'],
      tags: ['奇幻', '史诗', '经典']
    },
    metadata: {
      genre: [18, 28],
      rating: 9.3,
      year: 2011,
      status: 'active',
      priority: 9,
      views: 0,
      likes: 0
    }
  },
  {
    tmdbShowId: 1668,
    title: 'Friends',
    originalTitle: 'Friends',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/f496cm9enuEsZkSPzCwnTESEK5s.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w92/f496cm9enuEsZkSPzCwnTESEK5s.jpg',
    recommendation: {
      text: '学英语必看！对话简单清晰，新手友好，治愈系经典神剧！',
      difficulty: 'medium',
      language: 'zh-CN',
      category: ['comedy'],
      tags: ['喜剧', '友情', '经典']
    },
    metadata: {
      genre: [35],
      rating: 8.9,
      year: 1994,
      status: 'active',
      priority: 8,
      views: 0,
      likes: 0
    }
  },
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
      tags: ['科幻', '悬疑', '青春']
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
  {
    tmdbShowId: 13916,
    title: 'The Office',
    originalTitle: 'The Office',
    backdropUrl: 'https://image.tmdb.org/t/p/w780/7Tr6r1sKaD0SIU8Yv1NfTbnc83t.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w92/7Tr6r1sKaD0SIU8Yv1NfTbnc83t.jpg',
    recommendation: {
      text: '商务英语必备，职场对话太实用了！轻松幽默的喜剧神作！',
      difficulty: 'easy',
      language: 'zh-CN',
      category: ['comedy'],
      tags: ['职场', '喜剧', '实用']
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
      tags: ['治愈', '喜剧', '温暖']
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
      tags: ['历史', '剧情', '经典']
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
      tags: ['治愈', '哲学', '喜剧']
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

// 分批导入函数
async function importInBatches(allRecommendations) {
  const batches = [];
  for (let i = 0; i < allRecommendations.length; i += BATCH_SIZE) {
    batches.push(allRecommendations.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 将分 ${batches.length} 批导入，每批 ${BATCH_SIZE} 个`);
  
  let totalImported = 0;
  let totalErrors = 0;
  
  for (let i = 0; i < batches.length; i++) {
    console.log(`\n📦 正在导入第 ${i + 1}/${batches.length} 批...`);
    
    const result = await batchImportRecommendations(batches[i]);
    if (result) {
      totalImported += result.imported;
      totalErrors += result.errors;
      
      if (result.errors > 0) {
        console.log(`⚠️  第 ${i + 1} 批有 ${result.errors} 个错误:`);
        result.details.errors.forEach(error => {
          console.log(`   - TMDB ID ${error.tmdbShowId}: ${error.error}`);
        });
      }
    }
    
    // 添加延迟避免API限制
    if (i < batches.length - 1) {
      console.log('⏳ 等待 2 秒后继续下一批...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n🎉 批量导入完成！`);
  console.log(`📊 总计: 成功 ${totalImported} 个，失败 ${totalErrors} 个`);
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

// 主函数
async function main() {
  console.log('🎬 推荐内容管理系统 - 批量导入工具');
  console.log('=====================================');
  
  // 检查现有统计
  console.log('\n📊 检查现有推荐内容...');
  await getRecommendationStats();
  
  // 开始批量导入
  console.log('\n🚀 开始批量导入推荐内容...');
  await importInBatches(sampleRecommendations);
  
  // 导入后再次检查统计
  console.log('\n📊 导入后统计:');
  await getRecommendationStats();
  
  console.log('\n✨ 批量导入工具执行完成！');
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  batchImportRecommendations,
  importInBatches,
  getRecommendationStats,
  sampleRecommendations
}; 