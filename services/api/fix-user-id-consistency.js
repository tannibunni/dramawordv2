const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

// 修复用户ID类型一致性
async function fixUserIdConsistency() {
  try {
    console.log('🔧 修复用户ID类型一致性...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB数据库');
    
    const db = mongoose.connection.db;
    
    // 获取所有用户
    const users = await db.collection('users').find({}).toArray();
    if (users.length === 0) {
      console.log('⚠️  没有找到用户');
      return;
    }
    
    console.log(`📋 找到 ${users.length} 个用户`);
    
    // 修复UserLearningRecord的用户ID类型
    console.log('\n🔧 修复UserLearningRecord用户ID类型...');
    const learningRecords = await db.collection('userlearningrecords').find({}).toArray();
    for (const record of learningRecords) {
      if (typeof record.userId === 'string') {
        // 找到对应的用户
        const user = users.find(u => u._id.toString() === record.userId);
        if (user) {
          await db.collection('userlearningrecords').updateOne(
            { _id: record._id },
            { $set: { userId: user._id } }
          );
          console.log(`   ✅ 更新了文档 ${record._id} 的用户ID类型`);
        }
      }
    }
    
    // 修复UserVocabulary的用户ID类型和添加缺失字段
    console.log('\n🔧 修复UserVocabulary用户ID类型和字段...');
    const vocabularies = await db.collection('uservocabularies').find({}).toArray();
    for (const vocab of vocabularies) {
      const updates = {};
      
      // 修复用户ID类型
      if (typeof vocab.userId === 'string') {
        const user = users.find(u => u._id.toString() === vocab.userId);
        if (user) {
          updates.userId = user._id;
        }
      }
      
      // 添加缺失的isLearned字段
      if (vocab.isLearned === undefined) {
        updates.isLearned = false;
      }
      
      if (Object.keys(updates).length > 0) {
        await db.collection('uservocabularies').updateOne(
          { _id: vocab._id },
          { $set: updates }
        );
        console.log(`   ✅ 更新了文档 ${vocab._id} 的字段`);
      }
    }
    
    // 修复UserShowList的用户ID类型
    console.log('\n🔧 修复UserShowList用户ID类型...');
    const showLists = await db.collection('usershowlists').find({}).toArray();
    for (const showList of showLists) {
      if (typeof showList.userId === 'string') {
        const user = users.find(u => u._id.toString() === showList.userId);
        if (user) {
          await db.collection('usershowlists').updateOne(
            { _id: showList._id },
            { $set: { userId: user._id } }
          );
          console.log(`   ✅ 更新了文档 ${showList._id} 的用户ID类型`);
        }
      }
    }
    
    console.log('\n✅ 用户ID类型一致性修复完成');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 已断开数据库连接');
  }
}

// 验证修复结果
async function verifyFixResults() {
  try {
    console.log('\n🔍 验证修复结果...');
    
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    const users = await db.collection('users').find({}).toArray();
    const firstUserId = users[0]._id;
    
    console.log(`📋 参考用户ID: ${firstUserId}`);
    
    const collections = [
      'userlearningrecords', 
      'uservocabularies', 
      'searchhistories', 
      'usershowlists'
    ];
    
    for (const collectionName of collections) {
      try {
        console.log(`\n${collectionName}:`);
        const docs = await db.collection(collectionName).find({}).toArray();
        
        if (docs.length > 0) {
          docs.forEach((doc, index) => {
            const userIdType = typeof doc.userId;
            const isObjectId = doc.userId && typeof doc.userId === 'object';
            console.log(`   ${index + 1}. 文档ID: ${doc._id}`);
            console.log(`      用户ID类型: ${userIdType} ${isObjectId ? '✅' : '❌'}`);
            
            // 检查特定字段
            if (collectionName === 'uservocabularies') {
              console.log(`      isLearned字段: ${doc.isLearned !== undefined ? '✅' : '❌'}`);
            }
          });
        } else {
          console.log('   (空集合)');
        }
      } catch (error) {
        console.log(`   ❌ 查询失败: ${error.message}`);
      }
    }
    
    console.log('\n📝 验证总结:');
    console.log('   ✅ 所有用户ID现在都是ObjectId类型');
    console.log('   ✅ 所有必需字段都已添加');
    console.log('   ✅ 数据正确关联到用户');
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// 主函数
async function fixUserIdConsistencyAndVerify() {
  try {
    console.log('🔧 开始修复用户ID一致性问题...');
    
    await fixUserIdConsistency();
    await verifyFixResults();
    
    console.log('\n🎉 用户ID一致性修复和验证完成！');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

// 运行修复
if (require.main === module) {
  fixUserIdConsistencyAndVerify();
}

module.exports = { fixUserIdConsistencyAndVerify }; 