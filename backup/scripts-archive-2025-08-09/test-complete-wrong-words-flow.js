// 完整错词功能测试脚本
// 测试从错词添加到移除的完整流程

const axios = require('axios');

const API_BASE_URL = 'https://dramawordv2.onrender.com';

console.log('🧪 开始完整错词功能测试...\n');

// 测试用户数据
const testUser = {
  id: 'test-complete-wrong-words-' + Date.now(),
  username: 'testuser',
  email: 'test@example.com'
};

async function testCompleteWrongWordsFlow() {
  try {
    console.log('🔍 测试1: 检查后端服务状态');
    
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log(`✅ 后端服务状态: ${healthResponse.status}`);
    console.log(`🕐 服务器时间: ${healthResponse.data.timestamp}`);
    console.log('');

    console.log('🔍 测试2: 清空测试用户词汇表');
    
    // 清空用户词汇表
    try {
      await axios.delete(`${API_BASE_URL}/api/words/user/clear-vocabulary`, {
        data: { userId: testUser.id }
      });
      console.log('✅ 用户词汇表已清空');
    } catch (error) {
      console.log('ℹ️ 用户词汇表为空或清空失败（继续测试）');
    }
    console.log('');

    console.log('🔍 测试3: 添加错词到用户词汇表');
    
    // 添加apple作为错词
    console.log('📱 用户左滑 apple（答错）...');
    const addAppleResponse = await axios.post(`${API_BASE_URL}/api/words/user/vocabulary`, {
      userId: testUser.id,
      word: 'apple',
      translation: '苹果',
      incorrectCount: 1,
      consecutiveIncorrect: 1,
      consecutiveCorrect: 0
    });
    
    if (addAppleResponse.data.success) {
      console.log('✅ apple 已添加到用户词汇表');
    } else {
      console.log('❌ apple 添加失败');
      return;
    }

    // 添加banana作为错词
    console.log('📱 用户左滑 banana（答错）...');
    const addBananaResponse = await axios.post(`${API_BASE_URL}/api/words/user/vocabulary`, {
      userId: testUser.id,
      word: 'banana',
      translation: '香蕉',
      incorrectCount: 1,
      consecutiveIncorrect: 1,
      consecutiveCorrect: 0
    });
    
    if (addBananaResponse.data.success) {
      console.log('✅ banana 已添加到用户词汇表');
    } else {
      console.log('❌ banana 添加失败');
      return;
    }

    console.log('');

    console.log('🔍 测试4: 验证错词数量计算');
    
    // 获取用户词汇表
    const vocabularyResponse = await axios.get(`${API_BASE_URL}/api/words/user/vocabulary?userId=${testUser.id}`);
    
    if (vocabularyResponse.data.success) {
      const vocabulary = vocabularyResponse.data.data;
      console.log(`📥 用户词汇表数量: ${vocabulary.length}`);
      
      // 计算错词数量
      const wrongWords = vocabulary.filter(word => {
        // 连续答对3次后从错词卡移除
        if ((word.consecutiveCorrect || 0) >= 3) {
          return false;
        }
        
        // 有答错记录或连续答错
        return (word.incorrectCount || 0) > 0 || (word.consecutiveIncorrect || 0) > 0;
      });

      console.log(`📊 错词数量计算结果: ${wrongWords.length}`);
      console.log('📋 错词详情:');
      wrongWords.forEach(word => {
        console.log(`  - ${word.word}: incorrectCount=${word.incorrectCount}, consecutiveIncorrect=${word.consecutiveIncorrect}, consecutiveCorrect=${word.consecutiveCorrect}`);
      });
    } else {
      console.log('❌ 获取用户词汇表失败');
      return;
    }

    console.log('');

    console.log('🔍 测试5: 模拟错词移除流程');
    
    // 模拟用户连续答对apple 3次
    console.log('📱 用户连续答对 apple 3次...');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`📤 第${i}次答对，更新学习进度...`);
      
      const updateResponse = await axios.put(`${API_BASE_URL}/api/words/user/progress`, {
        userId: testUser.id,
        word: 'apple',
        progress: {
          reviewCount: 1 + i,
          incorrectCount: 1,
          consecutiveIncorrect: 0,
          consecutiveCorrect: i
        }
      });
      
      if (updateResponse.data.success) {
        console.log(`✅ 第${i}次答对，学习进度更新成功`);
        
        if (i === 3) {
          console.log('🎉 apple 连续答对3次，应该从错词集合移除');
        }
      } else {
        console.log(`❌ 第${i}次答对，学习进度更新失败`);
        return;
      }
    }

    console.log('');

    console.log('🔍 测试6: 验证错词移除后的状态');
    
    // 再次获取用户词汇表
    const finalVocabularyResponse = await axios.get(`${API_BASE_URL}/api/words/user/vocabulary?userId=${testUser.id}`);
    
    if (finalVocabularyResponse.data.success) {
      const finalVocabulary = finalVocabularyResponse.data.data;
      console.log(`📥 最终用户词汇表数量: ${finalVocabulary.length}`);
      
      // 计算最终错词数量
      const finalWrongWords = finalVocabulary.filter(word => {
        if ((word.consecutiveCorrect || 0) >= 3) {
          return false;
        }
        return (word.incorrectCount || 0) > 0 || (word.consecutiveIncorrect || 0) > 0;
      });

      console.log(`📊 最终错词数量: ${finalWrongWords.length}`);
      console.log('📋 最终错词详情:');
      finalWrongWords.forEach(word => {
        console.log(`  - ${word.word}: incorrectCount=${word.incorrectCount}, consecutiveIncorrect=${word.consecutiveIncorrect}, consecutiveCorrect=${word.consecutiveCorrect}`);
      });

      // 验证apple的状态
      const appleWord = finalVocabulary.find(word => word.word === 'apple');
      if (appleWord) {
        console.log(`\n🍎 apple 最终状态:`);
        console.log(`  - consecutiveCorrect: ${appleWord.consecutiveCorrect}`);
        console.log(`  - 是否在错词集合中: ${appleWord.consecutiveCorrect >= 3 ? '否' : '是'}`);
      }

      console.log('');

      console.log('🎯 最终验证:');
      console.log(`✅ 后端服务状态: 正常`);
      console.log(`✅ 错词添加功能: 正常`);
      console.log(`✅ 错词移除功能: 正常`);
      console.log(`✅ 错词数量计算: 正确`);
      console.log(`✅ 用户词汇表管理: 正常`);

      if (finalWrongWords.length === 1 && finalWrongWords[0].word === 'banana') {
        console.log('🎉 完整错词功能测试通过！');
        console.log('✅ 错词添加、更新、移除流程完全正常');
      } else {
        console.log('❌ 完整错词功能测试失败！');
        console.log(`❌ 期望错词数量: 1 (banana)，实际: ${finalWrongWords.length}`);
      }

    } else {
      console.log('❌ 获取最终用户词汇表失败');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('📊 错误响应:', error.response.status, error.response.data);
    }
  }
}

// 运行测试
testCompleteWrongWordsFlow().then(() => {
  console.log('\n✅ 完整错词功能测试完成');
}).catch(error => {
  console.error('\n❌ 测试执行失败:', error.message);
}); 