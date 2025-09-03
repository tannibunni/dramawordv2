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
  avatar: String,
  // 其他字段...
}, { strict: false });

const User = mongoose.model('User', userSchema);

// 修复头像URL
const fixAvatarUrl = async () => {
  try {
    console.log('🔍 开始检查用户头像URL...');
    
    // 查找有头像URL的用户
    const usersWithAvatar = await User.find({ 
      avatar: { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log(`📊 找到 ${usersWithAvatar.length} 个有头像的用户`);
    
    for (const user of usersWithAvatar) {
      console.log(`\n👤 用户: ${user.username || user.email || user._id}`);
      console.log(`🖼️ 当前头像URL: ${user.avatar}`);
      
      // 检查URL是否包含无效的文件名
      if (user.avatar && user.avatar.includes('avatar-68978aba968929e7a6d03f10-1756606302684-957780915')) {
        console.log('⚠️ 发现无效头像URL，清除...');
        
        // 清除无效的头像URL
        await User.findByIdAndUpdate(user._id, { 
          $unset: { avatar: 1 } 
        });
        
        console.log('✅ 已清除无效头像URL');
      }
    }
    
    console.log('\n🎉 头像URL修复完成');
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
};

// 主函数
const main = async () => {
  await connectDB();
  await fixAvatarUrl();
  await mongoose.disconnect();
  console.log('👋 数据库连接已关闭');
};

main().catch(console.error);
