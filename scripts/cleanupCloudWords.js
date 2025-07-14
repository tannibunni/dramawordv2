#!/usr/bin/env node

// 自动安装 mongoose
const { execSync } = require('child_process');
try {
  require.resolve('mongoose');
} catch (e) {
  console.log('未检测到 mongoose，正在自动安装...');
  execSync('npm install mongoose', { stdio: 'inherit' });
}

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dramaword'; // 修改为你的Mongo连接串

const cloudWordSchema = new mongoose.Schema({
  word: String,
  definitions: [
    {
      partOfSpeech: String,
      definition: String,
      examples: [
        {
          english: String,
          chinese: String,
        },
      ],
    },
  ],
});

const CloudWord = mongoose.model('CloudWord', cloudWordSchema, 'words'); // 改为 'words' 集合

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // 匹配“xxx 的释义”或“暂无释义”
  const regex = /(的释义|暂无释义)$/;

  // 查找所有兜底内容的单词
  const words = await CloudWord.find({
    'definitions.0.definition': { $regex: regex }
  });

  if (words.length === 0) {
    console.log('没有需要清理的兜底内容单词。');
    process.exit(0);
  }

  console.log(`将要删除 ${words.length} 条兜底内容单词：`);
  words.forEach(w => {
    console.log(`- ${w.word}: ${w.definitions[0].definition}`);
  });

  // 执行删除
  const result = await CloudWord.deleteMany({
    'definitions.0.definition': { $regex: regex }
  });

  console.log(`已删除 ${result.deletedCount} 条记录。`);
  process.exit(0);
}

main().catch(err => {
  console.error('批量清理出错:', err);
  process.exit(1);
}); 