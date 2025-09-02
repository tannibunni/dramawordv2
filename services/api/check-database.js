const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

async function checkDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 连接到MongoDB数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    const db = client.db('dramaword');
    
    // 获取所有集合
    console.log('\n📋 数据库集合列表:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    // 检查用户数据
    console.log('\n👥 用户数据统计:');
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`  总用户数: ${userCount}`);
    
    if (userCount > 0) {
      console.log('\n📊 用户详情:');
      const users = await usersCollection.find({}).limit(5).toArray();
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user._id}`);
        console.log(`     昵称: ${user.nickname || 'N/A'}`);
        console.log(`     邮箱: ${user.email || 'N/A'}`);
        console.log(`     创建时间: ${user.createdAt || 'N/A'}`);
        console.log(`     最后登录: ${user.lastLoginAt || 'N/A'}`);
        console.log('');
      });
    }
    
    // 检查设备数据
    console.log('\n📱 设备数据统计:');
    const devicesCollection = db.collection('devices');
    const deviceCount = await devicesCollection.countDocuments();
    console.log(`  总设备数: ${deviceCount}`);
    
    if (deviceCount > 0) {
      console.log('\n📊 设备详情:');
      const devices = await devicesCollection.find({}).limit(5).toArray();
      devices.forEach((device, index) => {
        console.log(`  ${index + 1}. 设备ID: ${device.deviceId}`);
        console.log(`     设备名称: ${device.deviceName || 'N/A'}`);
        console.log(`     设备类型: ${device.deviceType || 'N/A'}`);
        console.log(`     用户ID: ${device.userId || 'N/A'}`);
        console.log(`     是否初始化: ${device.isInitialized || false}`);
        console.log(`     最后同步: ${device.lastSyncTime || 'N/A'}`);
        console.log('');
      });
    }
    
    // 检查数据版本
    console.log('\n📦 数据版本统计:');
    const dataVersionsCollection = db.collection('dataVersions');
    const versionCount = await dataVersionsCollection.countDocuments();
    console.log(`  总版本数: ${versionCount}`);
    
    if (versionCount > 0) {
      console.log('\n📊 数据版本详情:');
      const versions = await dataVersionsCollection.find({}).limit(5).toArray();
      versions.forEach((version, index) => {
        console.log(`  ${index + 1}. 版本: ${version.version}`);
        console.log(`     数据类型: ${version.dataType || 'N/A'}`);
        console.log(`     用户ID: ${version.userId || 'N/A'}`);
        console.log(`     设备ID: ${version.deviceId || 'N/A'}`);
        console.log(`     时间戳: ${version.timestamp || 'N/A'}`);
        console.log(`     数据大小: ${version.metadata?.size || 0} bytes`);
        console.log('');
      });
    }
    
    // 检查同步数据
    console.log('\n🔄 同步数据统计:');
    const syncCollection = db.collection('syncData');
    const syncCount = await syncCollection.countDocuments();
    console.log(`  总同步记录数: ${syncCount}`);
    
    if (syncCount > 0) {
      console.log('\n📊 同步记录详情:');
      const syncRecords = await syncCollection.find({}).limit(5).toArray();
      syncRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. 用户ID: ${record.userId}`);
        console.log(`     数据类型: ${record.type || 'N/A'}`);
        console.log(`     操作: ${record.operation || 'N/A'}`);
        console.log(`     时间戳: ${record.timestamp || 'N/A'}`);
        console.log(`     状态: ${record.status || 'N/A'}`);
        console.log('');
      });
    }
    
    // 检查词汇数据
    console.log('\n📚 词汇数据统计:');
    const wordsCollection = db.collection('words');
    const wordCount = await wordsCollection.countDocuments();
    console.log(`  总词汇数: ${wordCount}`);
    
    // 检查学习记录
    console.log('\n📖 学习记录统计:');
    const learningRecordsCollection = db.collection('learningRecords');
    const learningCount = await learningRecordsCollection.countDocuments();
    console.log(`  总学习记录数: ${learningCount}`);
    
    // 检查经验值数据
    console.log('\n⭐ 经验值数据统计:');
    const experienceCollection = db.collection('experience');
    const experienceCount = await experienceCollection.countDocuments();
    console.log(`  总经验值记录数: ${experienceCount}`);
    
    // 检查徽章数据
    console.log('\n🏆 徽章数据统计:');
    const badgesCollection = db.collection('badges');
    const badgeCount = await badgesCollection.countDocuments();
    console.log(`  总徽章记录数: ${badgeCount}`);
    
    console.log('\n✅ 数据库检查完成');
    
  } catch (error) {
    console.error('❌ 数据库检查失败:', error);
  } finally {
    await client.close();
    console.log('🔌 数据库连接已关闭');
  }
}

checkDatabase();
