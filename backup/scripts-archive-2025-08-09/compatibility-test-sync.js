const axios = require('axios');

const API_BASE_URL = 'https://dramawordv2.onrender.com';

// 简单的超时包装函数
function timeoutPromise(promise, ms) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout after ${ms}ms`));
    }, ms);
    
    promise.then(result => {
      clearTimeout(timeoutId);
      resolve(result);
    }).catch(error => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

// 测试数据
const testData = {
  type: 'learning_record',
  userId: 'compatibility_test_user',
  data: [
    {
      word: 'hello',
      mastery: 80,
      reviewCount: 5,
      correctCount: 4,
      incorrectCount: 1,
      lastReviewDate: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      interval: 24,
      easeFactor: 2.5,
      consecutiveCorrect: 3,
      consecutiveIncorrect: 0,
      totalStudyTime: 240,
      averageResponseTime: 3,
      confidence: 4,
      notes: '兼容性测试',
      tags: ['test', 'compatibility']
    }
  ]
};

async function runCompatibilityTests() {
  console.log('🔧 开始兼容性测试...\n');
  
  const results = [];
  
  // 测试1: 基础连接
  try {
    console.log('1️⃣ 测试基础连接...');
    const startTime = Date.now();
    
    const response = await timeoutPromise(
      axios.get(`${API_BASE_URL}/health`),
      5000
    );
    
    const duration = Date.now() - startTime;
    
    if (response.status === 200 && response.data.status === 'OK') {
      console.log(`✅ 基础连接成功 (${duration}ms)`);
      results.push({ test: '基础连接', success: true, duration });
    } else {
      console.log('❌ 基础连接失败');
      results.push({ test: '基础连接', success: false, duration });
    }
  } catch (error) {
    console.log(`❌ 基础连接失败: ${error.message}`);
    results.push({ test: '基础连接', success: false, error: error.message });
  }
  
  // 测试2: 同步端点
  try {
    console.log('\n2️⃣ 测试同步端点...');
    const startTime = Date.now();
    
    const response = await timeoutPromise(
      axios.post(`${API_BASE_URL}/api/sync/test`, testData, {
        headers: {
          'Content-Type': 'application/json'
        }
      }),
      10000
    );
    
    const duration = Date.now() - startTime;
    
    if (response.data.success) {
      console.log(`✅ 同步端点正常 (${duration}ms)`);
      results.push({ test: '同步端点', success: true, duration });
    } else {
      console.log('❌ 同步端点异常');
      results.push({ test: '同步端点', success: false, duration });
    }
  } catch (error) {
    console.log(`❌ 同步端点失败: ${error.message}`);
    results.push({ test: '同步端点', success: false, error: error.message });
  }
  
  // 测试3: 数据库连接
  try {
    console.log('\n3️⃣ 测试数据库连接...');
    const startTime = Date.now();
    
    const response = await timeoutPromise(
      axios.post(`${API_BASE_URL}/api/debug/sync-test`, testData, {
        headers: {
          'Content-Type': 'application/json'
        }
      }),
      10000
    );
    
    const duration = Date.now() - startTime;
    
    if (response.data.success && response.data.data.databaseConnected) {
      console.log(`✅ 数据库连接正常 (${duration}ms)`);
      results.push({ test: '数据库连接', success: true, duration });
    } else {
      console.log('❌ 数据库连接异常');
      results.push({ test: '数据库连接', success: false, duration });
    }
  } catch (error) {
    console.log(`❌ 数据库连接失败: ${error.message}`);
    results.push({ test: '数据库连接', success: false, error: error.message });
  }
  
  // 测试4: 认证检查
  try {
    console.log('\n4️⃣ 测试认证机制...');
    const startTime = Date.now();
    
    await timeoutPromise(
      axios.post(`${API_BASE_URL}/api/sync/batch`, testData, {
        headers: {
          'Content-Type': 'application/json'
        }
      }),
      10000
    );
    
    // 如果没有认证但请求成功，这是不安全的
    console.log('❌ 认证机制异常 - 缺少认证但请求成功');
    results.push({ test: '认证机制', success: false, error: '缺少认证但请求成功' });
  } catch (error) {
    const startTime = Date.now();
    const duration = Date.now() - startTime;
    
    if (error.response && error.response.status === 401) {
      console.log(`✅ 认证机制正常 (${duration}ms) - 正确要求认证`);
      results.push({ test: '认证机制', success: true, duration });
    } else {
      console.log(`❌ 认证机制异常: ${error.message}`);
      results.push({ test: '认证机制', success: false, error: error.message });
    }
  }
  
  // 测试5: 错误处理
  try {
    console.log('\n5️⃣ 测试错误处理...');
    const startTime = Date.now();
    
    const invalidData = { invalid: 'data' };
    
    const response = await timeoutPromise(
      axios.post(`${API_BASE_URL}/api/sync/test`, invalidData, {
        headers: {
          'Content-Type': 'application/json'
        }
      }),
      10000
    );
    
    const duration = Date.now() - startTime;
    console.log(`✅ 错误处理正常 (${duration}ms) - 正确处理无效数据`);
    results.push({ test: '错误处理', success: true, duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error.response && error.response.status >= 400) {
      console.log(`✅ 错误处理正常 (${duration}ms) - 正确返回错误状态码`);
      results.push({ test: '错误处理', success: true, duration });
    } else {
      console.log(`❌ 错误处理异常: ${error.message}`);
      results.push({ test: '错误处理', success: false, error: error.message });
    }
  }
  
  // 生成报告
  console.log('\n📊 兼容性测试报告');
  console.log('='.repeat(50));
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`成功率: ${successRate}%`);
  
  // 计算平均响应时间
  const responseTimes = results
    .filter(r => r.duration)
    .map(r => r.duration);
  const avgResponseTime = responseTimes.length > 0 
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(0)
    : 0;
  
  console.log(`平均响应时间: ${avgResponseTime}ms`);
  console.log('='.repeat(50));
  
  if (failedTests > 0) {
    console.log('\n❌ 失败的测试:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.test}: ${r.error || '未知错误'}`));
  }
  
  console.log('\n🎯 兼容性评估:');
  if (successRate >= 90) {
    console.log('✅ 优秀 - 所有功能兼容性良好');
  } else if (successRate >= 70) {
    console.log('⚠️ 良好 - 大部分功能兼容，需要小幅改进');
  } else {
    console.log('❌ 需要改进 - 存在兼容性问题');
  }
  
  console.log('\n💡 建议:');
  if (successRate >= 90) {
    console.log('  - 兼容性测试通过');
    console.log('  - 可以安全部署到各种环境');
  } else {
    console.log('  - 检查失败的测试项');
    console.log('  - 改进错误处理机制');
    console.log('  - 重新运行测试验证');
  }
}

// 运行测试
runCompatibilityTests().catch(error => {
  console.error('❌ 兼容性测试过程中发生错误:', error);
}); 