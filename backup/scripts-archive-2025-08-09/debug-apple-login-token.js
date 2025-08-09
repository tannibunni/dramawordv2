const axios = require('axios');

console.log('🔍 调试Apple登录Token存储问题...\n');

async function debugAppleLoginToken() {
  try {
    // 1. 测试Apple登录API
    console.log('1️⃣ 测试Apple登录API...');
    
    // 模拟Apple登录请求
    const appleLoginData = {
      idToken: 'mock_apple_id_token',
      email: 'test@example.com',
      fullName: {
        givenName: 'Test',
        familyName: 'User'
      }
    };
    
    try {
      const response = await axios.post('https://dramawordv2.onrender.com/api/apple/login', appleLoginData);
      console.log('✅ Apple登录API响应:', response.status);
      console.log('📋 响应数据:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success && response.data.data && response.data.data.token) {
        console.log('🎯 获取到Token:', response.data.data.token.substring(0, 50) + '...');
        
        // 2. 测试使用token调用API
        console.log('\n2️⃣ 测试使用Token调用API...');
        
        const token = response.data.data.token;
        
        try {
          const profileResponse = await axios.get('https://dramawordv2.onrender.com/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ 用户资料API调用成功:', profileResponse.status);
        } catch (error) {
          console.log('❌ 用户资料API调用失败:', error.response?.status, error.response?.data?.message);
        }
        
        // 3. 测试同步API
        console.log('\n3️⃣ 测试同步API...');
        
        try {
          const syncResponse = await axios.post('https://dramawordv2.onrender.com/api/users/batch-sync', {
            data: [{
              type: 'vocabulary',
              data: [{
                word: 'test',
                translation: '测试',
                userId: response.data.data.user.id
              }],
              timestamp: Date.now(),
              userId: response.data.data.user.id,
              operation: 'create',
              priority: 'medium'
            }],
            timestamp: Date.now(),
            syncStrategy: 'local-first',
            deviceId: 'test-device'
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ 同步API调用成功:', syncResponse.status);
        } catch (error) {
          console.log('❌ 同步API调用失败:', error.response?.status, error.response?.data?.message);
        }
        
      } else {
        console.log('❌ Apple登录响应中没有找到token');
      }
      
    } catch (error) {
      console.log('❌ Apple登录API调用失败:', error.response?.status, error.response?.data?.message);
    }
    
    // 4. 分析可能的问题
    console.log('\n4️⃣ 分析Apple登录Token问题...');
    
    const possibleIssues = [
      {
        issue: 'Apple登录API返回的token格式不正确',
        check: '检查后端AppleController返回的token格式'
      },
      {
        issue: '前端没有正确保存token到AsyncStorage',
        check: '检查userService.saveUserLoginInfo方法'
      },
      {
        issue: 'token保存后没有正确获取',
        check: '检查unifiedSyncService.getAuthToken方法'
      },
      {
        issue: 'Apple登录流程中断',
        check: '检查前端Apple登录的完整流程'
      }
    ];
    
    possibleIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.issue}`);
      console.log(`     检查方法: ${issue.check}`);
    });
    
    // 5. 提供解决方案
    console.log('\n5️⃣ 解决方案建议...');
    
    const solutions = [
      {
        step: '检查Apple登录流程',
        action: '确认Apple登录成功后token是否正确返回',
        code: 'console.log("Apple登录响应:", result.data.token)'
      },
      {
        step: '检查token保存',
        action: '确认token是否正确保存到AsyncStorage',
        code: 'await storageService.setAuthToken(token)'
      },
      {
        step: '检查token获取',
        action: '确认unifiedSyncService能正确获取token',
        code: 'const token = await getAuthToken()'
      },
      {
        step: '添加调试日志',
        action: '在关键步骤添加console.log',
        code: 'console.log("Token状态:", token)'
      }
    ];
    
    solutions.forEach((solution, index) => {
      console.log(`  ${index + 1}. ${solution.step}`);
      console.log(`     ${solution.action}`);
      console.log(`     代码示例: ${solution.code}`);
    });
    
    console.log('\n🎯 Apple登录Token调试完成！');
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error.message);
  }
}

// 运行调试
debugAppleLoginToken(); 