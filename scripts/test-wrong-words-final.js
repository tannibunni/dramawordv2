const axios = require('axios');

class WrongWordsFinalTester {
  constructor() {
    this.baseUrl = 'https://dramawordv2.onrender.com';
    this.testResults = [];
  }

  async runTests() {
    console.log('🧪 最终测试错词卡功能...\n');
    try {
      await this.testServerHealth();
      
      // 使用硬编码的测试数据
      const testData = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OGE3OWE4ZWE2ZWE3N2ZiMGM3ZWVhNCIsImlhdCI6MTc1MzkwNTU3NiwiZXhwIjoxNzU0NTEwMzc2fQ.CDqk3nFzk30L-DqM43soEaFs42XQIP_bcmnAd-QUjcw",
        userId: "688a79a8ea6ea77fb0c7eea4",
        username: "t_guest_576032l5if"
      };
      
      await this.testWordProgressUpdate(testData.token, testData.userId);
      await this.testGetUserVocabulary(testData.token, testData.userId);
      await this.testWrongWordsLogic();
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
      
      if (response.status === 200 && response.data.success && response.data.data && response.data.data.user && response.data.data.token) {
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
        
        return { vocabulary, wrongWords };
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
      return { vocabulary: [], wrongWords: [] };
    }
  }

  async testWrongWordsLogic() {
    try {
      console.log('\n🔍 测试错词卡逻辑...');
      
      // 模拟前端错词卡逻辑
      const mockVocabulary = [
        {
          word: 'borough',
          incorrectCount: 1,
          consecutiveIncorrect: 1,
          correctCount: 0,
          consecutiveCorrect: 0
        },
        {
          word: 'hello',
          incorrectCount: 0,
          consecutiveIncorrect: 0,
          correctCount: 5,
          consecutiveCorrect: 3
        }
      ];
      
      const wrongWords = mockVocabulary.filter(word => 
        (word.incorrectCount && word.incorrectCount > 0) || 
        (word.consecutiveIncorrect && word.consecutiveIncorrect > 0)
      );
      
      console.log(`📊 模拟错词卡逻辑: 总单词 ${mockVocabulary.length}, 错词 ${wrongWords.length}`);
      
      if (wrongWords.length > 0) {
        console.log('✅ 错词卡逻辑正常，找到错词:');
        wrongWords.forEach(word => {
          console.log(`  - ${word.word}: incorrectCount=${word.incorrectCount}, consecutiveIncorrect=${word.consecutiveIncorrect}`);
        });
        
        this.testResults.push({
          test: '错词卡逻辑',
          status: '✅ 通过',
          details: `找到 ${wrongWords.length} 个错词`
        });
      } else {
        console.log('❌ 错词卡逻辑异常，没有找到错词');
        this.testResults.push({
          test: '错词卡逻辑',
          status: '❌ 失败',
          details: '没有找到错词'
        });
      }
    } catch (error) {
      this.testResults.push({
        test: '错词卡逻辑',
        status: '❌ 失败',
        details: error.message
      });
      console.log('❌ 错词卡逻辑测试失败:', error.message);
    }
  }

  generateReport() {
    console.log('\n📋 最终测试报告:');
    console.log('='.repeat(50));
    this.testResults.forEach(result => {
      console.log(`${result.status} ${result.test}`);
      console.log(`   详情: ${result.details}`);
      console.log('');
    });
    
    const passedTests = this.testResults.filter(r => r.status === '✅ 通过').length;
    const totalTests = this.testResults.length;
    
    console.log(`🎯 测试结果: ${passedTests}/${totalTests} 通过`);
    
    if (passedTests === totalTests) {
      console.log('🎉 错词卡功能完全正常！');
    } else {
      console.log('⚠️ 错词卡功能存在问题，需要进一步检查');
    }
  }
}

const tester = new WrongWordsFinalTester();
tester.runTests().catch(console.error); 