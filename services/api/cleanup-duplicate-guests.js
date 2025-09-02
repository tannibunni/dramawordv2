const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

async function cleanupDuplicateGuests() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 连接到MongoDB数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    const db = client.db('dramaword');
    const usersCollection = db.collection('users');
    
    console.log('\n🔍 分析重复的游客用户...');
    
    // 查找所有游客用户
    const guestUsers = await usersCollection.find({
      'auth.loginType': 'guest'
    }).toArray();
    
    console.log(`📊 找到 ${guestUsers.length} 个游客用户`);
    
    // 按设备ID分组（如果有的话）
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
    
    console.log(`📱 有设备ID的用户组: ${Object.keys(deviceGroups).length} 组`);
    console.log(`❓ 无设备ID的用户: ${noDeviceUsers.length} 个`);
    
    // 处理有设备ID的重复用户
    let duplicateCount = 0;
    let keptCount = 0;
    
    for (const [deviceId, users] of Object.entries(deviceGroups)) {
      if (users.length > 1) {
        console.log(`\n🔍 设备 ${deviceId} 有 ${users.length} 个用户:`);
        
        // 按创建时间排序，保留最新的
        users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const keepUser = users[0];
        const deleteUsers = users.slice(1);
        
        console.log(`  ✅ 保留: ${keepUser.nickname} (${keepUser.createdAt})`);
        
        for (const user of deleteUsers) {
          console.log(`  ❌ 删除: ${user.nickname} (${user.createdAt})`);
          
          // 删除重复用户
          await usersCollection.deleteOne({ _id: user._id });
          duplicateCount++;
        }
        
        keptCount++;
      }
    }
    
    // 处理无设备ID的用户（这些可能是旧的重复用户）
    if (noDeviceUsers.length > 0) {
      console.log(`\n🔍 处理 ${noDeviceUsers.length} 个无设备ID的用户...`);
      
      // 按昵称模式分组
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
          console.log(`\n🔍 昵称 ${nickname} 有 ${users.length} 个用户:`);
          
          // 按创建时间排序，保留最新的
          users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const keepUser = users[0];
          const deleteUsers = users.slice(1);
          
          console.log(`  ✅ 保留: ${keepUser._id} (${keepUser.createdAt})`);
          
          for (const user of deleteUsers) {
            console.log(`  ❌ 删除: ${user._id} (${user.createdAt})`);
            
            // 删除重复用户
            await usersCollection.deleteOne({ _id: user._id });
            duplicateCount++;
          }
        }
      }
    }
    
    console.log('\n📊 清理结果:');
    console.log(`  ✅ 保留的用户组: ${keptCount}`);
    console.log(`  ❌ 删除的重复用户: ${duplicateCount}`);
    
    // 显示清理后的统计
    const remainingGuests = await usersCollection.countDocuments({
      'auth.loginType': 'guest'
    });
    console.log(`  📱 剩余游客用户: ${remainingGuests}`);
    
    console.log('\n✅ 游客用户清理完成');
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
  } finally {
    await client.close();
    console.log('🔌 数据库连接已关闭');
  }
}

cleanupDuplicateGuests();
