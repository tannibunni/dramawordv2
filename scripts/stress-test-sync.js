const axios = require('axios');

const API_BASE_URL = 'https://dramawordv2.onrender.com';

// 生成大量测试数据
function generateTestData(count = 100) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      word: `test_word_${i}`,
      mastery: Math.floor(Math.random() * 100),
      reviewCount: Math.floor(Math.random() * 20),
      correctCount: Math.floor(Math.random() * 15),
      incorrectCount: Math.floor(Math.random() * 5),
      lastReviewDate: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      interval: Math.floor(Math.random() * 72) + 1,
      easeFactor: 1.3 + Math.random() * 3.7,
      consecutiveCorrect: Math.floor(Math.random() * 10),
      consecutiveIncorrect: Math.floor(Math.random() * 5),
      totalStudyTime: Math.floor(Math.random() * 1000),
      averageResponseTime: Math.random() * 10,
      confidence: Math.floor(Math.random() * 5) + 1,
      notes: `测试数据 ${i}`,
      tags: ['test', `batch_${i}`]
    });
  }
  return data;
}

class SyncStressTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  // 记录结果
  logResult(testName, success, details = '', duration = 0) {
    const result = {
      test: testName,
      success,
      details,
      duration,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    
    const status = success ? '✅' : '❌';
    const timeInfo = duration > 0 ? ` (${duration}ms)` : '';
    console.log(`${status} ${testName}: ${details}${timeInfo}`);
    return result;
  }

  // 并发测试
  async concurrentTest(concurrency = 5, dataSize = 10) {
    console.log(`\n🔄 开始并发测试 (并发数: ${concurrency}, 数据量: ${dataSize})`);
    
    const testData = {
      type: 'learning_record',
      userId: `stress_test_user_${Date.now()}`,
      data: generateTestData(dataSize)
    };

    const promises = [];
    const startTime = Date.now();

    for (let i = 0; i < concurrency; i++) {
      const promise = this.singleRequest(testData, i);
      promises.push(promise);
    }

    try {
      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      const successRate = ((successful / results.length) * 100).toFixed(1);

      this.logResult(
        `并发测试 (${concurrency}x${dataSize})`,
        successRate >= 80,
        `${successful}/${results.length} 成功 (${successRate}%)`,
        totalDuration
      );

      return { successful, failed, successRate, totalDuration };
    } catch (error) {
      this.logResult(
        `并发测试 (${concurrency}x${dataSize})`,
        false,
        `测试失败: ${error.message}`,
        0
      );
      return { successful: 0, failed: concurrency, successRate: 0, totalDuration: 0 };
    }
  }

  // 单个请求
  async singleRequest(data, index) {
    const startTime = Date.now();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/sync/test`, data, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Index': index.toString()
        }
      });

      const duration = Date.now() - startTime;
      return {
        success: response.data.success,
        duration,
        status: response.status
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        duration,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  // 大数据量测试
  async largeDataTest() {
    console.log('\n📊 开始大数据量测试');
    
    const testSizes = [10, 50, 100, 200];
    
    for (const size of testSizes) {
      const testData = {
        type: 'learning_record',
        userId: `large_data_user_${size}`,
        data: generateTestData(size)
      };

      const startTime = Date.now();
      try {
        const response = await axios.post(`${API_BASE_URL}/api/sync/test`, testData, {
          timeout: 60000, // 60秒超时
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const duration = Date.now() - startTime;
        const isGood = duration < 10000; // 10秒内为良好

        this.logResult(
          `大数据量测试 (${size}条记录)`,
          response.data.success && isGood,
          `处理 ${size} 条记录`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        this.logResult(
          `大数据量测试 (${size}条记录)`,
          false,
          `处理失败: ${error.message}`,
          duration
        );
      }
    }
  }

  // 持续负载测试
  async sustainedLoadTest(duration = 30000) { // 30秒
    console.log(`\n⏱️ 开始持续负载测试 (${duration/1000}秒)`);
    
    const testData = {
      type: 'learning_record',
      userId: `sustained_user_${Date.now()}`,
      data: generateTestData(20)
    };

    const startTime = Date.now();
    const requests = [];
    let successCount = 0;
    let failureCount = 0;

    // 每2秒发送一个请求
    const interval = setInterval(async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/sync/test`, testData, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
      }
    }, 2000);

    // 等待测试完成
    await new Promise(resolve => setTimeout(resolve, duration));
    clearInterval(interval);

    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    const totalRequests = successCount + failureCount;
    const successRate = totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(1) : 0;

    this.logResult(
      '持续负载测试',
      successRate >= 80,
      `${successCount}/${totalRequests} 成功 (${successRate}%)`,
      totalDuration
    );

    return { successCount, failureCount, successRate, totalDuration };
  }

  // 错误恢复测试
  async errorRecoveryTest() {
    console.log('\n🔄 开始错误恢复测试');
    
    const testCases = [
      {
        name: '网络超时恢复',
        data: { type: 'learning_record', userId: 'timeout_test', data: generateTestData(5) },
        shouldTimeout: false
      },
      {
        name: '无效数据恢复',
        data: { invalid: 'data' },
        shouldTimeout: false
      },
      {
        name: '正常数据恢复',
        data: { type: 'learning_record', userId: 'recovery_test', data: generateTestData(10) },
        shouldTimeout: false
      }
    ];

    for (const testCase of testCases) {
      const startTime = Date.now();
      try {
        const response = await axios.post(`${API_BASE_URL}/api/sync/test`, testCase.data, {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const duration = Date.now() - startTime;
        this.logResult(
          testCase.name,
          true,
          '成功恢复',
          duration
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        this.logResult(
          testCase.name,
          false,
          `恢复失败: ${error.message}`,
          duration
        );
      }
    }
  }

  // 运行所有压力测试
  async runAllStressTests() {
    console.log('🚀 开始同步功能压力测试...\n');
    
    // 基础并发测试
    await this.concurrentTest(3, 5);
    await this.concurrentTest(5, 10);
    await this.concurrentTest(10, 5);
    
    // 大数据量测试
    await this.largeDataTest();
    
    // 持续负载测试
    await this.sustainedLoadTest(20000); // 20秒
    
    // 错误恢复测试
    await this.errorRecoveryTest();
    
    this.generateStressReport();
  }

  // 生成压力测试报告
  generateStressReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    // 计算平均响应时间
    const responseTimes = this.results
      .filter(r => r.duration > 0)
      .map(r => r.duration);
    const avgResponseTime = responseTimes.length > 0 
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(0)
      : 0;
    
    console.log('\n📊 压力测试报告');
    console.log('='.repeat(60));
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests}`);
    console.log(`失败: ${failedTests}`);
    console.log(`成功率: ${successRate}%`);
    console.log(`平均响应时间: ${avgResponseTime}ms`);
    console.log(`总测试耗时: ${duration}ms`);
    console.log('='.repeat(60));
    
    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.test}: ${r.details}`));
    }
    
    console.log('\n🎯 压力测试评估:');
    if (successRate >= 90) {
      console.log('✅ 优秀 - 同步功能在高负载下表现稳定');
    } else if (successRate >= 70) {
      console.log('⚠️ 良好 - 大部分功能稳定，需要优化');
    } else {
      console.log('❌ 需要改进 - 高负载下性能不稳定');
    }
    
    console.log('\n📈 性能指标:');
    if (avgResponseTime < 2000) {
      console.log('✅ 响应时间优秀 (< 2秒)');
    } else if (avgResponseTime < 5000) {
      console.log('⚠️ 响应时间良好 (< 5秒)');
    } else {
      console.log('❌ 响应时间较慢 (> 5秒)');
    }
    
    console.log('\n💡 建议:');
    if (successRate >= 90 && avgResponseTime < 2000) {
      console.log('  - 同步功能已准备好处理生产环境负载');
      console.log('  - 可以支持更多并发用户');
    } else {
      console.log('  - 考虑优化数据库查询');
      console.log('  - 增加服务器资源');
      console.log('  - 实现缓存机制');
    }
  }
}

// 运行压力测试
const stressTester = new SyncStressTester();
stressTester.runAllStressTests().catch(error => {
  console.error('❌ 压力测试过程中发生错误:', error);
}); 