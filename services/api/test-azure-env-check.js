// 检查Azure环境变量配置
const axios = require('axios');

async function testAzureEnvCheck() {
  try {
    console.log('🔍 检查Azure环境变量配置...\n');
    
    // 测试一个全新的词汇，确保不会被缓存
    const testWord = 'Azure环境检查' + Date.now();
    
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
      
      // 分析结果
      if (response.data.source === 'azure_translation') {
        console.log('✅ Azure翻译服务工作正常');
        console.log('💡 环境变量配置正确');
      } else {
        console.log(`⚠️ 使用了其他翻译服务: ${response.data.source}`);
        console.log('💡 可能的问题:');
        console.log('   1. AZURE_TRANSLATOR_ENDPOINT 未配置或格式错误');
        console.log('   2. AZURE_TRANSLATOR_KEY 未配置或无效');
        console.log('   3. Azure服务端点不可访问');
        console.log('   4. Azure API密钥权限不足');
        console.log('   5. Azure服务配置不支持中文到日文翻译');
        
        console.log('\n🔧 建议检查:');
        console.log('   - 确认Render环境变量中已设置AZURE_TRANSLATOR_ENDPOINT');
        console.log('   - 确认Render环境变量中已设置AZURE_TRANSLATOR_KEY');
        console.log('   - 检查Azure端点格式是否正确（应该类似：https://your-resource.cognitiveservices.azure.com/）');
        console.log('   - 检查Azure API密钥是否有效且未过期');
        console.log('   - 检查Azure资源是否支持翻译服务');
      }
      
    } catch (error) {
      console.error(`❌ 测试失败: ${error.message}`);
      if (error.response) {
        console.error(`📊 错误响应:`, error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Azure环境检查失败:', error.message);
  }
}

// 运行测试
testAzureEnvCheck();
