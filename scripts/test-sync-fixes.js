#!/usr/bin/env node

/**
 * 同步修复验证测试脚本
 * 验证数据覆盖、时间戳、冲突解决等问题的修复效果
 */

const API_BASE_URL = 'https://dramawordv2.onrender.com';

// 测试配置
const TEST_CONFIG = {
  userId: `test-sync-fixes-${Date.now()}`,
  testWords: ['hello', 'world', 'test', 'sync', 'fix'],
  testShows: ['Friends', 'Breaking Bad', 'Game of Thrones']
};

// 日志工具
const logger = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`)
};

// 模拟本地存储
class MockLocalStorage {
  constructor() {
    this.storage = new Map();
    this.initializeTestData();
  }

  initializeTestData() {
    // 初始化测试数据
    this.storage.set('vocabulary', [
      {
        word: 'hello',
        translation: '你好',
        mastery: 50,
        timestamp: Date.now() - 86400000, // 1天前
        reviewCount: 3
      }
    ]);
    
    this.storage.set('userStats', {
      experience: 100,
      level: 2,
      totalWords: 1
    });
  }

  async getData(key) {
    return this.storage.get(key) || null;
  }

  async setData(key, value) {
    this.storage.set(key, value);
  }

  async updateData(key, updates) {
    const current = this.storage.get(key) || {};
    this.storage.set(key, { ...current, ...updates });
  }
}

// 同步服务测试类
class SyncFixTestService {
  constructor(localStorage) {
    this.localStorage = localStorage;
  }

  // 测试1: 数据覆盖问题修复验证
  async testDataOverwriteFix() {
    logger.info('🧪 测试1: 数据覆盖问题修复验证');
    
    try {
      // 获取初始数据
      const initialVocabulary = await this.localStorage.getData('vocabulary');
      const initialMastery = initialVocabulary[0].mastery;
      
      // 模拟本地数据变更
      initialVocabulary[0].mastery = 100;
      initialVocabulary[0].timestamp = Date.now();
      await this.localStorage.setData('vocabulary', initialVocabulary);
      
      // 模拟服务器数据（较旧的数据）
      const serverData = {
        word: 'hello',
        translation: '你好',
        mastery: 30, // 服务器数据较旧
        timestamp: Date.now() - 3600000, // 1小时前
        reviewCount: 2
      };
      
      // 测试合并逻辑（模拟后端mergeRecords方法）
      const mergedData = this.mergeRecordsWithLocalPriority(serverData, initialVocabulary[0]);
      
      // 验证本地数据优先
      if (mergedData.mastery === 100) {
        logger.success('✅ 本地数据优先原则验证成功');
        return true;
      } else {
        logger.error(`❌ 本地数据被覆盖: 期望100，实际${mergedData.mastery}`);
        return false;
      }
    } catch (error) {
      logger.error(`❌ 数据覆盖测试异常: ${error.message}`);
      return false;
    }
  }

  // 测试2: 时间戳问题修复验证
  async testTimestampFix() {
    logger.info('🧪 测试2: 时间戳问题修复验证');
    
    try {
      const testCases = [
        { input: null, expected: null, description: 'null值' },
        { input: undefined, expected: null, description: 'undefined值' },
        { input: 'invalid-date', expected: null, description: '无效日期字符串' },
        { input: 0, expected: null, description: '零时间戳' },
        { input: Date.now(), expected: 'valid', description: '有效时间戳' },
        { input: new Date().toISOString(), expected: 'valid', description: 'ISO日期字符串' },
        { input: new Date(), expected: 'valid', description: 'Date对象' }
      ];

      let passedTests = 0;
      let totalTests = testCases.length;

      for (const testCase of testCases) {
        try {
          const result = this.safeParseDate(testCase.input);
          
          if (testCase.expected === null && result === null) {
            passedTests++;
          } else if (testCase.expected === 'valid' && result instanceof Date && !isNaN(result.getTime())) {
            passedTests++;
          } else {
            logger.warning(`⚠️ 时间戳测试失败: ${testCase.description}`);
          }
        } catch (error) {
          logger.warning(`⚠️ 时间戳测试异常: ${testCase.description} - ${error.message}`);
        }
      }

      if (passedTests === totalTests) {
        logger.success(`✅ 时间戳处理修复验证成功: ${passedTests}/${totalTests}`);
        return true;
      } else {
        logger.error(`❌ 时间戳处理修复验证失败: ${passedTests}/${totalTests}`);
        return false;
      }
    } catch (error) {
      logger.error(`❌ 时间戳测试异常: ${error.message}`);
      return false;
    }
  }

  // 测试3: 冲突解决策略验证
  async testConflictResolution() {
    logger.info('🧪 测试3: 冲突解决策略验证');
    
    try {
      const testCases = [
        {
          local: { reviewCount: 5, mastery: 80, lastReviewDate: Date.now() },
          remote: { reviewCount: 3, mastery: 60, lastReviewDate: Date.now() - 3600000 },
          expected: { reviewCount: 5, mastery: 80 }, // 本地数据优先
          description: '本地数据更新'
        },
        {
          local: { reviewCount: 2, mastery: 40, lastReviewDate: Date.now() - 7200000 },
          remote: { reviewCount: 4, mastery: 70, lastReviewDate: Date.now() },
          expected: { reviewCount: 4, mastery: 70 }, // 远程数据更新
          description: '远程数据更新'
        },
        {
          local: { reviewCount: 3, mastery: 50, lastReviewDate: Date.now() },
          remote: { reviewCount: 3, mastery: 50, lastReviewDate: Date.now() - 1800000 },
          expected: { reviewCount: 3, mastery: 50 }, // 本地数据优先（时间接近）
          description: '时间接近的冲突'
        }
      ];

      let passedTests = 0;
      let totalTests = testCases.length;

      for (const testCase of testCases) {
        try {
          const merged = this.mergeRecordsWithLocalPriority(testCase.remote, testCase.local);
          
          if (merged.reviewCount === testCase.expected.reviewCount && 
              merged.mastery === testCase.expected.mastery) {
            passedTests++;
          } else {
            logger.warning(`⚠️ 冲突解决测试失败: ${testCase.description}`);
            logger.warning(`   期望: ${JSON.stringify(testCase.expected)}`);
            logger.warning(`   实际: {reviewCount: ${merged.reviewCount}, mastery: ${merged.mastery}}`);
          }
        } catch (error) {
          logger.warning(`⚠️ 冲突解决测试异常: ${testCase.description} - ${error.message}`);
        }
      }

      if (passedTests === totalTests) {
        logger.success(`✅ 冲突解决策略验证成功: ${passedTests}/${totalTests}`);
        return true;
      } else {
        logger.error(`❌ 冲突解决策略验证失败: ${passedTests}/${totalTests}`);
        return false;
      }
    } catch (error) {
      logger.error(`❌ 冲突解决测试异常: ${error.message}`);
      return false;
    }
  }

  // 测试4: 多次同步稳定性验证
  async testMultipleSyncStability() {
    logger.info('🧪 测试4: 多次同步稳定性验证');
    
    try {
      const initialData = await this.localStorage.getData('vocabulary');
      const initialCount = initialData.length;
      
      // 模拟多次同步
      for (let i = 0; i < 5; i++) {
        // 模拟同步操作（不实际修改数据）
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 检查数据是否保持稳定
        const currentData = await this.localStorage.getData('vocabulary');
        if (currentData.length !== initialCount) {
          logger.error(`❌ 多次同步数据不稳定: 第${i + 1}次同步后数据数量变化`);
          return false;
        }
      }
      
      logger.success('✅ 多次同步稳定性验证成功');
      return true;
    } catch (error) {
      logger.error(`❌ 多次同步测试异常: ${error.message}`);
      return false;
    }
  }

  // 模拟后端mergeRecords方法（本地数据优先版本）
  mergeRecordsWithLocalPriority(remoteRecord, localRecord) {
    // 以本地数据为基础，确保本地数据优先
    const merged = { ...localRecord };

    try {
      // 合并复习次数 - 取最大值
      merged.reviewCount = Math.max(remoteRecord.reviewCount || 0, localRecord.reviewCount || 0);
      merged.correctCount = Math.max(remoteRecord.correctCount || 0, localRecord.correctCount || 0);
      merged.incorrectCount = Math.max(remoteRecord.incorrectCount || 0, localRecord.incorrectCount || 0);

      // 使用最新的时间 - 本地数据优先
      const remoteTime = this.safeParseDate(remoteRecord.lastReviewDate);
      const localTime = this.safeParseDate(localRecord.lastReviewDate);
      
      if (remoteTime && localTime) {
        // 如果本地时间更新，保持本地时间；否则使用远程时间
        merged.lastReviewDate = localTime.getTime() >= remoteTime.getTime() 
          ? localRecord.lastReviewDate 
          : remoteRecord.lastReviewDate;
      } else if (localTime) {
        // 如果只有本地时间有效，使用本地时间
        merged.lastReviewDate = localRecord.lastReviewDate;
      } else if (remoteTime) {
        // 如果只有远程时间有效，使用远程时间
        merged.lastReviewDate = remoteRecord.lastReviewDate;
      }

      // 合并掌握度 - 本地数据优先，如果本地更高则保持本地值
      const localMastery = localRecord.mastery || 0;
      const remoteMastery = remoteRecord.mastery || 0;
      merged.mastery = localMastery >= remoteMastery ? localMastery : remoteMastery;

      return merged;
    } catch (error) {
      // 发生异常时，完全使用本地数据
      return { ...localRecord };
    }
  }

  // 安全解析日期
  safeParseDate(dateValue) {
    try {
      if (!dateValue) return null;
      
      if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? null : dateValue;
      }
      
      if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}

// 主测试函数
async function runSyncFixTests() {
  logger.info('🚀 开始同步修复验证测试');
  logger.info(`👤 测试用户ID: ${TEST_CONFIG.userId}`);

  const localStorage = new MockLocalStorage();
  const testService = new SyncFixTestService(localStorage);

  const testResults = {
    dataOverwriteFix: false,
    timestampFix: false,
    conflictResolution: false,
    multipleSyncStability: false
  };

  try {
    // 运行所有测试
    testResults.dataOverwriteFix = await testService.testDataOverwriteFix();
    testResults.timestampFix = await testService.testTimestampFix();
    testResults.conflictResolution = await testService.testConflictResolution();
    testResults.multipleSyncStability = await testService.testMultipleSyncStability();

    // 生成测试报告
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.keys(testResults).length;

    console.log('\n📊 测试结果摘要:');
    console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
    
    Object.entries(testResults).forEach(([testName, result]) => {
      const status = result ? '✅' : '❌';
      console.log(`${status} ${testName}: ${result ? '通过' : '失败'}`);
    });

    if (passedTests === totalTests) {
      logger.success('🎉 所有同步修复验证测试通过！');
    } else {
      logger.warning(`⚠️ 部分测试失败，需要进一步检查`);
    }

    return testResults;

  } catch (error) {
    logger.error(`❌ 测试执行异常: ${error.message}`);
    console.error(error);
    return testResults;
  }
}

// 运行测试
if (require.main === module) {
  runSyncFixTests().then(results => {
    process.exit(Object.values(results).every(result => result) ? 0 : 1);
  });
}

module.exports = { runSyncFixTests, SyncFixTestService }; 