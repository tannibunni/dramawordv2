const { MongoClient } = require('mongodb');

async function checkUsers() {
  const uri = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ 连接到MongoDB成功');

    const db = client.db('dramaword');
    const usersCollection = db.collection('users');

    // 查找所有用户
    const users = await usersCollection.find({}).toArray();

    console.log(`📊 找到 ${users.length} 个用户:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. 用户信息:`);
      console.log(`   - ID: ${user._id}`);
      console.log(`   - 用户名: ${user.username}`);
      console.log(`   - 登录类型: ${user.auth?.loginType}`);
      console.log(`   - 经验值: ${user.learningStats?.experience || 0}`);
      console.log(`   - 等级: ${user.learningStats?.level || 1}`);
      console.log(`   - Apple ID: ${user.auth?.appleId || '无'}`);
    });

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await client.close();
  }
}

checkUsers(); 