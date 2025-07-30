const axios = require('axios');

class SearchHistoryTester {
  constructor() {
    this.baseURL = 'https://dramawordv2.onrender.com';
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

  // 获取游客令牌
  async getGuestToken() {
    console.log('🔍 获取游客令牌...');
    
    try {
      const guestId = this.generateGuestId();
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
        console.log('✅ 获得游客令牌');
        return true;
      }
    } catch (error) {
      console.error('❌ 获取游客令牌失败:', error.message);
      return false;
    }
  }

  // 测试不同的搜索历史数据格式
  async testSearchHistoryFormats() {
    console.log('\n🧪 测试不同的搜索历史数据格式');
    
    if (!this.userToken) {
      console.log('⚠️ 跳过测试（无令牌）');
      return;
    }

    const testCases = [
      {
        name: '格式1: 标准格式',
        data: [
          {
            word: 'apple',
            definition: '苹果',
            timestamp: new Date().toISOString()
          }
        ]
      },
      {
        name: '格式2: 带userId',
        data: [
          {
            word: 'computer',
            definition: '计算机',
            timestamp: new Date().toISOString(),
            userId: this.userId
          }
        ]
      },
      {
        name: '格式3: 简化格式',
        data: [
          {
            word: 'hello',
            definition: '你好'
          }
        ]
      },
      {
        name: '格式4: 完整格式',
        data: [
          {
            word: 'world',
            definition: '世界',
            timestamp: new Date().toISOString(),
            userId: this.userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n测试: ${testCase.name}`);
      console.log(`数据: ${JSON.stringify(testCase.data, null, 2)}`);
      
      try {
        const syncData = {
          learningRecords: [],
          searchHistory: testCase.data,
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
          console.log('✅ 成功');
          console.log(`响应: ${JSON.stringify(response.data.data, null, 2)}`);
        } else {
          console.log('❌ 失败');
          console.log(`错误: ${JSON.stringify(response.data, null, 2)}`);
        }
      } catch (error) {
        console.log('❌ 请求失败');
        if (error.response) {
          console.log(`状态码: ${error.response.status}`);
          console.log(`错误信息: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
          console.log(`错误: ${error.message}`);
        }
      }
    }
  }

  // 检查SearchHistory模型定义
  async checkSearchHistoryModel() {
    console.log('\n🔍 检查SearchHistory模型定义');
    
    try {
      // 尝试直接创建搜索历史记录
      const searchData = {
        word: 'test',
        definition: '测试',
        timestamp: new Date().toISOString(),
        userId: this.userId
      };

      console.log(`测试数据: ${JSON.stringify(searchData, null, 2)}`);
      
      // 这里我们可以通过API来测试，或者检查模型定义
      console.log('SearchHistory模型要求字段:');
      console.log('- word: 必需，字符串');
      console.log('- definition: 必需，字符串');
      console.log('- timestamp: 可选，日期，默认当前时间');
      console.log('- userId: 可选，字符串');
    } catch (error) {
      console.error('检查模型失败:', error.message);
    }
  }

  // 运行调试
  async runDebug() {
    console.log('🚀 开始搜索历史同步调试\n');
    
    const tokenSuccess = await this.getGuestToken();
    if (tokenSuccess) {
      await this.checkSearchHistoryModel();
      await this.testSearchHistoryFormats();
    }
    
    console.log('\n📊 调试完成');
  }
}

// 运行调试
async function main() {
  const tester = new SearchHistoryTester();
  await tester.runDebug();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SearchHistoryTester; 