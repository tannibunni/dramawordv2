// 测试新的中文句子翻译
const axios = require('axios');

async function testNewSentence() {
  try {
    console.log('🔍 测试新句子翻译...\n');
    
    const testCases = [
      { word: '我吃鱼', targetLanguage: 'ja' },
      { word: '我喜欢吃鱼', targetLanguage: 'ja' },
      { word: '今天天气很好', targetLanguage: 'ja' },
      { word: '我要去学校', targetLanguage: 'ja' },
      { word: '我吃鱼', targetLanguage: 'en' },
      { word: '我喜欢吃鱼', targetLanguage: 'en' }
    ];
    
    for (const testCase of testCases) {
      console.log(`📝 测试: ${testCase.word} -> ${testCase.targetLanguage}`);
      
      try {
        // 测试单词翻译API
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
        } else {
          console.log(`❌ 翻译失败: 候选词为空`);
        }
        
        // 测试句子翻译API
        console.log(`\n📝 测试句子翻译API: ${testCase.word} -> ${testCase.targetLanguage}`);
        const sentenceResponse = await axios.post('https://dramawordv2.onrender.com/api/direct-translate/direct-translate', {
          text: testCase.word,
          targetLanguage: testCase.targetLanguage,
          uiLanguage: 'zh-CN'
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        console.log(`📊 句子翻译状态: ${sentenceResponse.status}`);
        console.log(`📊 句子翻译成功: ${sentenceResponse.data.success}`);
        if (sentenceResponse.data.success && sentenceResponse.data.data) {
          console.log(`✅ 句子翻译成功: ${sentenceResponse.data.data.translation}`);
        } else {
          console.log(`❌ 句子翻译失败: ${sentenceResponse.data.error || '未知错误'}`);
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
    console.error('❌ 总体测试失败:', error.message);
  }
}

// 运行测试
testNewSentence();
