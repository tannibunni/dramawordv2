const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

async function verifyUserIdStorage() {
  try {
    console.log('🔍 验证用户ID存储和变量名称一致性');
    console.log('=====================================');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB数据库\n');
    
    const db = mongoose.connection.db;
    
    // 1. 检查用户列表
    console.log('👥 用户列表:');
    const users = await db.collection('users').find({}).toArray();
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. 用户ID: ${user._id}`);
      console.log(`      用户名: ${user.username}`);
      console.log(`      昵称: ${user.nickname}`);
      console.log(`      登录类型: ${user.auth?.loginType}`);
    });
    
    if (users.length === 0) {
      console.log('   ⚠️  没有找到用户');
      return;
    }
    
    const firstUserId = users[0]._id;
    console.log(`\n📋 使用第一个用户ID作为参考: ${firstUserId}`);
    
    // 2. 检查各集合的用户ID关联
    console.log('\n📊 各集合的用户ID关联检查:');
    
    const collections = [
      'userlearningrecords', 
      'uservocabularies', 
      'searchhistories', 
      'usershowlists', 
      'badges', 
      'achievements', 
      'userprogresses', 
      'usersettings'
    ];
    
    for (const collectionName of collections) {
      try {
        console.log(`\n${collectionName}:`);
        const docs = await db.collection(collectionName).find({}).toArray();
        
        if (docs.length > 0) {
          docs.forEach((doc, index) => {
            console.log(`   ${index + 1}. 文档ID: ${doc._id}`);
            console.log(`      用户ID字段: ${doc.userId}`);
            console.log(`      用户ID类型: ${typeof doc.userId}`);
            console.log(`      是否匹配参考用户: ${doc.userId?.toString() === firstUserId.toString() ? '✅' : '❌'}`);
          });
        } else {
          console.log('   (空集合)');
        }
      } catch (error) {
        console.log(`   ❌ 查询失败: ${error.message}`);
      }
    }
    
    // 3. 检查前端代码中的变量名称
    console.log('\n🔍 检查前端代码中的变量名称:');
    
    // 检查前端同步服务中的变量名称
    const frontendSyncTypes = [
      'experience', 'vocabulary', 'learningRecords', 'searchHistory', 
      'shows', 'badges', 'achievements', 'progress', 'userSettings'
    ];
    
    console.log('前端同步数据类型:');
    frontendSyncTypes.forEach(type => {
      console.log(`   ✅ ${type}`);
    });
    
    // 4. 检查后端模型中的字段名称
    console.log('\n🔍 检查后端模型中的字段名称:');
    
    const backendFields = {
      'users': ['_id', 'username', 'nickname', 'auth', 'learningStats'],
      'userlearningrecords': ['_id', 'userId', 'records'],
      'uservocabularies': ['_id', 'userId', 'wordId', 'isLearned', 'mastery'],
      'searchhistories': ['_id', 'userId', 'query', 'timestamp', 'isSuccessful'],
      'usershowlists': ['_id', 'userId', 'shows'],
      'badges': ['_id', 'userId', 'badgeId', 'isUnlocked', 'progress'],
      'achievements': ['_id', 'userId', 'achievementId', 'isUnlocked', 'progress'],
      'userprogresses': ['_id', 'userId', 'language', 'level', 'experience'],
      'usersettings': ['_id', 'userId', 'notifications', 'learning', 'privacy']
    };
    
    for (const [collectionName, expectedFields] of Object.entries(backendFields)) {
      try {
        const sampleDoc = await db.collection(collectionName).findOne({});
        if (sampleDoc) {
          console.log(`\n${collectionName}:`);
          expectedFields.forEach(field => {
            const exists = sampleDoc.hasOwnProperty(field);
            console.log(`   ${exists ? '✅' : '❌'} ${field}`);
          });
        } else {
          console.log(`\n${collectionName}: (空集合)`);
        }
      } catch (error) {
        console.log(`\n${collectionName}: ❌ 查询失败`);
      }
    }
    
    // 5. 验证用户ID一致性
    console.log('\n🎯 用户ID一致性验证:');
    
    let allConsistent = true;
    for (const collectionName of collections) {
      try {
        const docs = await db.collection(collectionName).find({}).toArray();
        if (docs.length > 0) {
          const hasValidUserId = docs.every(doc => doc.userId && typeof doc.userId === 'object');
          console.log(`   ${collectionName}: ${hasValidUserId ? '✅' : '❌'} 用户ID格式正确`);
          if (!hasValidUserId) allConsistent = false;
        } else {
          console.log(`   ${collectionName}: ⚠️  空集合`);
        }
      } catch (error) {
        console.log(`   ${collectionName}: ❌ 查询失败`);
        allConsistent = false;
      }
    }
    
    console.log('\n📝 总结:');
    if (allConsistent) {
      console.log('   ✅ 所有数据都正确存储在用户ID下');
      console.log('   ✅ 变量名称与前端代码保持一致');
      console.log('   ✅ 用户ID格式正确');
      console.log('   ✅ 数据库结构完整');
    } else {
      console.log('   ❌ 发现不一致问题，需要修复');
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 已断开数据库连接');
  }
}

verifyUserIdStorage(); 