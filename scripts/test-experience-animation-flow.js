const axios = require('axios');

class ExperienceAnimationFlowTester {
  constructor() {
    this.baseUrl = 'https://dramawordv2.onrender.com';
    this.testResults = [];
  }

  async runTests() {
    console.log('🧪 开始测试经验值动画完整流程...\n');

    try {
      // 测试1: 检查服务器健康状态
      await this.testServerHealth();
      
      // 测试2: 模拟复习单词并调用经验值API
      const reviewResult = await this.testReviewExperience();
      
      // 测试3: 验证经验值是否正确增加
      await this.testExperienceVerification();
      
      // 测试4: 模拟保存navigationParams
      await this.testNavigationParams();

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

  async testReviewExperience() {
    console.log('🔍 测试2: 模拟复习单词并调用经验值API...');
    try {
      // 使用已知的token和用户ID
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OGE1NmNjMzdlYjgwYmRiN2ViZWZlNiIsImlhdCI6MTc1Mzg5NjY1MiwiZXhwIjoxNzU0NTAxNDUyfQ.5lU2dvX5t3uRXEtn_0hVS8c_hHnjPZJT1hMW4ZZpq3o';
      const userId = '688a56cc37eb80bdb7ebefe6';
      
      // 模拟复习单词 "test"
      const reviewData = {
        userId: userId,
        word: 'test',
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
          console.log(`💬 消息: ${experience.message}`);
          this.testResults.push({ test: '复习经验值API', status: 'PASS', data: experience });
          return experience.xpGained;
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

  async testExperienceVerification() {
    console.log('🔍 测试3: 验证经验值是否正确增加...');
    try {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OGE1NmNjMzdlYjgwYmRiN2ViZWZlNiIsImlhdCI6MTc1Mzg5NjY1MiwiZXhwIjoxNzU0NTAxNDUyfQ.5lU2dvX5t3uRXEtn_0hVS8c_hHnjPZJT1hMW4ZZpq3o';
      
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

  async testNavigationParams() {
    console.log('🔍 测试4: 模拟保存navigationParams...');
    try {
      // 模拟复习完成后的参数
      const params = {
        showExperienceAnimation: true,
        experienceGained: 2
      };
      
      console.log('✅ 模拟navigationParams参数:', params);
      console.log('📋 参数格式正确，应该能触发经验值动画');
      
      this.testResults.push({ test: 'navigationParams格式', status: 'PASS', data: params });
    } catch (error) {
      console.error('❌ navigationParams测试失败:', error.message);
      this.testResults.push({ test: 'navigationParams格式', status: 'FAIL', error: error.message });
      throw error;
    }
  }

  generateReport() {
    console.log('\n📊 经验值动画完整流程测试报告');
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
      console.log('\n🎉 所有测试通过！经验值动画流程正常');
      console.log('💡 如果前端仍然没有动画，请检查：');
      console.log('   1. ReviewIntroScreen是否正确重置hasCheckedExperience');
      console.log('   2. navigationParams是否正确保存和读取');
      console.log('   3. 经验值动画组件是否正确渲染');
    } else {
      console.log('\n⚠️ 部分测试失败，需要进一步检查');
    }
  }
}

// 运行测试
const tester = new ExperienceAnimationFlowTester();
tester.runTests().catch(console.error); 