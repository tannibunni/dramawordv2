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

async function testConnection() {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
  
  if (!MONGO_URI) {
    console.log('❌ 请设置 MONGO_URI 或 MONGODB_URI 环境变量');
    console.log('例如: MONGO_URI="mongodb+srv://..." node testDbConnection.js');
    process.exit(1);
  }

  console.log('🔍 正在测试数据库连接...');
  console.log('连接串:', MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // 隐藏密码

  try {
    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('✅ 数据库连接成功！');
    
    // 测试查询
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📊 数据库中的集合:', collections.map(c => c.name));
    
    // 测试 CloudWord 集合
    const cloudWords = db.collection('cloudwords');
    const count = await cloudWords.countDocuments();
    console.log(`📝 CloudWord 集合中有 ${count} 条记录`);
    
    // 查找兜底内容
    const fallbackWords = await cloudWords.find({
      'definitions.0.definition': { $regex: /(的释义|暂无释义)$/ }
    }).toArray();
    
    console.log(`⚠️  发现 ${fallbackWords.length} 条兜底内容单词:`);
    fallbackWords.slice(0, 10).forEach(w => {
      console.log(`  - ${w.word}: ${w.definitions[0].definition}`);
    });
    
    if (fallbackWords.length > 10) {
      console.log(`  ... 还有 ${fallbackWords.length - 10} 条`);
    }
    
    await mongoose.connection.close();
    console.log('📴 连接已关闭');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

testConnection(); 