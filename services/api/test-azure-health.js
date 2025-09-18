// 测试Azure翻译服务健康状态
const { JapaneseTranslationService } = require('./dist/services/japaneseTranslationService');

async function testAzureHealth() {
  try {
    console.log('🔍 测试Azure翻译服务健康状态...');
    
    // 检查环境变量
    console.log('📋 环境变量检查:');
    console.log('AZURE_TRANSLATOR_ENDPOINT:', process.env.AZURE_TRANSLATOR_ENDPOINT ? '✅ 已配置' : '❌ 未配置');
    console.log('AZURE_TRANSLATOR_KEY:', process.env.AZURE_TRANSLATOR_KEY ? '✅ 已配置' : '❌ 未配置');
    
    if (!process.env.AZURE_TRANSLATOR_ENDPOINT || !process.env.AZURE_TRANSLATOR_KEY) {
      console.error('❌ Azure Translator环境变量未配置');
      return;
    }
    
    // 测试服务初始化
    console.log('\n🔧 测试服务初始化...');
    const japaneseService = JapaneseTranslationService.getInstance();
    console.log('✅ Japanese Translation Service初始化成功');
    
    // 测试简单翻译
    console.log('\n🌐 测试翻译功能...');
    const testText = 'hello world';
    console.log(`📝 测试文本: "${testText}"`);
    
    const result = await japaneseService.translateToJapanese(testText);
    
    if (result.success) {
      console.log('✅ 翻译成功!');
      console.log('📊 结果详情:');
      console.log('  - 日文:', result.data.japaneseText);
      console.log('  - 罗马音:', result.data.romaji);
      console.log('  - 平假名:', result.data.hiragana);
      console.log('  - 源语言:', result.data.sourceLanguage);
    } else {
      console.error('❌ 翻译失败:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行测试
testAzureHealth();
