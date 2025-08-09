const fs = require('fs');
const path = require('path');

// 测试配置
const TEST_CONFIG = {
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
    'apps/mobile/src/components/learning/DataIntegrationTest.tsx'
  ],
  
  // 废弃的同步服务
  deprecatedServices: [
    'syncManager',
    'incrementalSyncManager', 
    'dataSyncService',
    'optimizedDataSyncService',
    'DataSyncService'
  ],
  
  // 新的统一同步服务
  newService: 'unifiedSyncService'
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

// 检查文件中的导入
function checkImports(filePath, content) {
  const lines = content.split('\n');
  const imports = [];
  
  lines.forEach((line, index) => {
    // 检查导入语句
    const importMatch = line.match(/import\s+.*from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const importPath = importMatch[1];
      
      // 检查是否导入了废弃的同步服务
      TEST_CONFIG.deprecatedServices.forEach(deprecatedService => {
        if (importPath.includes(deprecatedService)) {
          imports.push({
            line: index + 1,
            content: line.trim(),
            service: deprecatedService,
            filePath
          });
        }
      });
      
      // 检查是否导入了新的统一同步服务
      if (importPath.includes(TEST_CONFIG.newService)) {
        imports.push({
          line: index + 1,
          content: line.trim(),
          service: TEST_CONFIG.newService,
          filePath,
          isNew: true
        });
      }
    }
  });
  
  return imports;
}

// 检查文件中的使用
function checkUsage(filePath, content) {
  const usages = [];
  
  // 检查废弃服务的使用
  TEST_CONFIG.deprecatedServices.forEach(deprecatedService => {
    const usagePattern = new RegExp(`\\b${deprecatedService}\\b`, 'g');
    const matches = content.match(usagePattern);
    
    if (matches) {
      usages.push({
        service: deprecatedService,
        count: matches.length,
        filePath
      });
    }
  });
  
  // 检查新服务的使用
  const newUsagePattern = new RegExp(`\\b${TEST_CONFIG.newService}\\b`, 'g');
  const newMatches = content.match(newUsagePattern);
  
  if (newMatches) {
    usages.push({
      service: TEST_CONFIG.newService,
      count: newMatches.length,
      filePath,
      isNew: true
    });
  }
  
  return usages;
}

// 生成测试报告
function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.length,
      filesWithDeprecatedImports: 0,
      filesWithNewImports: 0,
      totalDeprecatedUsages: 0,
      totalNewUsages: 0
    },
    details: results,
    recommendations: []
  };
  
  results.forEach(result => {
    if (result.deprecatedImports.length > 0) {
      report.summary.filesWithDeprecatedImports++;
    }
    if (result.newImports.length > 0) {
      report.summary.filesWithNewImports++;
    }
    
    result.deprecatedUsages.forEach(usage => {
      report.summary.totalDeprecatedUsages += usage.count;
    });
    
    result.newUsages.forEach(usage => {
      report.summary.totalNewUsages += usage.count;
    });
  });
  
  // 生成建议
  if (report.summary.filesWithDeprecatedImports > 0) {
    report.recommendations.push('⚠️ 发现废弃的同步服务导入，需要更新为统一同步服务');
  }
  
  if (report.summary.totalDeprecatedUsages > 0) {
    report.recommendations.push('⚠️ 发现废弃的同步服务使用，需要替换为统一同步服务');
  }
  
  if (report.summary.filesWithNewImports === 0) {
    report.recommendations.push('❌ 没有文件导入新的统一同步服务');
  }
  
  if (report.summary.totalNewUsages === 0) {
    report.recommendations.push('❌ 没有文件使用新的统一同步服务');
  }
  
  if (report.summary.filesWithNewImports > 0 && report.summary.totalNewUsages > 0) {
    report.recommendations.push('✅ 统一同步服务已正确集成');
  }
  
  return report;
}

// 主测试函数
async function runIntegrationTest() {
  console.log('🧪 开始统一同步系统集成测试\n');
  console.log('=' .repeat(60));

  const results = [];

  try {
    // 检查每个文件
    for (const filePath of TEST_CONFIG.filesToCheck) {
      console.log(`🔍 检查文件: ${filePath}`);
      
      const content = readFile(filePath);
      if (!content) {
        console.log(`   ❌ 文件不存在或无法读取`);
        continue;
      }

      const imports = checkImports(filePath, content);
      const usages = checkUsage(filePath, content);
      
      const deprecatedImports = imports.filter(imp => !imp.isNew);
      const newImports = imports.filter(imp => imp.isNew);
      const deprecatedUsages = usages.filter(usage => !usage.isNew);
      const newUsages = usages.filter(usage => usage.isNew);

      const result = {
        filePath,
        deprecatedImports,
        newImports,
        deprecatedUsages,
        newUsages
      };

      results.push(result);

      // 输出检查结果
      if (deprecatedImports.length > 0) {
        console.log(`   ⚠️  发现 ${deprecatedImports.length} 个废弃导入:`);
        deprecatedImports.forEach(imp => {
          console.log(`      - 第${imp.line}行: ${imp.content}`);
        });
      }

      if (newImports.length > 0) {
        console.log(`   ✅ 发现 ${newImports.length} 个新导入:`);
        newImports.forEach(imp => {
          console.log(`      - 第${imp.line}行: ${imp.content}`);
        });
      }

      if (deprecatedUsages.length > 0) {
        console.log(`   ⚠️  发现 ${deprecatedUsages.length} 个废弃使用:`);
        deprecatedUsages.forEach(usage => {
          console.log(`      - ${usage.service}: ${usage.count} 次使用`);
        });
      }

      if (newUsages.length > 0) {
        console.log(`   ✅ 发现 ${newUsages.length} 个新使用:`);
        newUsages.forEach(usage => {
          console.log(`      - ${usage.service}: ${usage.count} 次使用`);
        });
      }

      if (deprecatedImports.length === 0 && deprecatedUsages.length === 0 && 
          newImports.length === 0 && newUsages.length === 0) {
        console.log(`   ℹ️  未发现同步相关代码`);
      }

      console.log('');
    }

    // 生成测试报告
    console.log('📊 生成测试报告...\n');
    const report = generateTestReport(results);

    // 输出报告摘要
    console.log('📋 测试报告摘要:');
    console.log(`   总文件数: ${report.summary.totalFiles}`);
    console.log(`   包含废弃导入的文件: ${report.summary.filesWithDeprecatedImports}`);
    console.log(`   包含新导入的文件: ${report.summary.filesWithNewImports}`);
    console.log(`   废弃服务使用次数: ${report.summary.totalDeprecatedUsages}`);
    console.log(`   新服务使用次数: ${report.summary.totalNewUsages}`);

    console.log('\n💡 建议:');
    report.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });

    // 保存详细报告
    const reportPath = `unified-sync-integration-test-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存: ${reportPath}`);

    // 测试结果总结
    console.log('\n🎯 测试结果:');
    if (report.summary.filesWithDeprecatedImports === 0 && 
        report.summary.totalDeprecatedUsages === 0 &&
        report.summary.filesWithNewImports > 0 &&
        report.summary.totalNewUsages > 0) {
      console.log('   ✅ 统一同步系统集成成功！');
      console.log('   ✅ 所有废弃的同步服务已被正确替换');
      console.log('   ✅ 新的统一同步服务已正确集成');
    } else {
      console.log('   ⚠️  统一同步系统集成需要进一步检查');
      if (report.summary.filesWithDeprecatedImports > 0) {
        console.log('   ⚠️  仍有文件导入废弃的同步服务');
      }
      if (report.summary.totalDeprecatedUsages > 0) {
        console.log('   ⚠️  仍有代码使用废弃的同步服务');
      }
      if (report.summary.filesWithNewImports === 0) {
        console.log('   ❌ 没有文件导入新的统一同步服务');
      }
      if (report.summary.totalNewUsages === 0) {
        console.log('   ❌ 没有代码使用新的统一同步服务');
      }
    }

  } catch (error) {
    console.error('❌ 集成测试失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  runIntegrationTest();
}

module.exports = {
  checkImports,
  checkUsage,
  generateTestReport,
  runIntegrationTest
}; 