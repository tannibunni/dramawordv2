const { AppleService } = require('./src/services/appleService');
require('dotenv').config();

console.log('🍎 Apple JWT 测试工具');
console.log('='.repeat(50));

// 显示当前配置
console.log('\n📋 当前Apple配置:');
console.log(`   APPLE_CLIENT_ID: ${process.env.APPLE_CLIENT_ID || '未设置'}`);
console.log(`   APPLE_TEAM_ID: ${process.env.APPLE_TEAM_ID || '未设置'}`);
console.log(`   APPLE_KEY_ID: ${process.env.APPLE_KEY_ID || '未设置'}`);

// 测试函数
async function testAppleJWT(idToken) {
  console.log('\n🔍 测试Apple JWT验证...');
  console.log('-'.repeat(30));
  
  try {
    // 首先解码JWT（不验证）
    console.log('📋 解码JWT token（不验证）:');
    const decoded = AppleService.decodeJWTWithoutVerification(idToken);
    
    console.log(`   audience: ${decoded.audience}`);
    console.log(`   issuer: ${decoded.issuer}`);
    console.log(`   subject: ${decoded.subject}`);
    console.log(`   expiration: ${decoded.expiration.toISOString()}`);
    console.log(`   issuedAt: ${decoded.issuedAt.toISOString()}`);
    
    // 检查是否过期
    const now = new Date();
    if (decoded.expiration < now) {
      console.log('⚠️  Token已过期！');
      return;
    }
    
    // 尝试验证
    console.log('\n🔐 尝试验证JWT token:');
    const result = await AppleService.verifyIdToken(idToken);
    
    console.log('✅ 验证成功！');
    console.log(`   sub: ${result.sub}`);
    console.log(`   email: ${result.email || 'N/A'}`);
    console.log(`   email_verified: ${result.email_verified || 'N/A'}`);
    
  } catch (error) {
    console.log('❌ 验证失败:');
    console.log(`   错误: ${error.message}`);
    
    if (error.details) {
      console.log('\n📋 详细错误信息:');
      console.log(`   期望的audience: ${error.details.expectedAudience}`);
      console.log(`   实际的audience: ${error.details.actualAudience}`);
      console.log(`   尝试的策略: ${error.details.triedStrategies.join(', ')}`);
    }
  }
}

// 主函数
async function main() {
  const idToken = process.argv[2];
  
  if (!idToken) {
    console.log('\n❌ 请提供JWT token作为参数');
    console.log('使用方法: node test-apple-jwt.js <JWT_TOKEN>');
    console.log('\n示例:');
    console.log('node test-apple-jwt.js eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMzQ1Njc4OTAifQ...');
    return;
  }
  
  console.log(`\n🔍 测试JWT token: ${idToken.substring(0, 50)}...`);
  
  await testAppleJWT(idToken);
  
  console.log('\n✅ 测试完成！');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAppleJWT
}; 