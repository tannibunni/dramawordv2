const fs = require('fs');
const path = require('path');

console.log('🔍 微信SDK初始化诊断报告\n');

// 检查 react-native-wechat-lib 版本和配置
console.log('📦 检查 react-native-wechat-lib 详细信息:');
try {
  const packagePath = path.join(__dirname, '../node_modules/react-native-wechat-lib');
  if (fs.existsSync(packagePath)) {
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`✅ 版本: ${packageJson.version}`);
      console.log(`✅ 主文件: ${packageJson.main || 'index.js'}`);
      console.log(`✅ 描述: ${packageJson.description || 'N/A'}`);
      
      // 检查主文件是否存在
      const mainFile = path.join(packagePath, packageJson.main || 'index.js');
      if (fs.existsSync(mainFile)) {
        console.log('✅ 主文件存在');
      } else {
        console.log('❌ 主文件不存在');
      }
    }
  } else {
    console.log('❌ react-native-wechat-lib 未安装');
  }
} catch (error) {
  console.log('❌ 检查失败:', error.message);
}

// 检查 iOS 配置
console.log('\n📱 检查 iOS 配置:');
try {
  const infoPlistPath = path.join(__dirname, '../apps/mobile/ios/app/Info.plist');
  if (fs.existsSync(infoPlistPath)) {
    const infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
    
    // 检查 URL Schemes
    if (infoPlist.includes('wxa225945508659eb8')) {
      console.log('✅ 微信 URL Scheme 已配置');
    } else {
      console.log('❌ 微信 URL Scheme 未配置');
    }
    
    // 检查 Bundle ID
    if (infoPlist.includes('com.tannibunni.dramawordmobile')) {
      console.log('✅ Bundle ID 正确');
    } else {
      console.log('❌ Bundle ID 不正确');
    }
    
    // 检查 LSApplicationQueriesSchemes
    if (infoPlist.includes('weixin') || infoPlist.includes('weixinULAPI')) {
      console.log('✅ LSApplicationQueriesSchemes 已配置');
    } else {
      console.log('❌ LSApplicationQueriesSchemes 未配置');
    }
  } else {
    console.log('❌ Info.plist 文件不存在');
  }
} catch (error) {
  console.log('❌ 检查 iOS 配置失败:', error.message);
}

// 检查 app.json 配置
console.log('\n📋 检查 app.json 配置:');
try {
  const appJsonPath = path.join(__dirname, '../apps/mobile/app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // 检查微信插件配置
    const wechatPlugin = appJson.expo.plugins?.find(p => 
      Array.isArray(p) && p[0] === 'expo-wechat'
    );
    
    if (wechatPlugin) {
      console.log('✅ expo-wechat 插件已配置');
      console.log(`   - AppID: ${wechatPlugin[1].appid}`);
      console.log(`   - Universal Link: ${wechatPlugin[1].universalLink}`);
      
      // 检查 Universal Link 格式
      const universalLink = wechatPlugin[1].universalLink;
      if (universalLink && universalLink.startsWith('https://') && universalLink.endsWith('/')) {
        console.log('✅ Universal Link 格式正确');
      } else {
        console.log('❌ Universal Link 格式可能有问题');
      }
    } else {
      console.log('❌ expo-wechat 插件未配置');
    }
    
    // 检查 Bundle ID
    if (appJson.expo.ios?.bundleIdentifier === 'com.tannibunni.dramawordmobile') {
      console.log('✅ Bundle ID 配置正确');
    } else {
      console.log('❌ Bundle ID 配置不正确');
    }
  } else {
    console.log('❌ app.json 文件不存在');
  }
} catch (error) {
  console.log('❌ 检查 app.json 失败:', error.message);
}

// 检查代码配置
console.log('\n💻 检查代码配置:');
try {
  const wechatSDKPath = path.join(__dirname, '../apps/mobile/src/services/wechatSDK.ts');
  if (fs.existsSync(wechatSDKPath)) {
    const wechatSDK = fs.readFileSync(wechatSDKPath, 'utf8');
    
    // 检查是否强制使用真实SDK
    if (wechatSDK.includes('new RealWechatSDK()')) {
      console.log('✅ 强制使用真实SDK');
    } else {
      console.log('❌ 未强制使用真实SDK');
    }
    
    // 检查 AppID 配置
    if (wechatSDK.includes('wxa225945508659eb8')) {
      console.log('✅ AppID 配置正确');
    } else {
      console.log('❌ AppID 配置不正确');
    }
    
    // 检查 Universal Link 配置
    if (wechatSDK.includes('https://dramaword.com/app/')) {
      console.log('✅ Universal Link 配置正确');
    } else {
      console.log('❌ Universal Link 配置不正确');
    }
  } else {
    console.log('❌ wechatSDK.ts 文件不存在');
  }
} catch (error) {
  console.log('❌ 检查代码配置失败:', error.message);
}

console.log('\n🔍 可能的初始化失败原因:');
console.log('1. Universal Links 配置不正确');
console.log('2. 微信开放平台 AppID 或 AppSecret 错误');
console.log('3. Bundle ID 与微信开放平台不匹配');
console.log('4. 设备上微信应用未安装');
console.log('5. 网络连接问题');
console.log('6. SDK 版本兼容性问题');

console.log('\n🔧 建议解决方案:');
console.log('1. 检查微信开放平台配置:');
console.log('   - 确认 AppID: wxa225945508659eb8');
console.log('   - 确认 Bundle ID: com.tannibunni.dramawordmobile');
console.log('   - 确认 Universal Links: https://dramaword.com/app/');
console.log('2. 确保设备上安装了微信应用');
console.log('3. 检查网络连接');
console.log('4. 尝试重新安装 react-native-wechat-lib');
console.log('5. 检查 Apple Developer 中的 Associated Domains 配置');

console.log('\n📋 微信开放平台检查清单:');
console.log('- [ ] AppID 正确');
console.log('- [ ] AppSecret 正确');
console.log('- [ ] Bundle ID 匹配');
console.log('- [ ] Universal Links 配置正确');
console.log('- [ ] 授权回调域名配置正确');
console.log('- [ ] JS接口安全域名配置正确'); 