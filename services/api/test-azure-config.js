// 测试Azure翻译服务配置
const axios = require('axios');

async function testAzureConfig() {
  try {
    console.log('🔍 检查Azure翻译服务配置...\n');
    
    // 1. 测试Azure翻译服务健康检查
    console.log('1️⃣ 测试Azure翻译服务健康检查:');
    try {
      const response = await axios.get('https://dramawordv2.onrender.com/api/health/azure-translation', {
        timeout: 10000
      });
      console.log(`📊 状态: ${response.status}`);
      console.log(`📊 响应:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error(`❌ Azure健康检查失败: ${error.message}`);
      if (error.response) {
        console.error(`📊 错误响应:`, error.response.data);
      }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. 测试Azure翻译服务初始化
    console.log('2️⃣ 测试Azure翻译服务初始化:');
    try {
      const response = await axios.post('https://dramawordv2.onrender.com/api/test/azure-init', {
        text: '测试',
        targetLanguage: 'ja'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      console.log(`📊 状态: ${response.status}`);
      console.log(`📊 响应:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error(`❌ Azure初始化测试失败: ${error.message}`);
      if (error.response) {
        console.error(`📊 错误响应:`, error.response.data);
      }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. 直接测试Azure翻译API
    console.log('3️⃣ 直接测试Azure翻译API:');
    try {
      const response = await axios.post('https://dramawordv2.onrender.com/api/direct-translate/direct-translate', {
        text: '我吃鱼',
        targetLanguage: 'ja',
        uiLanguage: 'zh-CN'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      console.log(`📊 状态: ${response.status}`);
      console.log(`📊 成功: ${response.data.success}`);
      if (response.data.success && response.data.data) {
        console.log(`📊 翻译结果: ${response.data.data.translation}`);
        console.log(`📊 来源服务: ${response.data.data.source || 'unknown'}`);
      } else {
        console.log(`📊 翻译失败: ${response.data.error}`);
      }
    } catch (error) {
      console.error(`❌ 直接Azure翻译测试失败: ${error.message}`);
      if (error.response) {
        console.error(`📊 错误响应:`, error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Azure配置检查失败:', error.message);
  }
}

// 运行测试
testAzureConfig();