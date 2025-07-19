const axios = require('axios');

async function testDbCheck() {
  console.log('🔍 检查数据库中的 hello 记录...');
  
  try {
    // 尝试直接查询数据库
    console.log('📝 尝试查询数据库...');
    
    const response = await axios.get('https://dramawordv2.onrender.com/api/words/popular?language=en', {
      timeout: 30000
    });
    
    console.log('✅ 查询成功:');
    console.log('   状态码:', response.status);
    console.log('   数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ 查询失败:');
    if (error.response) {
      console.log('   状态码:', error.response.status);
      console.log('   错误信息:', error.response.data?.error);
    } else {
      console.log('   网络错误:', error.message);
    }
  }
}

// 运行测试
testDbCheck().catch(console.error); 