const axios = require('axios');

class ReviewExperienceTester {
  constructor() {
    this.baseUrl = 'https://dramawordv2.onrender.com';
    this.testResults = [];
  }

  async runTests() {
    console.log('🧪 开始测试复习经验值API...\n');

    try {
      // 测试1: 检查服务器健康状态
      await this.testServerHealth();
      
      // 测试2: 模拟游客注册
      const guestData = await this.testGuestRegistration();
      
      // 测试3: 模拟复习单词并调用经验值API
      await this.testReviewExperience(guestData.token);
      
      // 测试4: 验证经验值是否正确增加
      await this.testExperienceVerification(guestData.token);

      this.generateReport();
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error.message);
    }
  }

  async testServerHealth() {
    console.log('🔍 测试1: 检查服务器健康状态...');
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 10000 });
      if (response.status === 200) {
        console.log('✅ 服务器健康状态正常');
        this.testResults.push({ test: '服务器健康状态', status: 'PASS' });
      } else {
        throw new Error(`服务器响应异常: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 服务器健康检查失败:', error.message);
      this.testResults.push({ test: '服务器健康状态', status: 'FAIL', error: error.message });
      throw error;
    }
  }

  async testGuestRegistration() {
    console.log('🔍 测试2: 模拟游客注册...');
    try {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 6);
      const guestId = `test_${timestamp}_${random}`;
      const registerData = {
        loginType: 'guest',
        username: `t_guest_${timestamp}_${random}`.slice(0, 20),
        nickname: guestId,
        guestId: guestId,
      };

      const response = await axios.post(`${this.baseUrl}/api/users/register`, registerData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200 && response.data.success && response.data.data.user && response.data.data.token) {
        console.log('✅ 游客注册成功，获得令牌');
        this.testResults.push({ test: '游客注册', status: 'PASS' });
        return {
          user: response.data.data.user,
          token: response.data.data.token
        };
      } else {
        throw new Error('注册响应格式异常');
      }
    } catch (error) {
      console.error('❌ 游客注册失败:', error.message);
      this.testResults.push({ test: '游客注册', status: 'FAIL', error: error.message });
      throw error;
    }
  }

  async testReviewExperience(token) {
    console.log('🔍 测试3: 模拟复习单词并调用经验值API...');
    try {
      // 模拟复习单词 "hello"
      const reviewData = {
        userId: 'test_user_id',
        word: 'hello',
        isSuccessfulReview: true, // 记得
        progress: {
          reviewCount: 1,
          correctCount: 1,
          incorrectCount: 0,
          consecutiveCorrect: 1,
          consecutiveIncorrect: 0,
          mastery: 1,
          lastReviewDate: new Date().toISOString(),
          nextReviewDate: new Date().toISOString(),
          interval: 24,
          easeFactor: 2.5,
          totalStudyTime: 0,
          averageResponseTime: 0,
          confidence: 1,
        }
      };

      const response = await axios.put(`${this.baseUrl}/api/words/user/progress`, reviewData, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200 && response.data.success) {
        const experience = response.data.data?.experience;
        if (experience && experience.xpGained > 0) {
          console.log('✅ 复习经验值API调用成功');
          console.log(`📊 获得经验值: +${experience.xpGained} XP`);
          console.log(`📈 新等级: ${experience.newLevel}`);
          console.log(`🎉 是否升级: ${experience.leveledUp ? '是' : '否'}`);
          this.testResults.push({ test: '复习经验值API', status: 'PASS', data: experience });
        } else {
          throw new Error('经验值API返回数据异常');
        }
      } else {
        throw new Error(`API调用失败: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 复习经验值API测试失败:', error.message);
      this.testResults.push({ test: '复习经验值API', status: 'FAIL', error: error.message });
      throw error;
    }
  }

  async testExperienceVerification(token) {
    console.log('🔍 测试4: 验证经验值是否正确增加...');
    try {
      // 获取用户统计数据
      const response = await axios.get(`${this.baseUrl}/api/users/stats`, {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200 && response.data.success) {
        const stats = response.data.data;
        console.log('✅ 用户统计数据获取成功');
        console.log(`📊 当前经验值: ${stats.experience} XP`);
        console.log(`📈 当前等级: ${stats.level}`);
        console.log(`🎯 总复习次数: ${stats.totalReviews || 0}`);
        
        if (stats.experience > 0) {
          console.log('✅ 经验值已正确增加');
          this.testResults.push({ test: '经验值验证', status: 'PASS', data: stats });
        } else {
          throw new Error('经验值未增加');
        }
      } else {
        throw new Error(`获取统计数据失败: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 经验值验证失败:', error.message);
      this.testResults.push({ test: '经验值验证', status: 'FAIL', error: error.message });
      throw error;
    }
  }

  generateReport() {
    console.log('\n📊 复习经验值API测试报告');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`📈 成功率: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    console.log('\n详细结果:');
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.test}`);
      if (result.data) {
        console.log(`   数据: ${JSON.stringify(result.data)}`);
      }
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
    });

    if (failed === 0) {
      console.log('\n🎉 所有测试通过！复习经验值API工作正常');
    } else {
      console.log('\n⚠️ 部分测试失败，需要进一步检查');
    }
  }
}

// 运行测试
const tester = new ReviewExperienceTester();
tester.runTests().catch(console.error); 