#!/usr/bin/env node

/**
 * 微信登录功能可行性检测脚本
 * 检测微信登录功能的各个组件是否正常工作
 */

const fs = require('fs');
const https = require('https');

console.log('💬 微信登录功能可行性检测\n');

// 检测结果汇总
const results = {
  backend: false,
  wechatEndpoint: false,
  config: false,
  appId: false,
  wechatConfig: false,
  envTemplate: false,
  renderConfig: false,
  overall: false
};

// 1. 检测后端服务状态
async function checkBackendService() {
  console.log('🔍 1. 检测后端服务状态...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'dramawordv2.onrender.com',
      port: 443,
      path: '/health',
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('  ✅ 后端服务正常运行');
        results.backend = true;
      } else {
        console.log(`  ❌ 后端服务异常，状态码: ${res.statusCode}`);
        results.backend = false;
      }
      resolve();
    });

    req.on('error', (error) => {
      console.log(`  ❌ 后端服务连接失败: ${error.message}`);
      results.backend = false;
      resolve();
    });

    req.on('timeout', () => {
      console.log('  ⚠️  后端服务连接超时');
      results.backend = false;
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// 2. 检测微信登录端点
async function checkWechatLoginEndpoint() {
  console.log('\n🔍 2. 检测微信登录端点...');
  
  return new Promise((resolve) => {
    const testData = JSON.stringify({ 
      code: 'test_wechat_code',
      state: 'dramaword_wechat_login_test'
    });
    
    const options = {
      hostname: 'dramawordv2.onrender.com',
      port: 443,
      path: '/api/wechat/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 400) {
          console.log('  ✅ 微信登录端点正常（预期的错误：无效的授权码）');
          console.log(`  📄 响应: ${data}`);
        } else if (res.statusCode === 500) {
          console.log('  ⚠️  微信登录端点返回服务器错误');
          console.log(`  📄 响应: ${data}`);
          console.log('  💡 这可能是配置问题，需要检查微信配置');
        } else {
          console.log(`  ℹ️  微信登录端点响应: ${res.statusCode}`);
          console.log(`  📄 响应: ${data}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`  ❌ 微信登录端点请求失败: ${error.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.log('  ⚠️  微信登录端点请求超时');
      req.destroy();
      resolve();
    });

    req.write(testData);
    req.end();
  });
}

// 3. 检测微信 App ID 配置
function checkWechatAppId() {
  console.log('\n🔍 3. 检测微信 App ID 配置...');
  
  const wechatServicePath = 'apps/mobile/src/services/wechatService.ts';
  if (fs.existsSync(wechatServicePath)) {
    const content = fs.readFileSync(wechatServicePath, 'utf8');
    const appIdMatch = content.match(/private static appId = '([^']+)'/);
    
    if (appIdMatch) {
      const appId = appIdMatch[1];
      console.log(`  ✅ 微信 App ID: ${appId}`);
      
      if (appId === 'wxa225945508659eb8') {
        console.log('  ✅ 微信 App ID 配置正确');
        results.appId = true;
      } else {
        console.log('  ❌ 微信 App ID 配置不正确');
        results.appId = false;
      }
    } else {
      console.log('  ❌ 未找到微信 App ID 配置');
      results.appId = false;
    }
  } else {
    console.log('  ❌ 微信服务文件不存在');
    results.appId = false;
  }
}

// 4. 检测后端微信配置
function checkWechatConfig() {
  console.log('\n🔍 4. 检测后端微信配置...');
  
  const wechatConfigPath = 'services/api/src/config/wechat.ts';
  if (fs.existsSync(wechatConfigPath)) {
    const content = fs.readFileSync(wechatConfigPath, 'utf8');
    console.log('  ✅ 微信配置文件存在');
    
    // 检查必要的配置项
    const hasAppId = content.includes('appId:');
    const hasAppSecret = content.includes('appSecret:');
    const hasBundleId = content.includes('bundleId:');
    
    if (hasAppId && hasAppSecret && hasBundleId) {
      console.log('  ✅ 微信配置包含必要的配置项');
      results.wechatConfig = true;
    } else {
      console.log('  ❌ 微信配置缺少必要的配置项');
      results.wechatConfig = false;
    }
  } else {
    console.log('  ❌ 微信配置文件不存在');
    results.wechatConfig = false;
  }
}

// 5. 检测环境变量模板
function checkEnvTemplate() {
  console.log('\n🔍 5. 检测环境变量模板...');
  
  const envTemplatePath = 'services/api/env.template';
  if (fs.existsSync(envTemplatePath)) {
    const content = fs.readFileSync(envTemplatePath, 'utf8');
    
    const hasWechatAppId = content.includes('WECHAT_APP_ID');
    const hasWechatAppSecret = content.includes('WECHAT_APP_SECRET');
    const hasWechatBundleId = content.includes('WECHAT_BUNDLE_ID');
    
    if (hasWechatAppId && hasWechatAppSecret && hasWechatBundleId) {
      console.log('  ✅ 环境变量模板包含微信配置');
      results.envTemplate = true;
    } else {
      console.log('  ❌ 环境变量模板缺少微信配置');
      results.envTemplate = false;
    }
  } else {
    console.log('  ❌ 环境变量模板文件不存在');
    results.envTemplate = false;
  }
}

// 6. 检测 Render 配置
function checkRenderConfig() {
  console.log('\n🔍 6. 检测 Render 配置...');
  
  const renderYamlPath = 'services/api/render.yaml';
  if (fs.existsSync(renderYamlPath)) {
    const content = fs.readFileSync(renderYamlPath, 'utf8');
    
    const hasWechatAppId = content.includes('WECHAT_APP_ID');
    const hasWechatAppSecret = content.includes('WECHAT_APP_SECRET');
    
    if (hasWechatAppId && hasWechatAppSecret) {
      console.log('  ✅ Render 配置包含微信环境变量');
      console.log('  ℹ️  注意: 需要在 Render 控制台中手动设置微信环境变量');
      results.renderConfig = true;
    } else {
      console.log('  ❌ Render 配置缺少微信环境变量');
      results.renderConfig = false;
    }
  } else {
    console.log('  ❌ Render 配置文件不存在');
    results.renderConfig = false;
  }
}

// 7. 检测微信 SDK 配置
function checkWechatSDK() {
  console.log('\n🔍 7. 检测微信 SDK 配置...');
  
  const wechatSDKPath = 'apps/mobile/src/services/wechatSDK.ts';
  if (fs.existsSync(wechatSDKPath)) {
    const content = fs.readFileSync(wechatSDKPath, 'utf8');
    console.log('  ✅ 微信 SDK 文件存在');
    
    const hasRealSDK = content.includes('RealWechatSDK');
    const hasMockSDK = content.includes('MockWechatSDK');
    const hasDevCheck = content.includes('__DEV__');
    
    if (hasRealSDK && hasMockSDK && hasDevCheck) {
      console.log('  ✅ 微信 SDK 配置完整');
      console.log('  ℹ️  开发环境使用模拟 SDK，生产环境使用真实 SDK');
    } else {
      console.log('  ⚠️  微信 SDK 配置不完整');
    }
  } else {
    console.log('  ❌ 微信 SDK 文件不存在');
  }
}

// 8. 生成可行性报告
function generateFeasibilityReport() {
  console.log('\n📊 微信登录功能可行性报告');
  console.log('================================');
  
  const totalChecks = Object.keys(results).length - 1; // 排除 overall
  const passedChecks = Object.values(results).filter(Boolean).length - (results.overall ? 1 : 0);
  
  console.log(`\n✅ 通过检测: ${passedChecks}/${totalChecks}`);
  
  // 详细状态
  console.log('\n📋 详细检测结果:');
  console.log(`  后端服务: ${results.backend ? '✅' : '❌'}`);
  console.log(`  微信 App ID: ${results.appId ? '✅' : '❌'}`);
  console.log(`  微信配置: ${results.wechatConfig ? '✅' : '❌'}`);
  console.log(`  环境变量模板: ${results.envTemplate ? '✅' : '❌'}`);
  console.log(`  Render 配置: ${results.renderConfig ? '✅' : '❌'}`);
  
  // 可行性评估
  console.log('\n🎯 可行性评估:');
  
  if (passedChecks >= 4) {
    console.log('  🟢 高可行性 - 微信登录功能基本可用');
    console.log('  💡 只需要配置微信环境变量即可');
    results.overall = true;
  } else if (passedChecks >= 3) {
    console.log('  🟡 中等可行性 - 需要修复一些配置问题');
    console.log('  💡 主要问题可能是微信配置');
    results.overall = false;
  } else {
    console.log('  🔴 低可行性 - 存在多个配置问题');
    console.log('  💡 需要全面检查和修复配置');
    results.overall = false;
  }
  
  // 修复建议
  console.log('\n🔧 修复建议:');
  
  if (!results.backend) {
    console.log('  - 检查后端服务是否正常运行');
  }
  
  if (!results.appId) {
    console.log('  - 检查微信 App ID 配置');
  }
  
  if (!results.wechatConfig) {
    console.log('  - 检查后端微信配置文件');
  }
  
  if (!results.envTemplate) {
    console.log('  - 检查环境变量模板');
  }
  
  if (!results.renderConfig) {
    console.log('  - 检查 Render 配置文件');
  }
  
  console.log('\n🎯 关键修复步骤:');
  console.log('1. 登录 Render 控制台');
  console.log('2. 设置微信环境变量:');
  console.log('   - WECHAT_APP_ID = wxa225945508659eb8');
  console.log('   - WECHAT_APP_SECRET = 你的微信应用密钥');
  console.log('   - WECHAT_BUNDLE_ID = com.tannibunni.dramawordmobile');
  console.log('3. 重新部署后端服务');
  console.log('4. 测试微信登录功能');
  
  console.log('\n⚠️  重要提醒:');
  console.log('- 微信登录需要正确的 App ID 和 App Secret');
  console.log('- 需要在微信开放平台配置应用');
  console.log('- 开发环境使用模拟 SDK，生产环境需要真实 SDK');
  
  return results.overall;
}

// 主函数
async function main() {
  try {
    await checkBackendService();
    await checkWechatLoginEndpoint();
    checkWechatAppId();
    checkWechatConfig();
    checkEnvTemplate();
    checkRenderConfig();
    checkWechatSDK();
    
    const isFeasible = generateFeasibilityReport();
    
    console.log(`\n🎉 检测完成！微信登录功能可行性: ${isFeasible ? '✅ 可行' : '❌ 需要修复'}`);
    
  } catch (error) {
    console.error('\n❌ 检测过程中出现错误:', error.message);
  }
}

// 运行检测
main(); 