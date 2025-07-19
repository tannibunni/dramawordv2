const axios = require('axios');

async function testHelloWord() {
  console.log('🔍 专门测试 "hello" 单词...');
  
  try {
    console.log('📝 发送请求...');
    
    const response = await axios.post('https://dramawordv2.onrender.com/api/words/search', {
      word: 'hello',
      language: 'en'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ 响应成功:');
    console.log('   状态码:', response.status);
    console.log('   数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ 请求失败:');
    if (error.response) {
      console.log('   状态码:', error.response.status);
      console.log('   响应数据:', JSON.stringify(error.response.data, null, 2));
      console.log('   响应头:', error.response.headers);
    } else if (error.request) {
      console.log('   网络错误:', error.message);
      console.log('   请求配置:', error.config);
    } else {
      console.log('   其他错误:', error.message);
    }
  }
}

// 运行测试
testHelloWord().catch(console.error); 