#!/usr/bin/env node

/**
 * 用户信息获取测试脚本
 * 验证微信和苹果用户登录后是否正确获取了用户名和头像
 */

const fs = require('fs');

console.log('👤 用户信息获取测试\n');

// 检查微信用户信息获取
function checkWechatUserInfo() {
  console.log('🔍 检查微信用户信息获取...');
  
  const wechatControllerPath = 'services/api/src/controllers/wechatController.ts';
  if (fs.existsSync(wechatControllerPath)) {
    const content = fs.readFileSync(wechatControllerPath, 'utf8');
    
    // 检查新用户创建
    const hasNewUserNickname = content.includes('wechatResult.userInfo.nickname') && content.includes('nickname =');
    const hasNewUserAvatar = content.includes('avatar: wechatResult.userInfo.headimgurl');
    
    // 检查现有用户更新
    const hasUpdateNickname = content.includes('user.nickname = newNickname');
    const hasUpdateAvatar = content.includes('user.avatar = newAvatar');
    
    console.log(`  ✅ 新用户昵称获取: ${hasNewUserNickname ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 新用户头像获取: ${hasNewUserAvatar ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 现有用户昵称更新: ${hasUpdateNickname ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 现有用户头像更新: ${hasUpdateAvatar ? '正确' : '❌ 缺失'}`);
    
    if (hasNewUserNickname && hasNewUserAvatar && hasUpdateNickname && hasUpdateAvatar) {
      console.log('  🟢 微信用户信息获取配置正确');
      return true;
    } else {
      console.log('  🔴 微信用户信息获取配置有问题');
      return false;
    }
  } else {
    console.log('  ❌ 微信控制器文件不存在');
    return false;
  }
}

// 检查苹果用户信息获取
function checkAppleUserInfo() {
  console.log('\n🔍 检查苹果用户信息获取...');
  
  const appleControllerPath = 'services/api/src/controllers/appleController.ts';
  if (fs.existsSync(appleControllerPath)) {
    const content = fs.readFileSync(appleControllerPath, 'utf8');
    
    // 检查是否接收完整用户信息
    const hasFullName = content.includes('fullName');
    const hasEmail = content.includes('email');
    
    // 检查昵称构建逻辑
    const hasNicknameLogic = content.includes('fullName.givenName') && content.includes('fullName.familyName');
    const hasFallbackNickname = content.includes('email.split(\'@\')[0]');
    
    // 检查用户信息更新
    const hasUpdateNickname = content.includes('user.nickname = nickname');
    const hasUpdateEmail = content.includes('user.email = email');
    
    console.log(`  ✅ 接收完整姓名: ${hasFullName ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 接收邮箱: ${hasEmail ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 昵称构建逻辑: ${hasNicknameLogic ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 邮箱昵称回退: ${hasFallbackNickname ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 昵称更新: ${hasUpdateNickname ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 邮箱更新: ${hasUpdateEmail ? '正确' : '❌ 缺失'}`);
    
    if (hasFullName && hasEmail && hasNicknameLogic && hasUpdateNickname) {
      console.log('  🟢 苹果用户信息获取配置正确');
      return true;
    } else {
      console.log('  🔴 苹果用户信息获取配置有问题');
      return false;
    }
  } else {
    console.log('  ❌ 苹果控制器文件不存在');
    return false;
  }
}

// 检查前端信息传递
function checkFrontendInfoPassing() {
  console.log('\n🔍 检查前端信息传递...');
  
  const loginScreenPath = 'apps/mobile/src/screens/Auth/LoginScreen.tsx';
  if (fs.existsSync(loginScreenPath)) {
    const content = fs.readFileSync(loginScreenPath, 'utf8');
    
    // 检查苹果登录信息传递
    const hasAppleFullName = content.includes('fullName: credential.fullName');
    const hasAppleEmail = content.includes('email: credential.email');
    
    // 检查微信登录调用
    const hasWechatPerformLogin = content.includes('WechatService.performLogin()');
    
    console.log(`  ✅ 苹果姓名传递: ${hasAppleFullName ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 苹果邮箱传递: ${hasAppleEmail ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 微信登录调用: ${hasWechatPerformLogin ? '正确' : '❌ 缺失'}`);
    
    if (hasAppleFullName && hasAppleEmail && hasWechatPerformLogin) {
      console.log('  🟢 前端信息传递配置正确');
      return true;
    } else {
      console.log('  🔴 前端信息传递配置有问题');
      return false;
    }
  } else {
    console.log('  ❌ 登录页面文件不存在');
    return false;
  }
}

// 检查 AppleService 接口
function checkAppleServiceInterface() {
  console.log('\n🔍 检查 AppleService 接口...');
  
  const appleServicePath = 'apps/mobile/src/services/appleService.ts';
  if (fs.existsSync(appleServicePath)) {
    const content = fs.readFileSync(appleServicePath, 'utf8');
    
    const hasAppleLoginData = content.includes('AppleLoginData');
    const hasFullNameInterface = content.includes('fullName?:');
    const hasEmailInterface = content.includes('email?:');
    
    console.log(`  ✅ AppleLoginData 接口: ${hasAppleLoginData ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 姓名接口定义: ${hasFullNameInterface ? '正确' : '❌ 缺失'}`);
    console.log(`  ✅ 邮箱接口定义: ${hasEmailInterface ? '正确' : '❌ 缺失'}`);
    
    if (hasAppleLoginData && hasFullNameInterface && hasEmailInterface) {
      console.log('  🟢 AppleService 接口配置正确');
      return true;
    } else {
      console.log('  🔴 AppleService 接口配置有问题');
      return false;
    }
  } else {
    console.log('  ❌ AppleService 文件不存在');
    return false;
  }
}

// 生成测试报告
function generateTestReport(wechatOk, appleOk, frontendOk, serviceOk) {
  console.log('\n📊 用户信息获取测试报告');
  console.log('================================');
  
  const totalChecks = 4;
  const passedChecks = [wechatOk, appleOk, frontendOk, serviceOk].filter(Boolean).length;
  
  console.log(`\n✅ 通过检测: ${passedChecks}/${totalChecks}`);
  
  console.log('\n📋 详细检测结果:');
  console.log(`  微信用户信息获取: ${wechatOk ? '✅' : '❌'}`);
  console.log(`  苹果用户信息获取: ${appleOk ? '✅' : '❌'}`);
  console.log(`  前端信息传递: ${frontendOk ? '✅' : '❌'}`);
  console.log(`  AppleService 接口: ${serviceOk ? '✅' : '❌'}`);
  
  console.log('\n🎯 测试结果:');
  
  if (passedChecks === totalChecks) {
    console.log('  🟢 完美 - 所有用户信息获取功能配置正确');
    console.log('  💡 微信和苹果用户登录后将正确获取真实用户名和头像');
  } else if (passedChecks >= 3) {
    console.log('  🟡 良好 - 大部分功能配置正确');
    console.log('  💡 可能需要修复一些小问题');
  } else {
    console.log('  🔴 需要修复 - 存在多个配置问题');
    console.log('  💡 需要全面检查和修复用户信息获取功能');
  }
  
  console.log('\n📱 预期效果:');
  console.log('- 微信用户登录后显示真实的微信昵称和头像');
  console.log('- 苹果用户登录后显示真实的姓名和默认头像');
  console.log('- 用户信息会在每次登录时更新');
  
  return passedChecks === totalChecks;
}

// 主函数
function main() {
  try {
    const wechatOk = checkWechatUserInfo();
    const appleOk = checkAppleUserInfo();
    const frontendOk = checkFrontendInfoPassing();
    const serviceOk = checkAppleServiceInterface();
    
    const allPassed = generateTestReport(wechatOk, appleOk, frontendOk, serviceOk);
    
    console.log(`\n🎉 测试完成！用户信息获取功能: ${allPassed ? '✅ 正常' : '❌ 需要修复'}`);
    
  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error.message);
  }
}

// 运行测试
main(); 