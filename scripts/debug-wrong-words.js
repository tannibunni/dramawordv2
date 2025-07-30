const axios = require('axios');

class WrongWordsDebugger {
  constructor() {
    this.baseUrl = 'https://dramawordv2.onrender.com';
    this.testResults = [];
  }

  async runTests() {
    console.log('🔍 开始调试错词卡问题...\n');
    try {
      await this.testServerHealth();
      await this.testDatabaseConnection();
      await this.testUserVocabularyAPI();
      await this.testWordProgressAPI();
      this.generateReport();
    } catch (error) {
      console.error('❌ 调试过程中发生错误:', error.message);
    }
  }

  async testServerHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      this.testResults.push({
        test: '服务器健康检查',
        status: response.status === 200 ? '✅ 通过' : '❌ 失败',
        details: `状态码: ${response.status}`
      });
      console.log('✅ 服务器健康检查通过');
    } catch (error) {
      this.testResults.push({
        test: '服务器健康检查',
        status: '❌ 失败',
        details: error.message
      });
      console.log('❌ 服务器健康检查失败:', error.message);
    }
  }

  async testDatabaseConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/debug/db-status`);
      if (response.status === 200 && response.data.success) {
        this.testResults.push({
          test: '数据库连接检查',
          status: '✅ 通过',
          details: `连接状态: ${response.data.data.connectionState}`
        });
        console.log('✅ 数据库连接正常');
        console.log('📊 数据库信息:', response.data.data);
      } else {
        throw new Error('数据库连接检查失败');
      }
    } catch (error) {
      this.testResults.push({
        test: '数据库连接检查',
        status: '❌ 失败',
        details: error.message
      });
      console.log('❌ 数据库连接检查失败:', error.message);
    }
  }

  async testUserVocabularyAPI() {
    try {
      // 使用一个已知的用户ID进行测试
      const testUserId = "688a556137eb80bdb7ebefb8"; // 从日志中看到的用户ID
      
      const response = await axios.get(`${this.baseUrl}/api/words/user/vocabulary?userId=${testUserId}`);
      
      if (response.status === 200 && response.data.success) {
        const vocabulary = response.data.data;
        const wrongWords = vocabulary.filter(word => 
          (word.incorrectCount && word.incorrectCount > 0) || 
          (word.consecutiveIncorrect && word.consecutiveIncorrect > 0)
        );

        this.testResults.push({
          test: '用户词汇表API',
          status: '✅ 通过',
          details: `总单词: ${vocabulary.length}, 错词: ${wrongWords.length}`
        });
        console.log('✅ 用户词汇表API正常');
        console.log(`📊 总单词: ${vocabulary.length}, 错词: ${wrongWords.length}`);
        
        if (vocabulary.length > 0) {
          console.log('🔍 词汇表详情:');
          vocabulary.forEach(word => {
            console.log(`  - ${word.word}: incorrectCount=${word.incorrectCount}, consecutiveIncorrect=${word.consecutiveIncorrect}`);
          });
        }
        
        if (wrongWords.length > 0) {
          console.log('🔍 错词详情:');
          wrongWords.forEach(word => {
            console.log(`  - ${word.word}: incorrectCount=${word.incorrectCount}, consecutiveIncorrect=${word.consecutiveIncorrect}`);
          });
        }
      } else {
        throw new Error('用户词汇表API响应格式异常');
      }
    } catch (error) {
      this.testResults.push({
        test: '用户词汇表API',
        status: '❌ 失败',
        details: error.message
      });
      console.log('❌ 用户词汇表API失败:', error.message);
    }
  }

  async testWordProgressAPI() {
    try {
      const testUserId = "688a556137eb80bdb7ebefb8";
      const testWord = "borough";
      
      // 先检查这个单词的进度
      const progressData = {
        userId: testUserId,
        word: testWord,
        isSuccessfulReview: false,
        progress: {
          reviewCount: 1,
          correctCount: 0,
          incorrectCount: 1,
          consecutiveCorrect: 0,
          consecutiveIncorrect: 1,
          mastery: 50,
          interval: 24,
          easeFactor: 2.5,
          totalStudyTime: 0,
          averageResponseTime: 0,
          confidence: 1,
          nextReviewDate: new Date().toISOString()
        }
      };

      const response = await axios.put(`${this.baseUrl}/api/words/user/progress`, progressData);
      
      if (response.status === 200 && response.data.success) {
        this.testResults.push({
          test: '单词进度更新API',
          status: '✅ 通过',
          details: `经验值: ${response.data.data?.experience?.xpGained || 0}`
        });
        console.log('✅ 单词进度更新成功');
        
        // 等待一下，然后再次检查词汇表
        console.log('⏳ 等待3秒后重新检查词汇表...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await this.testUserVocabularyAPI();
      } else {
        throw new Error('单词进度更新API响应格式异常');
      }
    } catch (error) {
      this.testResults.push({
        test: '单词进度更新API',
        status: '❌ 失败',
        details: error.message
      });
      console.log('❌ 单词进度更新API失败:', error.message);
    }
  }

  generateReport() {
    console.log('\n📋 调试报告:');
    console.log('='.repeat(50));
    this.testResults.forEach(result => {
      console.log(`${result.status} ${result.test}`);
      console.log(`   详情: ${result.details}`);
      console.log('');
    });
  }
}

const debuggerInstance = new WrongWordsDebugger();
debuggerInstance.runTests().catch(console.error); 