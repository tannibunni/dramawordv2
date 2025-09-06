/**
 * 数据库索引优化脚本
 * 创建关键索引以提升查询性能
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';
const DB_NAME = 'dramaword';

async function optimizeDatabaseIndexes() {
  let client;
  
  try {
    console.log('🚀 开始优化数据库索引...');
    
    // 连接数据库
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    const db = client.db(DB_NAME);
    
    // 1. 用户表索引优化
    console.log('\n👥 优化用户表索引...');
    const usersCollection = db.collection('users');
    
    await usersCollection.createIndex({ "email": 1 }, { unique: true, sparse: true });
    console.log('  ✅ 邮箱唯一索引');
    
    await usersCollection.createIndex({ "appleId": 1 }, { unique: true, sparse: true });
    console.log('  ✅ Apple ID唯一索引');
    
    await usersCollection.createIndex({ "lastLoginAt": -1 });
    console.log('  ✅ 最后登录时间索引');
    
    await usersCollection.createIndex({ "createdAt": -1 });
    console.log('  ✅ 创建时间索引');
    
    await usersCollection.createIndex({ "isActive": 1, "lastLoginAt": -1 });
    console.log('  ✅ 活跃用户复合索引');
    
    // 2. 学习记录表索引优化
    console.log('\n📚 优化学习记录表索引...');
    const learningRecordsCollection = db.collection('learningrecords');
    
    await learningRecordsCollection.createIndex({ "userId": 1, "createdAt": -1 });
    console.log('  ✅ 用户学习记录复合索引');
    
    await learningRecordsCollection.createIndex({ "wordId": 1, "userId": 1 });
    console.log('  ✅ 单词学习记录复合索引');
    
    await learningRecordsCollection.createIndex({ "createdAt": -1 });
    console.log('  ✅ 创建时间索引');
    
    await learningRecordsCollection.createIndex({ "userId": 1, "wordId": 1, "createdAt": -1 });
    console.log('  ✅ 用户单词时间复合索引');
    
    await learningRecordsCollection.createIndex({ "reviewCount": -1, "createdAt": -1 });
    console.log('  ✅ 复习次数时间复合索引');
    
    // 3. 词汇数据表索引优化
    console.log('\n📖 优化词汇数据表索引...');
    const cloudWordsCollection = db.collection('cloudwords');
    
    await cloudWordsCollection.createIndex({ "userId": 1, "word": 1 });
    console.log('  ✅ 用户词汇复合索引');
    
    await cloudWordsCollection.createIndex({ "userId": 1, "createdAt": -1 });
    console.log('  ✅ 用户创建时间复合索引');
    
    await cloudWordsCollection.createIndex({ "word": "text" });
    console.log('  ✅ 词汇文本搜索索引');
    
    await cloudWordsCollection.createIndex({ "userId": 1, "isLearned": 1 });
    console.log('  ✅ 用户学习状态复合索引');
    
    await cloudWordsCollection.createIndex({ "userId": 1, "difficulty": 1 });
    console.log('  ✅ 用户难度复合索引');
    
    // 4. 剧单数据表索引优化
    console.log('\n🎬 优化剧单数据表索引...');
    const showsCollection = db.collection('shows');
    
    await showsCollection.createIndex({ "userId": 1, "createdAt": -1 });
    console.log('  ✅ 用户剧单时间复合索引');
    
    await showsCollection.createIndex({ "userId": 1, "isActive": 1 });
    console.log('  ✅ 用户活跃剧单复合索引');
    
    await showsCollection.createIndex({ "showName": "text" });
    console.log('  ✅ 剧单名称文本搜索索引');
    
    await showsCollection.createIndex({ "userId": 1, "showType": 1 });
    console.log('  ✅ 用户剧单类型复合索引');
    
    // 5. 设备表索引优化
    console.log('\n📱 优化设备表索引...');
    const devicesCollection = db.collection('devices');
    
    await devicesCollection.createIndex({ "userId": 1, "deviceId": 1 });
    console.log('  ✅ 用户设备复合索引');
    
    await devicesCollection.createIndex({ "deviceId": 1 }, { unique: true });
    console.log('  ✅ 设备ID唯一索引');
    
    await devicesCollection.createIndex({ "lastSeenAt": -1 });
    console.log('  ✅ 最后活跃时间索引');
    
    // 6. 用户进度表索引优化
    console.log('\n📊 优化用户进度表索引...');
    const userProgressCollection = db.collection('userprogresses');
    
    await userProgressCollection.createIndex({ "userId": 1, "createdAt": -1 });
    console.log('  ✅ 用户进度时间复合索引');
    
    await userProgressCollection.createIndex({ "userId": 1, "progressType": 1 });
    console.log('  ✅ 用户进度类型复合索引');
    
    // 7. 搜索历史表索引优化
    console.log('\n🔍 优化搜索历史表索引...');
    const searchHistoryCollection = db.collection('searchhistory');
    
    await searchHistoryCollection.createIndex({ "userId": 1, "createdAt": -1 });
    console.log('  ✅ 用户搜索时间复合索引');
    
    await searchHistoryCollection.createIndex({ "searchTerm": "text" });
    console.log('  ✅ 搜索词文本索引');
    
    await searchHistoryCollection.createIndex({ "userId": 1, "searchType": 1 });
    console.log('  ✅ 用户搜索类型复合索引');
    
    // 8. 徽章数据表索引优化
    console.log('\n🏆 优化徽章数据表索引...');
    const badgesCollection = db.collection('badges');
    
    await badgesCollection.createIndex({ "userId": 1, "badgeId": 1 });
    console.log('  ✅ 用户徽章复合索引');
    
    await badgesCollection.createIndex({ "userId": 1, "unlockedAt": -1 });
    console.log('  ✅ 用户解锁时间复合索引');
    
    await badgesCollection.createIndex({ "badgeId": 1, "unlocked": 1 });
    console.log('  ✅ 徽章解锁状态复合索引');
    
    // 9. 经验值表索引优化
    console.log('\n⭐ 优化经验值表索引...');
    const experienceCollection = db.collection('experience');
    
    await experienceCollection.createIndex({ "userId": 1, "createdAt": -1 });
    console.log('  ✅ 用户经验时间复合索引');
    
    await experienceCollection.createIndex({ "userId": 1, "experienceType": 1 });
    console.log('  ✅ 用户经验类型复合索引');
    
    // 10. 创建复合索引以优化常见查询
    console.log('\n🔗 创建复合索引优化常见查询...');
    
    // 用户活跃度查询优化
    await usersCollection.createIndex({ 
      "isActive": 1, 
      "lastLoginAt": -1, 
      "createdAt": -1 
    });
    console.log('  ✅ 用户活跃度复合索引');
    
    // 学习统计查询优化
    await learningRecordsCollection.createIndex({ 
      "userId": 1, 
      "createdAt": -1, 
      "reviewCount": -1 
    });
    console.log('  ✅ 学习统计复合索引');
    
    // 词汇学习进度查询优化
    await cloudWordsCollection.createIndex({ 
      "userId": 1, 
      "isLearned": 1, 
      "difficulty": 1, 
      "createdAt": -1 
    });
    console.log('  ✅ 词汇学习进度复合索引');
    
    // 11. 创建部分索引以节省空间
    console.log('\n💾 创建部分索引节省空间...');
    
    // 只对活跃用户创建索引
    await usersCollection.createIndex(
      { "lastLoginAt": -1 }, 
      { 
        partialFilterExpression: { "isActive": true },
        name: "active_users_last_login"
      }
    );
    console.log('  ✅ 活跃用户部分索引');
    
    // 只对已学习的词汇创建索引
    await cloudWordsCollection.createIndex(
      { "userId": 1, "learnedAt": -1 }, 
      { 
        partialFilterExpression: { "isLearned": true },
        name: "learned_words_user_time"
      }
    );
    console.log('  ✅ 已学词汇部分索引');
    
    // 12. 获取索引统计信息
    console.log('\n📈 获取索引统计信息...');
    
    const collections = [
      'users', 'learningrecords', 'cloudwords', 'shows', 
      'devices', 'userprogresses', 'searchhistory', 'badges', 'experience'
    ];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      console.log(`  📋 ${collectionName}: ${indexes.length} 个索引`);
    }
    
    console.log('\n✅ 数据库索引优化完成！');
    
  } catch (error) {
    console.error('❌ 数据库索引优化失败:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('📴 数据库连接已关闭');
    }
  }
}

// 运行脚本
if (require.main === module) {
  optimizeDatabaseIndexes()
    .then(() => {
      console.log('🎉 索引优化脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 索引优化脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { optimizeDatabaseIndexes };
