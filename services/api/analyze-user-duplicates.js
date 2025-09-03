const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

async function analyzeDuplicates() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 连接到MongoDB数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    const db = client.db('dramaword');
    const usersCollection = db.collection('users');
    
    console.log('\n🔍 开始分析用户重复情况...');
    
    // 1. 按登录类型分组统计
    console.log('\n📊 按登录类型统计:');
    const loginTypeStats = await usersCollection.aggregate([
      {
        $group: {
          _id: '$auth.loginType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    loginTypeStats.forEach(stat => {
      console.log(`  ${stat._id || 'N/A'}: ${stat.count} 个用户`);
    });
    
    // 2. 检查游客用户重复情况
    console.log('\n👤 游客用户分析:');
    const guestUsers = await usersCollection.find({
      'auth.loginType': 'guest'
    }).toArray();
    
    console.log(`  总游客用户数: ${guestUsers.length}`);
    
    // 按设备ID分组
    const deviceGroups = {};
    const noDeviceUsers = [];
    
    guestUsers.forEach(user => {
      const deviceId = user.auth?.deviceId;
      if (deviceId) {
        if (!deviceGroups[deviceId]) {
          deviceGroups[deviceId] = [];
        }
        deviceGroups[deviceId].push(user);
      } else {
        noDeviceUsers.push(user);
      }
    });
    
    console.log(`  有设备ID的用户组: ${Object.keys(deviceGroups).length} 组`);
    console.log(`  无设备ID的用户: ${noDeviceUsers.length} 个`);
    
    // 检查有设备ID的重复用户
    let duplicateDeviceGroups = 0;
    let totalDeviceDuplicates = 0;
    
    for (const [deviceId, users] of Object.entries(deviceGroups)) {
      if (users.length > 1) {
        duplicateDeviceGroups++;
        totalDeviceDuplicates += users.length - 1;
        console.log(`\n  🔍 设备 ${deviceId} 有 ${users.length} 个用户:`);
        users.forEach((user, index) => {
          console.log(`    ${index + 1}. ${user.nickname} (${user.createdAt})`);
        });
      }
    }
    
    console.log(`\n📈 设备重复统计:`);
    console.log(`  重复设备组: ${duplicateDeviceGroups} 组`);
    console.log(`  重复用户数: ${totalDeviceDuplicates} 个`);
    
    // 3. 检查无设备ID的游客用户重复情况
    let duplicateNicknameGroups = 0;
    let totalNicknameDuplicates = 0;
    
    if (noDeviceUsers.length > 0) {
      console.log(`\n🔍 无设备ID用户分析:`);
      
      // 按昵称分组
      const nicknameGroups = {};
      noDeviceUsers.forEach(user => {
        const nickname = user.nickname;
        if (!nicknameGroups[nickname]) {
          nicknameGroups[nickname] = [];
        }
        nicknameGroups[nickname].push(user);
      });
      
      for (const [nickname, users] of Object.entries(nicknameGroups)) {
        if (users.length > 1) {
          duplicateNicknameGroups++;
          totalNicknameDuplicates += users.length - 1;
          console.log(`\n  🔍 昵称 '${nickname}' 有 ${users.length} 个用户:`);
          users.forEach((user, index) => {
            console.log(`    ${index + 1}. ${user._id} (${user.createdAt})`);
          });
        }
      }
      
      console.log(`\n📈 昵称重复统计:`);
      console.log(`  重复昵称组: ${duplicateNicknameGroups} 组`);
      console.log(`  重复用户数: ${totalNicknameDuplicates} 个`);
    }
    
    // 4. 检查其他登录类型的重复情况
    console.log(`\n🔍 其他登录类型重复检查:`);
    
    // 检查邮箱重复
    const emailUsers = await usersCollection.find({
      'auth.loginType': 'email',
      email: { $exists: true, $ne: null }
    }).toArray();
    
    const emailGroups = {};
    emailUsers.forEach(user => {
      const email = user.email;
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(user);
    });
    
    let duplicateEmails = 0;
    for (const [email, users] of Object.entries(emailGroups)) {
      if (users.length > 1) {
        duplicateEmails++;
        console.log(`\n  🔍 邮箱 '${email}' 有 ${users.length} 个用户:`);
        users.forEach((user, index) => {
          console.log(`    ${index + 1}. ${user.nickname} (${user.createdAt})`);
        });
      }
    }
    
    // 检查Apple ID重复
    const appleUsers = await usersCollection.find({
      'auth.loginType': 'apple',
      'auth.appleId': { $exists: true, $ne: null }
    }).toArray();
    
    const appleGroups = {};
    appleUsers.forEach(user => {
      const appleId = user.auth.appleId;
      if (!appleGroups[appleId]) {
        appleGroups[appleId] = [];
      }
      appleGroups[appleId].push(user);
    });
    
    let duplicateAppleIds = 0;
    for (const [appleId, users] of Object.entries(appleGroups)) {
      if (users.length > 1) {
        duplicateAppleIds++;
        console.log(`\n  🔍 Apple ID '${appleId}' 有 ${users.length} 个用户:`);
        users.forEach((user, index) => {
          console.log(`    ${index + 1}. ${user.nickname} (${user.createdAt})`);
        });
      }
    }
    
    console.log(`\n📈 其他类型重复统计:`);
    console.log(`  重复邮箱: ${duplicateEmails} 个`);
    console.log(`  重复Apple ID: ${duplicateAppleIds} 个`);
    
    // 5. 总结
    const totalDuplicates = totalDeviceDuplicates + totalNicknameDuplicates + duplicateEmails + duplicateAppleIds;
    console.log(`\n🎯 重复分析总结:`);
    console.log(`  总用户数: ${await usersCollection.countDocuments()}`);
    console.log(`  总重复数: ${totalDuplicates}`);
    console.log(`  建议清理: ${totalDuplicates > 0 ? '是' : '否'}`);
    
    if (totalDuplicates > 0) {
      console.log(`\n💡 建议操作:`);
      console.log(`  1. 清理重复的游客用户`);
      console.log(`  2. 合并重复的邮箱用户`);
      console.log(`  3. 合并重复的Apple用户`);
    }
    
  } catch (error) {
    console.error('❌ 分析失败:', error);
  } finally {
    await client.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

analyzeDuplicates();
