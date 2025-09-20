// 测试前端翻译流程
const axios = require('axios');

async function testFrontendTranslation() {
  try {
    console.log('🔍 测试前端翻译流程...\n');
    
    // 模拟前端调用统一查询服务
    const testCases = [
      { input: '我吃鱼', targetLanguage: 'ja' },
      { input: '我喜欢吃鱼', targetLanguage: 'ja' },
      { input: '今天天气很好', targetLanguage: 'ja' },
      { input: '我要去学校', targetLanguage: 'ja' },
      { input: '我吃鱼', targetLanguage: 'en' },
      { input: '我喜欢吃鱼', targetLanguage: 'en' }
    ];
    
    for (const testCase of testCases) {
      console.log(`📝 测试前端翻译: "${testCase.input}" -> ${testCase.targetLanguage}`);
      
      try {
        // 模拟前端调用words/translate API（这是统一查询服务会调用的）
        const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
          word: testCase.input,
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
          console.log(`✅ 翻译成功: ${testCase.input} -> ${response.data.candidates.join(', ')}`);
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
    console.error('❌ 前端翻译测试失败:', error.message);
  }
}

// 运行测试
testFrontendTranslation();
