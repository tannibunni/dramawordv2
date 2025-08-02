const fs = require('fs');
const path = require('path');

// 迁移配置
const MIGRATION_CONFIG = {
  // 需要废弃的同步服务文件
  deprecatedServices: [
    'apps/mobile/src/services/syncManager.ts',
    'apps/mobile/src/services/incrementalSyncManager.ts',
    'apps/mobile/src/services/dataSyncService.ts',
    'apps/mobile/src/services/optimizedDataSyncService.ts'
  ],
  
  // 需要更新的导入文件
  filesToUpdate: [
    'apps/mobile/src/screens/Review/ReviewIntroScreen.tsx',
    'apps/mobile/src/services/experienceManager.ts',
    'apps/mobile/src/App.tsx'
  ],
  
  // 新的统一同步服务
  newService: 'apps/mobile/src/services/unifiedSyncService.ts'
};

// 检查文件是否存在
function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

// 读取文件内容
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ 读取文件失败: ${filePath}`, error.message);
    return null;
  }
}

// 写入文件内容
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ 写入文件失败: ${filePath}`, error.message);
    return false;
  }
}

// 备份文件
function backupFile(filePath) {
  const backupPath = `${filePath}.backup.${Date.now()}`;
  try {
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ 备份文件: ${filePath} -> ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error(`❌ 备份文件失败: ${filePath}`, error.message);
    return null;
  }
}

// 检查废弃的同步服务
function checkDeprecatedServices() {
  console.log('🔍 检查废弃的同步服务...\n');
  
  const foundServices = [];
  
  MIGRATION_CONFIG.deprecatedServices.forEach(servicePath => {
    if (checkFileExists(servicePath)) {
      foundServices.push(servicePath);
      console.log(`⚠️  发现废弃的同步服务: ${servicePath}`);
    }
  });
  
  if (foundServices.length === 0) {
    console.log('✅ 未发现废弃的同步服务');
  } else {
    console.log(`\n📋 发现 ${foundServices.length} 个废弃的同步服务`);
  }
  
  return foundServices;
}

// 检查新统一同步服务
function checkNewUnifiedService() {
  console.log('\n🔍 检查新的统一同步服务...\n');
  
  if (checkFileExists(MIGRATION_CONFIG.newService)) {
    console.log(`✅ 统一同步服务已存在: ${MIGRATION_CONFIG.newService}`);
    return true;
  } else {
    console.log(`❌ 统一同步服务不存在: ${MIGRATION_CONFIG.newService}`);
    return false;
  }
}

// 分析文件中的导入
function analyzeImports(filePath) {
  const content = readFile(filePath);
  if (!content) return null;
  
  const imports = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // 检查导入语句
    const importMatch = line.match(/import\s+.*from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const importPath = importMatch[1];
      
      // 检查是否导入了废弃的同步服务
      MIGRATION_CONFIG.deprecatedServices.forEach(deprecatedService => {
        const serviceName = path.basename(deprecatedService, '.ts');
        if (importPath.includes(serviceName)) {
          imports.push({
            line: index + 1,
            content: line.trim(),
            service: serviceName,
            filePath
          });
        }
      });
    }
  });
  
  return imports;
}

// 更新文件中的导入
function updateImports(filePath) {
  console.log(`🔄 更新文件导入: ${filePath}`);
  
  const content = readFile(filePath);
  if (!content) return false;
  
  let updatedContent = content;
  let updated = false;
  
  // 备份原文件
  const backupPath = backupFile(filePath);
  if (!backupPath) return false;
  
  // 替换导入语句
  MIGRATION_CONFIG.deprecatedServices.forEach(deprecatedService => {
    const serviceName = path.basename(deprecatedService, '.ts');
    const oldImportPattern = new RegExp(`import\\s+.*from\\s+['"][^'"]*${serviceName}[^'"]*['"]`, 'g');
    const newImport = `import { unifiedSyncService } from '../services/unifiedSyncService';`;
    
    if (oldImportPattern.test(updatedContent)) {
      updatedContent = updatedContent.replace(oldImportPattern, newImport);
      updated = true;
      console.log(`   ✅ 替换导入: ${serviceName} -> unifiedSyncService`);
    }
  });
  
  // 替换使用语句
  const usageReplacements = [
    { old: 'syncManager', new: 'unifiedSyncService' },
    { old: 'incrementalSyncManager', new: 'unifiedSyncService' },
    { old: 'dataSyncService', new: 'unifiedSyncService' },
    { old: 'optimizedDataSyncService', new: 'unifiedSyncService' }
  ];
  
  usageReplacements.forEach(replacement => {
    const oldPattern = new RegExp(`\\b${replacement.old}\\b`, 'g');
    if (oldPattern.test(updatedContent)) {
      updatedContent = updatedContent.replace(oldPattern, replacement.new);
      updated = true;
      console.log(`   ✅ 替换使用: ${replacement.old} -> ${replacement.new}`);
    }
  });
  
  if (updated) {
    const success = writeFile(filePath, updatedContent);
    if (success) {
      console.log(`   ✅ 文件更新成功: ${filePath}`);
      return true;
    } else {
      console.log(`   ❌ 文件更新失败: ${filePath}`);
      return false;
    }
  } else {
    console.log(`   ℹ️  文件无需更新: ${filePath}`);
    return true;
  }
}

// 生成迁移报告
function generateMigrationReport(deprecatedServices, updatedFiles) {
  const report = {
    timestamp: new Date().toISOString(),
    deprecatedServicesFound: deprecatedServices.length,
    filesUpdated: updatedFiles.length,
    summary: {
      total: deprecatedServices.length + updatedFiles.length,
      success: updatedFiles.length,
      failed: 0
    }
  };
  
  const reportPath = `migration-report-${Date.now()}.json`;
  writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📊 迁移报告已生成: ${reportPath}`);
  return report;
}

// 生成迁移指南
function generateMigrationGuide() {
  const guide = `
# 统一同步系统迁移指南

## 概述
本指南帮助您从多套同步系统迁移到统一的同步系统。

## 迁移步骤

### 1. 备份现有代码
在开始迁移前，请确保备份了所有相关文件。

### 2. 更新导入语句
将所有对旧同步服务的导入更新为统一同步服务：

\`\`\`typescript
// 旧导入
import { syncManager } from '../services/syncManager';
import { incrementalSyncManager } from '../services/incrementalSyncManager';
import { dataSyncService } from '../services/dataSyncService';
import { optimizedDataSyncService } from '../services/optimizedDataSyncService';

// 新导入
import { unifiedSyncService } from '../services/unifiedSyncService';
\`\`\`

### 3. 更新使用方式
将所有对旧同步服务的使用更新为统一同步服务：

\`\`\`typescript
// 旧使用方式
syncManager.addToSyncQueue(data);
incrementalSyncManager.recordChange(type, operation, data);
dataSyncService.syncAllData();
optimizedDataSyncService.addToQueue(item);

// 新使用方式
unifiedSyncService.addToSyncQueue(data);
unifiedSyncService.addToSyncQueue({
  type,
  data,
  userId,
  operation,
  priority: 'medium'
});
\`\`\`

### 4. 迁移数据
在应用启动时调用迁移方法：

\`\`\`typescript
// 在 App.tsx 或应用初始化时
import { unifiedSyncService } from './services/unifiedSyncService';

// 迁移旧同步数据
await unifiedSyncService.migrateOldSyncData();
\`\`\`

### 5. 验证迁移
运行测试脚本验证迁移是否成功：

\`\`\`bash
node scripts/test-unified-sync.js
\`\`\`

## 废弃的同步服务
以下同步服务已被废弃，请使用统一同步服务替代：

- syncManager.ts - 多邻国风格同步管理器
- incrementalSyncManager.ts - 增量同步管理器
- dataSyncService.ts - 基础数据同步服务
- optimizedDataSyncService.ts - 优化的数据同步服务

## 统一同步服务特性
- 网络感知同步
- 用户活跃度感知
- 智能冲突解决
- 增量同步
- 版本控制
- 离线优先策略
- 统一配置管理

## 注意事项
1. 迁移过程中会自动备份原文件
2. 建议在测试环境中先进行迁移
3. 迁移后请验证所有同步功能正常工作
4. 如有问题，可以使用备份文件恢复

## 支持
如遇到迁移问题，请查看迁移报告或联系开发团队。
`;

  const guidePath = 'MIGRATION_GUIDE.md';
  writeFile(guidePath, guide);
  console.log(`\n📖 迁移指南已生成: ${guidePath}`);
}

// 主迁移函数
async function performMigration() {
  console.log('🚀 开始统一同步系统迁移\n');
  console.log('=' .repeat(50));

  try {
    // 1. 检查废弃的同步服务
    const deprecatedServices = checkDeprecatedServices();
    
    // 2. 检查新的统一同步服务
    const hasUnifiedService = checkNewUnifiedService();
    
    if (!hasUnifiedService) {
      console.log('\n❌ 统一同步服务不存在，请先创建该服务');
      return;
    }
    
    // 3. 分析需要更新的文件
    console.log('\n🔍 分析需要更新的文件...\n');
    const filesToUpdate = [];
    
    MIGRATION_CONFIG.filesToUpdate.forEach(filePath => {
      if (checkFileExists(filePath)) {
        const imports = analyzeImports(filePath);
        if (imports && imports.length > 0) {
          filesToUpdate.push(filePath);
          console.log(`⚠️  发现需要更新的文件: ${filePath}`);
          imports.forEach(importInfo => {
            console.log(`   - 第${importInfo.line}行: ${importInfo.content}`);
          });
        }
      }
    });
    
    if (filesToUpdate.length === 0) {
      console.log('✅ 未发现需要更新的文件');
    }
    
    // 4. 执行迁移
    console.log('\n🔄 开始执行迁移...\n');
    const updatedFiles = [];
    
    for (const filePath of filesToUpdate) {
      const success = updateImports(filePath);
      if (success) {
        updatedFiles.push(filePath);
      }
    }
    
    // 5. 生成迁移报告
    console.log('\n📊 生成迁移报告...\n');
    const report = generateMigrationReport(deprecatedServices, updatedFiles);
    
    // 6. 生成迁移指南
    generateMigrationGuide();
    
    // 7. 迁移总结
    console.log('\n✅ 迁移完成！\n');
    console.log('📋 迁移总结:');
    console.log(`   - 发现 ${deprecatedServices.length} 个废弃的同步服务`);
    console.log(`   - 更新了 ${updatedFiles.length} 个文件`);
    console.log(`   - 生成了迁移报告和指南`);
    
    console.log('\n🎯 下一步:');
    console.log('   1. 验证所有同步功能正常工作');
    console.log('   2. 运行测试脚本确认迁移成功');
    console.log('   3. 在应用启动时调用 migrateOldSyncData()');
    console.log('   4. 确认无误后可以删除废弃的同步服务文件');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
  }
}

// 运行迁移
if (require.main === module) {
  performMigration();
}

module.exports = {
  checkDeprecatedServices,
  checkNewUnifiedService,
  analyzeImports,
  updateImports,
  generateMigrationReport,
  generateMigrationGuide,
  performMigration
}; 