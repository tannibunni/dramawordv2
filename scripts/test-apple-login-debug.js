#!/usr/bin/env node

/**
 * Apple 登录调试脚本
 * 用于测试和调试 Apple 登录问题
 */

const https = require('https');

console.log('🍎 Apple 登录调试工具\n');

// 测试后端 API 连接
async function testBackendConnection() {
  console.log('🔍 测试后端 API 连接...');
  
  const options = {
    hostname: 'dramawordv2.onrender.com',
    port: 443,
    path: '/health',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`  ✅ 后端服务状态: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log(`  ✅ 后端服务正常运行`);
        } else {
          console.log(`  ⚠️  后端服务响应异常: ${data}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`  ❌ 后端服务连接失败: ${error.message}`);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.log(`  ⚠️  后端服务连接超时`);
      req.destroy();
      reject(new Error('Connection timeout'));
    });

    req.end();
  });
}

// 测试 Apple 登录端点
async function testAppleLoginEndpoint() {
  console.log('\n🔍 测试 Apple 登录端点...');
  
  const testData = {
    idToken: 'test_token_for_debugging'
  };

  const postData = JSON.stringify(testData);

  const options = {
    hostname: 'dramawordv2.onrender.com',
    port: 443,
    path: '/api/apple/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`  📊 响应状态码: ${res.statusCode}`);
        console.log(`  📄 响应内容: ${data}`);
        
        if (res.statusCode === 400) {
          console.log(`  ✅ 端点正常响应（预期的错误：缺少有效的 idToken）`);
        } else if (res.statusCode === 500) {
          console.log(`  ⚠️  服务器内部错误，可能是配置问题`);
        } else {
          console.log(`  ℹ️  其他响应状态`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`  ❌ 请求失败: ${error.message}`);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.log(`  ⚠️  请求超时`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// 显示调试信息
function showDebugInfo() {
  console.log('\n📋 调试信息:');
  console.log('1. 错误信息: "jwt audience invalid. expected: com.tannibunni.dramawordmobile"');
  console.log('2. 这表明 Apple 返回的 JWT token 中的 audience 字段与后端期望的不匹配');
  console.log('3. 可能的原因:');
  console.log('   - Render 环境变量 APPLE_CLIENT_ID 设置不正确');
  console.log('   - Apple Developer Console 中的 App ID 配置问题');
  console.log('   - 后端服务需要重新部署');
  
  console.log('\n🔧 解决步骤:');
  console.log('1. 登录 Render 控制台 (https://dashboard.render.com)');
  console.log('2. 找到 dramaword-api 服务');
  console.log('3. 进入 Environment 标签页');
  console.log('4. 检查 APPLE_CLIENT_ID 环境变量');
  console.log('5. 确保值为: com.tannibunni.dramawordmobile');
  console.log('6. 如果值不正确，更新并重新部署');
  
  console.log('\n🍎 Apple Developer Console 检查:');
  console.log('1. 登录 https://developer.apple.com/account/');
  console.log('2. 进入 Certificates, Identifiers & Profiles');
  console.log('3. 选择 Identifiers');
  console.log('4. 找到 com.tannibunni.dramawordmobile');
  console.log('5. 确保 Sign In with Apple 功能已启用');
  
  console.log('\n📱 应用端检查:');
  console.log('1. 确认 app.json 中的 bundleIdentifier 正确');
  console.log('2. 确认 Apple 登录权限已配置');
  console.log('3. 重新构建应用');
}

// 主函数
async function main() {
  try {
    await testBackendConnection();
    await testAppleLoginEndpoint();
    showDebugInfo();
    
    console.log('\n🎯 下一步操作:');
    console.log('1. 检查并修复 Render 环境变量');
    console.log('2. 重新部署后端服务');
    console.log('3. 重新测试 Apple 登录');
    
  } catch (error) {
    console.error('\n❌ 调试过程中出现错误:', error.message);
    showDebugInfo();
  }
}

// 运行调试
main(); 