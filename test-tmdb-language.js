const API_BASE_URL = 'https://dramawordv2.onrender.com/api';

async function testTMDBLanguage() {
  console.log('🧪 Testing TMDB API language parameter...\n');

  // 测试搜索API - 中文
  console.log('📝 Testing search API with Chinese language...');
  try {
    const response = await fetch(`${API_BASE_URL}/tmdb/search?query=breaking&language=zh-CN`);
    const data = await response.json();
    if (data.success && data.data.results.length > 0) {
      const show = data.data.results[0];
      console.log(`✅ Chinese search result: "${show.name}" - Overview: ${show.overview.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error('❌ Chinese search failed:', error.message);
  }

  // 测试搜索API - 英文
  console.log('\n📝 Testing search API with English language...');
  try {
    const response = await fetch(`${API_BASE_URL}/tmdb/search?query=breaking&language=en-US`);
    const data = await response.json();
    if (data.success && data.data.results.length > 0) {
      const show = data.data.results[0];
      console.log(`✅ English search result: "${show.name}" - Overview: ${show.overview.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error('❌ English search failed:', error.message);
  }

  // 测试剧集详情API - 中文
  console.log('\n📝 Testing show details API with Chinese language...');
  try {
    const response = await fetch(`${API_BASE_URL}/tmdb/shows/1396?language=zh-CN`); // Breaking Bad
    const data = await response.json();
    if (data.success) {
      const show = data.data;
      console.log(`✅ Chinese show details: "${show.name}" - Genres: ${show.genres.map(g => g.name).join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Chinese show details failed:', error.message);
  }

  // 测试剧集详情API - 英文
  console.log('\n📝 Testing show details API with English language...');
  try {
    const response = await fetch(`${API_BASE_URL}/tmdb/shows/1396?language=en-US`); // Breaking Bad
    const data = await response.json();
    if (data.success) {
      const show = data.data;
      console.log(`✅ English show details: "${show.name}" - Genres: ${show.genres.map(g => g.name).join(', ')}`);
    }
  } catch (error) {
    console.error('❌ English show details failed:', error.message);
  }

  console.log('\n🎉 TMDB language test completed!');
}

testTMDBLanguage().catch(console.error); 