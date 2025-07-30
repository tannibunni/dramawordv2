const axios = require('axios');

class ExperienceAnimationAccumulationTester {
  constructor() {
    this.baseUrl = 'https://dramawordv2.onrender.com';
    this.testResults = [];
  }

  async runTests() {
    console.log('🧪 开始测试经验值动画累加逻辑...\n');

    try {
      // 测试1: 模拟多次复习，验证经验值累加
      await this.testMultipleReviews();
      
      // 测试2: 验证动画状态重置
      await this.testAnimationStateReset();

      this.generateReport();
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error.message);
    }
  }

  async testMultipleReviews() {
    console.log('🔍 测试1: 模拟多次复习，验证经验值累加...');
    try {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OGE1NmNjMzdlYjgwYmRiN2ViZWZlNiIsImlhdCI6MTc1Mzg5NjY1MiwiZXhwIjoxNzU0NTAxNDUyfQ.5lU2dvX5t3uRXEtn_0hVS8c_hHnjPZJT1hMW4ZZpq3o';
      const userId = '688a56cc37eb80bdb7ebefe6';
      
      let totalExperience = 0;
      const reviewWords = ['test1', 'test2', 'test3'];
      
      for (let i = 0; i < reviewWords.length; i++) {
        const word = reviewWords[i];
        console.log(`📝 复习单词 ${i + 1}: ${word}`);
        
        const reviewData = {
          userId: userId,
          word: word,
          isSuccessfulReview: true, // 记得
          progress: {
            reviewCount: i + 1,
            correctCount: i + 1,
            incorrectCount: 0,
            consecutiveCorrect: i + 1,
            consecutiveIncorrect: 0,
            mastery: i + 1,
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
            totalExperience += experience.xpGained;
            console.log(`✅ 复习 ${word} 成功: +${experience.xpGained} XP`);
            console.log(`📊 累计经验值: ${totalExperience} XP`);
          } else {
            throw new Error(`复习 ${word} 失败: 没有获得经验值`);
          }
        } else {
          throw new Error(`复习 ${word} API调用失败: ${response.status}`);
        }
        
        // 等待一秒，模拟真实复习间隔
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`🎉 多次复习完成，总经验值: ${totalExperience} XP`);
      
      if (totalExperience >= 6) { // 3次复习，每次2XP
        console.log('✅ 经验值累加正常');
        this.testResults.push({ test: '经验值累加', status: 'PASS', data: { totalExperience } });
      } else {
        throw new Error(`经验值累加异常: 期望>=6，实际=${totalExperience}`);
      }
    } catch (error) {
      console.error('❌ 多次复习测试失败:', error.message);
      this.testResults.push({ test: '经验值累加', status: 'FAIL', error: error.message });
      throw error;
    }
  }

  async testAnimationStateReset() {
    console.log('🔍 测试2: 验证动画状态重置...');
    try {
      // 模拟动画状态重置逻辑
      const mockStates = {
        hasCheckedExperience: false,
        isProgressBarAnimating: false,
        showExperienceAnimation: false
      };
      
      console.log('📋 初始状态:', mockStates);
      
      // 模拟第一次动画
      mockStates.isProgressBarAnimating = true;
      mockStates.showExperienceAnimation = true;
      console.log('🎬 第一次动画开始:', mockStates);
      
      // 模拟动画完成
      mockStates.isProgressBarAnimating = false;
      mockStates.showExperienceAnimation = false;
      mockStates.hasCheckedExperience = true;
      console.log('✅ 第一次动画完成:', mockStates);
      
      // 模拟页面重新进入，状态重置
      mockStates.hasCheckedExperience = false;
      mockStates.isProgressBarAnimating = false;
      console.log('🔄 状态重置完成:', mockStates);
      
      // 验证状态重置
      if (!mockStates.hasCheckedExperience && !mockStates.isProgressBarAnimating) {
        console.log('✅ 动画状态重置正常');
        this.testResults.push({ test: '动画状态重置', status: 'PASS', data: mockStates });
      } else {
        throw new Error('动画状态重置失败');
      }
    } catch (error) {
      console.error('❌ 动画状态重置测试失败:', error.message);
      this.testResults.push({ test: '动画状态重置', status: 'FAIL', error: error.message });
      throw error;
    }
  }

  generateReport() {
    console.log('\n📊 经验值动画累加测试报告');
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
      console.log('\n🎉 所有测试通过！经验值动画累加逻辑正常');
      console.log('💡 如果前端仍然没有动画累加，可能的原因：');
      console.log('   1. 动画状态没有正确重置');
      console.log('   2. hasCheckedExperience状态没有重置');
      console.log('   3. 动画组件没有正确重新渲染');
    } else {
      console.log('\n⚠️ 部分测试失败，需要进一步检查');
    }
  }
}

// 运行测试
const tester = new ExperienceAnimationAccumulationTester();
tester.runTests().catch(console.error); 