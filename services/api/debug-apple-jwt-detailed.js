const jwt = require('jsonwebtoken');
require('dotenv').config();

// 配置
const appleConfig = {
  clientId: process.env.APPLE_CLIENT_ID || 'com.tannibunni.dramawordmobile',
  teamId: process.env.APPLE_TEAM_ID || '',
  keyId: process.env.APPLE_KEY_ID || '',
  privateKey: process.env.APPLE_PRIVATE_KEY || '',
  redirectUri: process.env.APPLE_REDIRECT_URI || 'dramaword://apple-login',
};

console.log('🍎 Apple JWT 详细调试工具');
console.log('='.repeat(50));

// 显示当前配置
console.log('\n📋 当前Apple配置:');
console.log(`   APPLE_CLIENT_ID: ${process.env.APPLE_CLIENT_ID || '未设置 (使用默认值)'}`);
console.log(`   APPLE_TEAM_ID: ${process.env.APPLE_TEAM_ID || '未设置'}`);
console.log(`   APPLE_KEY_ID: ${process.env.APPLE_KEY_ID || '未设置'}`);
console.log(`   APPLE_PRIVATE_KEY: ${process.env.APPLE_PRIVATE_KEY ? '已设置' : '未设置'}`);
console.log(`   使用的clientId: ${appleConfig.clientId}`);

// 解码JWT token（不验证签名）
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    
    return { header, payload };
  } catch (error) {
    throw new Error(`JWT解码失败: ${error.message}`);
  }
}

// 分析JWT token
function analyzeJWT(token) {
  console.log('\n🔍 JWT Token分析:');
  console.log('-'.repeat(30));
  
  try {
    const { header, payload } = decodeJWT(token);
    
    console.log('📋 Header:');
    console.log(`   alg: ${header.alg}`);
    console.log(`   kid: ${header.kid}`);
    console.log(`   typ: ${header.typ}`);
    
    console.log('\n📋 Payload:');
    console.log(`   iss: ${payload.iss} (issuer)`);
    console.log(`   aud: ${payload.aud} (audience)`);
    console.log(`   exp: ${payload.exp} (expiration)`);
    console.log(`   iat: ${payload.iat} (issued at)`);
    console.log(`   sub: ${payload.sub} (subject)`);
    console.log(`   c_hash: ${payload.c_hash || 'undefined'}`);
    console.log(`   auth_time: ${payload.auth_time || 'undefined'}`);
    console.log(`   nonce_supported: ${payload.nonce_supported || 'undefined'}`);
    
    // 检查audience
    console.log('\n🎯 Audience分析:');
    console.log(`   期望的audience: ${appleConfig.clientId}`);
    console.log(`   实际的audience: ${payload.aud}`);
    
    if (Array.isArray(payload.aud)) {
      console.log(`   audience是数组，包含: ${payload.aud.join(', ')}`);
      const hasExpectedAudience = payload.aud.includes(appleConfig.clientId);
      console.log(`   是否包含期望的audience: ${hasExpectedAudience ? '✅ 是' : '❌ 否'}`);
    } else {
      const isMatch = payload.aud === appleConfig.clientId;
      console.log(`   audience匹配: ${isMatch ? '✅ 是' : '❌ 否'}`);
    }
    
    // 检查issuer
    console.log('\n🏢 Issuer分析:');
    const expectedIssuer = `https://appleid.apple.com`;
    console.log(`   期望的issuer: ${expectedIssuer}`);
    console.log(`   实际的issuer: ${payload.iss}`);
    console.log(`   issuer匹配: ${payload.iss === expectedIssuer ? '✅ 是' : '❌ 否'}`);
    
    // 检查过期时间
    console.log('\n⏰ 时间分析:');
    const now = Math.floor(Date.now() / 1000);
    const expDate = new Date(payload.exp * 1000);
    const iatDate = new Date(payload.iat * 1000);
    
    console.log(`   当前时间: ${new Date().toISOString()}`);
    console.log(`   签发时间: ${iatDate.toISOString()}`);
    console.log(`   过期时间: ${expDate.toISOString()}`);
    console.log(`   token是否过期: ${payload.exp < now ? '❌ 是' : '✅ 否'}`);
    
    return { header, payload };
    
  } catch (error) {
    console.error(`❌ JWT分析失败: ${error.message}`);
    return null;
  }
}

// 提供解决方案建议
function provideSolutions(payload) {
  console.log('\n💡 解决方案建议:');
  console.log('='.repeat(30));
  
  if (!payload) {
    console.log('❌ 无法分析JWT，请检查token格式');
    return;
  }
  
  // Audience不匹配的解决方案
  if (payload.aud !== appleConfig.clientId) {
    console.log('🔧 Audience不匹配解决方案:');
    
    if (Array.isArray(payload.aud)) {
      console.log('   1. 检查Apple Developer Console中的App ID配置');
      console.log('   2. 确认Bundle ID是否包含在audience数组中');
      console.log('   3. 如果audience数组包含期望的值，修改验证逻辑');
    } else {
      console.log('   1. 检查环境变量APPLE_CLIENT_ID设置');
      console.log('   2. 检查Apple Developer Console中的App ID');
      console.log('   3. 检查移动端bundle identifier');
      console.log('   4. 确认App ID的"Sign in with Apple"功能已启用');
    }
    
    console.log('\n📱 移动端Bundle ID检查:');
    console.log('   检查apps/mobile/app.json中的bundleIdentifier');
    console.log('   确保与Apple Developer Console中的App ID一致');
  }
  
  // Issuer不匹配的解决方案
  if (payload.iss !== 'https://appleid.apple.com') {
    console.log('🔧 Issuer不匹配解决方案:');
    console.log('   1. 检查JWT token来源');
    console.log('   2. 确认token来自Apple官方');
  }
  
  // Token过期的解决方案
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    console.log('🔧 Token过期解决方案:');
    console.log('   1. 重新获取新的JWT token');
    console.log('   2. 检查客户端时间设置');
  }
  
  console.log('\n🔍 调试步骤:');
  console.log('   1. 在Apple Developer Console中检查App ID配置');
  console.log('   2. 确认"Sign in with Apple"功能已启用');
  console.log('   3. 检查移动端bundle identifier');
  console.log('   4. 验证环境变量设置');
  console.log('   5. 测试新的Apple登录流程');
}

// 主函数
function main() {
  const token = process.argv[2];
  
  if (!token) {
    console.log('\n❌ 请提供JWT token作为参数');
    console.log('使用方法: node debug-apple-jwt-detailed.js <JWT_TOKEN>');
    console.log('\n示例:');
    console.log('node debug-apple-jwt-detailed.js eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMzQ1Njc4OTAifQ...');
    return;
  }
  
  console.log(`\n🔍 分析JWT token: ${token.substring(0, 50)}...`);
  
  const result = analyzeJWT(token);
  provideSolutions(result?.payload);
  
  console.log('\n✅ 分析完成！');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  decodeJWT,
  analyzeJWT,
  provideSolutions
}; 