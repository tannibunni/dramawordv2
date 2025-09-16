const mongoose = require('mongoose');
require('dotenv').config();

// 导入CloudWord模型
const { CloudWord } = require('./dist/models/CloudWord');

async function clearChineseCloudWords() {
  try {
    console.log('🔗 连接数据库...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');

    // 删除所有中文相关的cloud words
    // 包括 language 为 'zh' 的记录
    const result = await CloudWord.deleteMany({
      $or: [
        { language: 'zh' },
        { uiLanguage: 'zh-CN' },
        { uiLanguage: 'zh' }
      ]
    });

    console.log(`🗑️ 删除结果:`);
    console.log(`   - 删除的记录数: ${result.deletedCount}`);
    console.log(`   - 匹配条件: language='zh' 或 uiLanguage='zh-CN' 或 uiLanguage='zh'`);

    // 显示剩余记录统计
    const remainingStats = await CloudWord.aggregate([
      {
        $group: {
          _id: { language: '$language', uiLanguage: '$uiLanguage' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.language': 1, '_id.uiLanguage': 1 } }
    ]);

    console.log(`📊 剩余记录统计:`);
    remainingStats.forEach(stat => {
      console.log(`   - ${stat._id.language}/${stat._id.uiLanguage}: ${stat.count} 条记录`);
    });

    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
    console.log('🎉 中文Cloud Words数据清理完成！');

  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

clearChineseCloudWords();
