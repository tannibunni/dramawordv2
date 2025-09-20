// 详细测试翻译流程
const axios = require('axios');

async function testDetailedTranslation() {
  try {
    console.log('🔍 详细测试中文翻译到日文...');
    
    const testCases = [
      { word: '我吃中餐', targetLanguage: 'ja' },
      { word: '你好', targetLanguage: 'ja' },
      { word: '谢谢', targetLanguage: 'ja' },
      { word: '天空', targetLanguage: 'en' },
      { word: '水', targetLanguage: 'en' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📝 测试: ${testCase.word} -> ${testCase.targetLanguage}`);
      
      try {
        const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', testCase, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        console.log(`📊 状态: ${response.status}`);
        console.log(`📊 成功: ${response.data.success}`);
        console.log(`📊 候选词: ${JSON.stringify(response.data.candidates)}`);
        console.log(`📊 来源: ${response.data.source}`);
        
        if (response.data.candidates && response.data.candidates.length > 0) {
          console.log(`✅ 翻译成功: ${testCase.word} -> ${response.data.candidates.join(', ')}`);
        } else {
          console.log(`❌ 翻译失败: 候选词为空`);
        }
        
      } catch (error) {
        console.error(`❌ 测试失败: ${error.message}`);
        if (error.response) {
          console.error(`📊 错误响应:`, error.response.data);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 总体测试失败:', error.message);
  }
}

// 运行测试
testDetailedTranslation();
