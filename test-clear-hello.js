const axios = require('axios');

async function testClearHello() {
  console.log('🔍 尝试清除 hello 记录...');
  
  try {
    // 尝试清除所有数据（调试用）
    console.log('📝 发送清除请求...');
    
    const response = await axios.delete('https://dramawordv2.onrender.com/api/words/clear-all', {
      timeout: 30000
    });
    
    console.log('✅ 清除成功:');
    console.log('   状态码:', response.status);
    console.log('   数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ 清除失败:');
    if (error.response) {
      console.log('   状态码:', error.response.status);
      console.log('   错误信息:', error.response.data?.error);
    } else {
      console.log('   网络错误:', error.message);
    }
  }
}

// 运行测试
testClearHello().catch(console.error); 