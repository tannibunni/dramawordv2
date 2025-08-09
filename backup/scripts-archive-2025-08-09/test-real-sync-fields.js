#!/usr/bin/env node

/**
 * 实际项目字段同步测试脚本
 * 验证实际项目中的字段是否能正确上传到云端
 */

const axios = require('axios');
const API_BASE_URL = 'https://dramawordv2.onrender.com';

// 测试配置
const TEST_CONFIG = {
  userId: `test-real-sync-${Date.now()}`,
  testWords: ['hello', 'world', 'test', 'sync', 'fields']
};

// 日志工具
const logger = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`)
};

// 实际项目中的数据结构（基于真实代码）
class RealDataGenerator {
  constructor(userId) {
    this.userId = userId;
  }

  // 生成实际的词汇数据（基于 UserVocabulary 模型）
  generateVocabularyData(word) {
    return {
      userId: this.userId,
      wordId: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      word: word,
      language: 'en',
      mastery: Math.floor(Math.random() * 100),
      reviewCount: Math.floor(Math.random() * 10),
      correctCount: Math.floor(Math.random() * 8),
      incorrectCount: Math.floor(Math.random() * 3),
      lastReviewDate: new Date(),
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      interval: 24,
      easeFactor: 2.5,
      consecutiveCorrect: Math.floor(Math.random() * 5),
      consecutiveIncorrect: Math.floor(Math.random() * 2),
      totalStudyTime: Math.floor(Math.random() * 3600),
      averageResponseTime: Math.floor(Math.random() * 5000),
      confidence: Math.floor(Math.random() * 5) + 1,
      notes: `Test note for ${word}`,
      tags: ['test', 'sync'],
      sourceShow: {
        id: 123,
        name: 'Test Show',
        status: 'watching'
      },
      collectedAt: new Date()
    };
  }

  // 生成实际的学习记录数据（基于 UserLearningRecord 模型）
  generateLearningRecordsData(word) {
    return {
      userId: this.userId,
      records: [{
        word: word,
        mastery: Math.floor(Math.random() * 100),
        reviewCount: Math.floor(Math.random() * 10),
        correctCount: Math.floor(Math.random() * 8),
        incorrectCount: Math.floor(Math.random() * 3),
        lastReviewDate: new Date(),
        nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        interval: 24,
        easeFactor: 2.5,
        consecutiveCorrect: Math.floor(Math.random() * 5),
        consecutiveIncorrect: Math.floor(Math.random() * 2),
        totalStudyTime: Math.floor(Math.random() * 3600),
        averageResponseTime: Math.floor(Math.random() * 5000),
        confidence: Math.floor(Math.random() * 5) + 1,
        notes: `Test note for ${word}`,
        tags: ['test', 'sync']
      }],
      totalWords: 1,
      totalReviews: 1,
      averageMastery: 50,
      lastStudyDate: new Date()
    };
  }

  // 生成实际的剧集数据（基于 UserShowList 模型）
  generateShowsData(showName) {
    return {
      userId: this.userId,
      shows: [{
        id: Date.now(),
        name: showName,
        status: 'watching',
        wordCount: Math.floor(Math.random() * 100),
        lastWatched: new Date().toISOString(),
        icon: null,
        poster_path: null,
        backdrop_path: null,
        original_name: showName,
        genres: ['Drama', 'Comedy'],
        genre_ids: [18, 35],
        vote_average: Math.random() * 10
      }],
      updatedAt: new Date()
    };
  }

  // 生成实际的搜索历史数据（基于 SearchHistory 模型）
  generateSearchHistoryData(query) {
    return {
      userId: this.userId,
      query: query,
      timestamp: new Date(),
      resultCount: Math.floor(Math.random() * 50),
      isSuccessful: true
    };
  }

  // 生成实际的用户统计数据
  generateUserStatsData() {
    return {
      userId: this.userId,
      experience: Math.floor(Math.random() * 1000),
      level: Math.floor(Math.random() * 10) + 1,
      totalWordsLearned: Math.floor(Math.random() * 100),
      totalReviews: Math.floor(Math.random() * 500),
      currentStreak: Math.floor(Math.random() * 30),
      longestStreak: Math.floor(Math.random() * 100)
    };
  }
}

// API客户端
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

  // 测试词汇表同步
  async testVocabularySync(syncData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/sync/test`, {
        userId: syncData.userId,
        data: [{
          type: 'vocabulary',
          data: syncData,
          userId: syncData.userId,
          operation: 'create',
          timestamp: Date.now(),
          priority: 'high'
        }]
      });
      return response.data;
    } catch (error) {
      throw new Error(`词汇表同步失败: ${error.message}`);
    }
  }

  // 测试学习记录同步
  async testLearningRecordsSync(syncData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/sync/test`, {
        userId: syncData.userId,
        data: [{
          type: 'learningRecords',
          data: syncData,
          userId: syncData.userId,
          operation: 'update',
          timestamp: Date.now(),
          priority: 'high'
        }]
      });
      return response.data;
    } catch (error) {
      throw new Error(`学习记录同步失败: ${error.message}`);
    }
  }

  // 测试剧集同步
  async testShowsSync(syncData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/sync/test`, {
        userId: syncData.userId,
        data: [{
          type: 'shows',
          data: syncData,
          userId: syncData.userId,
          operation: 'create',
          timestamp: Date.now(),
          priority: 'medium'
        }]
      });
      return response.data;
    } catch (error) {
      throw new Error(`剧集同步失败: ${error.message}`);
    }
  }

  // 测试搜索历史同步
  async testSearchHistorySync(syncData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/sync/test`, {
        userId: syncData.userId,
        data: [{
          type: 'searchHistory',
          data: syncData,
          userId: syncData.userId,
          operation: 'create',
          timestamp: Date.now(),
          priority: 'low'
        }]
      });
      return response.data;
    } catch (error) {
      throw new Error(`搜索历史同步失败: ${error.message}`);
    }
  }

  // 测试用户统计同步
  async testUserStatsSync(syncData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/sync/test`, {
        userId: syncData.userId,
        data: [{
          type: 'userStats',
          data: syncData,
          userId: syncData.userId,
          operation: 'update',
          timestamp: Date.now(),
          priority: 'high'
        }]
      });
      return response.data;
    } catch (error) {
      throw new Error(`用户统计同步失败: ${error.message}`);
    }
  }
}

// 主测试函数
async function testRealSyncFields() {
  logger.info('🚀 开始实际项目字段同步测试');
  logger.info(`👤 测试用户ID: ${TEST_CONFIG.userId}`);

  const dataGenerator = new RealDataGenerator(TEST_CONFIG.userId);
  const apiClient = new APIClient(API_BASE_URL);

  const testResults = {
    vocabulary: false,
    learningRecords: false,
    shows: false,
    searchHistory: false,
    userStats: false
  };

  try {
    // 1. 健康检查
    logger.info('🔍 步骤1: 后端服务健康检查');
    const healthResult = await apiClient.healthCheck();
    logger.success(`✅ 后端服务正常: ${healthResult.timestamp}`);

    // 2. 测试词汇表同步
    logger.info('🔍 步骤2: 测试词汇表字段同步');
    for (const word of TEST_CONFIG.testWords.slice(0, 2)) {
      const vocabularyData = dataGenerator.generateVocabularyData(word);
      logger.info(`📚 测试词汇表同步: ${word}`);
      logger.info(`   字段: userId, wordId, word, language, mastery, reviewCount, etc.`);
      
      try {
        const result = await apiClient.testVocabularySync(vocabularyData);
        if (result.success) {
          logger.success(`✅ 词汇表同步成功: ${word}`);
          testResults.vocabulary = true;
        } else {
          logger.error(`❌ 词汇表同步失败: ${word} - ${result.message}`);
        }
      } catch (error) {
        logger.error(`❌ 词汇表同步异常: ${word} - ${error.message}`);
      }
    }

    // 3. 测试学习记录同步
    logger.info('🔍 步骤3: 测试学习记录字段同步');
    for (const word of TEST_CONFIG.testWords.slice(0, 2)) {
      const learningData = dataGenerator.generateLearningRecordsData(word);
      logger.info(`📊 测试学习记录同步: ${word}`);
      logger.info(`   字段: userId, records[].word, records[].mastery, records[].reviewCount, etc.`);
      
      try {
        const result = await apiClient.testLearningRecordsSync(learningData);
        if (result.success) {
          logger.success(`✅ 学习记录同步成功: ${word}`);
          testResults.learningRecords = true;
        } else {
          logger.error(`❌ 学习记录同步失败: ${word} - ${result.message}`);
        }
      } catch (error) {
        logger.error(`❌ 学习记录同步异常: ${word} - ${error.message}`);
      }
    }

    // 4. 测试剧集同步
    logger.info('🔍 步骤4: 测试剧集字段同步');
    const showsData = dataGenerator.generateShowsData('Test Show');
    logger.info(`📺 测试剧集同步: Test Show`);
    logger.info(`   字段: userId, shows[].id, shows[].name, shows[].status, etc.`);
    
    try {
      const result = await apiClient.testShowsSync(showsData);
      if (result.success) {
        logger.success(`✅ 剧集同步成功: Test Show`);
        testResults.shows = true;
      } else {
        logger.error(`❌ 剧集同步失败: Test Show - ${result.message}`);
      }
    } catch (error) {
      logger.error(`❌ 剧集同步异常: Test Show - ${error.message}`);
    }

    // 5. 测试搜索历史同步
    logger.info('🔍 步骤5: 测试搜索历史字段同步');
    for (const word of TEST_CONFIG.testWords.slice(0, 2)) {
      const searchData = dataGenerator.generateSearchHistoryData(word);
      logger.info(`🔍 测试搜索历史同步: ${word}`);
      logger.info(`   字段: userId, query, timestamp, resultCount, isSuccessful`);
      
      try {
        const result = await apiClient.testSearchHistorySync(searchData);
        if (result.success) {
          logger.success(`✅ 搜索历史同步成功: ${word}`);
          testResults.searchHistory = true;
        } else {
          logger.error(`❌ 搜索历史同步失败: ${word} - ${result.message}`);
        }
      } catch (error) {
        logger.error(`❌ 搜索历史同步异常: ${word} - ${error.message}`);
      }
    }

    // 6. 测试用户统计同步
    logger.info('🔍 步骤6: 测试用户统计字段同步');
    const userStatsData = dataGenerator.generateUserStatsData();
    logger.info(`📈 测试用户统计同步`);
    logger.info(`   字段: userId, experience, level, totalWordsLearned, etc.`);
    
    try {
      const result = await apiClient.testUserStatsSync(userStatsData);
      if (result.success) {
        logger.success(`✅ 用户统计同步成功`);
        testResults.userStats = true;
      } else {
        logger.error(`❌ 用户统计同步失败: ${result.message}`);
      }
    } catch (error) {
      logger.error(`❌ 用户统计同步异常: ${error.message}`);
    }

    // 7. 生成测试报告
    logger.info('🔍 步骤7: 生成测试报告');
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.keys(testResults).length;

    console.log('\n📊 实际项目字段同步测试报告:');
    console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
    
    Object.entries(testResults).forEach(([testName, result]) => {
      const status = result ? '✅' : '❌';
      console.log(`${status} ${testName}: ${result ? '通过' : '失败'}`);
    });

    if (passedTests === totalTests) {
      logger.success('🎉 所有实际项目字段同步测试通过！');
      logger.success('✅ 实际项目中的字段能正确上传到云端');
    } else {
      logger.warning(`⚠️ 部分测试失败，需要检查字段映射`);
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
  testRealSyncFields().then(results => {
    process.exit(Object.values(results).every(result => result) ? 0 : 1);
  });
}

module.exports = { testRealSyncFields, RealDataGenerator }; 