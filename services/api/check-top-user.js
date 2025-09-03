const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword');
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

// 用户模型
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  nickname: String,
  avatar: String,
  loginType: String,
  // 其他字段...
}, { strict: false });

const User = mongoose.model('User', userSchema);

// 用户词汇模型
const userVocabularySchema = new mongoose.Schema({
  userId: String,
  wordId: String,
  // 其他字段...
}, { strict: false });

const UserVocabulary = mongoose.model('UserVocabulary', userVocabularySchema);

// 查询存词最多的用户
const findTopUser = async () => {
  try {
    console.log('🔍 开始查询用户词汇数据...');
    
    // 聚合查询：按用户ID分组，统计每个用户的词汇数量
    const userWordCounts = await UserVocabulary.aggregate([
      {
        $group: {
          _id: '$userId',
          wordCount: { $sum: 1 }
        }
      },
      {
        $sort: { wordCount: -1 }
      },
      {
        $limit: 10  // 获取前10名
      }
    ]);
    
    console.log(`📊 找到 ${userWordCounts.length} 个有词汇记录的用户`);
    
    if (userWordCounts.length === 0) {
      console.log('❌ 没有找到任何用户词汇记录');
      return;
    }
    
    // 获取用户详细信息
    const topUsers = [];
    for (const userWordCount of userWordCounts) {
      const user = await User.findById(userWordCount._id);
      if (user) {
        topUsers.push({
          userId: userWordCount._id,
          wordCount: userWordCount.wordCount,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          loginType: user.loginType,
          avatar: user.avatar
        });
      }
    }
    
    console.log('\n🏆 存词最多的用户排行榜:');
    console.log('=' .repeat(80));
    
    topUsers.forEach((user, index) => {
      console.log(`${index + 1}. 用户ID: ${user.userId}`);
      console.log(`   词汇数量: ${user.wordCount} 个`);
      console.log(`   用户名: ${user.username || 'N/A'}`);
      console.log(`   昵称: ${user.nickname || 'N/A'}`);
      console.log(`   邮箱: ${user.email || 'N/A'}`);
      console.log(`   登录类型: ${user.loginType || 'N/A'}`);
      console.log(`   头像: ${user.avatar ? '有' : '无'}`);
      console.log('-'.repeat(80));
    });
    
    if (topUsers.length > 0) {
      const topUser = topUsers[0];
      console.log(`\n🥇 存词最多的用户是:`);
      console.log(`   用户ID: ${topUser.userId}`);
      console.log(`   词汇数量: ${topUser.wordCount} 个`);
      console.log(`   用户名: ${topUser.username || 'N/A'}`);
      console.log(`   昵称: ${topUser.nickname || 'N/A'}`);
      console.log(`   邮箱: ${topUser.email || 'N/A'}`);
      console.log(`   登录类型: ${topUser.loginType || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('❌ 查询过程中出错:', error);
  }
};

// 主函数
const main = async () => {
  await connectDB();
  await findTopUser();
  await mongoose.disconnect();
  console.log('\n👋 数据库连接已关闭');
};

main().catch(console.error);
