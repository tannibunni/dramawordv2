const fs = require('fs');
const path = require('path');

console.log('🔍 微信SDK详细调试报告\n');

// 检查 react-native-wechat-lib 安装状态
console.log('📦 检查 react-native-wechat-lib 安装状态:');
try {
  // 检查多个可能的安装位置
  const possiblePaths = [
    path.join(__dirname, '../node_modules/react-native-wechat-lib'),
    path.join(__dirname, '../apps/mobile/node_modules/react-native-wechat-lib'),
    path.join(__dirname, '../apps/mobile/node_modules/@expo/react-native-wechat-lib')
  ];
  
  let packagePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      packagePath = p;
      break;
    }
  }
  
  if (packagePath) {
    console.log('✅ react-native-wechat-lib 已安装');
    console.log(`   路径: ${packagePath}`);
    
    // 检查 package.json
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`   版本: ${packageJson.version}`);
      console.log(`   主文件: ${packageJson.main || 'index.js'}`);
      
      // 检查主文件是否存在
      const mainFile = path.join(packagePath, packageJson.main || 'index.js');
      if (fs.existsSync(mainFile)) {
        console.log('✅ 主文件存在');
        
        // 读取主文件内容
        const mainContent = fs.readFileSync(mainFile, 'utf8');
        console.log('   导出内容:', mainContent.includes('Wechat') ? '包含Wechat对象' : '不包含Wechat对象');
      } else {
        console.log('❌ 主文件不存在');
      }
    }
  } else {
    console.log('❌ react-native-wechat-lib 未安装');
    console.log('   检查的路径:');
    possiblePaths.forEach(p => console.log(`   - ${p}`));
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
    
    // 检查 Associated Domains
    if (infoPlist.includes('com.apple.developer.associated-domains')) {
      console.log('✅ Associated Domains 已配置');
    } else {
      console.log('❌ Associated Domains 未配置');
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

// 检查 WechatService 配置
console.log('\n🔧 检查 WechatService 配置:');
try {
  const wechatServicePath = path.join(__dirname, '../apps/mobile/src/services/wechatService.ts');
  if (fs.existsSync(wechatServicePath)) {
    const wechatService = fs.readFileSync(wechatServicePath, 'utf8');
    
    // 检查 AppID 配置
    if (wechatService.includes('wxa225945508659eb8')) {
      console.log('✅ AppID 配置正确');
    } else {
      console.log('❌ AppID 配置不正确');
    }
    
    // 检查 Universal Link 配置
    if (wechatService.includes('https://dramaword.com/app/')) {
      console.log('✅ Universal Link 配置正确');
    } else {
      console.log('❌ Universal Link 配置不正确');
    }
    
    // 检查是否禁用了Mock模式
    if (wechatService.includes('Mock模式已禁用')) {
      console.log('✅ Mock模式已禁用');
    } else {
      console.log('❌ Mock模式可能未禁用');
    }
  } else {
    console.log('❌ wechatService.ts 文件不存在');
  }
} catch (error) {
  console.log('❌ 检查 WechatService 失败:', error.message);
}

// 检查 Podfile 配置
console.log('\n🍎 检查 Podfile 配置:');
try {
  const podfilePath = path.join(__dirname, '../apps/mobile/ios/Podfile');
  if (fs.existsSync(podfilePath)) {
    const podfile = fs.readFileSync(podfilePath, 'utf8');
    
    if (podfile.includes('react-native-wechat-lib')) {
      console.log('✅ react-native-wechat-lib 已在 Podfile 中配置');
    } else {
      console.log('❌ react-native-wechat-lib 未在 Podfile 中配置');
    }
  } else {
    console.log('❌ Podfile 文件不存在');
  }
} catch (error) {
  console.log('❌ 检查 Podfile 失败:', error.message);
}

console.log('\n🔍 可能的初始化失败原因:');
console.log('1. react-native-wechat-lib 未正确安装或链接');
console.log('2. iOS 原生配置问题 (Info.plist, Associated Domains)');
console.log('3. Universal Links 配置不正确');
console.log('4. 微信开放平台配置问题');
console.log('5. Bundle ID 不匹配');
console.log('6. 设备上微信应用未安装或版本过低');
console.log('7. 网络连接问题');
console.log('8. SDK 版本兼容性问题');

console.log('\n🔧 建议解决方案:');
console.log('1. 重新安装 react-native-wechat-lib:');
console.log('   cd apps/mobile && npm uninstall react-native-wechat-lib && npm install react-native-wechat-lib');
console.log('2. 重新链接 iOS 依赖:');
console.log('   cd apps/mobile/ios && pod install');
console.log('3. 检查微信开放平台配置:');
console.log('   - AppID: wxa225945508659eb8');
console.log('   - Bundle ID: com.tannibunni.dramawordmobile');
console.log('   - Universal Links: https://dramaword.com/app/');
console.log('4. 确保设备上安装了最新版本的微信');
console.log('5. 检查网络连接');
console.log('6. 重新构建应用');

console.log('\n📋 微信开放平台检查清单:');
console.log('- [ ] AppID 正确');
console.log('- [ ] AppSecret 正确');
console.log('- [ ] Bundle ID 匹配');
console.log('- [ ] Universal Links 配置正确');
console.log('- [ ] 授权回调域名配置正确');
console.log('- [ ] JS接口安全域名配置正确');
console.log('- [ ] "使用微信账号登录App" 功能已开通'); 