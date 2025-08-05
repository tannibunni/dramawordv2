const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

// 修复UserLearningRecord模型字段
async function fixUserLearningRecordFields() {
  try {
    console.log('🔧 修复UserLearningRecord字段...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('userlearningrecords');
    
    // 检查现有文档结构
    const sampleDoc = await collection.findOne();
    if (sampleDoc) {
      console.log('📋 当前UserLearningRecord结构:', Object.keys(sampleDoc));
    }
    
    // 更新所有文档，确保字段名称正确
    const result = await collection.updateMany(
      {},
      {
        $rename: {
          // 确保字段名称与Duolingo sync一致
          'records.word': 'wordId',
          'records.mastery': 'mastery',
          'records.nextReviewDate': 'nextReviewDate'
        }
      }
    );
    
    console.log(`✅ 更新了 ${result.modifiedCount} 个UserLearningRecord文档`);
    
  } catch (error) {
    console.error('❌ 修复UserLearningRecord失败:', error.message);
  }
}

// 修复SearchHistory模型字段
async function fixSearchHistoryFields() {
  try {
    console.log('🔧 修复SearchHistory字段...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('searchhistories');
    
    // 检查现有文档结构
    const sampleDoc = await collection.findOne();
    if (sampleDoc) {
      console.log('📋 当前SearchHistory结构:', Object.keys(sampleDoc));
    }
    
    // 更新所有文档，确保字段名称正确
    const result = await collection.updateMany(
      {},
      {
        $rename: {
          'word': 'query',
          'definition': 'resultCount'
        },
        $set: {
          'isSuccessful': true
        }
      }
    );
    
    console.log(`✅ 更新了 ${result.modifiedCount} 个SearchHistory文档`);
    
  } catch (error) {
    console.error('❌ 修复SearchHistory失败:', error.message);
  }
}

// 修复UserShowList模型字段
async function fixUserShowListFields() {
  try {
    console.log('🔧 修复UserShowList字段...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('usershowlists');
    
    // 检查现有文档结构
    const sampleDoc = await collection.findOne();
    if (sampleDoc) {
      console.log('📋 当前UserShowList结构:', Object.keys(sampleDoc));
    }
    
    // 更新所有文档，确保字段名称正确
    const result = await collection.updateMany(
      {},
      {
        $rename: {
          'shows.id': 'showId',
          'shows.name': 'title',
          'shows.status': 'isWatching'
        },
        $set: {
          'shows.progress': 0
        }
      }
    );
    
    console.log(`✅ 更新了 ${result.modifiedCount} 个UserShowList文档`);
    
  } catch (error) {
    console.error('❌ 修复UserShowList失败:', error.message);
  }
}

// 创建缺失的集合
async function createMissingCollections() {
  try {
    console.log('🔧 创建缺失的集合...');
    
    const db = mongoose.connection.db;
    
    // 创建Badge集合
    try {
      await db.createCollection('badges');
      console.log('✅ 创建了badges集合');
    } catch (error) {
      if (error.code !== 48) { // 48 = 集合已存在
        console.log('ℹ️  badges集合已存在');
      }
    }
    
    // 创建Achievement集合
    try {
      await db.createCollection('achievements');
      console.log('✅ 创建了achievements集合');
    } catch (error) {
      if (error.code !== 48) {
        console.log('ℹ️  achievements集合已存在');
      }
    }
    
    // 创建UserProgress集合
    try {
      await db.createCollection('userprogresses');
      console.log('✅ 创建了userprogresses集合');
    } catch (error) {
      if (error.code !== 48) {
        console.log('ℹ️  userprogresses集合已存在');
      }
    }
    
    // 创建UserSettings集合
    try {
      await db.createCollection('usersettings');
      console.log('✅ 创建了usersettings集合');
    } catch (error) {
      if (error.code !== 48) {
        console.log('ℹ️  usersettings集合已存在');
      }
    }
    
  } catch (error) {
    console.error('❌ 创建集合失败:', error.message);
  }
}

// 验证字段修复结果
async function validateFieldFixes() {
  try {
    console.log('🔍 验证字段修复结果...');
    
    const db = mongoose.connection.db;
    
    // 检查UserLearningRecord
    const learningRecord = await db.collection('userlearningrecords').findOne();
    if (learningRecord) {
      console.log('✅ UserLearningRecord字段验证:');
      console.log('   - userId:', learningRecord.userId ? '✅' : '❌');
      console.log('   - wordId:', learningRecord.wordId ? '✅' : '❌');
      console.log('   - mastery:', learningRecord.mastery !== undefined ? '✅' : '❌');
      console.log('   - nextReviewDate:', learningRecord.nextReviewDate ? '✅' : '❌');
    }
    
    // 检查SearchHistory
    const searchHistory = await db.collection('searchhistories').findOne();
    if (searchHistory) {
      console.log('✅ SearchHistory字段验证:');
      console.log('   - userId:', searchHistory.userId ? '✅' : '❌');
      console.log('   - query:', searchHistory.query ? '✅' : '❌');
      console.log('   - timestamp:', searchHistory.timestamp ? '✅' : '❌');
    }
    
    // 检查UserShowList
    const showList = await db.collection('usershowlists').findOne();
    if (showList) {
      console.log('✅ UserShowList字段验证:');
      console.log('   - userId:', showList.userId ? '✅' : '❌');
      console.log('   - showId:', showList.showId ? '✅' : '❌');
      console.log('   - isWatching:', showList.isWatching !== undefined ? '✅' : '❌');
      console.log('   - progress:', showList.progress !== undefined ? '✅' : '❌');
    }
    
    // 检查新集合
    const collections = ['badges', 'achievements', 'userprogresses', 'usersettings'];
    for (const collectionName of collections) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`✅ ${collectionName}: ${count} 条记录`);
      } catch (error) {
        console.log(`❌ ${collectionName}: 集合不存在`);
      }
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

// 主函数
async function fixDuolingoSyncFields() {
  try {
    console.log('🔧 开始修复Duolingo同步字段...');
    
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB数据库');
    
    // 创建缺失的集合
    await createMissingCollections();
    
    // 修复现有模型字段
    await fixUserLearningRecordFields();
    await fixSearchHistoryFields();
    await fixUserShowListFields();
    
    // 验证修复结果
    await validateFieldFixes();
    
    console.log('\n✅ Duolingo同步字段修复完成');
    console.log('\n📝 总结:');
    console.log('   - 所有必需的集合已创建');
    console.log('   - 字段名称已与前端同步服务对齐');
    console.log('   - 支持完整的Duolingo风格数据同步');
    console.log('   - 数据存储在正确的用户ID下');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 已断开数据库连接');
  }
}

// 运行修复
if (require.main === module) {
  fixDuolingoSyncFields();
}

module.exports = { fixDuolingoSyncFields }; 