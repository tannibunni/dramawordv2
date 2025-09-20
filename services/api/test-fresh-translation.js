// 测试全新的翻译流程（清除缓存）
const axios = require('axios');

async function testFreshTranslation() {
  try {
    console.log('🔍 测试全新翻译流程（清除缓存）...\n');
    
    // 测试一个全新的句子，确保不会被缓存
    const testCases = [
      { word: '我今天很高兴', targetLanguage: 'ja' },
      { word: '明天会下雨吗', targetLanguage: 'ja' },
      { word: '我喜欢读书', targetLanguage: 'ja' },
      { word: '今天天气不错', targetLanguage: 'ja' }
    ];
    
    for (const testCase of testCases) {
      console.log(`📝 测试: ${testCase.word} -> ${testCase.targetLanguage}`);
      
      try {
        const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
          word: testCase.word,
          targetLanguage: testCase.targetLanguage
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        console.log(`📊 状态: ${response.status}`);
        console.log(`📊 成功: ${response.data.success}`);
        console.log(`📊 候选词: ${JSON.stringify(response.data.candidates)}`);
        console.log(`📊 来源: ${response.data.source}`);
        
        if (response.data.success && response.data.candidates && response.data.candidates.length > 0) {
          console.log(`✅ 翻译成功: ${testCase.word} -> ${response.data.candidates.join(', ')}`);
          console.log(`📊 使用的翻译服务: ${response.data.source}`);
        } else {
          console.log(`❌ 翻译失败: 候选词为空`);
        }
        
      } catch (error) {
        console.error(`❌ 测试失败: ${error.message}`);
        if (error.response) {
          console.error(`📊 错误响应:`, error.response.data);
        }
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testFreshTranslation();
