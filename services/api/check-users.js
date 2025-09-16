const mongoose = require('mongoose');
require('dotenv').config();

// 用户模型
const userSchema = new mongoose.Schema({
  username: String,
  nickname: String,
  avatar: String,
  auth: {
    loginType: String,
    deviceId: String,
    guestId: String,
    lastLoginAt: Date
  },
  createdAt: Date,
  lastLogin: Date
});

const User = mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');

    // 获取所有用户
    const users = await User.find({});
    console.log(`\n📊 总用户数: ${users.length}`);

    // 按登录类型分组
    const usersByType = {};
    users.forEach(user => {
      const type = user.auth?.loginType || 'unknown';
      if (!usersByType[type]) usersByType[type] = [];
      usersByType[type].push(user);
    });

    console.log('\n📈 按登录类型分组:');
    Object.keys(usersByType).forEach(type => {
      console.log(`  ${type}: ${usersByType[type].length} 个用户`);
    });

    // 检查重复的deviceId
    const deviceIdMap = new Map();
    const duplicates = [];

    users.forEach(user => {
      if (user.auth?.deviceId) {
        if (deviceIdMap.has(user.auth.deviceId)) {
          duplicates.push({
            deviceId: user.auth.deviceId,
            users: [deviceIdMap.get(user.auth.deviceId), user._id]
          });
        } else {
          deviceIdMap.set(user.auth.deviceId, user._id);
        }
      }
    });

    console.log(`\n🔍 重复的deviceId: ${duplicates.length} 个`);
    duplicates.forEach(dup => {
      console.log(`  deviceId: ${dup.deviceId}`);
      console.log(`    用户1: ${dup.users[0]}`);
      console.log(`    用户2: ${dup.users[1]}`);
    });

    // 显示所有用户详情
    console.log('\n👥 所有用户详情:');
    users.forEach((user, index) => {
      console.log(`\n用户 ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  用户名: ${user.username}`);
      console.log(`  昵称: ${user.nickname}`);
      console.log(`  登录类型: ${user.auth?.loginType || 'unknown'}`);
      console.log(`  设备ID: ${user.auth?.deviceId || 'none'}`);
      console.log(`  游客ID: ${user.auth?.guestId || 'none'}`);
      console.log(`  创建时间: ${user.createdAt}`);
      console.log(`  最后登录: ${user.lastLogin}`);
    });

  } catch (error) {
    console.error('❌ 检查用户数据失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ 数据库连接已关闭');
  }
}

checkUsers();
