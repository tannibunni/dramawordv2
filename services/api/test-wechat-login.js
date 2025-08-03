const axios = require('axios');
require('dotenv').config();

console.log('💬 微信登录测试工具');
console.log('='.repeat(50));

// 显示当前配置
console.log('\n📋 当前微信配置:');
console.log(`   WECHAT_APP_ID: ${process.env.WECHAT_APP_ID || '未设置'}`);
console.log(`   WECHAT_APP_SECRET: ${process.env.WECHAT_APP_SECRET ? '已设置' : '未设置'}`);
console.log(`   API_BASE_URL: ${process.env.API_BASE_URL || 'http://localhost:3000'}`);

// 测试函数
async function testWechatLogin(code) {
  console.log('\n🔍 测试微信登录...');
  console.log('-'.repeat(30));
  
  try {
    const loginData = {
      code: code,
      state: 'dramaword_wechat_login'
    };
    
    console.log('📝 登录数据:', {
      code: code ? code.substring(0, 10) + '...' : 'null',
      state: loginData.state
    });
    
    const response = await axios.post(`${process.env.API_BASE_URL || 'http://localhost:3000'}/wechat/login`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ 微信登录成功！');
    console.log('📋 响应数据:');
    console.log(`   成功: ${response.data.success}`);
    console.log(`   消息: ${response.data.message}`);
    
    if (response.data.data && response.data.data.user) {
      const user = response.data.data.user;
      console.log('👤 用户信息:');
      console.log(`   ID: ${user.id}`);
      console.log(`   用户名: ${user.username}`);
      console.log(`   昵称: ${user.nickname}`);
      console.log(`   头像: ${user.avatar ? '已设置' : '未设置'}`);
      console.log(`   登录类型: ${user.loginType}`);
    }
    
    if (response.data.data && response.data.data.token) {
      console.log('🔐 Token信息:');
      console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
    }
    
    return response.data;
    
  } catch (error) {
    console.log('❌ 微信登录失败:');
    
    if (error.response) {
      console.log(`   状态码: ${error.response.status}`);
      console.log(`   错误信息: ${error.response.data.message || '未知错误'}`);
      console.log(`   响应数据:`, error.response.data);
    } else if (error.request) {
      console.log(`   网络错误: ${error.message}`);
    } else {
      console.log(`   其他错误: ${error.message}`);
    }
    
    throw error;
  }
}

async function testWechatAuthUrl() {
  console.log('\n🔍 测试获取授权URL...');
  console.log('-'.repeat(30));
  
  try {
    const response = await axios.get(`${process.env.API_BASE_URL || 'http://localhost:3000'}/wechat/auth-url`, {
      params: {
        redirectUri: 'https://dramaword.com/app/wechat-callback',
        state: 'dramaword_wechat_login'
      },
      timeout: 10000
    });
    
    console.log('✅ 获取授权URL成功！');
    console.log('📝 授权URL:', response.data.data.authUrl);
    console.log('📝 State:', response.data.data.state);
    
    return response.data;
    
  } catch (error) {
    console.log('❌ 获取授权URL失败:');
    console.log(`   错误: ${error.message}`);
    throw error;
  }
}

async function testWechatTokenRefresh(refreshToken) {
  console.log('\n🔍 测试Token刷新...');
  console.log('-'.repeat(30));
  
  try {
    const response = await axios.post(`${process.env.API_BASE_URL || 'http://localhost:3000'}/wechat/refresh`, {
      refreshToken: refreshToken
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Token刷新成功！');
    console.log('📋 刷新结果:');
    console.log(`   成功: ${response.data.success}`);
    console.log(`   消息: ${response.data.message}`);
    
    if (response.data.data) {
      console.log(`   新Token: ${response.data.data.token.substring(0, 20)}...`);
      console.log(`   过期时间: ${response.data.data.expiresIn}秒`);
    }
    
    return response.data;
    
  } catch (error) {
    console.log('❌ Token刷新失败:');
    console.log(`   错误: ${error.message}`);
    throw error;
  }
}

async function testWechatTokenCheck(accessToken, openid) {
  console.log('\n🔍 测试Token有效性检查...');
  console.log('-'.repeat(30));
  
  try {
    const response = await axios.post(`${process.env.API_BASE_URL || 'http://localhost:3000'}/wechat/check-token`, {
      accessToken: accessToken,
      openid: openid
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Token检查成功！');
    console.log('📋 检查结果:');
    console.log(`   有效: ${response.data.valid}`);
    console.log(`   消息: ${response.data.message}`);
    
    return response.data;
    
  } catch (error) {
    console.log('❌ Token检查失败:');
    console.log(`   错误: ${error.message}`);
    throw error;
  }
}

// 主函数
async function main() {
  const command = process.argv[2];
  const code = process.argv[3];
  const refreshToken = process.argv[4];
  const accessToken = process.argv[5];
  const openid = process.argv[6];
  
  console.log('\n🚀 微信登录测试工具');
  console.log(`📝 命令: ${command || 'help'}`);
  
  try {
    switch (command) {
      case 'login':
        if (!code) {
          console.log('\n❌ 请提供授权码');
          console.log('使用方法: node test-wechat-login.js login <AUTH_CODE>');
          return;
        }
        await testWechatLogin(code);
        break;
        
      case 'auth-url':
        await testWechatAuthUrl();
        break;
        
      case 'refresh':
        if (!refreshToken) {
          console.log('\n❌ 请提供refresh token');
          console.log('使用方法: node test-wechat-login.js refresh <REFRESH_TOKEN>');
          return;
        }
        await testWechatTokenRefresh(refreshToken);
        break;
        
      case 'check':
        if (!accessToken || !openid) {
          console.log('\n❌ 请提供access token和openid');
          console.log('使用方法: node test-wechat-login.js check <ACCESS_TOKEN> <OPENID>');
          return;
        }
        await testWechatTokenCheck(accessToken, openid);
        break;
        
      case 'mock':
        // 使用模拟授权码测试
        const mockCode = `mock_wechat_code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`📝 使用模拟授权码: ${mockCode}`);
        await testWechatLogin(mockCode);
        break;
        
      default:
        console.log('\n📋 可用命令:');
        console.log('   login <AUTH_CODE>     - 测试微信登录');
        console.log('   auth-url              - 测试获取授权URL');
        console.log('   refresh <REFRESH_TOKEN> - 测试Token刷新');
        console.log('   check <ACCESS_TOKEN> <OPENID> - 测试Token检查');
        console.log('   mock                  - 使用模拟授权码测试');
        console.log('\n📝 示例:');
        console.log('   node test-wechat-login.js login 1234567890');
        console.log('   node test-wechat-login.js auth-url');
        console.log('   node test-wechat-login.js mock');
    }
    
  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
  
  console.log('\n✅ 测试完成！');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testWechatLogin,
  testWechatAuthUrl,
  testWechatTokenRefresh,
  testWechatTokenCheck
}; 