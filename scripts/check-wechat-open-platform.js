const fs = require('fs');
const path = require('path');

console.log('🔍 微信开放平台配置检查\n');

// 检查前端配置
console.log('📱 前端配置检查:');
try {
  const appJsonPath = path.join(__dirname, '../apps/mobile/app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    const wechatPlugin = appJson.expo.plugins?.find(p => 
      Array.isArray(p) && p[0] === 'expo-wechat'
    );
    
    if (wechatPlugin) {
      console.log('✅ expo-wechat 插件已配置');
      console.log(`   - AppID: ${wechatPlugin[1].appid}`);
      console.log(`   - Universal Link: ${wechatPlugin[1].universalLink}`);
    } else {
      console.log('❌ expo-wechat 插件未配置');
    }
    
    if (appJson.expo.ios?.bundleIdentifier === 'com.tannibunni.dramawordmobile') {
      console.log('✅ Bundle ID 配置正确');
    } else {
      console.log('❌ Bundle ID 配置不正确');
    }
  }
} catch (error) {
  console.log('❌ 检查前端配置失败:', error.message);
}

// 检查后端配置
console.log('\n🔧 后端配置检查:');
try {
  const wechatConfigPath = path.join(__dirname, '../services/api/src/config/wechat.ts');
  if (fs.existsSync(wechatConfigPath)) {
    const wechatConfig = fs.readFileSync(wechatConfigPath, 'utf8');
    
    if (wechatConfig.includes('wxa225945508659eb8')) {
      console.log('✅ AppID 配置正确');
    } else {
      console.log('❌ AppID 配置不正确');
    }
    
    if (wechatConfig.includes('https://dramaword.com/app/')) {
      console.log('✅ Universal Links 配置正确');
    } else {
      console.log('❌ Universal Links 配置不正确');
    }
    
    if (wechatConfig.includes('com.tannibunni.dramawordmobile')) {
      console.log('✅ Bundle ID 配置正确');
    } else {
      console.log('❌ Bundle ID 配置不正确');
    }
  }
} catch (error) {
  console.log('❌ 检查后端配置失败:', error.message);
}

// 检查环境变量模板
console.log('\n📋 环境变量配置检查:');
try {
  const envTemplatePath = path.join(__dirname, '../services/api/env.template');
  if (fs.existsSync(envTemplatePath)) {
    const envTemplate = fs.readFileSync(envTemplatePath, 'utf8');
    
    if (envTemplate.includes('WECHAT_APP_ID=your-wechat-app-id-here')) {
      console.log('⚠️  WECHAT_APP_ID 需要填入实际值');
    } else if (envTemplate.includes('wxa225945508659eb8')) {
      console.log('✅ WECHAT_APP_ID 已配置');
    }
    
    if (envTemplate.includes('WECHAT_APP_SECRET=your-wechat-app-secret-here')) {
      console.log('⚠️  WECHAT_APP_SECRET 需要填入实际值');
    } else if (envTemplate.includes('WECHAT_APP_SECRET=')) {
      console.log('✅ WECHAT_APP_SECRET 已配置');
    }
    
    if (envTemplate.includes('WECHAT_UNIVERSAL_LINKS=https://dramaword.com/app/')) {
      console.log('✅ WECHAT_UNIVERSAL_LINKS 配置正确');
    } else {
      console.log('❌ WECHAT_UNIVERSAL_LINKS 配置不正确');
    }
  }
} catch (error) {
  console.log('❌ 检查环境变量失败:', error.message);
}

console.log('\n📋 微信开放平台配置清单:');
console.log('- [ ] AppID: wxa225945508659eb8');
console.log('- [ ] AppSecret: (需要填入实际值)');
console.log('- [ ] Bundle ID: com.tannibunni.dramawordmobile');
console.log('- [ ] Universal Links: https://dramaword.com/app/');
console.log('- [ ] 授权回调域名: dramaword.com');
console.log('- [ ] JS接口安全域名: dramaword.com');
console.log('- [ ] 网页授权域名: dramaword.com');
console.log('- [ ] 业务域名: dramaword.com');

console.log('\n🔧 需要完成的配置:');
console.log('1. 在微信开放平台确认以下配置:');
console.log('   - AppID: wxa225945508659eb8');
console.log('   - Bundle ID: com.tannibunni.dramawordmobile');
console.log('   - Universal Links: https://dramaword.com/app/');
console.log('   - 授权回调域名: dramaword.com');

console.log('\n2. 更新环境变量:');
console.log('   - 将实际的 AppSecret 填入环境变量');
console.log('   - 在 Render.com 中更新 WECHAT_APP_SECRET');

console.log('\n3. 检查域名配置:');
console.log('   - 确认 https://dramaword.com/app/.well-known/apple-app-site-association 文件存在');
console.log('   - 确认 Apple Developer 中的 Associated Domains 配置');

console.log('\n🎯 下一步操作:');
console.log('1. 更新环境变量中的 AppSecret');
console.log('2. 重新部署后端服务');
console.log('3. 重新构建前端应用');
console.log('4. 测试微信登录功能'); 