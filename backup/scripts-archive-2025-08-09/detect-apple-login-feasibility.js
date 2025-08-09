#!/usr/bin/env node

/**
 * Apple 登录功能可行性检测脚本
 * 全面检测 Apple 登录功能的各个组件是否正常工作
 */

const fs = require('fs');
const https = require('https');

console.log('🍎 Apple 登录功能可行性检测\n');

// 检测结果汇总
const results = {
  backend: false,
  config: false,
  bundleId: false,
  appleConfig: false,
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

// 2. 检测 Apple 登录端点
async function checkAppleLoginEndpoint() {
  console.log('\n🔍 2. 检测 Apple 登录端点...');
  
  return new Promise((resolve) => {
    const testData = JSON.stringify({ idToken: 'test_token' });
    
    const options = {
      hostname: 'dramawordv2.onrender.com',
      port: 443,
      path: '/api/apple/login',
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
          console.log('  ✅ Apple 登录端点正常（预期的错误：无效 token）');
          console.log(`  📄 响应: ${data}`);
        } else if (res.statusCode === 500) {
          console.log('  ⚠️  Apple 登录端点返回服务器错误');
          console.log(`  📄 响应: ${data}`);
          console.log('  💡 这可能是配置问题，需要检查环境变量');
        } else {
          console.log(`  ℹ️  Apple 登录端点响应: ${res.statusCode}`);
          console.log(`  📄 响应: ${data}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`  ❌ Apple 登录端点请求失败: ${error.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.log('  ⚠️  Apple 登录端点请求超时');
      req.destroy();
      resolve();
    });

    req.write(testData);
    req.end();
  });
}

// 3. 检测 Bundle ID 配置
function checkBundleIdConfig() {
  console.log('\n🔍 3. 检测 Bundle ID 配置...');
  
  const appJsonPath = 'apps/mobile/app.json';
  if (fs.existsSync(appJsonPath)) {
    try {
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      const bundleId = appJson.expo.ios.bundleIdentifier;
      
      if (bundleId === 'com.tannibunni.dramawordmobile') {
        console.log(`  ✅ Bundle ID 配置正确: ${bundleId}`);
        results.bundleId = true;
      } else {
        console.log(`  ❌ Bundle ID 配置错误: ${bundleId}`);
        console.log(`  💡 期望值: com.tannibunni.dramawordmobile`);
        results.bundleId = false;
      }
    } catch (error) {
      console.log(`  ❌ 读取 Bundle ID 配置失败: ${error.message}`);
      results.bundleId = false;
    }
  } else {
    console.log('  ❌ app.json 文件不存在');
    results.bundleId = false;
  }
}

// 4. 检测 Apple 配置
function checkAppleConfig() {
  console.log('\n🔍 4. 检测 Apple 配置...');
  
  const appleConfigPath = 'services/api/src/config/apple.ts';
  if (fs.existsSync(appleConfigPath)) {
    const content = fs.readFileSync(appleConfigPath, 'utf8');
    
    if (content.includes('com.tannibunni.dramawordmobile')) {
      console.log('  ✅ Apple 配置文件正确');
      results.appleConfig = true;
    } else {
      console.log('  ❌ Apple 配置文件中的 clientId 不正确');
      results.appleConfig = false;
    }
  } else {
    console.log('  ❌ Apple 配置文件不存在');
    results.appleConfig = false;
  }
}

// 5. 检测环境变量模板
function checkEnvTemplate() {
  console.log('\n🔍 5. 检测环境变量模板...');
  
  const envTemplatePath = 'services/api/env.template';
  if (fs.existsSync(envTemplatePath)) {
    const content = fs.readFileSync(envTemplatePath, 'utf8');
    const match = content.match(/APPLE_CLIENT_ID=(.+)/);
    
    if (match && match[1] === 'com.tannibunni.dramawordmobile') {
      console.log('  ✅ 环境变量模板配置正确');
      results.envTemplate = true;
    } else {
      console.log('  ❌ 环境变量模板配置不正确');
      console.log(`  💡 当前值: ${match ? match[1] : '未找到'}`);
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
    
    if (content.includes('APPLE_CLIENT_ID')) {
      console.log('  ✅ Render 配置包含 APPLE_CLIENT_ID');
      console.log('  ℹ️  注意: 需要在 Render 控制台中手动设置环境变量');
      results.renderConfig = true;
    } else {
      console.log('  ❌ Render 配置缺少 APPLE_CLIENT_ID');
      results.renderConfig = false;
    }
  } else {
    console.log('  ❌ Render 配置文件不存在');
    results.renderConfig = false;
  }
}

// 7. 生成可行性报告
function generateFeasibilityReport() {
  console.log('\n📊 Apple 登录功能可行性报告');
  console.log('================================');
  
  const totalChecks = Object.keys(results).length - 1; // 排除 overall
  const passedChecks = Object.values(results).filter(Boolean).length - (results.overall ? 1 : 0);
  
  console.log(`\n✅ 通过检测: ${passedChecks}/${totalChecks}`);
  
  // 详细状态
  console.log('\n📋 详细检测结果:');
  console.log(`  后端服务: ${results.backend ? '✅' : '❌'}`);
  console.log(`  Bundle ID: ${results.bundleId ? '✅' : '❌'}`);
  console.log(`  Apple 配置: ${results.appleConfig ? '✅' : '❌'}`);
  console.log(`  环境变量模板: ${results.envTemplate ? '✅' : '❌'}`);
  console.log(`  Render 配置: ${results.renderConfig ? '✅' : '❌'}`);
  
  // 可行性评估
  console.log('\n🎯 可行性评估:');
  
  if (passedChecks >= 4) {
    console.log('  🟢 高可行性 - Apple 登录功能基本可用');
    console.log('  💡 只需要修复 Render 环境变量即可');
    results.overall = true;
  } else if (passedChecks >= 3) {
    console.log('  🟡 中等可行性 - 需要修复一些配置问题');
    console.log('  💡 主要问题可能是环境变量配置');
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
  
  if (!results.bundleId) {
    console.log('  - 修复 app.json 中的 Bundle ID 配置');
  }
  
  if (!results.appleConfig) {
    console.log('  - 修复 Apple 配置文件');
  }
  
  if (!results.envTemplate) {
    console.log('  - 修复环境变量模板');
  }
  
  if (!results.renderConfig) {
    console.log('  - 检查 Render 配置文件');
  }
  
  console.log('\n🎯 关键修复步骤:');
  console.log('1. 登录 Render 控制台');
  console.log('2. 设置 APPLE_CLIENT_ID = com.tannibunni.dramawordmobile');
  console.log('3. 重新部署后端服务');
  console.log('4. 测试 Apple 登录功能');
  
  return results.overall;
}

// 主函数
async function main() {
  try {
    await checkBackendService();
    await checkAppleLoginEndpoint();
    checkBundleIdConfig();
    checkAppleConfig();
    checkEnvTemplate();
    checkRenderConfig();
    
    const isFeasible = generateFeasibilityReport();
    
    console.log(`\n🎉 检测完成！Apple 登录功能可行性: ${isFeasible ? '✅ 可行' : '❌ 需要修复'}`);
    
  } catch (error) {
    console.error('\n❌ 检测过程中出现错误:', error.message);
  }
}

// 运行检测
main(); 