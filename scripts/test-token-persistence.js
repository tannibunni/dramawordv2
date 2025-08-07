const axios = require('axios');

console.log('🔍 测试Token持久化功能...\n');

async function testTokenPersistence() {
  try {
    // 1. 测试用户注册
    console.log('1️⃣ 测试用户注册...');
    const testUserId = `test_user_${Date.now()}`;
    const registerData = {
      loginType: 'guest',
      username: testUserId.slice(0, 20),
      nickname: '测试用户',
      guestId: testUserId
    };
    
    const registerResponse = await axios.post('https://dramawordv2.onrender.com/api/users/register', registerData);
    console.log('✅ 用户注册成功:', registerResponse.status);
    
    if (registerResponse.data.success && registerResponse.data.data.token) {
      const token = registerResponse.data.data.token;
      console.log('🎯 获取到Token:', token.substring(0, 50) + '...');
      
      // 2. 测试token验证
      console.log('\n2️⃣ 测试Token验证...');
      try {
        const profileResponse = await axios.get('https://dramawordv2.onrender.com/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Token验证成功:', profileResponse.status);
      } catch (error) {
        console.log('❌ Token验证失败:', error.response?.status, error.response?.data?.message);
      }
      
      // 3. 测试token过期时间
      console.log('\n3️⃣ 分析Token过期时间...');
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
          const exp = payload.exp;
          const now = Math.floor(Date.now() / 1000);
          const remainingTime = exp - now;
          
          console.log('📅 Token信息:');
          console.log(`  - 过期时间: ${new Date(exp * 1000).toLocaleString()}`);
          console.log(`  - 剩余时间: ${Math.floor(remainingTime / 3600)}小时 ${Math.floor((remainingTime % 3600) / 60)}分钟`);
          console.log(`  - 是否即将过期: ${remainingTime < 3600 ? '是' : '否'}`);
        }
      } catch (error) {
        console.log('❌ Token解析失败:', error.message);
      }
      
      // 4. 测试同步功能
      console.log('\n4️⃣ 测试同步功能...');
      try {
        const syncResponse = await axios.post('https://dramawordv2.onrender.com/api/users/batch-sync', {
          data: [{
            type: 'vocabulary',
            data: [{
              word: 'test',
              translation: '测试',
              userId: registerResponse.data.data.user.id
            }],
            timestamp: Date.now(),
            userId: registerResponse.data.data.user.id,
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
        console.log('✅ 同步功能正常:', syncResponse.status);
      } catch (error) {
        console.log('❌ 同步功能失败:', error.response?.status, error.response?.data?.message);
      }
      
    } else {
      console.log('❌ 注册响应中没有token');
    }
    
    // 5. 分析问题原因
    console.log('\n5️⃣ 分析登录持久化问题...');
    
    const possibleIssues = [
      {
        issue: 'Token存储问题',
        description: 'Token没有正确保存到AsyncStorage',
        solution: '检查userService.saveUserLoginInfo方法'
      },
      {
        issue: 'Token验证问题',
        description: 'Token验证逻辑有误，导致有效token被清除',
        solution: '检查tokenValidationService.validateToken方法'
      },
      {
        issue: 'Token格式问题',
        description: 'Token格式验证失败',
        solution: '检查validateTokenFormat方法，修复atob兼容性'
      },
      {
        issue: 'Token过期问题',
        description: 'Token已过期或即将过期',
        solution: '检查token过期时间，考虑自动刷新机制'
      },
      {
        issue: '应用启动逻辑问题',
        description: '应用启动时没有正确恢复登录状态',
        solution: '检查AuthContext.loadUserInfo方法'
      }
    ];
    
    console.log('🔍 可能的问题原因:');
    possibleIssues.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.issue}`);
      console.log(`     描述: ${item.description}`);
      console.log(`     解决方案: ${item.solution}`);
    });
    
    // 6. 提供解决方案
    console.log('\n6️⃣ 解决方案建议...');
    
    const solutions = [
      {
        step: '修复Token验证',
        action: '修复tokenValidationService中的atob兼容性问题',
        priority: '高'
      },
      {
        step: '增强Token存储',
        action: '确保token正确保存到AsyncStorage',
        priority: '高'
      },
      {
        step: '添加Token刷新',
        action: '实现token自动刷新机制',
        priority: '中'
      },
      {
        step: '改进启动逻辑',
        action: '优化应用启动时的登录状态恢复',
        priority: '中'
      },
      {
        step: '添加调试日志',
        action: '在关键步骤添加详细日志',
        priority: '低'
      }
    ];
    
    solutions.forEach((solution, index) => {
      console.log(`  ${index + 1}. ${solution.step} (优先级: ${solution.priority})`);
      console.log(`     ${solution.action}`);
    });
    
    console.log('\n🎯 Token持久化测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testTokenPersistence();
