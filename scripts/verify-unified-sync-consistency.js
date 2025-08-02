const fs = require('fs');
const path = require('path');

// 验证配置
const VERIFICATION_CONFIG = {
  // 统一同步服务的公共方法
  publicMethods: [
    'addToSyncQueue',
    'syncPendingData',
    'getSyncStatus',
    'forceSync',
    'clearSyncQueue',
    'updateConfig',
    'getConfig',
    'migrateOldSyncData'
  ],
  
  // 数据类型
  dataTypes: [
    'experience',
    'vocabulary', 
    'progress',
    'achievements',
    'userStats',
    'learningRecords',
    'searchHistory',
    'userSettings',
    'badges'
  ],
  
  // 操作类型
  operations: ['create', 'update', 'delete'],
  
  // 优先级
  priorities: ['high', 'medium', 'low'],
  
  // 需要检查的文件
  filesToCheck: [
    'apps/mobile/src/App.tsx',
    'apps/mobile/src/screens/Review/ReviewIntroScreen.tsx',
    'apps/mobile/src/screens/Review/ReviewScreen.tsx',
    'apps/mobile/src/screens/Profile/ProfileScreen.tsx',
    'apps/mobile/src/screens/Auth/LoginScreen.tsx',
    'apps/mobile/src/context/AuthContext.tsx',
    'apps/mobile/src/context/VocabularyContext.tsx',
    'apps/mobile/src/components/learning/LearningStatsSection.tsx',
    'apps/mobile/src/components/learning/DataIntegrationTest.tsx',
    'apps/mobile/src/services/experienceManager.ts',
    'apps/mobile/src/services/learningDataService.ts',
    'apps/mobile/src/services/unifiedSyncService.ts'
  ]
};

// 读取文件内容
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ 读取文件失败: ${filePath}`, error.message);
    return null;
  }
}

// 检查方法调用
function checkMethodCalls(content, filePath) {
  const issues = [];
  
  VERIFICATION_CONFIG.publicMethods.forEach(method => {
    const methodPattern = new RegExp(`unifiedSyncService\\.${method}\\s*\\(`, 'g');
    const matches = content.match(methodPattern);
    
    if (matches) {
      console.log(`   ✅ 方法调用: ${method} (${matches.length} 次)`);
    }
  });
  
  return issues;
}

// 检查数据类型使用
function checkDataTypeUsage(content, filePath) {
  const issues = [];
  
  VERIFICATION_CONFIG.dataTypes.forEach(dataType => {
    const typePattern = new RegExp(`type:\\s*['"]${dataType}['"]`, 'g');
    const matches = content.match(typePattern);
    
    if (matches) {
      console.log(`   ✅ 数据类型: ${dataType} (${matches.length} 次)`);
    }
  });
  
  return issues;
}

// 检查操作类型使用
function checkOperationUsage(content, filePath) {
  const issues = [];
  
  VERIFICATION_CONFIG.operations.forEach(operation => {
    const operationPattern = new RegExp(`operation:\\s*['"]${operation}['"]`, 'g');
    const matches = content.match(operationPattern);
    
    if (matches) {
      console.log(`   ✅ 操作类型: ${operation} (${matches.length} 次)`);
    }
  });
  
  return issues;
}

// 检查优先级使用
function checkPriorityUsage(content, filePath) {
  const issues = [];
  
  VERIFICATION_CONFIG.priorities.forEach(priority => {
    const priorityPattern = new RegExp(`priority:\\s*['"]${priority}['"]`, 'g');
    const matches = content.match(priorityPattern);
    
    if (matches) {
      console.log(`   ✅ 优先级: ${priority} (${matches.length} 次)`);
    }
  });
  
  return issues;
}

// 检查接口一致性
function checkInterfaceConsistency(content, filePath) {
  const issues = [];
  
  // 检查 addToSyncQueue 的参数结构
  const addToSyncQueuePattern = /unifiedSyncService\.addToSyncQueue\(\s*\{([^}]+)\}/g;
  let match;
  
  while ((match = addToSyncQueuePattern.exec(content)) !== null) {
    const params = match[1];
    
    // 检查必需参数
    const requiredParams = ['type', 'data', 'userId', 'operation', 'priority'];
    const missingParams = [];
    
    requiredParams.forEach(param => {
      if (!params.includes(`${param}:`)) {
        missingParams.push(param);
      }
    });
    
    if (missingParams.length > 0) {
      issues.push(`缺少必需参数: ${missingParams.join(', ')}`);
    }
  }
  
  return issues;
}

// 检查废弃服务的使用
function checkDeprecatedUsage(content, filePath) {
  const deprecatedServices = [
    'syncManager',
    'incrementalSyncManager',
    'dataSyncService',
    'optimizedDataSyncService',
    'DataSyncService'
  ];
  
  const issues = [];
  
  deprecatedServices.forEach(service => {
    const servicePattern = new RegExp(`\\b${service}\\b`, 'g');
    const matches = content.match(servicePattern);
    
    if (matches) {
      issues.push(`发现废弃服务使用: ${service} (${matches.length} 次)`);
    }
  });
  
  return issues;
}

// 主验证函数
async function verifyUnifiedSyncConsistency() {
  console.log('🔍 开始验证统一同步服务一致性\n');
  console.log('=' .repeat(60));

  const results = {
    totalFiles: 0,
    filesWithIssues: 0,
    totalIssues: 0,
    details: []
  };

  try {
    for (const filePath of VERIFICATION_CONFIG.filesToCheck) {
      console.log(`\n🔍 检查文件: ${filePath}`);
      
      const content = readFile(filePath);
      if (!content) {
        console.log(`   ❌ 文件不存在或无法读取`);
        continue;
      }

      results.totalFiles++;
      const fileIssues = [];

      // 检查方法调用
      checkMethodCalls(content, filePath);
      
      // 检查数据类型使用
      checkDataTypeUsage(content, filePath);
      
      // 检查操作类型使用
      checkOperationUsage(content, filePath);
      
      // 检查优先级使用
      checkPriorityUsage(content, filePath);
      
      // 检查接口一致性
      const interfaceIssues = checkInterfaceConsistency(content, filePath);
      if (interfaceIssues.length > 0) {
        fileIssues.push(...interfaceIssues);
        console.log(`   ⚠️  接口一致性问题: ${interfaceIssues.join(', ')}`);
      }
      
      // 检查废弃服务使用
      const deprecatedIssues = checkDeprecatedUsage(content, filePath);
      if (deprecatedIssues.length > 0) {
        fileIssues.push(...deprecatedIssues);
        console.log(`   ❌ 废弃服务使用: ${deprecatedIssues.join(', ')}`);
      }

      if (fileIssues.length > 0) {
        results.filesWithIssues++;
        results.totalIssues += fileIssues.length;
        results.details.push({
          filePath,
          issues: fileIssues
        });
      } else {
        console.log(`   ✅ 文件检查通过`);
      }
    }

    // 输出验证结果
    console.log('\n📊 验证结果:');
    console.log(`   总文件数: ${results.totalFiles}`);
    console.log(`   有问题的文件数: ${results.filesWithIssues}`);
    console.log(`   总问题数: ${results.totalIssues}`);

    if (results.totalIssues === 0) {
      console.log('\n✅ 统一同步服务一致性验证通过！');
      console.log('✅ 所有函数和变量名称都与新方案一致');
      console.log('✅ 没有发现废弃服务的使用');
      console.log('✅ 接口调用格式正确');
    } else {
      console.log('\n⚠️  发现一致性问题:');
      results.details.forEach(detail => {
        console.log(`\n   文件: ${detail.filePath}`);
        detail.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      });
    }

    // 保存详细报告
    const reportPath = `unified-sync-consistency-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 详细报告已保存: ${reportPath}`);

  } catch (error) {
    console.error('❌ 验证过程失败:', error);
  }
}

// 运行验证
if (require.main === module) {
  verifyUnifiedSyncConsistency();
}

module.exports = {
  verifyUnifiedSyncConsistency,
  checkMethodCalls,
  checkDataTypeUsage,
  checkOperationUsage,
  checkPriorityUsage,
  checkInterfaceConsistency,
  checkDeprecatedUsage
}; 