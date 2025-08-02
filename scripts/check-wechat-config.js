const axios = require('axios');

async function checkWechatConfig() {
  console.log('💬 微信开放平台配置检查\n');
  
  console.log('📋 当前配置状态:');
  console.log('✅ Bundle ID: com.tannibunni.dramawordmobile');
  console.log('✅ Universal Links: https://dramaword.com/app/');
  console.log('❌ 测试 Bundle ID: 未填写');
  console.log('❌ 备用 Universal Links: 未填写');
  
  console.log('\n🔧 建议配置:');
  console.log('📱 测试 Bundle ID: com.tannibunni.dramawordmobile.dev');
  console.log('🔗 备用 Universal Links: https://dramaword.com/app/wechat/');
  
  console.log('\n📋 其他重要配置检查:');
  console.log('1. 授权回调域名: dramaword.com');
  console.log('2. JS接口安全域名: dramaword.com');
  console.log('3. 网页授权域名: dramaword.com');
  console.log('4. 业务域名: dramaword.com');
  
  console.log('\n⚠️ 注意事项:');
  console.log('- 确保 dramaword.com 域名已正确配置');
  console.log('- 确保 Universal Links 在 Apple Developer 中已配置');
  console.log('- 确保 App Secret 已安全保存');
  
  console.log('\n🎯 下一步操作:');
  console.log('1. 在微信开放平台完善配置');
  console.log('2. 重新构建应用');
  console.log('3. 测试微信登录流程');
}

checkWechatConfig().catch(console.error); 