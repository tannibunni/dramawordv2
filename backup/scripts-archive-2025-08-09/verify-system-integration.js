const fs = require('fs');
const path = require('path');

// 系统集成验证配置
const SYSTEM_INTEGRATION_CONFIG = {
  // 登录系统相关文件
  loginSystem: {
    files: [
      'apps/mobile/src/screens/Auth/LoginScreen.tsx',
      'apps/mobile/src/context/AuthContext.tsx'
    ],
    expectedMethods: ['clearSyncQueue', 'addToSyncQueue'],
    expectedDataTypes: ['searchHistory', 'userStats']
  },
  
  // 经验系统相关文件
  experienceSystem: {
    files: [
      'apps/mobile/src/services/experienceManager.ts',
      'apps/mobile/src/screens/Review/ReviewIntroScreen.tsx'
    ],
    expectedMethods: ['addToSyncQueue', 'syncPendingData', 'getSyncStatus'],
    expectedDataTypes: ['userStats', 'experience', 'achievements']
  },
  
  // 复习系统相关文件
  reviewSystem: {
    files: [
      'apps/mobile/src/screens/Review/ReviewScreen.tsx',
      'apps/mobile/src/screens/Review/ReviewIntroScreen.tsx',
      'apps/mobile/src/services/learningDataService.ts'
    ],
    expectedMethods: ['addToSyncQueue', 'syncPendingData', 'getSyncStatus'],
    expectedDataTypes: ['learningRecords', 'userStats', 'vocabulary']
  }
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

// 检查统一同步服务的使用
function checkUnifiedSyncUsage(content, filePath, systemName) {
  const results = {
    filePath,
    systemName,
    hasUnifiedSyncImport: false,
    hasUnifiedSyncUsage: false,
    methodCalls: [],
    dataTypes: [],
    issues: []
  };

  // 检查导入
  const importPattern = /import.*unifiedSyncService.*from.*unifiedSyncService/;
  if (importPattern.test(content)) {
    results.hasUnifiedSyncImport = true;
  } else {
    results.issues.push('缺少统一同步服务导入');
  }

  // 检查方法调用
  const methodPattern = /unifiedSyncService\.(\w+)\s*\(/g;
  let match;
  while ((match = methodPattern.exec(content)) !== null) {
    results.methodCalls.push(match[1]);
    results.hasUnifiedSyncUsage = true;
  }

  // 检查数据类型
  const dataTypePattern = /type:\s*['"]([^'"]+)['"]/g;
  while ((match = dataTypePattern.exec(content)) !== null) {
    results.dataTypes.push(match[1]);
  }

  return results;
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

// 验证系统集成
async function verifySystemIntegration() {
  console.log('🔍 开始验证系统集成 - 登录、经验系统、复习系统\n');
  console.log('=' .repeat(80));

  const results = {
    loginSystem: { files: [], totalIssues: 0 },
    experienceSystem: { files: [], totalIssues: 0 },
    reviewSystem: { files: [], totalIssues: 0 },
    summary: { totalFiles: 0, totalIssues: 0 }
  };

  try {
    // 验证登录系统
    console.log('\n🔐 验证登录系统集成:');
    console.log('-'.repeat(40));
    
    for (const filePath of SYSTEM_INTEGRATION_CONFIG.loginSystem.files) {
      console.log(`\n📄 检查文件: ${filePath}`);
      
      const content = readFile(filePath);
      if (!content) {
        console.log(`   ❌ 文件不存在或无法读取`);
        continue;
      }

      results.summary.totalFiles++;
      
      const syncUsage = checkUnifiedSyncUsage(content, filePath, 'loginSystem');
      const deprecatedIssues = checkDeprecatedUsage(content, filePath);
      
      results.loginSystem.files.push(syncUsage);
      
      if (syncUsage.hasUnifiedSyncImport) {
        console.log(`   ✅ 已导入统一同步服务`);
      } else {
        console.log(`   ❌ 缺少统一同步服务导入`);
        results.loginSystem.totalIssues++;
        results.summary.totalIssues++;
      }
      
      if (syncUsage.hasUnifiedSyncUsage) {
        console.log(`   ✅ 使用统一同步服务 (${syncUsage.methodCalls.length} 个方法调用)`);
        syncUsage.methodCalls.forEach(method => {
          console.log(`      - ${method}`);
        });
      } else {
        console.log(`   ❌ 未使用统一同步服务`);
        results.loginSystem.totalIssues++;
        results.summary.totalIssues++;
      }
      
      if (deprecatedIssues.length > 0) {
        console.log(`   ⚠️  发现废弃服务使用:`);
        deprecatedIssues.forEach(issue => {
          console.log(`      - ${issue}`);
          results.loginSystem.totalIssues++;
          results.summary.totalIssues++;
        });
      }
      
      syncUsage.issues.forEach(issue => {
        console.log(`   ❌ ${issue}`);
        results.loginSystem.totalIssues++;
        results.summary.totalIssues++;
      });
    }

    // 验证经验系统
    console.log('\n⭐ 验证经验系统集成:');
    console.log('-'.repeat(40));
    
    for (const filePath of SYSTEM_INTEGRATION_CONFIG.experienceSystem.files) {
      console.log(`\n📄 检查文件: ${filePath}`);
      
      const content = readFile(filePath);
      if (!content) {
        console.log(`   ❌ 文件不存在或无法读取`);
        continue;
      }

      results.summary.totalFiles++;
      
      const syncUsage = checkUnifiedSyncUsage(content, filePath, 'experienceSystem');
      const deprecatedIssues = checkDeprecatedUsage(content, filePath);
      
      results.experienceSystem.files.push(syncUsage);
      
      if (syncUsage.hasUnifiedSyncImport) {
        console.log(`   ✅ 已导入统一同步服务`);
      } else {
        console.log(`   ❌ 缺少统一同步服务导入`);
        results.experienceSystem.totalIssues++;
        results.summary.totalIssues++;
      }
      
      if (syncUsage.hasUnifiedSyncUsage) {
        console.log(`   ✅ 使用统一同步服务 (${syncUsage.methodCalls.length} 个方法调用)`);
        syncUsage.methodCalls.forEach(method => {
          console.log(`      - ${method}`);
        });
      } else {
        console.log(`   ❌ 未使用统一同步服务`);
        results.experienceSystem.totalIssues++;
        results.summary.totalIssues++;
      }
      
      if (deprecatedIssues.length > 0) {
        console.log(`   ⚠️  发现废弃服务使用:`);
        deprecatedIssues.forEach(issue => {
          console.log(`      - ${issue}`);
          results.experienceSystem.totalIssues++;
          results.summary.totalIssues++;
        });
      }
      
      syncUsage.issues.forEach(issue => {
        console.log(`   ❌ ${issue}`);
        results.experienceSystem.totalIssues++;
        results.summary.totalIssues++;
      });
    }

    // 验证复习系统
    console.log('\n📚 验证复习系统集成:');
    console.log('-'.repeat(40));
    
    for (const filePath of SYSTEM_INTEGRATION_CONFIG.reviewSystem.files) {
      console.log(`\n📄 检查文件: ${filePath}`);
      
      const content = readFile(filePath);
      if (!content) {
        console.log(`   ❌ 文件不存在或无法读取`);
        continue;
      }

      results.summary.totalFiles++;
      
      const syncUsage = checkUnifiedSyncUsage(content, filePath, 'reviewSystem');
      const deprecatedIssues = checkDeprecatedUsage(content, filePath);
      
      results.reviewSystem.files.push(syncUsage);
      
      if (syncUsage.hasUnifiedSyncImport) {
        console.log(`   ✅ 已导入统一同步服务`);
      } else {
        console.log(`   ❌ 缺少统一同步服务导入`);
        results.reviewSystem.totalIssues++;
        results.summary.totalIssues++;
      }
      
      if (syncUsage.hasUnifiedSyncUsage) {
        console.log(`   ✅ 使用统一同步服务 (${syncUsage.methodCalls.length} 个方法调用)`);
        syncUsage.methodCalls.forEach(method => {
          console.log(`      - ${method}`);
        });
      } else {
        console.log(`   ❌ 未使用统一同步服务`);
        results.reviewSystem.totalIssues++;
        results.summary.totalIssues++;
      }
      
      if (deprecatedIssues.length > 0) {
        console.log(`   ⚠️  发现废弃服务使用:`);
        deprecatedIssues.forEach(issue => {
          console.log(`      - ${issue}`);
          results.reviewSystem.totalIssues++;
          results.summary.totalIssues++;
        });
      }
      
      syncUsage.issues.forEach(issue => {
        console.log(`   ❌ ${issue}`);
        results.reviewSystem.totalIssues++;
        results.summary.totalIssues++;
      });
    }

    // 输出验证结果
    console.log('\n📊 系统集成验证结果:');
    console.log('=' .repeat(80));
    console.log(`   总文件数: ${results.summary.totalFiles}`);
    console.log(`   总问题数: ${results.summary.totalIssues}`);
    console.log(`   登录系统问题数: ${results.loginSystem.totalIssues}`);
    console.log(`   经验系统问题数: ${results.experienceSystem.totalIssues}`);
    console.log(`   复习系统问题数: ${results.reviewSystem.totalIssues}`);

    if (results.summary.totalIssues === 0) {
      console.log('\n✅ 系统集成验证通过！');
      console.log('✅ 登录系统正确使用统一同步方案');
      console.log('✅ 经验系统正确使用统一同步方案');
      console.log('✅ 复习系统正确使用统一同步方案');
      console.log('✅ 所有系统都已迁移到统一同步架构');
    } else {
      console.log('\n⚠️  发现系统集成问题:');
      
      if (results.loginSystem.totalIssues > 0) {
        console.log(`\n🔐 登录系统问题 (${results.loginSystem.totalIssues} 个):`);
        results.loginSystem.files.forEach(file => {
          if (file.issues.length > 0) {
            console.log(`   文件: ${file.filePath}`);
            file.issues.forEach(issue => {
              console.log(`   - ${issue}`);
            });
          }
        });
      }
      
      if (results.experienceSystem.totalIssues > 0) {
        console.log(`\n⭐ 经验系统问题 (${results.experienceSystem.totalIssues} 个):`);
        results.experienceSystem.files.forEach(file => {
          if (file.issues.length > 0) {
            console.log(`   文件: ${file.filePath}`);
            file.issues.forEach(issue => {
              console.log(`   - ${issue}`);
            });
          }
        });
      }
      
      if (results.reviewSystem.totalIssues > 0) {
        console.log(`\n📚 复习系统问题 (${results.reviewSystem.totalIssues} 个):`);
        results.reviewSystem.files.forEach(file => {
          if (file.issues.length > 0) {
            console.log(`   文件: ${file.filePath}`);
            file.issues.forEach(issue => {
              console.log(`   - ${issue}`);
            });
          }
        });
      }
    }

    // 保存详细报告
    const reportPath = `system-integration-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 详细报告已保存: ${reportPath}`);

  } catch (error) {
    console.error('❌ 验证过程失败:', error);
  }
}

// 运行验证
if (require.main === module) {
  verifySystemIntegration();
}

module.exports = {
  verifySystemIntegration,
  checkUnifiedSyncUsage,
  checkDeprecatedUsage
}; 