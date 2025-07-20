const API_BASE_URL = 'https://dramawordv2.onrender.com/api/word-feedback';

// 测试提交反馈
async function testSubmitFeedback() {
  console.log('🧪 测试提交反馈...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        word: 'test-word',
        feedback: 'positive'
      }),
    });

    const data = await response.json();
    console.log('✅ 提交反馈结果:', data);
    return data;
  } catch (error) {
    console.error('❌ 提交反馈失败:', error);
    return null;
  }
}

// 测试获取反馈统计
async function testGetFeedbackStats() {
  console.log('🧪 测试获取反馈统计...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/feedback/stats/test-word`);
    const data = await response.json();
    console.log('✅ 反馈统计结果:', data);
    return data;
  } catch (error) {
    console.error('❌ 获取反馈统计失败:', error);
    return null;
  }
}

// 测试获取用户反馈
async function testGetUserFeedback() {
  console.log('🧪 测试获取用户反馈...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/feedback/user/test-word`);
    const data = await response.json();
    console.log('✅ 用户反馈结果:', data);
    return data;
  } catch (error) {
    console.error('❌ 获取用户反馈失败:', error);
    return null;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始测试单词反馈系统...\n');
  
  // 测试提交反馈
  await testSubmitFeedback();
  console.log('');
  
  // 测试获取反馈统计
  await testGetFeedbackStats();
  console.log('');
  
  // 测试获取用户反馈
  await testGetUserFeedback();
  console.log('');
  
  console.log('✅ 所有测试完成！');
}

// 执行测试
runAllTests().catch(console.error); 