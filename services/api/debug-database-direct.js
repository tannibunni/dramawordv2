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

// 检查用户集合结构
async function inspectUserCollection() {
  console.log('\n🔍 检查用户集合结构...');
  console.log('='.repeat(50));
  
  try {
    const userCollection = mongoose.connection.collection('users');
    
    // 获取用户总数
    const totalUsers = await userCollection.countDocuments();
    console.log(`📊 用户总数: ${totalUsers}`);
    
    if (totalUsers === 0) {
      console.log('⚠️ 没有找到用户文档');
      return;
    }
    
    // 获取前5个用户文档进行分析
    const users = await userCollection.find({}).limit(5).toArray();
    
    console.log(`\n📋 分析前 ${users.length} 个用户文档:`);
    console.log('='.repeat(40));
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n👤 用户 ${i + 1}: ${user.username || user._id}`);
      console.log('-'.repeat(30));
      
      // 检查关键字段
      const criticalFields = [
        'username',
        'nickname', 
        'auth',
        'auth.loginType',
        'auth.appleId',
        'learningStats',
        'learningStats.level',
        'learningStats.experience',
        'settings',
        'subscription',
        'subscription.type',
        'subscription.startDate',
        'subscription.expiryDate'
      ];
      
      let missingFields = [];
      let fieldTypes = {};
      
      for (const field of criticalFields) {
        const value = getNestedValue(user, field);
        if (value === undefined) {
          missingFields.push(field);
          console.log(`❌ 缺少字段: ${field}`);
        } else {
          const valueType = Array.isArray(value) ? 'array' : typeof value;
          fieldTypes[field] = valueType;
          console.log(`✅ ${field}: ${valueType} = ${JSON.stringify(value).substring(0, 50)}`);
        }
      }
      
      // 检查subscription字段详情
      if (user.subscription) {
        console.log('\n🍎 Subscription字段详情:');
        console.log(`   type: ${user.subscription.type} (${typeof user.subscription.type})`);
        console.log(`   isActive: ${user.subscription.isActive} (${typeof user.subscription.isActive})`);
        console.log(`   startDate: ${user.subscription.startDate} (${typeof user.subscription.startDate})`);
        console.log(`   expiryDate: ${user.subscription.expiryDate} (${typeof user.subscription.expiryDate})`);
        console.log(`   autoRenew: ${user.subscription.autoRenew} (${typeof user.subscription.autoRenew})`);
      }
      
      // 检查Apple认证字段
      if (user.auth && user.auth.appleId) {
        console.log('\n🍎 Apple认证字段:');
        console.log(`   appleId: ${user.auth.appleId}`);
        console.log(`   appleEmail: ${user.auth.appleEmail || 'undefined'}`);
        console.log(`   loginType: ${user.auth.loginType}`);
      }
      
      if (missingFields.length > 0) {
        console.log(`\n⚠️ 用户 ${i + 1} 缺少字段: ${missingFields.join(', ')}`);
      }
    }
    
    // 统计问题用户
    console.log('\n📈 问题统计:');
    console.log('='.repeat(30));
    
    const usersWithoutSubscription = await userCollection.countDocuments({
      $or: [
        { subscription: { $exists: false } },
        { subscription: null }
      ]
    });
    
    const usersWithoutLearningStats = await userCollection.countDocuments({
      $or: [
        { learningStats: { $exists: false } },
        { learningStats: null }
      ]
    });
    
    const usersWithoutSettings = await userCollection.countDocuments({
      $or: [
        { settings: { $exists: false } },
        { settings: null }
      ]
    });
    
    console.log(`缺少subscription字段的用户: ${usersWithoutSubscription}`);
    console.log(`缺少learningStats字段的用户: ${usersWithoutLearningStats}`);
    console.log(`缺少settings字段的用户: ${usersWithoutSettings}`);
    
    // 检查Schema版本问题
    console.log('\n🔍 检查Schema版本问题:');
    console.log('='.repeat(30));
    
    // 查找有subscription但缺少必需字段的用户
    const incompleteSubscriptionUsers = await userCollection.countDocuments({
      subscription: { $exists: true, $ne: null },
      $or: [
        { 'subscription.type': { $exists: false } },
        { 'subscription.startDate': { $exists: false } },
        { 'subscription.expiryDate': { $exists: false } }
      ]
    });
    
    console.log(`subscription字段不完整的用户: ${incompleteSubscriptionUsers}`);
    
    return {
      totalUsers,
      usersWithoutSubscription,
      usersWithoutLearningStats,
      usersWithoutSettings,
      incompleteSubscriptionUsers
    };
    
  } catch (error) {
    console.error('❌ 检查用户集合失败:', error);
    return null;
  }
}

// 获取嵌套对象的值
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// 检查数据库索引
async function checkIndexes() {
  console.log('\n🔍 检查数据库索引...');
  console.log('='.repeat(30));
  
  try {
    const userCollection = mongoose.connection.collection('users');
    const indexes = await userCollection.indexes();
    
    console.log(`📊 用户集合索引数量: ${indexes.length}`);
    
    for (const index of indexes) {
      console.log(`索引: ${JSON.stringify(index.key)}`);
      console.log(`名称: ${index.name}`);
      console.log(`唯一: ${index.unique || false}`);
      console.log('---');
    }
    
  } catch (error) {
    console.error('❌ 检查索引失败:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 直接检查云端数据库...');
  
  try {
    await connectDB();
    
    // 检查用户集合
    const stats = await inspectUserCollection();
    
    // 检查索引
    await checkIndexes();
    
    // 生成修复建议
    console.log('\n📋 修复建议:');
    console.log('='.repeat(30));
    
    if (stats) {
      if (stats.usersWithoutSubscription > 0 || stats.incompleteSubscriptionUsers > 0) {
        console.log('❌ 发现subscription字段问题:');
        console.log(`   - ${stats.usersWithoutSubscription} 个用户缺少subscription字段`);
        console.log(`   - ${stats.incompleteSubscriptionUsers} 个用户subscription字段不完整`);
        console.log('\n🔧 建议运行修复脚本:');
        console.log('   node services/api/fix-user-subscription.js');
      }
      
      if (stats.usersWithoutLearningStats > 0) {
        console.log(`❌ ${stats.usersWithoutLearningStats} 个用户缺少learningStats字段`);
      }
      
      if (stats.usersWithoutSettings > 0) {
        console.log(`❌ ${stats.usersWithoutSettings} 个用户缺少settings字段`);
      }
    }
    
    console.log('\n✅ 检查完成！');
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
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
  inspectUserCollection,
  checkIndexes
}; 