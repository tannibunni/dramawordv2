const { MongoClient } = require('mongodb');

async function testExperienceFix() {
  const uri = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ 连接到MongoDB成功');

    const db = client.db('dramaword');
    const usersCollection = db.collection('users');

    // 查找测试用户 - 使用用户ID
    const user = await usersCollection.findOne({ 
      _id: '689117cc957b2953f296f979'
    });

    if (!user) {
      console.log('❌ 未找到测试用户');
      return;
    }

    console.log('📊 用户当前状态:');
    console.log(`   - 用户ID: ${user._id}`);
    console.log(`   - 用户名: ${user.username}`);
    console.log(`   - 当前经验值: ${user.learningStats?.experience || 0}`);
    console.log(`   - 当前等级: ${user.learningStats?.level || 1}`);

    // 模拟复习单词（正确）
    const oldExperience = user.learningStats?.experience || 0;
    const oldLevel = user.learningStats?.level || 1;

    console.log('\n🧪 测试复习单词（正确）...');
    
    // 更新用户经验值
    const result = await usersCollection.updateOne(
      { _id: user._id },
      {
        $inc: {
          'learningStats.experience': 2
        }
      }
    );

    if (result.modifiedCount > 0) {
      // 重新获取用户数据
      const updatedUser = await usersCollection.findOne({ _id: user._id });
      const newExperience = updatedUser.learningStats?.experience || 0;
      const xpGained = newExperience - oldExperience;

      console.log('✅ 经验值更新成功:');
      console.log(`   - 旧经验值: ${oldExperience}`);
      console.log(`   - 新经验值: ${newExperience}`);
      console.log(`   - 获得经验值: ${xpGained}`);
      console.log(`   - 应该获得: 2`);
      console.log(`   - 结果: ${xpGained === 2 ? '✅ 正确' : '❌ 错误'}`);
    } else {
      console.log('❌ 经验值更新失败');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await client.close();
  }
}

testExperienceFix(); 