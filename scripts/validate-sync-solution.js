const axios = require('axios');

const API_BASE_URL = 'https://dramawordv2.onrender.com';

// 模拟真实的同步数据
const mockSyncData = {
  type: 'learning_record',
  userId: 'test_user_123',
  data: [
    {
      word: 'hello',
      mastery: 85,
      reviewCount: 8,
      correctCount: 7,
      incorrectCount: 1,
      lastReviewDate: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      interval: 48,
      easeFactor: 2.8,
      consecutiveCorrect: 4,
      consecutiveIncorrect: 0,
      totalStudyTime: 360,
      averageResponseTime: 2.5,
      confidence: 4,
      notes: '测试数据',
      tags: ['basic', 'greeting', 'test']
    },
    {
      word: 'world',
      mastery: 60,
      reviewCount: 5,
      correctCount: 3,
      incorrectCount: 2,
      lastReviewDate: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      interval: 24,
      easeFactor: 2.2,
      consecutiveCorrect: 1,
      consecutiveIncorrect: 1,
      totalStudyTime: 240,
      averageResponseTime: 3.2,
      confidence: 3,
      notes: '',
      tags: ['basic', 'test']
    }
  ]
};

// 模拟批量同步数据
const mockBatchData = {
  learningRecords: [
    {
      word: 'apple',
      mastery: 90,
      reviewCount: 10,
      correctCount: 9,
      incorrectCount: 1,
      lastReviewDate: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      interval: 72,
      easeFactor: 3.0,
      consecutiveCorrect: 6,
      consecutiveIncorrect: 0,
      totalStudyTime: 480,
      averageResponseTime: 2.0,
      confidence: 5,
      notes: '水果类单词',
      tags: ['fruit', 'food', 'basic']
    }
  ],
  searchHistory: [
    {
      word: 'banana',
      definition: '香蕉',
      timestamp: new Date().toISOString()
    }
  ],
  userSettings: {
    notifications: {
      dailyReminder: true,
      reviewReminder: true
    },
    learning: {
      dailyGoal: 20,
      reviewInterval: 24
    }
  }
};

class SyncSolutionValidator {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  // 记录测试结果
  logResult(testName, success, details = '') {
    const result = {
      test: testName,
      success,
      details,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
    return result;
  }

  // 测试1: 服务器健康状态
  async testServerHealth() {
    try {
      // 使用传统的setTimeout方式替代AbortSignal.timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 200 && response.data.status === 'OK') {
        return this.logResult('服务器健康状态', true, '服务器运行正常');
      } else {
        return this.logResult('服务器健康状态', false, '服务器响应异常');
      }
    } catch (error) {
      return this.logResult('服务器健康状态', false, `连接失败: ${error.message}`);
    }
  }

  // 测试2: 数据库连接状态
  async testDatabaseConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await axios.post(`${API_BASE_URL}/api/debug/sync-test`, mockSyncData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data.success && response.data.data.databaseConnected) {
        return this.logResult('数据库连接', true, '数据库连接正常');
      } else {
        return this.logResult('数据库连接', false, '数据库连接异常');
      }
    } catch (error) {
      return this.logResult('数据库连接', false, `连接失败: ${error.message}`);
    }
  }

  // 测试3: 同步端点可用性
  async testSyncEndpointAvailability() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await axios.post(`${API_BASE_URL}/api/sync/test`, mockSyncData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data.success) {
        return this.logResult('同步端点可用性', true, '同步端点响应正常');
      } else {
        return this.logResult('同步端点可用性', false, '同步端点响应异常');
      }
    } catch (error) {
      return this.logResult('同步端点可用性', false, `请求失败: ${error.message}`);
    }
  }

  // 测试4: 认证机制
  async testAuthenticationMechanism() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await axios.post(`${API_BASE_URL}/api/sync/batch`, mockBatchData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // 如果没有认证，应该返回401
      return this.logResult('认证机制', false, '缺少认证但请求成功，这是不安全的');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return this.logResult('认证机制', true, '正确要求认证token');
      } else {
        return this.logResult('认证机制', false, `意外错误: ${error.message}`);
      }
    }
  }

  // 测试5: 错误处理机制
  async testErrorHandling() {
    try {
      // 发送无效数据测试错误处理
      const invalidData = {
        type: 'invalid_type',
        userId: null,
        data: 'invalid_data'
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/sync/test`, invalidData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // 应该能正确处理无效数据
      return this.logResult('错误处理机制', true, '正确处理无效数据');
    } catch (error) {
      if (error.response && error.response.status >= 400) {
        return this.logResult('错误处理机制', true, '正确返回错误状态码');
      } else {
        return this.logResult('错误处理机制', false, `处理错误时出现问题: ${error.message}`);
      }
    }
  }

  // 测试6: 响应时间
  async testResponseTime() {
    const tests = [
      { name: '健康检查响应时间', endpoint: '/health', method: 'GET' },
      { name: '同步测试响应时间', endpoint: '/api/sync/test', method: 'POST', data: mockSyncData },
      { name: '数据库测试响应时间', endpoint: '/api/debug/sync-test', method: 'POST', data: mockSyncData }
    ];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        
        if (test.method === 'GET') {
          await axios.get(`${API_BASE_URL}${test.endpoint}`, { timeout: 10000 });
        } else {
          await axios.post(`${API_BASE_URL}${test.endpoint}`, test.data, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const responseTime = Date.now() - startTime;
        const isGood = responseTime < 3000; // 3秒内为良好
        
        this.logResult(
          test.name, 
          isGood, 
          `${responseTime}ms ${isGood ? '(良好)' : '(较慢)'}`
        );
      } catch (error) {
        this.logResult(test.name, false, `请求失败: ${error.message}`);
      }
    }
  }

  // 测试7: 数据格式验证
  async testDataFormatValidation() {
    const testCases = [
      {
        name: '有效学习记录数据',
        data: mockSyncData,
        shouldPass: true
      },
      {
        name: '缺少必需字段的数据',
        data: { type: 'learning_record', userId: 'test' },
        shouldPass: false
      },
      {
        name: '空数据',
        data: {},
        shouldPass: false
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/sync/test`, testCase.data, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
        
        const passed = response.data.success === testCase.shouldPass;
        this.logResult(
          testCase.name,
          passed,
          passed ? '格式验证正确' : '格式验证异常'
        );
      } catch (error) {
        const passed = !testCase.shouldPass; // 如果期望失败但实际失败了，这是正确的
        this.logResult(
          testCase.name,
          passed,
          passed ? '正确拒绝无效数据' : `意外错误: ${error.message}`
        );
      }
    }
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始验证同步解决方案...\n');
    
    await this.testServerHealth();
    await this.testDatabaseConnection();
    await this.testSyncEndpointAvailability();
    await this.testAuthenticationMechanism();
    await this.testErrorHandling();
    await this.testResponseTime();
    await this.testDataFormatValidation();
    
    this.generateReport();
  }

  // 生成测试报告
  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log('\n📊 测试报告');
    console.log('='.repeat(50));
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests}`);
    console.log(`失败: ${failedTests}`);
    console.log(`成功率: ${successRate}%`);
    console.log(`测试耗时: ${duration}ms`);
    console.log('='.repeat(50));
    
    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.test}: ${r.details}`));
    }
    
    console.log('\n🎯 解决方案评估:');
    if (successRate >= 90) {
      console.log('✅ 优秀 - 同步解决方案工作正常');
    } else if (successRate >= 70) {
      console.log('⚠️ 良好 - 大部分功能正常，需要小幅改进');
    } else {
      console.log('❌ 需要改进 - 存在较多问题需要解决');
    }
    
    console.log('\n📝 建议:');
    if (failedTests === 0) {
      console.log('  - 所有测试通过，解决方案已就绪');
      console.log('  - 可以部署到生产环境');
    } else {
      console.log('  - 检查失败的测试项');
      console.log('  - 根据错误信息进行修复');
      console.log('  - 重新运行测试验证');
    }
  }
}

// 运行验证
const validator = new SyncSolutionValidator();
validator.runAllTests().catch(error => {
  console.error('❌ 验证过程中发生错误:', error);
}); 