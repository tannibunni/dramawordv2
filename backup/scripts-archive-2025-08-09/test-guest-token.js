const axios = require('axios');

class GuestTokenTester {
  constructor() {
    this.baseURL = 'https://dramawordv2.onrender.com';
    this.testResults = [];
  }

  // 生成游客ID
  generateGuestId() {
    const now = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4);
    const deviceHash = 'test'.split('').reduce((a, b) => a + b.charCodeAt(0), 0).toString(36).slice(-3);
    return now.slice(-6) + random + deviceHash;
  }

  // 测试游客注册
  async testGuestRegistration() {
    const guestId = this.generateGuestId();
    console.log(`🧪 测试游客注册，ID: ${guestId}`);
    
    try {
      const startTime = Date.now();
      
      const registerData = {
        loginType: 'guest',
        username: `t_guest_${guestId}`.slice(0, 20),
        nickname: guestId,
        guestId: guestId,
      };

      const response = await axios.post(`${this.baseURL}/api/users/register`, registerData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const duration = Date.now() - startTime;
      
      if (response.data.success && response.data.data.token) {
        console.log('✅ 游客注册成功');
        console.log(`   - 用户ID: ${response.data.data.user.id}`);
        console.log(`   - 令牌长度: ${response.data.data.token.length}`);
        console.log(`   - 响应时间: ${duration}ms`);
        
        this.testResults.push({
          test: '游客注册',
          status: '成功',
          duration,
          token: response.data.data.token.substring(0, 20) + '...'
        });
        
        return response.data.data.token;
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
      return null;
    }
  }

  // 测试令牌有效性
  async testTokenValidity(token) {
    if (!token) {
      console.log('⚠️ 跳过令牌有效性测试（无令牌）');
      return;
    }
    
    console.log('🧪 测试令牌有效性');
    
    try {
      const startTime = Date.now();
      
      const response = await axios.get(`${this.baseURL}/api/auth/status`, {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const duration = Date.now() - startTime;
      
      if (response.data.success) {
        console.log('✅ 令牌有效');
        console.log(`   - 用户信息: ${response.data.data.username}`);
        console.log(`   - 响应时间: ${duration}ms`);
        
        this.testResults.push({
          test: '令牌验证',
          status: '成功',
          duration
        });
      } else {
        throw new Error('令牌验证失败');
      }
    } catch (error) {
      console.error('❌ 令牌验证失败:', error.message);
      this.testResults.push({
        test: '令牌验证',
        status: '失败',
        error: error.message
      });
    }
  }

  // 测试同步功能
  async testSyncWithToken(token) {
    if (!token) {
      console.log('⚠️ 跳过同步测试（无令牌）');
      return;
    }
    
    console.log('🧪 测试同步功能');
    
    try {
      const startTime = Date.now();
      
      const syncData = {
        learningRecords: [
          {
            word: 'test',
            mastery: 0.8,
            lastReviewDate: new Date().toISOString(),
            reviewCount: 1
          }
        ],
        searchHistory: [
          {
            word: 'hello',
            language: 'en',
            searchTime: new Date().toISOString()
          }
        ],
        userSettings: {
          language: 'zh-CN',
          theme: 'light'
        }
      };

      const response = await axios.post(`${this.baseURL}/api/sync/batch`, syncData, {
        timeout: 15000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const duration = Date.now() - startTime;
      
      if (response.data.success) {
        console.log('✅ 同步测试成功');
        console.log(`   - 响应时间: ${duration}ms`);
        console.log(`   - 同步结果: ${JSON.stringify(response.data.data)}`);
        
        this.testResults.push({
          test: '数据同步',
          status: '成功',
          duration
        });
      } else {
        throw new Error('同步失败');
      }
    } catch (error) {
      console.error('❌ 同步测试失败:', error.message);
      this.testResults.push({
        test: '数据同步',
        status: '失败',
        error: error.message
      });
    }
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始游客令牌功能测试\n');
    
    // 测试1: 游客注册
    const token = await this.testGuestRegistration();
    
    // 测试2: 令牌验证
    await this.testTokenValidity(token);
    
    // 测试3: 同步功能
    await this.testSyncWithToken(token);
    
    // 生成报告
    this.generateReport();
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📊 测试报告');
    console.log('='.repeat(50));
    
    const successCount = this.testResults.filter(r => r.status === '成功').length;
    const totalCount = this.testResults.length;
    
    console.log(`总测试数: ${totalCount}`);
    console.log(`成功数: ${successCount}`);
    console.log(`成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
    
    console.log('\n详细结果:');
    this.testResults.forEach((result, index) => {
      const statusIcon = result.status === '成功' ? '✅' : '❌';
      console.log(`${index + 1}. ${statusIcon} ${result.test}: ${result.status}`);
      
      if (result.duration) {
        console.log(`   响应时间: ${result.duration}ms`);
      }
      
      if (result.token) {
        console.log(`   令牌: ${result.token}`);
      }
      
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(50));
    
    if (successCount === totalCount) {
      console.log('🎉 所有测试通过！游客令牌功能正常工作');
    } else {
      console.log('⚠️ 部分测试失败，需要检查相关功能');
    }
  }
}

// 运行测试
async function main() {
  const tester = new GuestTokenTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GuestTokenTester; 