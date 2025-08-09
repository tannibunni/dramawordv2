const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://dramawordv2.onrender.com';

// 测试配置
const TEST_CONFIG = {
  userId: 'test-conflict-protection-' + Date.now(),
  testWords: ['apple', 'banana', 'orange'],
  syncDelay: 500
};

// 测试结果记录
const testResults = {
  startTime: Date.now(),
  tests: [],
  errors: [],
  warnings: []
};

// 日志工具
const logger = {
  info: (message) => {
    console.log(`ℹ️  ${message}`);
    testResults.tests.push({ type: 'info', message, timestamp: Date.now() });
  },
  success: (message) => {
    console.log(`✅ ${message}`);
    testResults.tests.push({ type: 'success', message, timestamp: Date.now() });
  },
  error: (message) => {
    console.log(`❌ ${message}`);
    testResults.errors.push({ message, timestamp: Date.now() });
  },
  warning: (message) => {
    console.log(`⚠️  ${message}`);
    testResults.warnings.push({ message, timestamp: Date.now() });
  }
};

// 模拟本地存储
class MockLocalStorage {
  constructor() {
    this.data = {
      vocabulary: [],
      learningRecords: [],
      userStats: {
        experience: 0,
        level: 1,
        currentStreak: 0,
        totalWordsLearned: 0
      },
      shows: [],
      searchHistory: [],
      userSettings: {
        notifications: { enabled: true },
        learning: { dailyGoal: 50 },
        privacy: { shareProgress: false }
      }
    };
    this.snapshots = []; // 用于记录数据快照
  }

  async getData(key) {
    return this.data[key] || null;
  }

  async setData(key, value) {
    this.data[key] = value;
    return true;
  }

  async updateData(key, updates) {
    if (!this.data[key]) {
      this.data[key] = {};
    }
    this.data[key] = { ...this.data[key], ...updates };
    return true;
  }

  // 创建数据快照
  createSnapshot(description) {
    const snapshot = {
      timestamp: Date.now(),
      description,
      data: JSON.parse(JSON.stringify(this.data)) // 深拷贝
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  // 比较两个快照
  compareSnapshots(snapshot1, snapshot2) {
    const differences = {};
    
    for (const key in snapshot1.data) {
      if (JSON.stringify(snapshot1.data[key]) !== JSON.stringify(snapshot2.data[key])) {
        differences[key] = {
          before: snapshot1.data[key],
          after: snapshot2.data[key]
        };
      }
    }
    
    return differences;
  }

  // 获取所有快照
  getSnapshots() {
    return this.snapshots;
  }
}

// API客户端类
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      throw new Error(`健康检查失败: ${error.message}`);
    }
  }

  async syncData(userId, syncData) {
    try {
      // 使用测试端点，不需要认证
      const response = await axios.post(`${this.baseURL}/api/sync/test`, {
        userId,
        ...syncData
      });
      return response.data;
    } catch (error) {
      throw new Error(`同步失败: ${error.message}`);
    }
  }

  // 模拟从云端获取数据（这个操作在多邻国同步中不应该发生）
  async getDataFromCloud(userId, dataType) {
    try {
      const response = await axios.get(`${this.baseURL}/api/sync/${dataType}/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(`获取云端数据失败: ${error.message}`);
    }
  }
}

// 同步服务类（遵循多邻国原则）
class DuolingoSyncService {
  constructor(localStorage, apiClient) {
    this.localStorage = localStorage;
    this.apiClient = apiClient;
    this.syncQueue = [];
  }

  // 添加同步任务
  addToSyncQueue(dataType, data) {
    this.syncQueue.push({
      type: dataType,
      data,
      timestamp: Date.now()
    });
  }

  // 执行同步（仅上传，不下载）
  async performSync() {
    logger.info(`🔄 开始同步数据（仅上传模式）`);

    try {
      // 获取本地数据
      const localData = {
        vocabulary: await this.localStorage.getData('vocabulary'),
        learningRecords: await this.localStorage.getData('learningRecords'),
        userStats: await this.localStorage.getData('userStats'),
        shows: await this.localStorage.getData('shows'),
        searchHistory: await this.localStorage.getData('searchHistory'),
        userSettings: await this.localStorage.getData('userSettings')
      };

      // 检查是否有数据需要同步
      const hasData = Object.values(localData).some(data => 
        Array.isArray(data) ? data.length > 0 : (data && Object.keys(data).length > 0)
      );

      if (!hasData) {
        logger.info('📱 无数据需要同步');
        return { success: true, message: '无数据需要同步' };
      }

      logger.info(`📊 准备同步数据: 词汇${localData.vocabulary.length}个, 学习记录${localData.learningRecords.length}条, 剧集${localData.shows.length}个`);

      // 发送到云端（仅上传）
      const syncResult = await this.apiClient.syncData(TEST_CONFIG.userId, localData);
      
      if (syncResult.success) {
        logger.success(`✅ 同步成功: 数据已上传到云端`);
        this.syncQueue = []; // 清空队列
      } else {
        logger.error(`❌ 同步失败: ${syncResult.message}`);
      }

      return syncResult;
    } catch (error) {
      logger.error(`❌ 同步异常: ${error.message}`);
      throw error;
    }
  }

  // 验证本地数据未被覆盖
  async validateLocalDataIntegrity(originalSnapshot) {
    logger.info('🔍 验证本地数据完整性（确保未被云端覆盖）');
    
    const currentData = {
      vocabulary: await this.localStorage.getData('vocabulary'),
      learningRecords: await this.localStorage.getData('learningRecords'),
      userStats: await this.localStorage.getData('userStats'),
      shows: await this.localStorage.getData('shows'),
      searchHistory: await this.localStorage.getData('searchHistory'),
      userSettings: await this.localStorage.getData('userSettings')
    };

    const differences = this.localStorage.compareSnapshots(originalSnapshot, {
      timestamp: Date.now(),
      description: 'current',
      data: currentData
    });

    if (Object.keys(differences).length === 0) {
      logger.success('✅ 本地数据完整性验证通过：数据未被覆盖');
      return { success: true, differences: {} };
    } else {
      logger.error('❌ 本地数据完整性验证失败：数据被意外覆盖');
      logger.error('📊 数据差异:', JSON.stringify(differences, null, 2));
      return { success: false, differences };
    }
  }
}

// 数据冲突测试类
class DataConflictTester {
  constructor(localStorage, apiClient, syncService) {
    this.localStorage = localStorage;
    this.apiClient = apiClient;
    this.syncService = syncService;
  }

  // 测试1: 本地数据变更后同步
  async testLocalDataChangeSync() {
    logger.info('🧪 测试1: 本地数据变更后同步');
    
    // 创建初始快照
    const initialSnapshot = this.localStorage.createSnapshot('初始状态');
    
    // 模拟本地数据变更
    const vocabulary = await this.localStorage.getData('vocabulary');
    if (vocabulary.length > 0) {
      vocabulary[0].mastery = 85; // 修改本地数据
      vocabulary[0].notes = '本地修改的笔记';
      await this.localStorage.setData('vocabulary', vocabulary);
      logger.info('📱 模拟本地数据变更');
    }

    // 创建变更后快照
    const afterChangeSnapshot = this.localStorage.createSnapshot('本地变更后');
    
    // 执行同步
    const syncResult = await this.syncService.performSync();
    
    // 验证本地数据未被覆盖
    const integrityResult = await this.syncService.validateLocalDataIntegrity(afterChangeSnapshot);
    
    if (integrityResult.success) {
      logger.success('✅ 测试1通过：本地数据变更后同步成功，数据未被覆盖');
      return true;
    } else {
      logger.error('❌ 测试1失败：本地数据被覆盖');
      return false;
    }
  }

  // 测试2: 模拟云端数据变更（不应该影响本地）
  async testCloudDataChangeProtection() {
    logger.info('🧪 测试2: 云端数据变更保护测试');
    
    // 创建当前快照
    const currentSnapshot = this.localStorage.createSnapshot('同步前状态');
    
    // 模拟云端数据变更（通过直接调用API）
    try {
      const cloudData = {
        vocabulary: [
          {
            word: 'cloud_word',
            translation: '云端词汇',
            mastery: 100,
            notes: '这是云端的数据'
          }
        ],
        userStats: {
          experience: 9999,
          level: 99,
          currentStreak: 999,
          totalWordsLearned: 999
        }
      };

      // 直接上传到云端（模拟其他设备的数据）
      await this.apiClient.syncData(TEST_CONFIG.userId, cloudData);
      logger.info('☁️ 模拟云端数据变更');
      
      // 等待一段时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 验证本地数据未被云端数据覆盖
      const integrityResult = await this.syncService.validateLocalDataIntegrity(currentSnapshot);
      
      if (integrityResult.success) {
        logger.success('✅ 测试2通过：云端数据变更未影响本地数据');
        return true;
      } else {
        logger.error('❌ 测试2失败：本地数据被云端数据覆盖');
        return false;
      }
    } catch (error) {
      logger.error(`❌ 测试2异常: ${error.message}`);
      return false;
    }
  }

  // 测试3: 多次同步测试
  async testMultipleSyncs() {
    logger.info('🧪 测试3: 多次同步测试');
    
    const initialSnapshot = this.localStorage.createSnapshot('多次同步前');
    
    // 执行多次同步
    for (let i = 0; i < 3; i++) {
      logger.info(`🔄 执行第 ${i + 1} 次同步`);
      
      // 模拟一些本地操作
      const userStats = await this.localStorage.getData('userStats');
      userStats.experience += 10;
      await this.localStorage.setData('userStats', userStats);
      
      // 执行同步
      await this.syncService.performSync();
      
      // 验证数据完整性
      const integrityResult = await this.syncService.validateLocalDataIntegrity(initialSnapshot);
      if (!integrityResult.success) {
        logger.error(`❌ 第 ${i + 1} 次同步后数据被覆盖`);
        return false;
      }
    }
    
    logger.success('✅ 测试3通过：多次同步后本地数据保持完整');
    return true;
  }

  // 测试4: 离线同步测试
  async testOfflineSync() {
    logger.info('🧪 测试4: 离线同步测试');
    
    const initialSnapshot = this.localStorage.createSnapshot('离线测试前');
    
    // 模拟离线操作
    const vocabulary = await this.localStorage.getData('vocabulary');
    if (vocabulary.length > 0) {
      vocabulary[0].mastery = 95;
      vocabulary[0].notes = '离线修改的笔记';
      await this.localStorage.setData('vocabulary', vocabulary);
    }
    
    // 模拟网络恢复后的同步
    const syncResult = await this.syncService.performSync();
    
    // 验证离线操作的数据被正确同步
    const integrityResult = await this.syncService.validateLocalDataIntegrity(initialSnapshot);
    
    if (integrityResult.success) {
      logger.success('✅ 测试4通过：离线操作数据正确同步，本地数据未被覆盖');
      return true;
    } else {
      logger.error('❌ 测试4失败：离线操作数据同步异常');
      return false;
    }
  }

  // 测试5: 数据冲突解决策略测试
  async testConflictResolution() {
    logger.info('🧪 测试5: 数据冲突解决策略测试');
    
    // 创建初始快照
    const initialSnapshot = this.localStorage.createSnapshot('冲突测试前');
    
    // 模拟本地数据变更
    const vocabulary = await this.localStorage.getData('vocabulary');
    if (vocabulary.length > 0) {
      vocabulary[0].mastery = 90;
      vocabulary[0].notes = '本地冲突测试';
      await this.localStorage.setData('vocabulary', vocabulary);
    }
    
    // 模拟云端同时有数据变更（通过直接API调用）
    const cloudConflictData = {
      vocabulary: [
        {
          word: vocabulary[0]?.word || 'test',
          translation: '云端冲突数据',
          mastery: 80,
          notes: '云端冲突测试'
        }
      ]
    };
    
    // 直接上传冲突数据到云端
    await this.apiClient.syncData(TEST_CONFIG.userId, cloudConflictData);
    
    // 执行本地同步
    await this.syncService.performSync();
    
    // 验证本地数据优先（多邻国原则）
    const integrityResult = await this.syncService.validateLocalDataIntegrity(initialSnapshot);
    
    if (integrityResult.success) {
      logger.success('✅ 测试5通过：冲突解决策略正确，本地数据优先');
      return true;
    } else {
      logger.error('❌ 测试5失败：冲突解决策略异常');
      return false;
    }
  }
}

// 主测试函数
async function runConflictProtectionTest() {
  logger.info('🚀 开始数据冲突保护测试');
  logger.info(`👤 测试用户ID: ${TEST_CONFIG.userId}`);

  // 初始化组件
  const localStorage = new MockLocalStorage();
  const apiClient = new APIClient(API_BASE_URL);
  const syncService = new DuolingoSyncService(localStorage, apiClient);
  const conflictTester = new DataConflictTester(localStorage, apiClient, syncService);

  // 初始化测试数据
  logger.info('📝 初始化测试数据');
  const testVocabulary = TEST_CONFIG.testWords.map(word => ({
    word,
    translation: `${word}的翻译`,
    mastery: Math.floor(Math.random() * 100),
    reviewCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    notes: '',
    tags: ['test']
  }));

  await localStorage.setData('vocabulary', testVocabulary);
  await localStorage.setData('userStats', {
    experience: 100,
    level: 2,
    currentStreak: 5,
    totalWordsLearned: 10
  });

  try {
    // 1. 健康检查
    logger.info('🔍 步骤1: 后端服务健康检查');
    const healthResult = await apiClient.healthCheck();
    logger.success(`✅ 后端服务正常: ${healthResult.timestamp}`);

    // 2. 运行所有冲突保护测试
    const testResults = {
      test1: await conflictTester.testLocalDataChangeSync(),
      test2: await conflictTester.testCloudDataChangeProtection(),
      test3: await conflictTester.testMultipleSyncs(),
      test4: await conflictTester.testOfflineSync(),
      test5: await conflictTester.testConflictResolution()
    };

    // 3. 生成测试报告
    logger.info('🔍 生成测试报告');
    generateConflictTestReport(testResults);

    // 4. 输出测试结果摘要
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log('\n📋 冲突保护测试摘要:');
    console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
    console.log(`❌ 失败测试: ${totalTests - passedTests}`);
    
    if (passedTests === totalTests) {
      logger.success('🎉 所有冲突保护测试通过！多邻国同步原则正确实现');
    } else {
      logger.error('⚠️  部分冲突保护测试失败，需要检查同步逻辑');
    }

  } catch (error) {
    logger.error(`❌ 测试执行失败: ${error.message}`);
    console.error(error);
  }
}

// 生成冲突测试报告
function generateConflictTestReport(testResults) {
  const report = {
    testId: TEST_CONFIG.userId,
    startTime: new Date(testResults.startTime).toISOString(),
    endTime: new Date().toISOString(),
    duration: Date.now() - testResults.startTime,
    testResults: {
      localDataChangeSync: testResults.test1,
      cloudDataChangeProtection: testResults.test2,
      multipleSyncs: testResults.test3,
      offlineSync: testResults.test4,
      conflictResolution: testResults.test5
    },
    summary: {
      totalTests: 5,
      passedTests: Object.values(testResults).filter(result => result).length,
      failedTests: Object.values(testResults).filter(result => !result).length
    },
    tests: testResults.tests,
    errors: testResults.errors,
    warnings: testResults.warnings,
    snapshots: testResults.snapshots || []
  };

  // 保存报告到文件
  const reportPath = path.join(__dirname, `data-conflict-protection-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logger.success(`📊 冲突保护测试报告已生成: ${reportPath}`);
  
  return report;
}

// 运行测试
if (require.main === module) {
  runConflictProtectionTest()
    .then(() => {
      console.log('\n🎉 数据冲突保护测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = {
  MockLocalStorage,
  APIClient,
  DuolingoSyncService,
  DataConflictTester,
  runConflictProtectionTest
}; 