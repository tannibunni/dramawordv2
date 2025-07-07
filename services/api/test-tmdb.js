require('dotenv').config();
const axios = require('axios');

// TMDB API 配置
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;

console.log('🔧 TMDB API 测试');
console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
console.log('TMDB_ACCESS_TOKEN exists:', !!TMDB_ACCESS_TOKEN);

if (!TMDB_API_KEY && !TMDB_ACCESS_TOKEN) {
  console.error('❌ 请设置 TMDB_API_KEY 或 TMDB_ACCESS_TOKEN 环境变量');
  process.exit(1);
}

async function testTMDBAPI() {
  try {
    // 测试搜索功能
    console.log('\n🔍 测试搜索功能...');
    const searchParams = new URLSearchParams({
      query: 'Friends',
      page: '1',
      include_adult: 'false',
      language: 'zh-CN'
    });

    if (TMDB_API_KEY) {
      searchParams.append('api_key', TMDB_API_KEY);
    }

    const headers = {};
    if (TMDB_ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${TMDB_ACCESS_TOKEN}`;
    }

    const searchResponse = await axios.get(
      `${TMDB_BASE_URL}/search/tv?${searchParams.toString()}`,
      { headers }
    );

    console.log('✅ 搜索成功');
    console.log(`找到 ${searchResponse.data.results.length} 个结果`);
    
    if (searchResponse.data.results.length > 0) {
      const firstShow = searchResponse.data.results[0];
      console.log(`第一个结果: ${firstShow.name} (ID: ${firstShow.id})`);
      
      // 测试获取剧集详情
      console.log('\n📺 测试获取剧集详情...');
      const detailParams = new URLSearchParams({
        language: 'zh-CN'
      });

      if (TMDB_API_KEY) {
        detailParams.append('api_key', TMDB_API_KEY);
      }

      const detailResponse = await axios.get(
        `${TMDB_BASE_URL}/tv/${firstShow.id}?${detailParams.toString()}`,
        { headers }
      );

      console.log('✅ 获取剧集详情成功');
      console.log(`剧集: ${detailResponse.data.name}`);
      console.log(`季数: ${detailResponse.data.number_of_seasons}`);
      console.log(`集数: ${detailResponse.data.number_of_episodes}`);
      console.log(`评分: ${detailResponse.data.vote_average}/10`);
    }

    // 测试获取热门剧集
    console.log('\n🔥 测试获取热门剧集...');
    const popularParams = new URLSearchParams({
      page: '1',
      language: 'zh-CN'
    });

    if (TMDB_API_KEY) {
      popularParams.append('api_key', TMDB_API_KEY);
    }

    const popularResponse = await axios.get(
      `${TMDB_BASE_URL}/tv/popular?${popularParams.toString()}`,
      { headers }
    );

    console.log('✅ 获取热门剧集成功');
    console.log(`找到 ${popularResponse.data.results.length} 个热门剧集`);

    console.log('\n🎉 TMDB API 测试完成！所有功能正常。');

  } catch (error) {
    console.error('❌ TMDB API 测试失败:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('🔑 认证失败：请检查 API Key 或 Access Token 是否正确');
    } else if (error.response?.status === 404) {
      console.error('🔍 资源未找到：请检查 API 端点是否正确');
    }
  }
}

// 运行测试
testTMDBAPI(); 