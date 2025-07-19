const axios = require('axios');

async function testHelloExists() {
  console.log('🔍 检查 "hello" 是否已存在于数据库...');
  
  try {
    // 先尝试直接查询，看看是否能从缓存或数据库中找到
    console.log('📝 尝试查询 hello...');
    
    const response = await axios.post('https://dramawordv2.onrender.com/api/words/search', {
      word: 'hello',
      language: 'en'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ 查询成功:');
    console.log('   状态码:', response.status);
    console.log('   来源:', response.data.source);
    console.log('   单词:', response.data.data.word);
    console.log('   释义:', response.data.data.definitions?.[0]?.definition);
    
  } catch (error) {
    console.log('❌ 查询失败:');
    if (error.response) {
      console.log('   状态码:', error.response.status);
      console.log('   错误信息:', error.response.data?.error);
      console.log('   详细信息:', error.response.data?.message);
      
      // 如果是重复键错误，说明单词已存在
      if (error.response.data?.message?.includes('duplicate key error')) {
        console.log('🔍 分析: 单词已存在于数据库中，但查询时出现错误');
        console.log('💡 可能的原因:');
        console.log('   1. 数据库中存在损坏的记录');
        console.log('   2. 索引问题');
        console.log('   3. 查询逻辑有问题');
      }
    } else {
      console.log('   网络错误:', error.message);
    }
  }
}

// 运行测试
testHelloExists().catch(console.error); 