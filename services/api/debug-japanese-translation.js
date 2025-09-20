// 调试日文翻译问题
const axios = require('axios');

async function debugJapaneseTranslation() {
  try {
    console.log('🔍 调试日文翻译问题...\n');
    
    const testWord = '我吃鱼';
    console.log(`📝 测试单词: ${testWord}`);
    
    // 1. 测试直接调用日文翻译服务
    console.log('\n1️⃣ 测试直接调用日文翻译服务:');
    try {
      const response = await axios.post('https://dramawordv2.onrender.com/api/direct-translate/direct-translate', {
        text: testWord,
        targetLanguage: 'ja',
        uiLanguage: 'zh-CN'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log(`📊 状态: ${response.status}`);
      console.log(`📊 成功: ${response.data.success}`);
      console.log(`📊 数据:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error(`❌ 日文翻译服务错误: ${error.message}`);
      if (error.response) {
        console.error(`📊 错误响应:`, error.response.data);
      }
    }
    
    // 2. 测试单词翻译API的详细响应
    console.log('\n2️⃣ 测试单词翻译API详细响应:');
    try {
      const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
        word: testWord,
        targetLanguage: 'ja'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log(`📊 状态: ${response.status}`);
      console.log(`📊 完整响应:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error(`❌ 单词翻译API错误: ${error.message}`);
      if (error.response) {
        console.error(`📊 错误响应:`, error.response.data);
      }
    }
    
    // 3. 测试英文翻译作为对比
    console.log('\n3️⃣ 测试英文翻译作为对比:');
    try {
      const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
        word: testWord,
        targetLanguage: 'en'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log(`📊 状态: ${response.status}`);
      console.log(`📊 完整响应:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error(`❌ 英文翻译API错误: ${error.message}`);
      if (error.response) {
        console.error(`📊 错误响应:`, error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

// 运行调试
debugJapaneseTranslation();
