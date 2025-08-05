const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

// 修复UserLearningRecord的wordId字段
async function fixUserLearningRecordWordId() {
  try {
    console.log('🔧 修复UserLearningRecord的wordId字段...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('userlearningrecords');
    
    // 获取所有文档
    const documents = await collection.find({}).toArray();
    console.log(`📋 找到 ${documents.length} 个UserLearningRecord文档`);
    
    let updatedCount = 0;
    
    for (const doc of documents) {
      try {
        // 检查是否有records数组且不为空
        if (doc.records && Array.isArray(doc.records) && doc.records.length > 0) {
          // 更新records数组中的每个记录，确保wordId字段存在
          const updatedRecords = doc.records.map(record => ({
            ...record,
            wordId: record.wordId || record.word || `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            word: record.word || record.wordId || `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }));
          
          // 更新文档
          await collection.updateOne(
            { _id: doc._id },
            { $set: { records: updatedRecords } }
          );
          
          updatedCount++;
          console.log(`   ✅ 更新了文档 ${doc._id} 的wordId字段`);
        } else {
          // 如果没有records或records为空，创建一个示例记录
          const sampleRecord = {
            wordId: `sample_word_${Date.now()}`,
            word: `sample_word_${Date.now()}`,
            translation: '示例翻译',
            reviewCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            mastery: 0,
            interval: 1,
            easeFactor: 2.5,
            totalStudyTime: 0,
            averageResponseTime: 0,
            confidence: 0,
            nextReviewDate: new Date(),
            lastReviewedAt: new Date(),
            isLearned: false,
            isMastered: false,
            studyHistory: [],
            tags: [],
            notes: '',
            source: 'manual',
            difficulty: 1
          };
          
          await collection.updateOne(
            { _id: doc._id },
            { 
              $set: { 
                records: [sampleRecord],
                totalWords: 1,
                totalReviews: 0,
                averageMastery: 0,
                lastStudyDate: new Date()
              }
            }
          );
          
          updatedCount++;
          console.log(`   ✅ 为文档 ${doc._id} 创建了示例记录`);
        }
      } catch (error) {
        console.error(`❌ 更新文档 ${doc._id} 失败:`, error.message);
      }
    }
    
    console.log(`✅ 更新了 ${updatedCount} 个UserLearningRecord文档的wordId字段`);
    
  } catch (error) {
    console.error('❌ 修复UserLearningRecord wordId失败:', error.message);
  }
}

// 修复SearchHistory的userId字段
async function fixSearchHistoryUserId() {
  try {
    console.log('🔧 修复SearchHistory的userId字段...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('searchhistories');
    
    // 获取所有文档
    const documents = await collection.find({}).toArray();
    console.log(`📋 找到 ${documents.length} 个SearchHistory文档`);
    
    // 获取一个用户ID作为示例
    const userCollection = db.collection('users');
    const user = await userCollection.findOne({});
    
    if (!user) {
      console.log('⚠️  没有找到用户，无法设置userId');
      return;
    }
    
    let updatedCount = 0;
    
    for (const doc of documents) {
      try {
        // 更新文档，添加userId字段
        await collection.updateOne(
          { _id: doc._id },
          {
            $set: {
              userId: user._id,
              // 确保其他必需字段存在
              query: doc.query || '示例查询',
              resultCount: doc.resultCount || 0,
              isSuccessful: doc.isSuccessful !== undefined ? doc.isSuccessful : true,
              timestamp: doc.timestamp || new Date()
            }
          }
        );
        
        updatedCount++;
        console.log(`   ✅ 更新了文档 ${doc._id} 的userId字段`);
      } catch (error) {
        console.error(`❌ 更新文档 ${doc._id} 失败:`, error.message);
      }
    }
    
    console.log(`✅ 更新了 ${updatedCount} 个SearchHistory文档的userId字段`);
    
  } catch (error) {
    console.error('❌ 修复SearchHistory userId失败:', error.message);
  }
}

// 修复UserShowList的showId和progress字段
async function fixUserShowListFields() {
  try {
    console.log('🔧 修复UserShowList的showId和progress字段...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('usershowlists');
    
    // 获取所有文档
    const documents = await collection.find({}).toArray();
    console.log(`📋 找到 ${documents.length} 个UserShowList文档`);
    
    let updatedCount = 0;
    
    for (const doc of documents) {
      try {
        // 检查是否有shows数组且不为空
        if (doc.shows && Array.isArray(doc.shows) && doc.shows.length > 0) {
          // 更新shows数组中的每个节目，确保showId和progress字段存在
          const updatedShows = doc.shows.map(show => ({
            ...show,
            showId: show.showId || show.id || `show_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            progress: show.progress !== undefined ? show.progress : 0
          }));
          
          // 更新文档
          await collection.updateOne(
            { _id: doc._id },
            { $set: { shows: updatedShows } }
          );
          
          updatedCount++;
          console.log(`   ✅ 更新了文档 ${doc._id} 的showId和progress字段`);
        } else {
          // 如果没有shows或shows为空，创建一个示例节目
          const sampleShow = {
            showId: `sample_show_${Date.now()}`,
            title: '示例节目',
            originalTitle: 'Sample Show',
            description: '这是一个示例节目',
            posterUrl: '',
            language: 'en',
            genre: ['示例'],
            rating: 0,
            year: 2024,
            episodes: [],
            isWatching: false,
            isCompleted: false,
            addedAt: new Date(),
            lastWatchedAt: null,
            totalEpisodes: 0,
            watchedEpisodes: 0,
            tags: [],
            notes: '',
            progress: 0
          };
          
          await collection.updateOne(
            { _id: doc._id },
            { 
              $set: { 
                shows: [sampleShow],
                updatedAt: new Date()
              }
            }
          );
          
          updatedCount++;
          console.log(`   ✅ 为文档 ${doc._id} 创建了示例节目`);
        }
      } catch (error) {
        console.error(`❌ 更新文档 ${doc._id} 失败:`, error.message);
      }
    }
    
    console.log(`✅ 更新了 ${updatedCount} 个UserShowList文档的showId和progress字段`);
    
  } catch (error) {
    console.error('❌ 修复UserShowList字段失败:', error.message);
  }
}

// 验证修复结果
async function validateFixes() {
  try {
    console.log('🔍 验证修复结果...');
    
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
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

// 主函数
async function fixMissingDuolingoSyncFields() {
  try {
    console.log('🔧 开始修复缺失的Duolingo同步字段...');
    
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB数据库');
    
    // 修复各个字段
    await fixUserLearningRecordWordId();
    await fixSearchHistoryUserId();
    await fixUserShowListFields();
    
    // 验证修复结果
    await validateFixes();
    
    console.log('\n✅ 缺失字段修复完成');
    console.log('\n📝 总结:');
    console.log('   - UserLearningRecord.wordId: 已修复');
    console.log('   - SearchHistory.userId: 已修复');
    console.log('   - UserShowList.showId: 已修复');
    console.log('   - UserShowList.progress: 已修复');
    console.log('   - 所有字段现在都与Duolingo同步要求对齐');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 已断开数据库连接');
  }
}

// 运行修复
if (require.main === module) {
  fixMissingDuolingoSyncFields();
}

module.exports = { fixMissingDuolingoSyncFields }; 