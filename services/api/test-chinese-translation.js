// 测试中文翻译到日文
const axios = require('axios');

async function testChineseTranslation() {
  try {
    console.log('🔍 测试中文翻译到日文...');
    
    const testData = {
      word: '我吃中餐',
      targetLanguage: 'ja'
    };
    
    console.log('📝 测试数据:', testData);
    
    const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('📊 响应状态:', response.status);
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('✅ 翻译成功!');
      console.log('📋 候选词:', response.data.candidates);
      console.log('📋 来源:', response.data.source);
    } else {
      console.error('❌ 翻译失败:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📊 错误响应:', error.response.status, error.response.data);
    }
  }
}

// 运行测试
testChineseTranslation();
