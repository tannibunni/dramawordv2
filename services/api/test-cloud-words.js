const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// 测试云单词表架构
async function testCloudWordsArchitecture() {
  console.log('🧪 开始测试云单词表架构...\n');

  try {
    // 1. 测试单词搜索（应该从云单词表获取）
    console.log('1️⃣ 测试单词搜索...');
    const searchResponse = await axios.post(`${API_BASE_URL}/words/search`, {
      word: 'hello'
    });
    
    if (searchResponse.data.success) {
      console.log('✅ 单词搜索成功');
      console.log(`   单词: ${searchResponse.data.data.word}`);
      console.log(`   来源: ${searchResponse.data.source}`);
      console.log(`   搜索次数: ${searchResponse.data.data.searchCount}`);
    } else {
      console.log('❌ 单词搜索失败:', searchResponse.data.error);
    }

    // 2. 测试获取热门单词
    console.log('\n2️⃣ 测试获取热门单词...');
    const popularResponse = await axios.get(`${API_BASE_URL}/words/popular`);
    
    if (popularResponse.data.success) {
      console.log('✅ 获取热门单词成功');
      console.log(`   热门单词数量: ${popularResponse.data.data.length}`);
      popularResponse.data.data.slice(0, 3).forEach((word, index) => {
        console.log(`   ${index + 1}. ${word.word} (搜索 ${word.searchCount} 次)`);
      });
    } else {
      console.log('❌ 获取热门单词失败:', popularResponse.data.error);
    }

    // 3. 测试获取最近搜索
    console.log('\n3️⃣ 测试获取最近搜索...');
    const recentResponse = await axios.get(`${API_BASE_URL}/words/recent-searches`);
    
    if (recentResponse.data.success) {
      console.log('✅ 获取最近搜索成功');
      console.log(`   最近搜索数量: ${recentResponse.data.data.length}`);
      recentResponse.data.data.slice(0, 3).forEach((search, index) => {
        console.log(`   ${index + 1}. ${search.word} - ${search.definition}`);
      });
    } else {
      console.log('❌ 获取最近搜索失败:', recentResponse.data.error);
    }

    // 4. 测试保存搜索历史
    console.log('\n4️⃣ 测试保存搜索历史...');
    const historyResponse = await axios.post(`${API_BASE_URL}/words/history`, {
      word: 'test',
      definition: '测试',
      timestamp: Date.now()
    });
    
    if (historyResponse.data.success) {
      console.log('✅ 保存搜索历史成功');
    } else {
      console.log('❌ 保存搜索历史失败:', historyResponse.data.error);
    }

    // 5. 测试拼写建议
    console.log('\n5️⃣ 测试拼写建议...');
    const spellResponse = await axios.post(`${API_BASE_URL}/words/search`, {
      word: 'helo' // 故意拼错
    });
    
    if (!spellResponse.data.success && spellResponse.data.suggestions) {
      console.log('✅ 拼写建议功能正常');
      console.log(`   建议: ${spellResponse.data.suggestions.join(', ')}`);
    } else {
      console.log('⚠️ 拼写建议功能异常');
    }

    console.log('\n🎉 云单词表架构测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

// 测试数据迁移（如果直接运行此脚本）
if (require.main === module) {
  // 检查服务器是否运行
  axios.get(`${API_BASE_URL}/health`)
    .then(() => {
      console.log('🚀 服务器运行正常，开始测试...\n');
      testCloudWordsArchitecture();
    })
    .catch(() => {
      console.error('❌ 服务器未运行，请先启动服务器');
      console.log('   运行命令: npm start');
    });
}

module.exports = { testCloudWordsArchitecture }; 