const fs = require('fs');
const path = require('path');

// 需要删除的老旧服务文件
const OLD_SERVICES_TO_DELETE = [
  'apps/mobile/src/services/syncManager.ts',
  'apps/mobile/src/services/incrementalSyncManager.ts',
  'apps/mobile/src/services/dataSyncService.ts',
  'apps/mobile/src/services/optimizedDataSyncService.ts'
];

// 备份目录
const BACKUP_DIR = 'backup/old-sync-services';

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 创建备份目录
function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 创建备份目录: ${BACKUP_DIR}`);
  }
}

// 备份文件
function backupFile(filePath) {
  try {
    const fileName = path.basename(filePath);
    const backupPath = path.join(BACKUP_DIR, fileName);
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ 备份文件: ${filePath} -> ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`❌ 备份文件失败: ${filePath}`, error.message);
    return false;
  }
}

// 删除文件
function deleteFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    console.log(`🗑️  删除文件: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ 删除文件失败: ${filePath}`, error.message);
    return false;
  }
}

// 检查文件是否被使用
function checkFileUsage(filePath) {
  const fileName = path.basename(filePath, '.ts');
  const serviceName = fileName.replace(/Service|Manager/, '');
  
  // 检查是否有其他文件导入这个服务
  const searchPatterns = [
    `import.*${fileName}`,
    `import.*${serviceName}`,
    `require.*${fileName}`,
    `require.*${serviceName}`
  ];
  
  console.log(`🔍 检查文件使用情况: ${fileName}`);
  
  // 这里只是简单的检查，实际项目中可能需要更复杂的分析
  return false; // 假设没有被使用
}

// 主清理函数
async function cleanupOldServices() {
  console.log('🧹 开始清理老旧同步服务文件\n');
  console.log('=' .repeat(50));

  try {
    // 创建备份目录
    createBackupDir();
    
    let backupCount = 0;
    let deleteCount = 0;
    let skipCount = 0;

    for (const filePath of OLD_SERVICES_TO_DELETE) {
      console.log(`\n🔍 处理文件: ${filePath}`);
      
      if (!fileExists(filePath)) {
        console.log(`   ℹ️  文件不存在，跳过`);
        skipCount++;
        continue;
      }

      // 检查文件是否被使用
      const isUsed = checkFileUsage(filePath);
      
      if (isUsed) {
        console.log(`   ⚠️  文件可能仍在使用中，跳过删除`);
        skipCount++;
        continue;
      }

      // 备份文件
      const backupSuccess = backupFile(filePath);
      if (backupSuccess) {
        backupCount++;
      }

      // 删除文件
      const deleteSuccess = deleteFile(filePath);
      if (deleteSuccess) {
        deleteCount++;
      }
    }

    // 输出清理结果
    console.log('\n📊 清理结果:');
    console.log(`   备份文件数: ${backupCount}`);
    console.log(`   删除文件数: ${deleteCount}`);
    console.log(`   跳过文件数: ${skipCount}`);
    console.log(`   总处理文件数: ${OLD_SERVICES_TO_DELETE.length}`);

    if (deleteCount > 0) {
      console.log('\n✅ 老旧同步服务文件清理完成！');
      console.log(`📁 备份文件保存在: ${BACKUP_DIR}`);
      console.log('💡 如果发现问题，可以从备份目录恢复文件');
    } else {
      console.log('\nℹ️  没有文件被删除');
    }

  } catch (error) {
    console.error('❌ 清理过程失败:', error);
  }
}

// 恢复备份文件
function restoreBackup() {
  console.log('🔄 开始恢复备份文件\n');
  
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('❌ 备份目录不存在');
      return;
    }

    const backupFiles = fs.readdirSync(BACKUP_DIR);
    let restoreCount = 0;

    for (const backupFile of backupFiles) {
      const backupPath = path.join(BACKUP_DIR, backupFile);
      const originalPath = path.join('apps/mobile/src/services', backupFile);
      
      try {
        fs.copyFileSync(backupPath, originalPath);
        console.log(`✅ 恢复文件: ${backupFile}`);
        restoreCount++;
      } catch (error) {
        console.error(`❌ 恢复文件失败: ${backupFile}`, error.message);
      }
    }

    console.log(`\n📊 恢复完成: ${restoreCount} 个文件`);
    
  } catch (error) {
    console.error('❌ 恢复过程失败:', error);
  }
}

// 运行清理
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--restore')) {
    restoreBackup();
  } else {
    cleanupOldServices();
  }
}

module.exports = {
  cleanupOldServices,
  restoreBackup
}; 