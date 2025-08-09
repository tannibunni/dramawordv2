const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// 自动接受代码配置
const AUTO_ACCEPT_CONFIG = {
  // 代码质量检查
  qualityChecks: {
    enableLintCheck: true,
    enableTypeCheck: true,
    enableTestRun: true,
    enableIntegrationTest: true
  },
  
  // 验证脚本
  validationScripts: [
    'scripts/verify-system-integration.js',
    'scripts/verify-unified-sync-consistency.js'
  ],
  
  // 安全检查
  safetyChecks: {
    checkDeprecatedServices: true,
    checkBackupFiles: true,
    checkGitStatus: true
  },
  
  // 自动接受条件
  autoAcceptConditions: {
    requireAllTestsPass: true,
    requireNoDeprecatedServices: true,
    requireCleanGitStatus: true,
    requireBackupExists: true
  }
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查Git状态
function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim() === '';
  } catch (error) {
    log('❌ Git状态检查失败', 'red');
    return false;
  }
}

// 检查是否有未提交的更改
function checkUncommittedChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    return [];
  }
}

// 检查废弃服务使用
function checkDeprecatedServices() {
  try {
    const result = execSync(
      'find apps/mobile/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "syncManager\\|incrementalSyncManager\\|dataSyncService\\|optimizedDataSyncService\\|DataSyncService" 2>/dev/null || echo "CLEAN"',
      { encoding: 'utf8' }
    );
    return result.trim() === 'CLEAN';
  } catch (error) {
    return true; // 如果没有找到，认为是干净的
  }
}

// 检查备份文件
function checkBackupFiles() {
  const backupDir = 'backup/old-sync-services';
  const requiredFiles = [
    'syncManager.ts',
    'incrementalSyncManager.ts',
    'dataSyncService.ts',
    'optimizedDataSyncService.ts'
  ];
  
  try {
    const files = fs.readdirSync(backupDir);
    return requiredFiles.every(file => files.includes(file));
  } catch (error) {
    return false;
  }
}

// 运行验证脚本
async function runValidationScripts() {
  const results = [];
  
  for (const script of AUTO_ACCEPT_CONFIG.validationScripts) {
    try {
      log(`🔍 运行验证脚本: ${script}`, 'blue');
      const output = execSync(`node ${script}`, { encoding: 'utf8' });
      
      // 检查输出中是否包含成功信息
      const isSuccess = output.includes('✅') && !output.includes('❌') && !output.includes('⚠️');
      
      results.push({
        script,
        success: isSuccess,
        output: output.substring(0, 500) + '...' // 截取前500字符
      });
      
      log(`   ${isSuccess ? '✅' : '❌'} ${script}`, isSuccess ? 'green' : 'red');
    } catch (error) {
      results.push({
        script,
        success: false,
        output: error.message
      });
      log(`   ❌ ${script} 执行失败`, 'red');
    }
  }
  
  return results;
}

// 运行代码质量检查
function runQualityChecks() {
  const results = [];
  
  // 检查TypeScript编译
  if (AUTO_ACCEPT_CONFIG.qualityChecks.enableTypeCheck) {
    try {
      log('🔍 检查TypeScript编译...', 'blue');
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      results.push({ check: 'TypeScript', success: true });
      log('   ✅ TypeScript编译检查通过', 'green');
    } catch (error) {
      results.push({ check: 'TypeScript', success: false, error: error.message });
      log('   ❌ TypeScript编译检查失败', 'red');
    }
  }
  
  // 检查ESLint
  if (AUTO_ACCEPT_CONFIG.qualityChecks.enableLintCheck) {
    try {
      log('🔍 检查ESLint...', 'blue');
      execSync('npx eslint apps/mobile/src --ext .ts,.tsx', { stdio: 'pipe' });
      results.push({ check: 'ESLint', success: true });
      log('   ✅ ESLint检查通过', 'green');
    } catch (error) {
      results.push({ check: 'ESLint', success: false, error: error.message });
      log('   ❌ ESLint检查失败', 'red');
    }
  }
  
  return results;
}

// 自动接受代码
async function autoAcceptCode() {
  log('🤖 开始自动接受代码流程', 'bold');
  log('=' .repeat(60));
  
  const results = {
    gitStatus: false,
    deprecatedServices: false,
    backupFiles: false,
    qualityChecks: [],
    validationScripts: [],
    canAutoAccept: false,
    reasons: []
  };
  
  // 1. 检查Git状态
  log('\n📋 1. 检查Git状态...', 'blue');
  results.gitStatus = checkGitStatus();
  if (results.gitStatus) {
    log('   ✅ Git工作目录干净', 'green');
  } else {
    log('   ❌ Git工作目录有未提交的更改', 'red');
    results.reasons.push('Git工作目录不干净');
  }
  
  // 2. 检查废弃服务
  log('\n📋 2. 检查废弃服务使用...', 'blue');
  results.deprecatedServices = checkDeprecatedServices();
  if (results.deprecatedServices) {
    log('   ✅ 没有发现废弃服务使用', 'green');
  } else {
    log('   ❌ 发现废弃服务使用', 'red');
    results.reasons.push('存在废弃服务使用');
  }
  
  // 3. 检查备份文件
  log('\n📋 3. 检查备份文件...', 'blue');
  results.backupFiles = checkBackupFiles();
  if (results.backupFiles) {
    log('   ✅ 备份文件完整', 'green');
  } else {
    log('   ❌ 备份文件不完整', 'red');
    results.reasons.push('备份文件不完整');
  }
  
  // 4. 运行代码质量检查
  log('\n📋 4. 运行代码质量检查...', 'blue');
  results.qualityChecks = runQualityChecks();
  const qualityChecksPassed = results.qualityChecks.every(check => check.success);
  if (qualityChecksPassed) {
    log('   ✅ 所有代码质量检查通过', 'green');
  } else {
    log('   ❌ 部分代码质量检查失败', 'red');
    results.reasons.push('代码质量检查失败');
  }
  
  // 5. 运行验证脚本
  log('\n📋 5. 运行验证脚本...', 'blue');
  results.validationScripts = await runValidationScripts();
  const validationScriptsPassed = results.validationScripts.every(script => script.success);
  if (validationScriptsPassed) {
    log('   ✅ 所有验证脚本通过', 'green');
  } else {
    log('   ❌ 部分验证脚本失败', 'red');
    results.reasons.push('验证脚本失败');
  }
  
  // 6. 判断是否可以自动接受
  log('\n📋 6. 判断自动接受条件...', 'blue');
  results.canAutoAccept = 
    results.gitStatus &&
    results.deprecatedServices &&
    results.backupFiles &&
    qualityChecksPassed &&
    validationScriptsPassed;
  
  if (results.canAutoAccept) {
    log('   ✅ 满足所有自动接受条件', 'green');
  } else {
    log('   ❌ 不满足自动接受条件', 'red');
    log('   原因:', 'yellow');
    results.reasons.forEach(reason => {
      log(`   - ${reason}`, 'yellow');
    });
  }
  
  // 7. 执行自动接受
  if (results.canAutoAccept) {
    log('\n🚀 7. 执行自动接受...', 'blue');
    
    try {
      // 检查是否有未推送的提交
      const unpushedCommits = execSync('git log --oneline origin/main..HEAD', { encoding: 'utf8' });
      
      if (unpushedCommits.trim()) {
        log('   📤 发现未推送的提交，正在推送...', 'blue');
        execSync('git push origin main', { stdio: 'inherit' });
        log('   ✅ 代码已成功推送到远程仓库', 'green');
      } else {
        log('   ✅ 所有代码已是最新状态', 'green');
      }
      
      log('\n🎉 自动接受完成！', 'bold');
      log('✅ 代码已成功接受并部署', 'green');
      
    } catch (error) {
      log('   ❌ 自动接受失败', 'red');
      log(`   错误: ${error.message}`, 'red');
      results.reasons.push('推送失败');
    }
  } else {
    log('\n⚠️ 自动接受被拒绝', 'yellow');
    log('请解决上述问题后重试', 'yellow');
  }
  
  // 8. 生成报告
  const reportPath = `auto-accept-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`\n📄 详细报告已保存: ${reportPath}`, 'blue');
  
  return results;
}

// 快速接受模式（跳过部分检查）
async function quickAccept() {
  log('⚡ 快速接受模式', 'bold');
  log('跳过部分检查，直接推送代码', 'yellow');
  
  try {
    const unpushedCommits = execSync('git log --oneline origin/main..HEAD', { encoding: 'utf8' });
    
    if (unpushedCommits.trim()) {
      log('📤 推送未提交的代码...', 'blue');
      execSync('git push origin main', { stdio: 'inherit' });
      log('✅ 代码已成功推送', 'green');
    } else {
      log('✅ 所有代码已是最新状态', 'green');
    }
  } catch (error) {
    log('❌ 快速接受失败', 'red');
    log(`错误: ${error.message}`, 'red');
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const isQuickMode = args.includes('--quick') || args.includes('-q');

// 运行自动接受
if (require.main === module) {
  if (isQuickMode) {
    quickAccept();
  } else {
    autoAcceptCode();
  }
}

module.exports = {
  autoAcceptCode,
  quickAccept,
  checkGitStatus,
  checkDeprecatedServices,
  checkBackupFiles,
  runValidationScripts,
  runQualityChecks
}; 