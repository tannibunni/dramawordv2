const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

async function clearAllUserData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 连接到MongoDB数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    const db = client.db('dramaword');
    
    console.log('\n🗑️  开始清除所有用户数据...');
    
    // 1. 清除用户主表
    console.log('\n👥 清除用户表 (users)...');
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`  当前用户数: ${userCount}`);
    
    if (userCount > 0) {
      const deleteResult = await usersCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个用户记录`);
    } else {
      console.log('  ℹ️  用户表已为空');
    }
    
    // 2. 清除设备表
    console.log('\n📱 清除设备表 (devices)...');
    const devicesCollection = db.collection('devices');
    const deviceCount = await devicesCollection.countDocuments();
    console.log(`  当前设备数: ${deviceCount}`);
    
    if (deviceCount > 0) {
      const deleteResult = await devicesCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个设备记录`);
    } else {
      console.log('  ℹ️  设备表已为空');
    }
    
    // 3. 清除用户进度表
    console.log('\n📊 清除用户进度表 (userprogresses)...');
    const userProgressCollection = db.collection('userprogresses');
    const progressCount = await userProgressCollection.countDocuments();
    console.log(`  当前进度记录数: ${progressCount}`);
    
    if (progressCount > 0) {
      const deleteResult = await userProgressCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个进度记录`);
    } else {
      console.log('  ℹ️  用户进度表已为空');
    }
    
    // 4. 清除用户词汇表
    console.log('\n📚 清除用户词汇表 (uservocabularies)...');
    const userVocabularyCollection = db.collection('uservocabularies');
    const vocabularyCount = await userVocabularyCollection.countDocuments();
    console.log(`  当前词汇记录数: ${vocabularyCount}`);
    
    if (vocabularyCount > 0) {
      const deleteResult = await userVocabularyCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个词汇记录`);
    } else {
      console.log('  ℹ️  用户词汇表已为空');
    }
    
    // 5. 清除学习记录表
    console.log('\n📝 清除学习记录表 (learningrecords)...');
    const learningRecordsCollection = db.collection('learningrecords');
    const learningCount = await learningRecordsCollection.countDocuments();
    console.log(`  当前学习记录数: ${learningCount}`);
    
    if (learningCount > 0) {
      const deleteResult = await learningRecordsCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个学习记录`);
    } else {
      console.log('  ℹ️  学习记录表已为空');
    }
    
    // 6. 清除经验记录表
    console.log('\n⭐ 清除经验记录表 (experiences)...');
    const experienceCollection = db.collection('experiences');
    const experienceCount = await experienceCollection.countDocuments();
    console.log(`  当前经验记录数: ${experienceCount}`);
    
    if (experienceCount > 0) {
      const deleteResult = await experienceCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个经验记录`);
    } else {
      console.log('  ℹ️  经验记录表已为空');
    }
    
    // 7. 清除徽章记录表
    console.log('\n🏆 清除徽章记录表 (badges)...');
    const badgesCollection = db.collection('badges');
    const badgesCount = await badgesCollection.countDocuments();
    console.log(`  当前徽章记录数: ${badgesCount}`);
    
    if (badgesCount > 0) {
      const deleteResult = await badgesCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个徽章记录`);
    } else {
      console.log('  ℹ️  徽章记录表已为空');
    }
    
    // 8. 清除同步数据表
    console.log('\n🔄 清除同步数据表 (syncdata)...');
    const syncCollection = db.collection('syncdata');
    const syncCount = await syncCollection.countDocuments();
    console.log(`  当前同步记录数: ${syncCount}`);
    
    if (syncCount > 0) {
      const deleteResult = await syncCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个同步记录`);
    } else {
      console.log('  ℹ️  同步数据表已为空');
    }
    
    // 9. 清除数据版本表
    console.log('\n📋 清除数据版本表 (dataversions)...');
    const dataVersionsCollection = db.collection('dataversions');
    const dataVersionsCount = await dataVersionsCollection.countDocuments();
    console.log(`  当前数据版本记录数: ${dataVersionsCount}`);
    
    if (dataVersionsCount > 0) {
      const deleteResult = await dataVersionsCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个数据版本记录`);
    } else {
      console.log('  ℹ️  数据版本表已为空');
    }
    
    // 10. 清除用户设置表
    console.log('\n⚙️  清除用户设置表 (usersettings)...');
    const userSettingsCollection = db.collection('usersettings');
    const settingsCount = await userSettingsCollection.countDocuments();
    console.log(`  当前设置记录数: ${settingsCount}`);
    
    if (settingsCount > 0) {
      const deleteResult = await userSettingsCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个设置记录`);
    } else {
      console.log('  ℹ️  用户设置表已为空');
    }
    
    // 11. 清除用户显示列表表
    console.log('\n📺 清除用户显示列表表 (usershowlists)...');
    const userShowListsCollection = db.collection('usershowlists');
    const showListsCount = await userShowListsCollection.countDocuments();
    console.log(`  当前显示列表记录数: ${showListsCount}`);
    
    if (showListsCount > 0) {
      const deleteResult = await userShowListsCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个显示列表记录`);
    } else {
      console.log('  ℹ️  用户显示列表表已为空');
    }
    
    // 12. 清除Apple设备表
    console.log('\n🍎 清除Apple设备表 (appledevices)...');
    const appleDevicesCollection = db.collection('appledevices');
    const appleDevicesCount = await appleDevicesCollection.countDocuments();
    console.log(`  当前Apple设备记录数: ${appleDevicesCount}`);
    
    if (appleDevicesCount > 0) {
      const deleteResult = await appleDevicesCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个Apple设备记录`);
    } else {
      console.log('  ℹ️  Apple设备表已为空');
    }
    
    // 13. 清除Apple同步数据表
    console.log('\n🍎 清除Apple同步数据表 (applesyncdata)...');
    const appleSyncDataCollection = db.collection('applesyncdata');
    const appleSyncDataCount = await appleSyncDataCollection.countDocuments();
    console.log(`  当前Apple同步数据记录数: ${appleSyncDataCount}`);
    
    if (appleSyncDataCount > 0) {
      const deleteResult = await appleSyncDataCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个Apple同步数据记录`);
    } else {
      console.log('  ℹ️  Apple同步数据表已为空');
    }
    
    // 14. 清除用户显示词包表
    console.log('\n📦 清除用户显示词包表 (showwordpackages)...');
    const showWordPackagesCollection = db.collection('showwordpackages');
    const showWordPackagesCount = await showWordPackagesCollection.countDocuments();
    console.log(`  当前显示词包记录数: ${showWordPackagesCount}`);
    
    if (showWordPackagesCount > 0) {
      const deleteResult = await showWordPackagesCollection.deleteMany({});
      console.log(`  ✅ 已删除 ${deleteResult.deletedCount} 个显示词包记录`);
    } else {
      console.log('  ℹ️  显示词包表已为空');
    }
    
    console.log('\n🎉 所有用户数据清除完成！');
    console.log('\n📊 清除后的数据库状态:');
    
    // 显示清除后的统计信息
    const finalUserCount = await usersCollection.countDocuments();
    const finalDeviceCount = await devicesCollection.countDocuments();
    const finalProgressCount = await userProgressCollection.countDocuments();
    const finalVocabularyCount = await userVocabularyCollection.countDocuments();
    const finalLearningCount = await learningRecordsCollection.countDocuments();
    const finalExperienceCount = await experienceCollection.countDocuments();
    const finalBadgesCount = await badgesCollection.countDocuments();
    const finalSyncCount = await syncCollection.countDocuments();
    
    console.log(`  用户数: ${finalUserCount}`);
    console.log(`  设备数: ${finalDeviceCount}`);
    console.log(`  进度记录数: ${finalProgressCount}`);
    console.log(`  词汇记录数: ${finalVocabularyCount}`);
    console.log(`  学习记录数: ${finalLearningCount}`);
    console.log(`  经验记录数: ${finalExperienceCount}`);
    console.log(`  徽章记录数: ${finalBadgesCount}`);
    console.log(`  同步记录数: ${finalSyncCount}`);
    
    console.log('\n✅ 数据库清理完成，所有用户相关数据已清除！');
    
  } catch (error) {
    console.error('❌ 清除用户数据时发生错误:', error);
  } finally {
    await client.close();
    console.log('\n📴 数据库连接已关闭');
  }
}

// 执行清除操作
clearAllUserData().catch(console.error);
