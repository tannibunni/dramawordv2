const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './services/api/.env' });

// 解码 JWT token（不验证签名）
function decodeJWTWithoutVerification(token) {
  try {
    // 分割 JWT token
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // 解码 payload（第二部分）
    const payload = parts[1];
    const decodedPayload = Buffer.from(payload, 'base64').toString('utf8');
    const payloadObj = JSON.parse(decodedPayload);
    
    return payloadObj;
  } catch (error) {
    console.error('❌ JWT 解码失败:', error.message);
    return null;
  }
}

// 分析 JWT token
function analyzeJWTToken(token) {
  console.log('\n🔍 JWT Token 分析:');
  console.log('='.repeat(50));
  
  if (!token) {
    console.log('❌ 没有提供 JWT token');
    return;
  }
  
  console.log(`📏 Token 长度: ${token.length}`);
  console.log(`🔑 Token 前50字符: ${token.substring(0, 50)}...`);
  
  // 解码 token
  const payload = decodeJWTWithoutVerification(token);
  if (!payload) {
    return;
  }
  
  console.log('\n📋 JWT Payload 内容:');
  console.log('='.repeat(30));
  
  // 显示所有字段
  Object.keys(payload).forEach(key => {
    const value = payload[key];
    if (typeof value === 'object') {
      console.log(`${key}:`, JSON.stringify(value, null, 2));
    } else {
      console.log(`${key}: ${value}`);
    }
  });
  
  // 特别关注 audience 字段
  console.log('\n🎯 Audience 分析:');
  console.log('='.repeat(30));
  
  if (payload.aud) {
    console.log(`✅ 找到 audience 字段: ${payload.aud}`);
    console.log(`   类型: ${typeof payload.aud}`);
    
    if (Array.isArray(payload.aud)) {
      console.log(`   数组内容: [${payload.aud.join(', ')}]`);
    }
  } else {
    console.log('❌ 没有找到 audience 字段');
  }
  
  // 检查其他重要字段
  console.log('\n📊 其他重要字段:');
  console.log('='.repeat(30));
  
  if (payload.iss) {
    console.log(`iss (issuer): ${payload.iss}`);
  }
  
  if (payload.sub) {
    console.log(`sub (subject): ${payload.sub}`);
  }
  
  if (payload.iat) {
    const iatDate = new Date(payload.iat * 1000);
    console.log(`iat (issued at): ${payload.iat} (${iatDate.toISOString()})`);
  }
  
  if (payload.exp) {
    const expDate = new Date(payload.exp * 1000);
    console.log(`exp (expires at): ${payload.exp} (${expDate.toISOString()})`);
  }
}

// 检查配置
function checkConfiguration() {
  console.log('\n⚙️ 当前配置:');
  console.log('='.repeat(30));
  
  const appleConfig = {
    clientId: process.env.APPLE_CLIENT_ID || 'com.tannibunni.dramawordmobile',
    teamId: process.env.APPLE_TEAM_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
    privateKey: process.env.APPLE_PRIVATE_KEY ? '已设置' : '未设置',
  };
  
  console.log(`APPLE_CLIENT_ID: ${appleConfig.clientId}`);
  console.log(`APPLE_TEAM_ID: ${appleConfig.teamId}`);
  console.log(`APPLE_KEY_ID: ${appleConfig.keyId}`);
  console.log(`APPLE_PRIVATE_KEY: ${appleConfig.privateKey}`);
}

// 生成解决方案
function generateSolutions(actualAudience, expectedAudience) {
  console.log('\n🔧 解决方案:');
  console.log('='.repeat(30));
  
  if (actualAudience === expectedAudience) {
    console.log('✅ Audience 匹配，问题可能在其他地方');
    console.log('建议检查:');
    console.log('1. JWT token 是否过期');
    console.log('2. Apple 签名验证是否失败');
    console.log('3. 网络连接问题');
  } else {
    console.log('❌ Audience 不匹配');
    console.log(`   期望: ${expectedAudience}`);
    console.log(`   实际: ${actualAudience}`);
    
    console.log('\n可能的解决方案:');
    console.log('1. 更新 APPLE_CLIENT_ID 环境变量为实际值');
    console.log('2. 检查 Apple Developer Console 中的 App ID 配置');
    console.log('3. 确认应用端发送的 token 来自正确的 App ID');
    
    if (Array.isArray(actualAudience)) {
      console.log('\n注意: Audience 是数组，可能需要检查数组中的值');
      console.log('可能的配置:');
      actualAudience.forEach((aud, index) => {
        console.log(`   ${index + 1}. ${aud}`);
      });
    }
  }
}

// 主函数
function main() {
  console.log('🚀 Apple JWT Audience 调试工具');
  console.log('='.repeat(50));
  
  // 检查配置
  checkConfiguration();
  
  // 从命令行参数获取 token
  const token = process.argv[2];
  
  if (!token) {
    console.log('\n❌ 使用方法: node debug-apple-jwt-audience.js <JWT_TOKEN>');
    console.log('\n💡 提示: 从 Apple 登录响应中获取 idToken 参数');
    console.log('   例如: node debug-apple-jwt-audience.js eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...');
    return;
  }
  
  // 分析 token
  analyzeJWTToken(token);
  
  // 解码并获取实际 audience
  const payload = decodeJWTWithoutVerification(token);
  if (payload && payload.aud) {
    const actualAudience = payload.aud;
    const expectedAudience = process.env.APPLE_CLIENT_ID || 'com.tannibunni.dramawordmobile';
    
    generateSolutions(actualAudience, expectedAudience);
  }
  
  console.log('\n✅ 分析完成！');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  decodeJWTWithoutVerification,
  analyzeJWTToken,
  checkConfiguration,
  generateSolutions
}; 