const axios = require('axios');

async function testEnglishSearch() {
  console.log('🔍 测试英文单词搜索...');
  
  const testWords = [
    'hello',
    'computer',
    'beautiful',
    'university',
    'mineral water'
  ];
  
  for (const word of testWords) {
    try {
      console.log(`\n📝 测试单词: "${word}"`);
      
      const response = await axios.post('https://dramawordv2.onrender.com/api/words/search', {
        word: word,
        language: 'en'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (response.data.success) {
        console.log(`✅ 成功: ${word}`);
        console.log(`   来源: ${response.data.source}`);
        console.log(`   单词: ${response.data.data.word}`);
        console.log(`   修正: ${response.data.data.correctedWord}`);
        console.log(`   释义: ${response.data.data.definitions?.[0]?.definition || '无释义'}`);
      } else {
        console.log(`❌ 失败: ${word}`);
        console.log(`   错误: ${response.data.error}`);
      }
    } catch (error) {
      console.log(`❌ 错误: ${word}`);
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   错误信息: ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        console.log(`   网络错误: ${error.message}`);
      } else {
        console.log(`   其他错误: ${error.message}`);
      }
    }
    
    // 等待1秒再测试下一个
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 运行测试
testEnglishSearch().catch(console.error); 