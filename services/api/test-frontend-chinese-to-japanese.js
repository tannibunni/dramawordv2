// 测试前端中文到日文翻译流程
const axios = require('axios');

async function testFrontendChineseToJapanese() {
  try {
    console.log('🔍 测试前端中文到日文翻译流程...\n');
    
    const testCases = [
      { input: '我吃鱼', expected: '日文翻译' },
      { input: '我喜欢吃鱼', expected: '日文翻译' },
      { input: '今天天气很好', expected: '日文翻译' },
      { input: '我要去学校', expected: '日文翻译' },
      { input: '你好', expected: '日文翻译' },
      { input: '谢谢', expected: '日文翻译' }
    ];
    
    for (const testCase of testCases) {
      console.log(`📝 测试: "${testCase.input}" -> 日文`);
      
      try {
        // 模拟前端调用统一查询服务
        const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
          word: testCase.input,
          targetLanguage: 'ja'
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
        console.log(`📊 目标语言: ${response.data.targetLanguage}`);
        
        if (response.data.success && response.data.candidates && response.data.candidates.length > 0) {
          console.log(`✅ 翻译成功: "${testCase.input}" -> ${response.data.candidates.join(', ')}`);
          console.log(`📊 使用的翻译服务: ${response.data.source}`);
          
          // 分析翻译来源
          switch (response.data.source) {
            case 'azure_translation':
              console.log(`🎯 Azure翻译服务成功`);
              break;
            case 'google_translation':
              console.log(`🎯 Google翻译服务成功 (Azure降级)`);
              break;
            case 'openai_translation':
              console.log(`🎯 OpenAI翻译服务成功 (Azure+Google降级)`);
              break;
            case 'memory_cache':
              console.log(`🎯 内存缓存命中`);
              break;
            case 'database_cache':
              console.log(`🎯 数据库缓存命中`);
              break;
            default:
              console.log(`🎯 其他来源: ${response.data.source}`);
          }
        } else {
          console.log(`❌ 翻译失败: 候选词为空`);
          console.log(`📊 所有翻译服务都失败了`);
        }
        
      } catch (error) {
        console.error(`❌ 测试失败: ${error.message}`);
        if (error.response) {
          console.error(`📊 错误响应:`, error.response.data);
        }
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
    }
    
    console.log('🎯 总结:');
    console.log('- 如果来源是 azure_translation: Azure翻译服务工作正常');
    console.log('- 如果来源是 google_translation: Azure失败，Google成功');
    console.log('- 如果来源是 openai_translation: Azure+Google失败，OpenAI成功');
    console.log('- 如果来源是 memory_cache/database_cache: 使用了缓存结果');
    console.log('- 如果候选词为空: 所有翻译服务都失败了');
    
  } catch (error) {
    console.error('❌ 前端翻译测试失败:', error.message);
  }
}

// 运行测试
testFrontendChineseToJapanese();
