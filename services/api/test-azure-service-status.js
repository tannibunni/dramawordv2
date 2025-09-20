// 测试Azure服务的实际状态
const axios = require('axios');

async function testAzureServiceStatus() {
  try {
    console.log('🔍 测试Azure服务的实际状态...\n');
    
    // 测试一个全新的词汇，确保不会被缓存
    const testWord = '测试Azure服务状态' + Date.now();
    
    console.log(`📝 测试词汇: "${testWord}"`);
    
    try {
      const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
        word: testWord,
        targetLanguage: 'ja'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log(`📊 状态: ${response.status}`);
      console.log(`📊 成功: ${response.data.success}`);
      console.log(`📊 候选词: ${JSON.stringify(response.data.candidates)}`);
      console.log(`📊 来源: ${response.data.source}`);
      
      // 分析来源
      switch (response.data.source) {
        case 'azure_translation':
          console.log('✅ Azure翻译服务工作正常');
          break;
        case 'google_translation':
          console.log('⚠️ Azure翻译服务失败，使用了Google降级');
          console.log('💡 可能原因:');
          console.log('   - AZURE_TRANSLATOR_ENDPOINT 未配置或格式错误');
          console.log('   - AZURE_TRANSLATOR_KEY 未配置或无效');
          console.log('   - Azure服务初始化失败');
          break;
        case 'openai_translation':
          console.log('⚠️ Azure和Google都失败，使用了OpenAI降级');
          break;
        case 'memory_cache':
        case 'database_cache':
          console.log('✅ 使用了缓存结果');
          break;
        default:
          console.log(`⚠️ 使用了其他服务: ${response.data.source}`);
      }
      
    } catch (error) {
      console.error(`❌ 测试失败: ${error.message}`);
      if (error.response) {
        console.error(`📊 错误响应:`, error.response.data);
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 测试英文翻译
    console.log('📝 测试英文翻译: "hello"');
    try {
      const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
        word: 'hello',
        targetLanguage: 'ja'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log(`📊 状态: ${response.status}`);
      console.log(`📊 成功: ${response.data.success}`);
      console.log(`📊 候选词: ${JSON.stringify(response.data.candidates)}`);
      console.log(`📊 来源: ${response.data.source}`);
      
      if (response.data.source === 'azure_translation') {
        console.log('✅ Azure英文翻译工作正常');
      } else {
        console.log(`⚠️ 英文翻译也使用了其他服务: ${response.data.source}`);
        console.log('💡 这说明Azure翻译服务完全没有工作');
      }
      
    } catch (error) {
      console.error(`❌ 英文翻译测试失败: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Azure服务状态测试失败:', error.message);
  }
}

// 运行测试
testAzureServiceStatus();
