#!/usr/bin/env node

/**
 * 检查经验模型和多邻国数据同步系统对齐脚本
 * 验证变量名称引用正确性
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始检查经验模型和多邻国数据同步系统对齐情况...\n');

// 定义需要检查的文件路径
const filesToCheck = {
  // 前端经验值相关文件
  frontend: {
    experienceCalculationService: 'apps/mobile/src/services/experienceCalculationService.ts',
    experienceService: 'apps/mobile/src/services/experienceService.ts',
    experienceManager: 'apps/mobile/src/services/experienceManager.ts',
    unifiedSyncService: 'apps/mobile/src/services/unifiedSyncService.ts',
    experienceTypes: 'apps/mobile/src/types/experience.ts',
    storageService: 'apps/mobile/src/services/storageService.ts',
    userService: 'apps/mobile/src/services/userService.ts',
    reviewIntroScreen: 'apps/mobile/src/screens/Review/ReviewIntroScreen.tsx'
  },
  // 后端经验值相关文件
  backend: {
    userModel: 'services/api/src/models/User.ts',
    experienceService: 'services/api/src/services/experienceService.ts',
    userController: 'services/api/src/controllers/userController.ts',
    wordController: 'services/api/src/controllers/wordController.ts'
  }
};

// 定义关键变量名称映射
const expectedVariableMappings = {
  // 经验值基础字段
  experience: {
    frontend: ['experience', 'currentExperience', 'totalExperience'],
    backend: ['experience', 'learningStats.experience'],
    sync: ['experience', 'data.experience']
  },
  level: {
    frontend: ['level', 'currentLevel', 'newLevel', 'oldLevel'],
    backend: ['level', 'learningStats.level'],
    sync: ['level', 'data.level']
  },
  experienceToNextLevel: {
    frontend: ['experienceToNextLevel', 'expToNextLevel'],
    backend: ['experienceToNextLevel'],
    sync: ['experienceToNextLevel']
  },
  // 经验值增益相关
  xpGained: {
    frontend: ['xpGained', 'gainedExp', 'experienceGained'],
    backend: ['xpGained'],
    sync: ['xpGained']
  },
  leveledUp: {
    frontend: ['leveledUp', 'isLevelUp'],
    backend: ['leveledUp'],
    sync: ['leveledUp']
  },
  // 同步相关
  syncData: {
    frontend: ['SyncData', 'syncData'],
    backend: ['syncData'],
    sync: ['SyncData']
  },
  experienceEvents: {
    frontend: ['ExperienceEvent', 'experienceEvents'],
    backend: ['experienceEvents'],
    sync: ['events']
  }
};

// 检查文件是否存在并读取内容
function readFileContent(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return null;
  }
  return fs.readFileSync(fullPath, 'utf8');
}

// 检查变量名称在文件中的使用情况
function checkVariableUsage(content, variableName, context) {
  const regex = new RegExp(`\\b${variableName}\\b`, 'g');
  const matches = content.match(regex);
  return {
    variable: variableName,
    context: context,
    count: matches ? matches.length : 0,
    found: matches !== null
  };
}

// 检查类型定义对齐
function checkTypeAlignment() {
  console.log('📋 检查类型定义对齐...');
  
  const frontendTypes = readFileContent(filesToCheck.frontend.experienceTypes);
  const backendUserModel = readFileContent(filesToCheck.backend.userModel);
  
  if (!frontendTypes || !backendUserModel) {
    console.log('❌ 无法读取类型定义文件');
    return false;
  }
  
  const typeChecks = [
    {
      name: 'ExperienceGainResult',
      frontend: frontendTypes.includes('interface ExperienceGainResult'),
      backend: backendUserModel.includes('ExperienceGainResult')
    },
    {
      name: 'LevelInfo',
      frontend: frontendTypes.includes('interface LevelInfo'),
      backend: backendUserModel.includes('level') && backendUserModel.includes('experience')
    },
    {
      name: 'ExperienceEvent',
      frontend: frontendTypes.includes('interface ExperienceEvent'),
      backend: backendUserModel.includes('experience')
    }
  ];
  
  let allAligned = true;
  typeChecks.forEach(check => {
    const status = check.frontend && check.backend ? '✅' : '❌';
    console.log(`  ${status} ${check.name}: 前端=${check.frontend}, 后端=${check.backend}`);
    if (!check.frontend || !check.backend) {
      allAligned = false;
    }
  });
  
  return allAligned;
}

// 检查经验值计算逻辑对齐
function checkCalculationAlignment() {
  console.log('\n📋 检查经验值计算逻辑对齐...');
  
  const frontendCalc = readFileContent(filesToCheck.frontend.experienceCalculationService);
  const backendUserModel = readFileContent(filesToCheck.backend.userModel);
  
  if (!frontendCalc || !backendUserModel) {
    console.log('❌ 无法读取计算逻辑文件');
    return false;
  }
  
  const calculationChecks = [
    {
      name: '等级计算公式',
      frontend: frontendCalc.includes('Math.pow(level + 1, 2)'),
      backend: backendUserModel.includes('Math.pow(currentLevel + 1, 2)')
    },
    {
      name: '经验值累加',
      frontend: frontendCalc.includes('currentExp + gainedExp'),
      backend: backendUserModel.includes('experience += exp')
    },
    {
      name: '升级检查',
      frontend: frontendCalc.includes('newLevel > oldLevel'),
      backend: backendUserModel.includes('level += 1')
    }
  ];
  
  let allAligned = true;
  calculationChecks.forEach(check => {
    const status = check.frontend && check.backend ? '✅' : '❌';
    console.log(`  ${status} ${check.name}: 前端=${check.frontend}, 后端=${check.backend}`);
    if (!check.frontend || !check.backend) {
      allAligned = false;
    }
  });
  
  return allAligned;
}

// 检查同步系统对齐
function checkSyncAlignment() {
  console.log('\n📋 检查同步系统对齐...');
  
  const frontendSync = readFileContent(filesToCheck.frontend.unifiedSyncService);
  const frontendTypes = readFileContent(filesToCheck.frontend.experienceTypes);
  
  if (!frontendSync || !frontendTypes) {
    console.log('❌ 无法读取同步系统文件');
    return false;
  }
  
  const syncChecks = [
    {
      name: '经验值同步类型',
      frontend: frontendSync.includes("type: 'experience'"),
      types: frontendTypes.includes('ExperienceSyncData')
    },
    {
      name: '同步数据结构',
      frontend: frontendSync.includes('SyncData'),
      types: frontendTypes.includes('interface ExperienceSyncData')
    },
    {
      name: '冲突解决',
      frontend: frontendSync.includes('resolveConflicts'),
      types: frontendTypes.includes('DataConflictResolver')
    }
  ];
  
  let allAligned = true;
  syncChecks.forEach(check => {
    const status = check.frontend && check.types ? '✅' : '❌';
    console.log(`  ${status} ${check.name}: 同步服务=${check.frontend}, 类型定义=${check.types}`);
    if (!check.frontend || !check.types) {
      allAligned = false;
    }
  });
  
  return allAligned;
}

// 检查变量名称一致性
function checkVariableConsistency() {
  console.log('\n📋 检查变量名称一致性...');
  
  const files = {
    '前端计算服务': readFileContent(filesToCheck.frontend.experienceCalculationService),
    '后端用户模型': readFileContent(filesToCheck.backend.userModel),
    '统一同步服务': readFileContent(filesToCheck.frontend.unifiedSyncService)
  };
  
  const variableChecks = [
    { name: 'experience', expected: ['experience', 'currentExperience'] },
    { name: 'level', expected: ['level', 'currentLevel'] },
    { name: 'xpGained', expected: ['xpGained', 'gainedExp'] },
    { name: 'leveledUp', expected: ['leveledUp', 'isLevelUp'] }
  ];
  
  let allConsistent = true;
  
  Object.entries(files).forEach(([fileName, content]) => {
    if (!content) return;
    
    console.log(`\n  检查 ${fileName}:`);
    variableChecks.forEach(check => {
      const found = check.expected.some(variable => 
        content.includes(variable)
      );
      const status = found ? '✅' : '❌';
      console.log(`    ${status} ${check.name}: ${found ? '找到' : '未找到'}`);
      if (!found) {
        allConsistent = false;
      }
    });
  });
  
  return allConsistent;
}

// 检查API接口对齐
function checkAPIAlignment() {
  console.log('\n📋 检查API接口对齐...');
  
  const frontendService = readFileContent(filesToCheck.frontend.experienceService);
  const backendService = readFileContent(filesToCheck.backend.experienceService);
  
  if (!frontendService || !backendService) {
    console.log('❌ 无法读取API服务文件');
    return false;
  }
  
  const apiChecks = [
    {
      name: '获取经验值信息',
      frontend: frontendService.includes('getExperienceInfo'),
      backend: backendService.includes('getUserExperienceInfo')
    },
    {
      name: '添加复习经验值',
      frontend: frontendService.includes('addReviewExperience'),
      backend: backendService.includes('addExperienceForReview')
    },
    {
      name: '添加新词经验值',
      frontend: frontendService.includes('addNewWordExperience'),
      backend: backendService.includes('addExperienceForNewWord')
    }
  ];
  
  let allAligned = true;
  apiChecks.forEach(check => {
    const status = check.frontend && check.backend ? '✅' : '❌';
    console.log(`  ${status} ${check.name}: 前端=${check.frontend}, 后端=${check.backend}`);
    if (!check.frontend || !check.backend) {
      allAligned = false;
    }
  });
  
  return allAligned;
}

// 检查存储键对齐
function checkStorageAlignment() {
  console.log('\n📋 检查存储键对齐...');
  
  const storageService = readFileContent(filesToCheck.frontend.storageService);
  const reviewScreen = readFileContent(filesToCheck.frontend.reviewIntroScreen);
  
  if (!storageService || !reviewScreen) {
    console.log('❌ 无法读取存储相关文件');
    return false;
  }
  
  const storageKeys = [
    'experienceGain',
    'experienceGainApplied',
    'experienceEvents',
    'userStats'
  ];
  
  let allAligned = true;
  storageKeys.forEach(key => {
    const inStorageService = storageService.includes(key);
    const inReviewScreen = reviewScreen.includes(key);
    const status = inStorageService && inReviewScreen ? '✅' : '❌';
    console.log(`  ${status} ${key}: 存储服务=${inStorageService}, 使用处=${inReviewScreen}`);
    if (!inStorageService || !inReviewScreen) {
      allAligned = false;
    }
  });
  
  return allAligned;
}

// 主检查函数
function performAlignmentCheck() {
  console.log('🚀 开始执行对齐检查...\n');
  
  const results = {
    typeAlignment: checkTypeAlignment(),
    calculationAlignment: checkCalculationAlignment(),
    syncAlignment: checkSyncAlignment(),
    variableConsistency: checkVariableConsistency(),
    apiAlignment: checkAPIAlignment(),
    storageAlignment: checkStorageAlignment()
  };
  
  console.log('\n📊 检查结果总结:');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([check, result]) => {
    const status = result ? '✅ 通过' : '❌ 失败';
    console.log(`${status} ${check}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 所有检查通过！经验模型和同步系统对齐良好。');
  } else {
    console.log('⚠️ 发现对齐问题，请检查上述失败的检查项。');
  }
  
  return allPassed;
}

// 生成改进建议
function generateImprovementSuggestions() {
  console.log('\n💡 改进建议:');
  console.log('1. 确保前后端使用相同的经验值计算公式');
  console.log('2. 统一变量命名规范，避免不一致');
  console.log('3. 完善类型定义，确保类型安全');
  console.log('4. 添加更多单元测试验证对齐情况');
  console.log('5. 建立API文档确保接口一致性');
}

// 执行检查
if (require.main === module) {
  const success = performAlignmentCheck();
  generateImprovementSuggestions();
  
  process.exit(success ? 0 : 1);
}

module.exports = {
  performAlignmentCheck,
  checkTypeAlignment,
  checkCalculationAlignment,
  checkSyncAlignment,
  checkVariableConsistency,
  checkAPIAlignment,
  checkStorageAlignment
}; 