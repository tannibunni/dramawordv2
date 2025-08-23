const mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb+srv://tannibunni:1234567890@cluster0.mongodb.net/dramaword?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugWords() {
  try {
    console.log('🔍 开始调试单词数据结构...');
    
    // 获取数据库连接
    const db = mongoose.connection.db;
    const cloudwords = db.collection('cloudwords');
    
    // 1. 检查总单词数量
    const totalWords = await cloudwords.countDocuments();
    console.log(`📊 总单词数量: ${totalWords}`);
    
    // 2. 检查有sourceShow字段的单词
    const wordsWithSourceShow = await cloudwords.countDocuments({
      'sourceShow': { $exists: true }
    });
    console.log(`📊 有sourceShow字段的单词数量: ${wordsWithSourceShow}`);
    
    // 3. 检查sourceShow.type为'show'的单词
    const wordsWithShowType = await cloudwords.countDocuments({
      'sourceShow.type': 'show'
    });
    console.log(`📊 sourceShow.type为'show'的单词数量: ${wordsWithShowType}`);
    
    // 4. 查看几个示例单词的完整结构
    console.log('\n🔍 查看示例单词结构:');
    const sampleWords = await cloudwords.find({
      'sourceShow.type': 'show'
    }).limit(3).toArray();
    
    sampleWords.forEach((word, index) => {
      console.log(`\n单词 ${index + 1}:`);
      console.log('  word:', word.word);
      console.log('  sourceShow:', JSON.stringify(word.sourceShow, null, 2));
      console.log('  showName:', word.showName);
      console.log('  showId:', word.showId);
    });
    
    // 5. 检查所有可能的剧集相关字段
    console.log('\n🔍 检查所有可能的剧集相关字段:');
    const allFields = await cloudwords.aggregate([
      { $limit: 100 },
      { $project: { arrayofkeyvalue: { $objectToArray: "$$ROOT" } } },
      { $unwind: "$arrayofkeyvalue" },
      { $group: { _id: null, allkeys: { $addToSet: "$arrayofkeyvalue.k" } } }
    ]).toArray();
    
    if (allFields.length > 0) {
      const fields = allFields[0].allkeys;
      const showRelatedFields = fields.filter(field => 
        field.toLowerCase().includes('show') || 
        field.toLowerCase().includes('drama') ||
        field.toLowerCase().includes('movie')
      );
      console.log('剧集相关字段:', showRelatedFields);
    }
    
    // 6. 尝试不同的查询方式
    console.log('\n🔍 尝试不同的查询方式:');
    
    // 方式1: 查询sourceShow.id存在的单词
    const wordsWithSourceShowId = await cloudwords.countDocuments({
      'sourceShow.id': { $exists: true }
    });
    console.log(`sourceShow.id存在的单词数量: ${wordsWithSourceShowId}`);
    
    // 方式2: 查询showName字段存在的单词
    const wordsWithShowName = await cloudwords.countDocuments({
      'showName': { $exists: true, $ne: null }
    });
    console.log(`showName字段存在的单词数量: ${wordsWithShowName}`);
    
    // 方式3: 查询showId字段存在的单词
    const wordsWithShowId = await cloudwords.countDocuments({
      'showId': { $exists: true, $ne: null }
    });
    console.log(`showId字段存在的单词数量: ${wordsWithShowId}`);
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    mongoose.disconnect();
  }
}

debugWords();
