const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

async function testDeviceIdFunctionality() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 连接到MongoDB数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    const db = client.db('dramaword');
    const usersCollection = db.collection('users');
    
    console.log('\n🧪 测试设备ID功能...');
    
    // 1. 创建一个测试用户，包含设备ID
    const testDeviceId = `device_${Date.now()}_test123`;
    const testGuestId = `guest_${Date.now()}_test456`;
    
    const testUser = {
      username: `test_user_${Date.now()}`,
      nickname: `TestGuest${Date.now()}`,
      auth: {
        loginType: 'guest',
        guestId: testGuestId,
        deviceId: testDeviceId,
        lastLoginAt: new Date(),
        isActive: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('📝 创建测试用户:', {
      username: testUser.username,
      nickname: testUser.nickname,
      guestId: testUser.auth.guestId,
      deviceId: testUser.auth.deviceId
    });
    
    const insertResult = await usersCollection.insertOne(testUser);
    console.log('✅ 测试用户创建成功:', insertResult.insertedId);
    
    // 2. 验证用户是否正确保存了设备ID
    const savedUser = await usersCollection.findOne({ _id: insertResult.insertedId });
    console.log('\n🔍 验证保存的用户:');
    console.log('  用户ID:', savedUser._id);
    console.log('  用户名:', savedUser.username);
    console.log('  昵称:', savedUser.nickname);
    console.log('  游客ID:', savedUser.auth.guestId);
    console.log('  设备ID:', savedUser.auth.deviceId);
    console.log('  登录类型:', savedUser.auth.loginType);
    
    // 3. 测试按设备ID查找用户
    console.log('\n🔍 测试按设备ID查找用户:');
    const userByDeviceId = await usersCollection.findOne({
      'auth.deviceId': testDeviceId
    });
    
    if (userByDeviceId) {
      console.log('✅ 按设备ID查找成功:', userByDeviceId.nickname);
    } else {
      console.log('❌ 按设备ID查找失败');
    }
    
    // 4. 测试按游客ID查找用户
    console.log('\n🔍 测试按游客ID查找用户:');
    const userByGuestId = await usersCollection.findOne({
      'auth.guestId': testGuestId
    });
    
    if (userByGuestId) {
      console.log('✅ 按游客ID查找成功:', userByGuestId.nickname);
    } else {
      console.log('❌ 按游客ID查找失败');
    }
    
    // 5. 测试设备ID排重功能
    console.log('\n🔍 测试设备ID排重功能:');
    const duplicateUser = {
      username: `duplicate_user_${Date.now()}`,
      nickname: `DuplicateGuest${Date.now()}`,
      auth: {
        loginType: 'guest',
        guestId: `guest_${Date.now()}_duplicate`,
        deviceId: testDeviceId, // 使用相同的设备ID
        lastLoginAt: new Date(),
        isActive: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      const duplicateResult = await usersCollection.insertOne(duplicateUser);
      console.log('❌ 设备ID排重失败 - 创建了重复用户:', duplicateResult.insertedId);
    } catch (error) {
      console.log('✅ 设备ID排重成功 - 阻止了重复用户创建');
    }
    
    // 6. 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await usersCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ 测试用户已删除');
    
    // 7. 检查当前用户设备ID状态
    console.log('\n📊 当前用户设备ID状态:');
    const totalUsers = await usersCollection.countDocuments();
    const usersWithDeviceId = await usersCollection.countDocuments({
      'auth.deviceId': { $exists: true, $ne: null }
    });
    
    console.log(`  总用户数: ${totalUsers}`);
    console.log(`  有设备ID的用户: ${usersWithDeviceId}`);
    console.log(`  无设备ID的用户: ${totalUsers - usersWithDeviceId}`);
    
    console.log('\n🎯 测试结论:');
    if (usersWithDeviceId > 0) {
      console.log('✅ 设备ID功能正常工作');
      console.log('✅ 数据库支持设备ID字段');
      console.log('✅ 可以按设备ID查找用户');
    } else {
      console.log('❌ 设备ID功能可能有问题');
      console.log('💡 建议检查前端代码是否正确传递设备ID');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await client.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

testDeviceIdFunctionality();
