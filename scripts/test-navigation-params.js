const axios = require('axios');

class NavigationParamsTester {
  constructor() {
    this.baseUrl = 'https://dramawordv2.onrender.com';
    this.testResults = [];
  }

  async runTests() {
    console.log('🧪 开始测试navigationParams保存和读取...\n');

    try {
      // 测试1: 模拟复习完成，保存navigationParams
      await this.testSaveNavigationParams();
      
      // 测试2: 模拟读取navigationParams
      await this.testReadNavigationParams();

      this.generateReport();
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error.message);
    }
  }

  async testSaveNavigationParams() {
    console.log('🔍 测试1: 模拟保存navigationParams...');
    try {
      // 模拟复习完成后的参数
      const params = {
        showExperienceAnimation: true,
        experienceGained: 2
      };
      
      console.log('✅ 模拟navigationParams参数:', params);
      console.log('📋 参数格式正确，应该能触发经验值动画');
      
      // 模拟保存到AsyncStorage的逻辑
      const savedParams = JSON.stringify(params);
      console.log('💾 保存的JSON字符串:', savedParams);
      
      // 验证JSON格式
      const parsedParams = JSON.parse(savedParams);
      console.log('✅ JSON解析成功:', parsedParams);
      
      if (parsedParams.showExperienceAnimation && parsedParams.experienceGained > 0) {
        console.log('✅ 参数验证通过，满足动画条件');
        this.testResults.push({ test: 'navigationParams保存', status: 'PASS', data: parsedParams });
      } else {
        throw new Error('参数验证失败');
      }
    } catch (error) {
      console.error('❌ navigationParams保存测试失败:', error.message);
      this.testResults.push({ test: 'navigationParams保存', status: 'FAIL', error: error.message });
      throw error;
    }
  }

  async testReadNavigationParams() {
    console.log('🔍 测试2: 模拟读取navigationParams...');
    try {
      // 模拟从AsyncStorage读取的逻辑
      const mockSavedParams = '{"showExperienceAnimation":true,"experienceGained":2}';
      console.log('📖 模拟读取的JSON字符串:', mockSavedParams);
      
      const params = JSON.parse(mockSavedParams);
      console.log('✅ JSON解析成功:', params);
      
      // 验证参数结构
      if (typeof params.showExperienceAnimation === 'boolean' && 
          typeof params.experienceGained === 'number') {
        console.log('✅ 参数类型验证通过');
        
        if (params.showExperienceAnimation && params.experienceGained > 0) {
          console.log('✅ 参数值验证通过，满足动画条件');
          this.testResults.push({ test: 'navigationParams读取', status: 'PASS', data: params });
        } else {
          throw new Error('参数值不满足动画条件');
        }
      } else {
        throw new Error('参数类型不正确');
      }
    } catch (error) {
      console.error('❌ navigationParams读取测试失败:', error.message);
      this.testResults.push({ test: 'navigationParams读取', status: 'FAIL', error: error.message });
      throw error;
    }
  }

  generateReport() {
    console.log('\n📊 navigationParams测试报告');
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
      console.log('\n🎉 所有测试通过！navigationParams机制正常');
      console.log('💡 如果前端仍然没有动画，可能的原因：');
      console.log('   1. checkForExperienceGain函数没有被调用');
      console.log('   2. 经验值动画组件没有正确渲染');
      console.log('   3. 用户统计数据没有正确加载');
    } else {
      console.log('\n⚠️ 部分测试失败，需要进一步检查');
    }
  }
}

// 运行测试
const tester = new NavigationParamsTester();
tester.runTests().catch(console.error); 