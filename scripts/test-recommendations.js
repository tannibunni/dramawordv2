// 测试推荐功能
console.log('🧪 测试推荐功能...');

// 模拟推荐数据
const mockRecommendations = [
  {
    id: '1',
    tmdbShowId: 1396,
    title: 'Breaking Bad',
    originalTitle: '绝命毒师',
    backdropUrl: 'https://via.placeholder.com/780x439/E53E3E/FFFFFF?text=Breaking+Bad',
    posterUrl: 'https://via.placeholder.com/92x138/E53E3E/FFFFFF?text=BB',
    recommendation: {
      text: '这部剧真的绝了！学英语必备，强烈安利！',
      difficulty: 'hard'
    }
  },
  {
    id: '2',
    tmdbShowId: 1399,
    title: 'Game of Thrones',
    originalTitle: '权力的游戏',
    backdropUrl: 'https://via.placeholder.com/780x439/2D3748/FFFFFF?text=Game+of+Thrones',
    posterUrl: 'https://via.placeholder.com/92x138/2D3748/FFFFFF?text=GoT',
    recommendation: {
      text: '看完后我的英语口语突飞猛进，姐妹们冲！',
      difficulty: 'hard'
    }
  },
  {
    id: '3',
    tmdbShowId: 1668,
    title: 'Friends',
    originalTitle: '老友记',
    backdropUrl: 'https://via.placeholder.com/780x439/ED8936/FFFFFF?text=Friends',
    posterUrl: 'https://via.placeholder.com/92x138/ED8936/FFFFFF?text=Friends',
    recommendation: {
      text: '学英语必看！对话简单清晰，新手友好',
      difficulty: 'medium'
    }
  }
];

console.log('✅ 推荐数据创建成功');
console.log('📊 推荐数量:', mockRecommendations.length);
console.log('🎯 推荐内容示例:');
mockRecommendations.forEach((rec, index) => {
  console.log(`  ${index + 1}. ${rec.title} - ${rec.recommendation.text}`);
});

// 测试搜索功能
const testSearch = (query) => {
  const filtered = mockRecommendations.filter(rec => 
    rec.title.toLowerCase().includes(query.toLowerCase()) ||
    rec.originalTitle.toLowerCase().includes(query.toLowerCase()) ||
    rec.recommendation.text.toLowerCase().includes(query.toLowerCase())
  );
  return filtered;
};

console.log('\n🔍 测试搜索功能:');
console.log('搜索 "英语" 结果:', testSearch('英语').length, '个');
console.log('搜索 "Friends" 结果:', testSearch('Friends').length, '个');
console.log('搜索 "强烈" 结果:', testSearch('强烈').length, '个');

console.log('\n🎉 推荐功能测试完成！'); 