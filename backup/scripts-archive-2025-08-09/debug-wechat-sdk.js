const fs = require('fs');
const path = require('path');

console.log('🔍 微信SDK诊断报告\n');

// 检查 react-native-wechat-lib 是否安装
console.log('📦 检查 react-native-wechat-lib 安装状态:');
try {
  // 先检查根目录的 node_modules
  let packagePath = path.join(__dirname, '../node_modules/react-native-wechat-lib');
  if (!fs.existsSync(packagePath)) {
    // 如果根目录没有，检查 apps/mobile/node_modules
    packagePath = path.join(__dirname, '../apps/mobile/node_modules/react-native-wechat-lib');
  }
  if (fs.existsSync(packagePath)) {
    console.log('✅ react-native-wechat-lib 已安装');
    
    // 检查 package.json
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`   - 版本: ${packageJson.version}`);
      console.log(`   - 主文件: ${packageJson.main || 'index.js'}`);
    }
  } else {
    console.log('❌ react-native-wechat-lib 未安装');
  }
} catch (error) {
  console.log('❌ 检查安装状态失败:', error.message);
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
  } else {
    console.log('❌ wechatSDK.ts 文件不存在');
  }
} catch (error) {
  console.log('❌ 检查代码配置失败:', error.message);
}

console.log('\n📋 可能的问题原因:');
console.log('1. react-native-wechat-lib 原生模块未正确链接');
console.log('2. Universal Links 配置不正确');
console.log('3. 微信开放平台配置不匹配');
console.log('4. 设备上微信应用未安装');
console.log('5. 网络连接问题');

console.log('\n🔧 建议解决方案:');
console.log('1. 重新安装 react-native-wechat-lib: npm install react-native-wechat-lib');
console.log('2. 重新链接原生模块: npx pod-install');
console.log('3. 检查微信开放平台配置');
console.log('4. 确保设备上安装了微信应用');
console.log('5. 检查网络连接'); 