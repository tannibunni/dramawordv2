const axios = require('axios');

class LanguagePickerSyncTester {
  constructor() {
    this.baseUrl = 'https://dramawordv2.onrender.com';
    this.testResults = [];
  }

  async runTests() {
    console.log('🧪 开始测试LanguagePicker状态同步...\n');

    try {
      // 测试1: 检查服务器健康状态
      await this.testServerHealth();
      
      // 测试2: 模拟游客注册
      const guestData = await this.testGuestRegistration();
      
      // 测试3: 模拟初始语言设置
      await this.testInitialLanguageSetup(guestData.token);
      
      // 测试4: 验证语言设置同步
      await this.testLanguageSync(guestData.token);

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

      if (response.status === 200 && response.data.success && response.data.data.token) {
        console.log('✅ 游客注册成功，获得令牌');
        this.testResults.push({ test: '游客注册', status: 'PASS' });
        return response.data.data;
      } else {
        throw new Error('注册响应格式异常');
      }
    } catch (error) {
      console.error('❌ 游客注册失败:', error.message);
      this.testResults.push({ test: '游客注册', status: 'FAIL', error: error.message });
      throw error;
    }
  }

  async testInitialLanguageSetup(token) {
    console.log('🔍 测试3: 模拟初始语言设置...');
    try {
      // 模拟用户选择英语、法语、日语
      const learningLanguages = ['en', 'fr', 'ja'];
      
      // 模拟保存学习语言设置到AsyncStorage
      const syncData = {
        learningLanguages: learningLanguages,
        userSettings: {
          notifications: {
            dailyReminder: false,
            weeklyReminder: false,
            motivationReminder: false,
            streakReminder: false,
            notificationsEnabled: false
          },
          learning: {
            autoPlay: true,
            showPinyin: true,
            showTranslation: true,
            reviewInterval: 24
          },
          privacy: {
            shareProgress: false,
            allowAnalytics: true
          },
          theme: {
            mode: 'light',
            fontSize: 'medium'
          },
          language: {
            appLanguage: 'zh-CN',
            learningLanguages: learningLanguages
          }
        }
      };

      const response = await axios.post(`${this.baseUrl}/api/sync/batch`, syncData, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        console.log('✅ 初始语言设置同步成功');
        this.testResults.push({ test: '初始语言设置', status: 'PASS' });
      } else {
        throw new Error(`同步失败: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 初始语言设置失败:', error.message);
      this.testResults.push({ test: '初始语言设置', status: 'FAIL', error: error.message });
      throw error;
    }
  }

  async testLanguageSync(token) {
    console.log('🔍 测试4: 验证语言设置同步...');
    try {
      // 验证语言设置是否正确保存
      const response = await axios.get(`${this.baseUrl}/api/sync/download`, {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        const userData = response.data.data;
        const learningLanguages = userData.userSettings?.language?.learningLanguages || [];
        
        if (learningLanguages.includes('en') && learningLanguages.includes('fr') && learningLanguages.includes('ja')) {
          console.log('✅ 语言设置同步验证成功');
          console.log('📋 学习语言列表:', learningLanguages);
          this.testResults.push({ test: '语言设置同步验证', status: 'PASS' });
        } else {
          throw new Error(`语言设置不匹配，期望: ['en', 'fr', 'ja'], 实际: ${JSON.stringify(learningLanguages)}`);
        }
      } else {
        throw new Error(`下载数据失败: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 语言设置同步验证失败:', error.message);
      this.testResults.push({ test: '语言设置同步验证', status: 'FAIL', error: error.message });
      throw error;
    }
  }

  generateReport() {
    console.log('\n📊 LanguagePicker状态同步测试报告');
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
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
    });

    if (failed === 0) {
      console.log('\n🎉 所有测试通过！LanguagePicker状态同步问题已修复');
    } else {
      console.log('\n⚠️ 部分测试失败，需要进一步检查');
    }
  }
}

// 运行测试
const tester = new LanguagePickerSyncTester();
tester.runTests().catch(console.error); 