const axios = require('axios');

class WrongWordsTester {
  constructor() {
    this.baseUrl = 'https://dramawordv2.onrender.com';
    this.testResults = [];
  }

  async runTests() {
    console.log('🧪 开始测试错词卡功能...\n');
    try {
      await this.testServerHealth();
      
      // 使用硬编码的测试数据
      const testData = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OGE1ZDcxMzdlYjgwYmRiN2ViZjFhZSIsImlhdCI6MTc1Mzg5ODM1MywiZXhwIjoxNzU0NTAzMTUzfQ.M_D5rqIQh_BDazd94sNMWsBM--UONRrJCz799dOocLQ",
        userId: "688a5d7137eb80bdb7ebf1ae",
        username: "t_guest_3530132pck"
      };
      
      await this.testWordProgressUpdate(testData.token, testData.userId);
      await this.testGetUserVocabulary(testData.token, testData.userId);
      this.generateReport();
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error.message);
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

  async testGuestRegistration() {
    try {
      const guestId = Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 4);
      const registerData = {
        loginType: 'guest',
        username: `t_guest_${guestId}`.slice(0, 20),
        nickname: guestId,
        guestId: guestId,
      };

      const response = await axios.post(`${this.baseUrl}/api/users/register`, registerData);
      
      console.log('注册响应:', JSON.stringify(response.data, null, 2));
      
      if (response.status === 200 && response.data.success) {
        const userData = response.data.data;
        this.testResults.push({
          test: '游客注册',
          status: '✅ 通过',
          details: `用户ID: ${userData.user.id}, 用户名: ${userData.user.username}`
        });
        console.log('✅ 游客注册成功');
        return {
          token: userData.token,
          userId: userData.user.id,
          username: userData.user.username
        };
      } else {
        throw new Error(`注册失败: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      this.testResults.push({
        test: '游客注册',
        status: '❌ 失败',
        details: error.message
      });
      console.log('❌ 游客注册失败:', error.message);
      throw error;
    }
  }

  async testWordProgressUpdate(token, userId) {
    try {
      const progressData = {
        userId: userId,
        word: 'borough',
        isSuccessfulReview: false, // 模拟答错
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

      const response = await axios.put(`${this.baseUrl}/api/words/user/progress`, progressData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 && response.data.success) {
        this.testResults.push({
          test: '单词进度更新（答错）',
          status: '✅ 通过',
          details: `经验值: ${response.data.data?.experience?.xpGained || 0}`
        });
        console.log('✅ 单词进度更新成功');
      } else {
        throw new Error('进度更新响应格式异常');
      }
    } catch (error) {
      this.testResults.push({
        test: '单词进度更新（答错）',
        status: '❌ 失败',
        details: error.message
      });
      console.log('❌ 单词进度更新失败:', error.message);
    }
  }

  async testGetUserVocabulary(token, userId) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/words/user/vocabulary?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200 && response.data.success) {
        const vocabulary = response.data.data;
        const wrongWords = vocabulary.filter(word => 
          (word.incorrectCount && word.incorrectCount > 0) || 
          (word.consecutiveIncorrect && word.consecutiveIncorrect > 0)
        );

        this.testResults.push({
          test: '获取用户词汇表',
          status: '✅ 通过',
          details: `总单词: ${vocabulary.length}, 错词: ${wrongWords.length}`
        });
        console.log('✅ 获取用户词汇表成功');
        console.log(`📊 总单词: ${vocabulary.length}, 错词: ${wrongWords.length}`);
        
        if (wrongWords.length > 0) {
          console.log('🔍 错词详情:');
          wrongWords.forEach(word => {
            console.log(`  - ${word.word}: incorrectCount=${word.incorrectCount}, consecutiveIncorrect=${word.consecutiveIncorrect}`);
          });
        }
      } else {
        throw new Error('获取词汇表响应格式异常');
      }
    } catch (error) {
      this.testResults.push({
        test: '获取用户词汇表',
        status: '❌ 失败',
        details: error.message
      });
      console.log('❌ 获取用户词汇表失败:', error.message);
    }
  }

  generateReport() {
    console.log('\n📋 测试报告:');
    console.log('='.repeat(50));
    this.testResults.forEach(result => {
      console.log(`${result.status} ${result.test}`);
      console.log(`   详情: ${result.details}`);
      console.log('');
    });
  }
}

const tester = new WrongWordsTester();
tester.runTests().catch(console.error); 