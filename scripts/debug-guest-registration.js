const axios = require('axios');

class GuestRegistrationTester {
  constructor() {
    this.baseURL = 'https://dramawordv2.onrender.com';
  }

  // 生成游客ID
  generateGuestId() {
    const now = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4);
    const deviceHash = 'test'.split('').reduce((a, b) => a + b.charCodeAt(0), 0).toString(36).slice(-3);
    return now.slice(-6) + random + deviceHash;
  }

  // 测试服务器健康状态
  async testServerHealth() {
    console.log('🔍 测试服务器健康状态...');
    
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 10000
      });
      
      console.log('✅ 服务器健康检查通过');
      console.log(`   状态: ${response.status}`);
      console.log(`   响应: ${JSON.stringify(response.data)}`);
      return true;
    } catch (error) {
      console.error('❌ 服务器健康检查失败:', error.message);
      return false;
    }
  }

  // 测试数据库连接
  async testDatabaseConnection() {
    console.log('\n🔍 测试数据库连接...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/debug/db-status`, {
        timeout: 10000
      });
      
      console.log('✅ 数据库连接检查通过');
      console.log(`   状态: ${response.status}`);
      console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } catch (error) {
      console.error('❌ 数据库连接检查失败:', error.message);
      if (error.response) {
        console.error(`   错误状态: ${error.response.status}`);
        console.error(`   错误信息: ${error.response.data}`);
      }
      return false;
    }
  }

  // 测试用户注册端点
  async testUserRegistrationEndpoint() {
    console.log('\n🔍 测试用户注册端点...');
    
    const guestId = this.generateGuestId();
    console.log(`   使用游客ID: ${guestId}`);
    
    const registerData = {
      loginType: 'guest',
      username: `t_guest_${guestId}`.slice(0, 20),
      nickname: guestId,
      guestId: guestId,
    };

    console.log(`   注册数据: ${JSON.stringify(registerData, null, 2)}`);
    
    try {
      const response = await axios.post(`${this.baseURL}/api/users/register`, registerData, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('✅ 用户注册成功');
      console.log(`   状态: ${response.status}`);
      console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
      return response.data;
    } catch (error) {
      console.error('❌ 用户注册失败');
      console.error(`   错误类型: ${error.constructor.name}`);
      console.error(`   错误消息: ${error.message}`);
      
      if (error.response) {
        console.error(`   响应状态: ${error.response.status}`);
        console.error(`   响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
        console.error(`   响应头: ${JSON.stringify(error.response.headers, null, 2)}`);
      } else if (error.request) {
        console.error(`   请求错误: ${error.request}`);
      }
      
      return null;
    }
  }

  // 测试同步端点
  async testSyncEndpoint(token) {
    if (!token) {
      console.log('\n⚠️ 跳过同步端点测试（无令牌）');
      return;
    }
    
    console.log('\n🔍 测试同步端点...');
    
          const syncData = {
        learningRecords: [
          {
            word: 'test',
            mastery: 0.8,
            lastReviewDate: new Date().toISOString(),
            nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天复习
            reviewCount: 1
          }
        ],
              searchHistory: [
          {
            word: 'hello',
            language: 'en',
            definition: '你好',
            searchTime: new Date().toISOString()
          }
        ],
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

    try {
      const response = await axios.post(`${this.baseURL}/api/sync/batch`, syncData, {
        timeout: 15000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('✅ 同步端点测试成功');
      console.log(`   状态: ${response.status}`);
      console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } catch (error) {
      console.error('❌ 同步端点测试失败');
      console.error(`   错误消息: ${error.message}`);
      
      if (error.response) {
        console.error(`   响应状态: ${error.response.status}`);
        console.error(`   响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      
      return false;
    }
  }

  // 运行完整调试
  async runDebug() {
    console.log('🚀 开始游客注册调试\n');
    
    // 步骤1: 检查服务器健康状态
    const serverHealthy = await this.testServerHealth();
    if (!serverHealthy) {
      console.log('\n❌ 服务器不健康，停止调试');
      return;
    }
    
    // 步骤2: 检查数据库连接
    const dbConnected = await this.testDatabaseConnection();
    if (!dbConnected) {
      console.log('\n❌ 数据库连接失败，停止调试');
      return;
    }
    
    // 步骤3: 测试用户注册
    const registrationResult = await this.testUserRegistrationEndpoint();
    
    // 步骤4: 如果注册成功，测试同步
    if (registrationResult && registrationResult.data && registrationResult.data.token) {
      await this.testSyncEndpoint(registrationResult.data.token);
    }
    
    console.log('\n📊 调试完成');
  }
}

// 运行调试
async function main() {
  const tester = new GuestRegistrationTester();
  await tester.runDebug();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GuestRegistrationTester; 