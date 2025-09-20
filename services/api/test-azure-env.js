// 测试Azure环境变量配置
const axios = require('axios');

async function testAzureEnvironment() {
  try {
    console.log('🔍 检查Azure环境变量配置...\n');
    
    // 测试一个简单的翻译请求，看日志输出
    console.log('📝 测试翻译请求以检查Azure配置日志:');
    
    const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
      word: '测试Azure配置',
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
    if (response.data.source === 'azure_translation') {
      console.log('✅ Azure翻译服务工作正常');
    } else if (response.data.source === 'google_translation') {
      console.log('⚠️ Azure翻译服务失败，使用了Google降级');
      console.log('💡 可能原因: AZURE_TRANSLATOR_ENDPOINT 或 AZURE_TRANSLATOR_KEY 未配置');
    } else if (response.data.source === 'openai_translation') {
      console.log('⚠️ Azure和Google都失败，使用了OpenAI降级');
    } else {
      console.log(`⚠️ 使用了其他翻译服务: ${response.data.source}`);
    }
    
  } catch (error) {
    console.error('❌ 环境变量检查失败:', error.message);
  }
}

// 运行测试
testAzureEnvironment();
