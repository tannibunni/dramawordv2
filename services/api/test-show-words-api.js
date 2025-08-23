const mongoose = require('mongoose');
const { CloudWord } = require('./src/models/CloudWord');

// 连接数据库
const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

async function testShowWordsAPI() {
  try {
    console.log('🔌 连接数据库...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 数据库连接成功');

    // 测试1: 获取剧集单词统计
    console.log('\n📊 测试1: 获取剧集单词统计');
    const showsWithWordCount = await CloudWord.aggregate([
      {
        $match: {
          showName: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$showName',
          showId: { $first: '$showId' },
          language: { $first: '$language' },
          wordCount: { $sum: 1 },
          sampleWords: { $push: { word: '$word', definitions: '$definitions' } }
        }
      },
      {
        $project: {
          showName: '$_id',
          showId: 1,
          language: 1,
          wordCount: 1,
          sampleWords: { $slice: ['$sampleWords', 3] }
        }
      },
      {
        $sort: { wordCount: -1 }
      }
    ]);

    console.log('📺 剧集单词统计结果:');
    console.log(JSON.stringify(showsWithWordCount, null, 2));

    // 测试2: 如果有剧集数据，测试获取单词列表
    if (showsWithWordCount.length > 0) {
      const firstShow = showsWithWordCount[0];
      console.log(`\n📝 测试2: 获取剧集 "${firstShow.showName}" 的单词列表`);
      
      const showWords = await CloudWord.find({
        showName: firstShow.showName
      }).select('word definitions phonetic difficulty tags');
      
      console.log(`📚 单词列表 (共${showWords.length}个):`);
      console.log(JSON.stringify(showWords, null, 2));
    } else {
      console.log('\n⚠️  没有找到关联剧集的单词数据');
      
      // 查看所有单词数据
      console.log('\n🔍 查看所有单词数据样本:');
      const allWords = await CloudWord.find({}).limit(5);
      console.log(JSON.stringify(allWords, null, 2));
    }

    // 测试3: 查看数据库中的剧集关联情况
    console.log('\n🔍 测试3: 查看数据库中的剧集关联情况');
    const showNameStats = await CloudWord.aggregate([
      {
        $group: {
          _id: '$showName',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log('📊 剧集名称统计:');
    console.log(JSON.stringify(showNameStats, null, 2));

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行测试
testShowWordsAPI();
