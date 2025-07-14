const axios = require('axios');

const API_BASE_URL = 'https://dramawordv2.onrender.com/api';

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
        console.log(`   ${index + 1}. ${word.word} (搜索 ${word.count} 次)`);
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

// 测试用户单词本相关API
async function testUserVocabularyAPI() {
  console.log('\n📚 开始测试用户单词本API...\n');

  const testUserId = 'test-user-123';

  try {
    // 1. 测试获取用户单词本
    console.log('1️⃣ 测试获取用户单词本...');
    const vocabResponse = await axios.get(`${API_BASE_URL}/words/user/vocabulary?userId=${testUserId}`);
    
    if (vocabResponse.data.success) {
      console.log('✅ 获取用户单词本成功');
      console.log(`   单词本数量: ${vocabResponse.data.data.length}`);
      vocabResponse.data.data.slice(0, 3).forEach((word, index) => {
        console.log(`   ${index + 1}. ${word.word} - 掌握度: ${word.mastery || 0}%`);
      });
    } else {
      console.log('❌ 获取用户单词本失败:', vocabResponse.data.error);
    }

    // 2. 测试添加单词到用户单词本
    console.log('\n2️⃣ 测试添加单词到用户单词本...');
    const addWordResponse = await axios.post(`${API_BASE_URL}/words/user/vocabulary`, {
      userId: testUserId,
      word: 'beautiful',
      sourceShow: {
        id: 123,
        name: 'Friends',
        status: 'watching'
      }
    });
    
    if (addWordResponse.data.success) {
      console.log('✅ 添加单词到用户单词本成功');
      console.log(`   添加的单词: ${addWordResponse.data.data.word}`);
    } else {
      console.log('❌ 添加单词到用户单词本失败:', addWordResponse.data.error);
    }

    // 3. 测试更新单词学习进度
    console.log('\n3️⃣ 测试更新单词学习进度...');
    const progressResponse = await axios.put(`${API_BASE_URL}/words/user/progress`, {
      userId: testUserId,
      word: 'beautiful',
      progress: {
        mastery: 75,
        reviewCount: 3,
        correctCount: 2,
        incorrectCount: 1,
        confidence: 4,
        notes: '这个单词很美'
      }
    });
    
    if (progressResponse.data.success) {
      console.log('✅ 更新单词学习进度成功');
    } else {
      console.log('❌ 更新单词学习进度失败:', progressResponse.data.error);
    }

    // 4. 再次获取用户单词本，验证更新
    console.log('\n4️⃣ 验证更新后的用户单词本...');
    const updatedVocabResponse = await axios.get(`${API_BASE_URL}/words/user/vocabulary?userId=${testUserId}`);
    
    if (updatedVocabResponse.data.success) {
      console.log('✅ 验证用户单词本更新成功');
      const beautifulWord = updatedVocabResponse.data.data.find(w => w.word === 'beautiful');
      if (beautifulWord) {
        console.log(`   beautiful 单词掌握度: ${beautifulWord.mastery}%`);
        console.log(`   复习次数: ${beautifulWord.reviewCount}`);
        console.log(`   用户笔记: ${beautifulWord.notes}`);
      }
    } else {
      console.log('❌ 验证用户单词本更新失败:', updatedVocabResponse.data.error);
    }

    console.log('\n🎉 用户单词本API测试完成！');

  } catch (error) {
    console.error('❌ 用户单词本API测试过程中出现错误:', error.message);
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
      testCloudWordsArchitecture()
        .then(() => testUserVocabularyAPI())
        .then(() => {
          console.log('\n🎉 所有测试完成！');
        })
        .catch((error) => {
          console.error('❌ 测试执行失败:', error.message);
        });
    })
    .catch(() => {
      console.error('❌ 服务器未运行，请先启动服务器');
      console.log('   运行命令: npm start');
    });
}

module.exports = { testCloudWordsArchitecture, testUserVocabularyAPI }; 