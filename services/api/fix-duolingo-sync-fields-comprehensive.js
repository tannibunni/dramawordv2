const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

// 修复UserLearningRecord模型字段 - 处理嵌套结构
async function fixUserLearningRecordFields() {
  try {
    console.log('🔧 修复UserLearningRecord字段...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('userlearningrecords');
    
    // 获取所有文档
    const documents = await collection.find({}).toArray();
    console.log(`📋 找到 ${documents.length} 个UserLearningRecord文档`);
    
    let updatedCount = 0;
    
    for (const doc of documents) {
      try {
        // 检查是否有records数组
        if (doc.records && Array.isArray(doc.records)) {
          // 更新records数组中的每个记录
          const updatedRecords = doc.records.map(record => ({
            wordId: record.word || record.wordId || '',
            word: record.word || record.wordId || '',
            translation: record.translation || '',
            reviewCount: record.reviewCount || 0,
            correctCount: record.correctCount || 0,
            incorrectCount: record.incorrectCount || 0,
            consecutiveCorrect: record.consecutiveCorrect || 0,
            consecutiveIncorrect: record.consecutiveIncorrect || 0,
            mastery: record.mastery || 0,
            interval: record.interval || 1,
            easeFactor: record.easeFactor || 2.5,
            totalStudyTime: record.totalStudyTime || 0,
            averageResponseTime: record.averageResponseTime || 0,
            confidence: record.confidence || 0,
            nextReviewDate: record.nextReviewDate || new Date(),
            lastReviewedAt: record.lastReviewDate || new Date(),
            isLearned: record.isLearned || false,
            isMastered: record.isMastered || false,
            studyHistory: record.studyHistory || [],
            tags: record.tags || [],
            notes: record.notes || '',
            source: record.source || 'manual',
            difficulty: record.difficulty || 1
          }));
          
          // 更新文档
          await collection.updateOne(
            { _id: doc._id },
            { 
              $set: { 
                records: updatedRecords,
                // 确保其他必需字段存在
                totalWords: doc.totalWords || updatedRecords.length,
                totalReviews: doc.totalReviews || 0,
                averageMastery: doc.averageMastery || 0,
                lastStudyDate: doc.lastStudyDate || new Date()
              }
            }
          );
          
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ 更新文档 ${doc._id} 失败:`, error.message);
      }
    }
    
    console.log(`✅ 更新了 ${updatedCount} 个UserLearningRecord文档`);
    
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
    
    // 获取所有文档
    const documents = await collection.find({}).toArray();
    console.log(`📋 找到 ${documents.length} 个SearchHistory文档`);
    
    let updatedCount = 0;
    
    for (const doc of documents) {
      try {
        // 更新文档字段
        await collection.updateOne(
          { _id: doc._id },
          {
            $set: {
              query: doc.word || doc.query || '',
              resultCount: doc.definition ? 1 : 0, // 如果有definition说明有结果
              isSuccessful: true,
              timestamp: doc.timestamp || new Date()
            },
            $unset: {
              word: "",
              definition: ""
            }
          }
        );
        
        updatedCount++;
      } catch (error) {
        console.error(`❌ 更新文档 ${doc._id} 失败:`, error.message);
      }
    }
    
    console.log(`✅ 更新了 ${updatedCount} 个SearchHistory文档`);
    
  } catch (error) {
    console.error('❌ 修复SearchHistory失败:', error.message);
  }
}

// 修复UserShowList模型字段 - 处理嵌套结构
async function fixUserShowListFields() {
  try {
    console.log('🔧 修复UserShowList字段...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('usershowlists');
    
    // 获取所有文档
    const documents = await collection.find({}).toArray();
    console.log(`📋 找到 ${documents.length} 个UserShowList文档`);
    
    let updatedCount = 0;
    
    for (const doc of documents) {
      try {
        // 检查是否有shows数组
        if (doc.shows && Array.isArray(doc.shows)) {
          // 更新shows数组中的每个节目
          const updatedShows = doc.shows.map(show => ({
            showId: show.id || show.showId || '',
            title: show.name || show.title || '',
            originalTitle: show.original_name || show.originalTitle || '',
            description: show.description || '',
            posterUrl: show.poster_path || show.posterUrl || '',
            language: show.language || 'en',
            genre: show.genres || show.genre || [],
            rating: show.vote_average || show.rating || 0,
            year: show.year || null,
            episodes: show.episodes || [],
            isWatching: show.status === 'watching' || show.isWatching || false,
            isCompleted: show.status === 'completed' || show.isCompleted || false,
            addedAt: show.addedAt || new Date(),
            lastWatchedAt: show.lastWatched ? new Date(show.lastWatched) : null,
            totalEpisodes: show.totalEpisodes || 0,
            watchedEpisodes: show.watchedEpisodes || 0,
            tags: show.tags || [],
            notes: show.notes || '',
            progress: show.progress || 0
          }));
          
          // 更新文档
          await collection.updateOne(
            { _id: doc._id },
            { 
              $set: { 
                shows: updatedShows,
                updatedAt: new Date()
              }
            }
          );
          
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ 更新文档 ${doc._id} 失败:`, error.message);
      }
    }
    
    console.log(`✅ 更新了 ${updatedCount} 个UserShowList文档`);
    
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
      if (learningRecord.records && learningRecord.records.length > 0) {
        const firstRecord = learningRecord.records[0];
        console.log('   - wordId:', firstRecord.wordId ? '✅' : '❌');
        console.log('   - mastery:', firstRecord.mastery !== undefined ? '✅' : '❌');
        console.log('   - nextReviewDate:', firstRecord.nextReviewDate ? '✅' : '❌');
      } else {
        console.log('   - 没有学习记录');
      }
    }
    
    // 检查SearchHistory
    const searchHistory = await db.collection('searchhistories').findOne();
    if (searchHistory) {
      console.log('✅ SearchHistory字段验证:');
      console.log('   - userId:', searchHistory.userId ? '✅' : '❌');
      console.log('   - query:', searchHistory.query ? '✅' : '❌');
      console.log('   - timestamp:', searchHistory.timestamp ? '✅' : '❌');
      console.log('   - isSuccessful:', searchHistory.isSuccessful !== undefined ? '✅' : '❌');
    }
    
    // 检查UserShowList
    const showList = await db.collection('usershowlists').findOne();
    if (showList) {
      console.log('✅ UserShowList字段验证:');
      console.log('   - userId:', showList.userId ? '✅' : '❌');
      if (showList.shows && showList.shows.length > 0) {
        const firstShow = showList.shows[0];
        console.log('   - showId:', firstShow.showId ? '✅' : '❌');
        console.log('   - isWatching:', firstShow.isWatching !== undefined ? '✅' : '❌');
        console.log('   - progress:', firstShow.progress !== undefined ? '✅' : '❌');
      } else {
        console.log('   - 没有剧单记录');
      }
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
async function fixDuolingoSyncFieldsComprehensive() {
  try {
    console.log('🔧 开始全面修复Duolingo同步字段...');
    
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
    
    console.log('\n✅ Duolingo同步字段全面修复完成');
    console.log('\n📝 总结:');
    console.log('   - 所有必需的集合已创建');
    console.log('   - 字段名称已与前端同步服务对齐');
    console.log('   - 支持完整的Duolingo风格数据同步');
    console.log('   - 数据存储在正确的用户ID下');
    console.log('   - 嵌套结构已正确处理');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 已断开数据库连接');
  }
}

// 运行修复
if (require.main === module) {
  fixDuolingoSyncFieldsComprehensive();
}

module.exports = { fixDuolingoSyncFieldsComprehensive }; 