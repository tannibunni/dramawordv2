const mongoose = require('mongoose');

// 直接连接到数据库
const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// 清空所有用户数据
async function clearAllUsers() {
  console.log('\n🗑️ 清空所有用户数据...');
  console.log('='.repeat(50));
  
  try {
    const userCollection = mongoose.connection.collection('users');
    
    // 获取当前用户数量
    const totalUsers = await userCollection.countDocuments();
    console.log(`📊 当前用户总数: ${totalUsers}`);
    
    if (totalUsers === 0) {
      console.log('✅ 数据库中没有用户数据');
      return;
    }
    
    // 显示前几个用户信息
    const sampleUsers = await userCollection.find({}).limit(5).toArray();
    console.log('\n📋 前5个用户示例:');
    sampleUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.auth?.loginType || 'unknown'})`);
    });
    
    // 确认删除
    console.log('\n⚠️ 警告: 即将删除所有用户数据！');
    console.log('='.repeat(40));
    console.log('这将删除:');
    console.log('   - 所有用户账户');
    console.log('   - 所有学习记录');
    console.log('   - 所有用户设置');
    console.log('   - 所有订阅信息');
    console.log('\n此操作不可逆！');
    
    // 执行删除
    const result = await userCollection.deleteMany({});
    
    console.log(`\n🗑️ 删除结果:`);
    console.log(`   ✅ 成功删除: ${result.deletedCount} 个用户`);
    
    // 验证删除结果
    const remainingUsers = await userCollection.countDocuments();
    console.log(`   📊 剩余用户: ${remainingUsers}`);
    
    if (remainingUsers === 0) {
      console.log('✅ 所有用户数据已成功清空！');
    } else {
      console.log('⚠️ 仍有用户数据未删除');
    }
    
  } catch (error) {
    console.error('❌ 清空用户数据失败:', error);
  }
}

// 清空相关集合
async function clearRelatedCollections() {
  console.log('\n🗑️ 清空相关集合...');
  console.log('='.repeat(30));
  
  try {
    const collections = [
      'userlearningrecords',
      'searchhistories', 
      'cloudwords',
      'userwords',
      'uservocabularies',
      'payments',
      'recommendations',
      'feedbacks'
    ];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`   ✅ 清空 ${collectionName}: ${result.deletedCount} 条记录`);
        } else {
          console.log(`   ℹ️  ${collectionName}: 无数据`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${collectionName}: 集合不存在或清空失败`);
      }
    }
    
  } catch (error) {
    console.error('❌ 清空相关集合失败:', error);
  }
}

// 显示数据库状态
async function showDatabaseStatus() {
  console.log('\n📊 数据库状态:');
  console.log('='.repeat(30));
  
  try {
    const collections = [
      'users',
      'userlearningrecords',
      'searchhistories',
      'cloudwords',
      'userwords',
      'uservocabularies',
      'payments',
      'recommendations',
      'feedbacks'
    ];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`   ${collectionName}: ${count} 条记录`);
      } catch (error) {
        console.log(`   ${collectionName}: 集合不存在`);
      }
    }
    
  } catch (error) {
    console.error('❌ 获取数据库状态失败:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 清空数据库用户数据...');
  
  try {
    await connectDB();
    
    // 显示清空前状态
    await showDatabaseStatus();
    
    // 清空用户数据
    await clearAllUsers();
    
    // 清空相关集合
    await clearRelatedCollections();
    
    // 显示清空后状态
    await showDatabaseStatus();
    
    console.log('\n✅ 数据库清空完成！');
    
  } catch (error) {
    console.error('❌ 清空过程中出错:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  clearAllUsers,
  clearRelatedCollections,
  showDatabaseStatus
}; 