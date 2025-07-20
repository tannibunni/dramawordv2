const API_BASE_URL = 'https://dramawordv2.onrender.com/api/word-feedback';

// 测试提交反馈 - 详细调试
async function testSubmitFeedbackDebug() {
  console.log('🧪 测试提交反馈 - 详细调试...');
  
  try {
    console.log('📤 发送请求到:', `${API_BASE_URL}/feedback`);
    console.log('📤 请求方法: POST');
    console.log('📤 请求头:', {
      'Content-Type': 'application/json'
    });
    console.log('📤 请求体:', {
      word: 'test-word',
      feedback: 'positive'
    });
    
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

    console.log('📥 响应状态:', response.status);
    console.log('📥 响应头:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📥 响应数据:', data);
    return data;
  } catch (error) {
    console.error('❌ 提交反馈失败:', error);
    return null;
  }
}

// 测试获取反馈统计 - 详细调试
async function testGetFeedbackStatsDebug() {
  console.log('🧪 测试获取反馈统计 - 详细调试...');
  
  try {
    console.log('📤 发送请求到:', `${API_BASE_URL}/feedback/stats/test-word`);
    console.log('📤 请求方法: GET');
    
    const response = await fetch(`${API_BASE_URL}/feedback/stats/test-word`);
    
    console.log('📥 响应状态:', response.status);
    console.log('📥 响应头:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📥 响应数据:', data);
    return data;
  } catch (error) {
    console.error('❌ 获取反馈统计失败:', error);
    return null;
  }
}

// 测试健康检查
async function testHealthCheck() {
  console.log('🧪 测试健康检查...');
  
  try {
    const response = await fetch('https://dramawordv2.onrender.com/health');
    const data = await response.json();
    console.log('✅ 健康检查结果:', data);
    return data;
  } catch (error) {
    console.error('❌ 健康检查失败:', error);
    return null;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始详细调试测试...\n');
  
  // 测试健康检查
  await testHealthCheck();
  console.log('');
  
  // 测试获取反馈统计
  await testGetFeedbackStatsDebug();
  console.log('');
  
  // 测试提交反馈
  await testSubmitFeedbackDebug();
  console.log('');
  
  console.log('✅ 所有调试测试完成！');
}

// 执行测试
runAllTests().catch(console.error); 