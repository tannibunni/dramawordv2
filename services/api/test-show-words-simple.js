const mongoose = require('mongoose');

// 连接数据库
const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

async function testDatabase() {
  try {
    console.log('🔌 连接数据库...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 数据库连接成功');

    // 直接查询 cloudwords 集合
    const db = mongoose.connection.db;
    const cloudwords = db.collection('cloudwords');
    
    // 查看集合中的文档数量
    const totalCount = await cloudwords.countDocuments();
    console.log(`📊 总单词数量: ${totalCount}`);

    // 查看是否有 showName 字段的单词
    const showWordsCount = await cloudwords.countDocuments({
      showName: { $exists: true, $ne: null, $ne: '' }
    });
    console.log(`📺 关联剧集的单词数量: ${showWordsCount}`);

    // 查看一些样本数据
    console.log('\n🔍 查看样本数据:');
    const sampleWords = await cloudwords.find({}).limit(3).toArray();
    sampleWords.forEach((word, index) => {
      console.log(`\n单词 ${index + 1}:`);
      console.log(`  单词: ${word.word}`);
      console.log(`  语言: ${word.language}`);
      console.log(`  剧集: ${word.showName || '无'}`);
      console.log(`  剧集ID: ${word.showId || '无'}`);
    });

    // 查看剧集名称统计
    console.log('\n📊 剧集名称统计:');
    const showNameStats = await cloudwords.aggregate([
      {
        $group: {
          _id: '$showName',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray();
    
    showNameStats.forEach((stat, index) => {
      console.log(`${index + 1}. ${stat._id || '无剧集'}: ${stat.count} 个单词`);
    });

    // 如果有剧集数据，查看具体内容
    if (showWordsCount > 0) {
      console.log('\n🎬 查看具体剧集单词:');
      const showWords = await cloudwords.find({
        showName: { $exists: true, $ne: null, $ne: '' }
      }).limit(5).toArray();
      
      showWords.forEach((word, index) => {
        console.log(`\n剧集单词 ${index + 1}:`);
        console.log(`  单词: ${word.word}`);
        console.log(`  剧集: ${word.showName}`);
        console.log(`  剧集ID: ${word.showId}`);
        console.log(`  定义: ${JSON.stringify(word.definitions)}`);
      });
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行测试
testDatabase();
