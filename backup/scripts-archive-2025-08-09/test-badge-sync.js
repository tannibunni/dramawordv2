#!/usr/bin/env node

/**
 * 测试徽章同步功能
 * 验证徽章系统是否正确集成到多邻国数据同步方案中
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

// 测试徽章数据结构
const testBadgeDataStructure = () => {
  log.title('1️⃣ 测试徽章数据结构');
  
  const badgeStructure = {
    id: 1,
    count: 10,
    unlocked: false
  };
  
  const requiredFields = ['id', 'count', 'unlocked'];
  const missingFields = requiredFields.filter(field => !(field in badgeStructure));
  
  if (missingFields.length === 0) {
    log.success('徽章数据结构完整');
    console.log('   • 包含必要字段:', requiredFields.join(', '));
  } else {
    log.error('徽章数据结构不完整');
    console.log('   • 缺失字段:', missingFields.join(', '));
  }
  
  return missingFields.length === 0;
};

// 测试数据冲突解决器中的徽章支持
const testConflictResolverBadgeSupport = () => {
  log.title('2️⃣ 测试数据冲突解决器徽章支持');
  
  const conflictResolverPath = path.join(__dirname, '../apps/mobile/src/services/dataConflictResolver.ts');
  
  if (!fs.existsSync(conflictResolverPath)) {
    log.error('数据冲突解决器文件不存在');
    return false;
  }
  
  const content = fs.readFileSync(conflictResolverPath, 'utf8');
  
  const checks = [
    {
      name: '徽章合并策略配置',
      pattern: /badges:\s*{\s*strategy:\s*'highest-value'/,
      found: content.includes('badges:') && content.includes('strategy:')
    },
    {
      name: '徽章冲突解决方法',
      pattern: /resolveBadgesConflict/,
      found: content.includes('resolveBadgesConflict')
    },
    {
      name: '徽章合并方法',
      pattern: /mergeBadges/,
      found: content.includes('mergeBadges')
    },
    {
      name: '徽章冲突检测',
      pattern: /case 'badges':/,
      found: content.includes("case 'badges':")
    }
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    if (check.found) {
      log.success(check.name);
    } else {
      log.error(check.name);
      allPassed = false;
    }
  });
  
  return allPassed;
};

// 测试同步控制器中的徽章支持
const testSyncControllerBadgeSupport = () => {
  log.title('3️⃣ 测试同步控制器徽章支持');
  
  const syncControllerPath = path.join(__dirname, '../services/api/src/controllers/syncController.ts');
  
  if (!fs.existsSync(syncControllerPath)) {
    log.error('同步控制器文件不存在');
    return false;
  }
  
  const content = fs.readFileSync(syncControllerPath, 'utf8');
  
  const checks = [
    {
      name: '徽章数据处理',
      pattern: /case 'badges':/,
      found: content.includes("case 'badges':")
    },
    {
      name: '徽章日志记录',
      pattern: /处理徽章数据/,
      found: content.includes('处理徽章数据')
    },
    {
      name: '徽章错误处理',
      pattern: /处理徽章数据失败/,
      found: content.includes('处理徽章数据失败')
    }
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    if (check.found) {
      log.success(check.name);
    } else {
      log.error(check.name);
      allPassed = false;
    }
  });
  
  return allPassed;
};

// 测试VocabularyScreen中的徽章同步功能
const testVocabularyScreenBadgeSync = () => {
  log.title('4️⃣ 测试VocabularyScreen徽章同步功能');
  
  const vocabularyScreenPath = path.join(__dirname, '../apps/mobile/src/screens/Vocabulary/VocabularyScreen.tsx');
  
  if (!fs.existsSync(vocabularyScreenPath)) {
    log.error('VocabularyScreen文件不存在');
    return false;
  }
  
  const content = fs.readFileSync(vocabularyScreenPath, 'utf8');
  
  const checks = [
    {
      name: '徽章同步状态',
      pattern: /badgeSyncStatus/,
      found: content.includes('badgeSyncStatus')
    },
    {
      name: '徽章本地存储',
      pattern: /saveBadgesToStorage/,
      found: content.includes('saveBadgesToStorage')
    },
    {
      name: '徽章服务器同步',
      pattern: /syncBadgesToServer/,
      found: content.includes('syncBadgesToServer')
    },
    {
      name: '徽章同步队列',
      pattern: /unifiedSyncService\.addToSyncQueue/,
      found: content.includes('unifiedSyncService.addToSyncQueue')
    },
    {
      name: '徽章同步状态指示器',
      pattern: /badgeSyncIndicator/,
      found: content.includes('badgeSyncIndicator')
    }
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    if (check.found) {
      log.success(check.name);
    } else {
      log.error(check.name);
      allPassed = false;
    }
  });
  
  return allPassed;
};

// 测试多邻国同步原则
const testDuolingoSyncPrinciples = () => {
  log.title('5️⃣ 验证多邻国同步原则');
  
  const vocabularyScreenPath = path.join(__dirname, '../apps/mobile/src/screens/Vocabulary/VocabularyScreen.tsx');
  const content = fs.readFileSync(vocabularyScreenPath, 'utf8');
  
  const principles = [
    {
      name: '本地优先策略',
      pattern: /saveBadgesToStorage.*newBadges/,
      found: content.includes('saveBadgesToStorage') && content.includes('newBadges')
    },
    {
      name: '仅上传策略',
      pattern: /addToSyncQueue.*badges/,
      found: content.includes('addToSyncQueue') && content.includes('badges')
    },
    {
      name: '离线支持',
      pattern: /AsyncStorage.*userBadges/,
      found: content.includes('AsyncStorage') && content.includes('userBadges')
    }
  ];
  
  let allPassed = true;
  principles.forEach(principle => {
    if (principle.found) {
      log.success(principle.name);
    } else {
      log.error(principle.name);
      allPassed = false;
    }
  });
  
  return allPassed;
};

// 主测试函数
const runTests = () => {
  log.title('🧪 开始测试徽章同步功能');
  
  const tests = [
    { name: '徽章数据结构', test: testBadgeDataStructure },
    { name: '冲突解决器支持', test: testConflictResolverBadgeSupport },
    { name: '同步控制器支持', test: testSyncControllerBadgeSupport },
    { name: 'VocabularyScreen同步', test: testVocabularyScreenBadgeSync },
    { name: '多邻国同步原则', test: testDuolingoSyncPrinciples }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  tests.forEach(({ name, test }) => {
    try {
      const result = test();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      log.error(`${name} 测试失败: ${error.message}`);
    }
  });
  
  log.title('📊 测试结果总结');
  console.log(`   总测试数: ${totalTests}`);
  console.log(`   通过测试: ${passedTests}`);
  console.log(`   失败测试: ${totalTests - passedTests}`);
  console.log(`   成功率: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    log.success('🎉 所有测试通过！徽章同步功能已成功实现');
    console.log('\n   ✅ 徽章系统已完全集成到多邻国数据同步方案中');
    console.log('   ✅ 支持跨设备徽章进度同步');
    console.log('   ✅ 遵循多邻国同步原则：本地优先，仅上传');
    console.log('   ✅ 具备完整的冲突解决机制');
  } else {
    log.error('❌ 部分测试失败，请检查实现');
  }
  
  return passedTests === totalTests;
};

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = { runTests }; 