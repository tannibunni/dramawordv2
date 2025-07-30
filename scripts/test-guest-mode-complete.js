const axios = require('axios');

class GuestModeTester {
  constructor() {
    this.baseURL = 'https://dramawordv2.onrender.com';
    this.testResults = [];
    this.userToken = null;
    this.userId = null;
  }

  // 生成游客ID
  generateGuestId() {
    const now = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4);
    const deviceHash = 'test'.split('').reduce((a, b) => a + b.charCodeAt(0), 0).toString(36).slice(-3);
    return now.slice(-6) + random + deviceHash;
  }

  // 测试1: 游客注册和令牌获取
  async testGuestRegistration() {
    console.log('🧪 测试1: 游客注册和令牌获取');
    
    try {
      const guestId = this.generateGuestId();
      console.log(`   游客ID: ${guestId}`);
      
      const registerData = {
        loginType: 'guest',
        username: `t_guest_${guestId}`.slice(0, 20),
        nickname: guestId,
        guestId: guestId,
      };

      const response = await axios.post(`${this.baseURL}/api/users/register`, registerData, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success && response.data.data.token) {
        this.userToken = response.data.data.token;
        this.userId = response.data.data.user.id;
        
        console.log('✅ 游客注册成功');
        console.log(`   用户ID: ${this.userId}`);
        console.log(`   令牌长度: ${this.userToken.length}`);
        console.log(`   用户等级: ${response.data.data.user.levelName}`);
        
        this.testResults.push({
          test: '游客注册',
          status: '成功',
          details: {
            userId: this.userId,
            tokenLength: this.userToken.length,
            level: response.data.data.user.levelName
          }
        });
        
        return true;
      } else {
        throw new Error('注册响应格式错误');
      }
    } catch (error) {
      console.error('❌ 游客注册失败:', error.message);
      this.testResults.push({
        test: '游客注册',
        status: '失败',
        error: error.message
      });
      return false;
    }
  }

  // 测试2: 模拟学习记录保存
  async testLearningRecordsSync() {
    console.log('\n🧪 测试2: 模拟学习记录保存');
    
    if (!this.userToken) {
      console.log('⚠️ 跳过测试（无令牌）');
      return false;
    }

    try {
      // 模拟用户学习了一些单词
      const learningRecords = [
        {
          word: 'hello',
          mastery: 0.9,
          lastReviewDate: new Date().toISOString(),
          nextReviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2天后复习
          reviewCount: 3
        },
        {
          word: 'world',
          mastery: 0.7,
          lastReviewDate: new Date().toISOString(),
          nextReviewDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1天后复习
          reviewCount: 2
        },
        {
          word: 'beautiful',
          mastery: 0.5,
          lastReviewDate: new Date().toISOString(),
          nextReviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天后复习
          reviewCount: 1
        }
      ];

      const syncData = {
        learningRecords: learningRecords,
        searchHistory: [],
        userSettings: {
          notifications: {
            dailyReminder: true,
            reviewReminder: true,
            achievementNotification: true
          },
          learning: {
            dailyGoal: 15,
            reviewInterval: 24,
            autoPlayAudio: true,
            showPhonetic: true
          },
          privacy: {
            shareProgress: false,
            showInLeaderboard: true
          },
          theme: 'light',
          language: 'zh-CN'
        }
      };

      const response = await axios.post(`${this.baseURL}/api/sync/batch`, syncData, {
        timeout: 15000,
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        console.log('✅ 学习记录同步成功');
        console.log(`   同步单词数: ${learningRecords.length}`);
        console.log(`   平均掌握度: ${(learningRecords.reduce((sum, record) => sum + record.mastery, 0) / learningRecords.length).toFixed(2)}`);
        
        this.testResults.push({
          test: '学习记录同步',
          status: '成功',
          details: {
            wordCount: learningRecords.length,
            averageMastery: (learningRecords.reduce((sum, record) => sum + record.mastery, 0) / learningRecords.length).toFixed(2)
          }
        });
        
        return true;
      } else {
        throw new Error('同步失败');
      }
    } catch (error) {
      console.error('❌ 学习记录同步失败:', error.message);
      this.testResults.push({
        test: '学习记录同步',
        status: '失败',
        error: error.message
      });
      return false;
    }
  }

  // 测试3: 模拟搜索历史保存
  async testSearchHistorySync() {
    console.log('\n🧪 测试3: 模拟搜索历史保存');
    
    if (!this.userToken) {
      console.log('⚠️ 跳过测试（无令牌）');
      return false;
    }

    try {
      // 模拟用户搜索了一些单词
      const searchHistory = [
        {
          word: 'apple',
          definition: '苹果',
          timestamp: new Date().toISOString()
        },
        {
          word: 'computer',
          definition: '计算机',
          timestamp: new Date().toISOString()
        },
        {
          word: '学习',
          definition: 'study',
          timestamp: new Date().toISOString()
        }
      ];

      const syncData = {
        learningRecords: [],
        searchHistory: searchHistory,
        userSettings: {
          notifications: {
            dailyReminder: true,
            reviewReminder: true,
            achievementNotification: true
          },
          learning: {
            dailyGoal: 10,
            reviewInterval: 24,
            autoPlayAudio: true,
            showPhonetic: true
          },
          privacy: {
            shareProgress: false,
            showInLeaderboard: true
          },
          theme: 'light',
          language: 'zh-CN'
        }
      };

      const response = await axios.post(`${this.baseURL}/api/sync/batch`, syncData, {
        timeout: 15000,
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        console.log('✅ 搜索历史同步成功');
        console.log(`   搜索记录数: ${searchHistory.length}`);
        console.log(`   搜索内容: ${searchHistory.map(item => item.word).join(', ')}`);
        
        this.testResults.push({
          test: '搜索历史同步',
          status: '成功',
          details: {
            searchCount: searchHistory.length,
            searchWords: searchHistory.map(item => item.word)
          }
        });
        
        return true;
      } else {
        throw new Error('同步失败');
      }
    } catch (error) {
      console.error('❌ 搜索历史同步失败:', error.message);
      this.testResults.push({
        test: '搜索历史同步',
        status: '失败',
        error: error.message
      });
      return false;
    }
  }

  // 测试4: 模拟用户设置保存
  async testUserSettingsSync() {
    console.log('\n🧪 测试4: 模拟用户设置保存');
    
    if (!this.userToken) {
      console.log('⚠️ 跳过测试（无令牌）');
      return false;
    }

    try {
      // 模拟用户自定义设置
      const userSettings = {
        notifications: {
          dailyReminder: false,
          reviewReminder: true,
          achievementNotification: false
        },
        learning: {
          dailyGoal: 20,
          reviewInterval: 12,
          autoPlayAudio: false,
          showPhonetic: true
        },
        privacy: {
          shareProgress: true,
          showInLeaderboard: false
        },
        theme: 'dark',
        language: 'en-US'
      };

      const syncData = {
        learningRecords: [],
        searchHistory: [],
        userSettings: userSettings
      };

      const response = await axios.post(`${this.baseURL}/api/sync/batch`, syncData, {
        timeout: 15000,
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        console.log('✅ 用户设置同步成功');
        console.log(`   主题: ${userSettings.theme}`);
        console.log(`   语言: ${userSettings.language}`);
        console.log(`   每日目标: ${userSettings.learning.dailyGoal}个单词`);
        
        this.testResults.push({
          test: '用户设置同步',
          status: '成功',
          details: {
            theme: userSettings.theme,
            language: userSettings.language,
            dailyGoal: userSettings.learning.dailyGoal
          }
        });
        
        return true;
      } else {
        throw new Error('同步失败');
      }
    } catch (error) {
      console.error('❌ 用户设置同步失败:', error.message);
      this.testResults.push({
        test: '用户设置同步',
        status: '失败',
        error: error.message
      });
      return false;
    }
  }

  // 测试5: 模拟数据下载
  async testDataDownload() {
    console.log('\n🧪 测试5: 模拟数据下载');
    
    if (!this.userToken) {
      console.log('⚠️ 跳过测试（无令牌）');
      return false;
    }

    try {
      // 模拟从服务器下载用户数据
      const response = await axios.get(`${this.baseURL}/api/sync/download`, {
        timeout: 15000,
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        const data = response.data.data;
        console.log('✅ 数据下载成功');
        console.log(`   学习记录数: ${data.learningRecords?.length || 0}`);
        console.log(`   搜索历史数: ${data.searchHistory?.length || 0}`);
        console.log(`   用户设置: ${data.userSettings ? '已保存' : '未保存'}`);
        
        this.testResults.push({
          test: '数据下载',
          status: '成功',
          details: {
            learningRecordsCount: data.learningRecords?.length || 0,
            searchHistoryCount: data.searchHistory?.length || 0,
            hasUserSettings: !!data.userSettings
          }
        });
        
        return true;
      } else {
        throw new Error('下载失败');
      }
    } catch (error) {
      console.error('❌ 数据下载失败:', error.message);
      this.testResults.push({
        test: '数据下载',
        status: '失败',
        error: error.message
      });
      return false;
    }
  }

  // 测试6: 模拟用户统计信息
  async testUserStats() {
    console.log('\n🧪 测试6: 模拟用户统计信息');
    
    if (!this.userToken) {
      console.log('⚠️ 跳过测试（无令牌）');
      return false;
    }

    try {
      // 获取用户统计信息
      const response = await axios.get(`${this.baseURL}/api/users/stats`, {
        timeout: 15000,
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        const stats = response.data.data;
        console.log('✅ 用户统计信息获取成功');
        console.log(`   等级: ${stats.level} (${stats.levelName})`);
        console.log(`   经验值: ${stats.experience}`);
        console.log(`   学习单词数: ${stats.totalWordsLearned}`);
        console.log(`   复习次数: ${stats.totalReviews}`);
        
        this.testResults.push({
          test: '用户统计信息',
          status: '成功',
          details: {
            level: stats.level,
            levelName: stats.levelName,
            experience: stats.experience,
            totalWordsLearned: stats.totalWordsLearned
          }
        });
        
        return true;
      } else {
        throw new Error('获取统计信息失败');
      }
    } catch (error) {
      console.error('❌ 用户统计信息获取失败:', error.message);
      this.testResults.push({
        test: '用户统计信息',
        status: '失败',
        error: error.message
      });
      return false;
    }
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始游客模式完整测试\n');
    console.log('='.repeat(60));
    
    // 测试1: 游客注册
    const registrationSuccess = await this.testGuestRegistration();
    
    if (registrationSuccess) {
      // 测试2-6: 数据操作
      await this.testLearningRecordsSync();
      await this.testSearchHistorySync();
      await this.testUserSettingsSync();
      await this.testDataDownload();
      await this.testUserStats();
    }
    
    // 生成报告
    this.generateReport();
  }

  // 生成测试报告
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 游客模式测试报告');
    console.log('='.repeat(60));
    
    const successCount = this.testResults.filter(r => r.status === '成功').length;
    const totalCount = this.testResults.length;
    
    console.log(`总测试数: ${totalCount}`);
    console.log(`成功数: ${successCount}`);
    console.log(`成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
    
    console.log('\n详细结果:');
    this.testResults.forEach((result, index) => {
      const statusIcon = result.status === '成功' ? '✅' : '❌';
      console.log(`${index + 1}. ${statusIcon} ${result.test}: ${result.status}`);
      
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
      
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (successCount === totalCount) {
      console.log('🎉 所有测试通过！游客模式功能完全正常');
      console.log('✅ 游客可以正常注册、获得令牌、保存和同步数据');
    } else {
      console.log('⚠️ 部分测试失败，需要检查相关功能');
    }
    
    console.log('='.repeat(60));
  }
}

// 运行测试
async function main() {
  const tester = new GuestModeTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GuestModeTester; 