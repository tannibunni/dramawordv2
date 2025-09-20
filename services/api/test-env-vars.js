// 检查所有环境变量
const axios = require('axios');

async function testEnvVars() {
  try {
    console.log('🔍 检查环境变量配置...\n');
    
    // 测试一个全新的词汇
    const testWord = '环境变量检查' + Date.now();
    
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
        console.log('\n🔧 需要检查的Render环境变量:');
        console.log('   1. AZURE_TRANSLATOR_ENDPOINT');
        console.log('   2. AZURE_TRANSLATOR_KEY');
        console.log('\n📋 检查步骤:');
        console.log('   1. 登录Render控制台');
        console.log('   2. 找到dramawordv2服务');
        console.log('   3. 进入Environment标签');
        console.log('   4. 确认以下变量已设置:');
        console.log('      - AZURE_TRANSLATOR_ENDPOINT=https://your-resource.cognitiveservices.azure.com/');
        console.log('      - AZURE_TRANSLATOR_KEY=your-api-key');
        console.log('   5. 如果没有设置，请添加这些变量');
        console.log('   6. 重启服务以加载新环境变量');
        console.log('\n⚠️ 注意事项:');
        console.log('   - 环境变量名称必须完全匹配（区分大小写）');
        console.log('   - 端点URL应该以https://开头，以/结尾');
        console.log('   - API密钥应该是32位字符的字符串');
        console.log('   - 修改环境变量后需要重启服务');
      }
      
    } catch (error) {
      console.error(`❌ 测试失败: ${error.message}`);
      if (error.response) {
        console.error(`📊 错误响应:`, error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ 环境变量检查失败:', error.message);
  }
}

// 运行测试
testEnvVars();
