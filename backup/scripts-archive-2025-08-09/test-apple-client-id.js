const axios = require('axios');

async function testAppleClientIds() {
  console.log('🍎 测试不同的 Apple Client ID 配置...\n');
  
  const clientIds = [
    'com.tannibunni.dramawordmobile',
    'com.tanny.dramaword',
    'com.tannibunni.dramawordmobile.dev',
    'com.tannibunni.dramawordmobile.test'
  ];
  
  for (const clientId of clientIds) {
    console.log(`🔍 测试 Client ID: ${clientId}`);
    
    try {
      // 这里可以添加实际的测试逻辑
      console.log(`   - 配置: ${clientId}`);
      console.log(`   - 状态: 需要手动验证`);
      
    } catch (error) {
      console.log(`   - 错误: ${error.message}`);
    }
  }
  
  console.log('\n📋 建议检查步骤:');
  console.log('1. 确认 Apple Developer Console 中的 App ID 配置');
  console.log('2. 确认 "Sign in with Apple" 已启用');
  console.log('3. 确认 Xcode 项目 Bundle Identifier 匹配');
  console.log('4. 确认 Provisioning Profile 正确');
  
  console.log('\n🔧 可能的解决方案:');
  console.log('- 方案1: 修复 Apple Developer 配置');
  console.log('- 方案2: 临时使用另一个 App ID');
  console.log('- 方案3: 重新生成 App ID 和证书');
}

testAppleClientIds(); 