// 直接测试Azure服务初始化
const { AzureTranslationService } = require('./dist/services/azureTranslationService');

async function testAzureDirect() {
  try {
    console.log('🔍 直接测试Azure服务初始化...\n');
    
    console.log('📝 尝试初始化Azure服务...');
    
    try {
      const azureService = AzureTranslationService.getInstance();
      console.log('✅ Azure服务初始化成功');
      
      console.log('📝 尝试翻译测试...');
      const result = await azureService.translateToJapanese('你好');
      
      console.log('📊 翻译结果:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ Azure翻译成功');
      } else {
        console.log('❌ Azure翻译失败:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Azure服务初始化失败:', error.message);
      console.error('💡 可能原因:');
      console.error('   - AZURE_TRANSLATOR_ENDPOINT 未配置');
      console.error('   - AZURE_TRANSLATOR_KEY 未配置');
      console.error('   - Azure端点格式错误');
      console.error('   - Azure API密钥无效');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testAzureDirect();
