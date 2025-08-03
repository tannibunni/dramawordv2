const mongoose = require('mongoose');
require('dotenv').config();

// 连接到数据库
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// 检查用户文档结构
async function checkUserDocuments() {
  console.log('\n🔍 检查用户文档结构...');
  console.log('='.repeat(50));
  
  try {
    // 获取用户集合
    const userCollection = mongoose.connection.collection('users');
    
    // 获取所有用户文档
    const users = await userCollection.find({}).limit(10).toArray();
    
    console.log(`📊 检查了 ${users.length} 个用户文档`);
    
    if (users.length === 0) {
      console.log('⚠️ 没有找到用户文档');
      return;
    }
    
    // 分析第一个用户文档的结构
    const sampleUser = users[0];
    console.log('\n📋 示例用户文档结构:');
    console.log('='.repeat(30));
    
    // 递归检查对象结构
    function checkObjectStructure(obj, path = '') {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const valueType = Array.isArray(value) ? 'array' : typeof value;
        
        console.log(`${currentPath}: ${valueType}${Array.isArray(value) ? `[${value.length}]` : ''}`);
        
        if (valueType === 'object' && value !== null && !Array.isArray(value)) {
          checkObjectStructure(value, currentPath);
        }
      }
    }
    
    checkObjectStructure(sampleUser);
    
    // 检查关键字段是否存在
    console.log('\n🔍 检查关键字段:');
    console.log('='.repeat(30));
    
    const criticalFields = [
      'username',
      'nickname',
      'auth',
      'auth.loginType',
      'auth.lastLoginAt',
      'learningStats',
      'learningStats.level',
      'learningStats.experience',
      'learningStats.currentStreak',
      'learningStats.lastStudyDate',
      'settings',
      'subscription',
      'subscription.type',
      'subscription.startDate',
      'subscription.expiryDate'
    ];
    
    let missingFields = [];
    let incorrectTypes = [];
    
    for (const field of criticalFields) {
      const value = getNestedValue(sampleUser, field);
      if (value === undefined) {
        missingFields.push(field);
        console.log(`❌ 缺少字段: ${field}`);
      } else {
        console.log(`✅ 字段存在: ${field} (${typeof value})`);
      }
    }
    
    // 检查订阅字段
    console.log('\n🍎 检查订阅字段:');
    console.log('='.repeat(30));
    
    if (sampleUser.subscription) {
      console.log(`✅ subscription 对象存在`);
      console.log(`   type: ${sampleUser.subscription.type || 'undefined'}`);
      console.log(`   isActive: ${sampleUser.subscription.isActive}`);
      console.log(`   startDate: ${sampleUser.subscription.startDate}`);
      console.log(`   expiryDate: ${sampleUser.subscription.expiryDate}`);
    } else {
      console.log(`❌ subscription 对象不存在`);
      missingFields.push('subscription');
    }
    
    // 检查Apple认证字段
    console.log('\n🍎 检查Apple认证字段:');
    console.log('='.repeat(30));
    
    if (sampleUser.auth && sampleUser.auth.appleId) {
      console.log(`✅ Apple认证字段存在`);
      console.log(`   appleId: ${sampleUser.auth.appleId}`);
      console.log(`   appleEmail: ${sampleUser.auth.appleEmail || 'undefined'}`);
    } else {
      console.log(`⚠️ Apple认证字段不存在或为空`);
    }
    
    // 生成修复建议
    console.log('\n📋 修复建议:');
    console.log('='.repeat(30));
    
    if (missingFields.length > 0) {
      console.log('❌ 发现缺少的字段:');
      missingFields.forEach(field => console.log(`   - ${field}`));
      console.log('\n🔧 建议运行数据库迁移脚本修复缺失字段');
    } else {
      console.log('✅ 所有关键字段都存在');
    }
    
    return { missingFields, incorrectTypes };
    
  } catch (error) {
    console.error('❌ 检查用户文档结构失败:', error);
    return { missingFields: [], incorrectTypes: [] };
  }
}

// 获取嵌套对象的值
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// 修复用户文档结构
async function fixUserDocuments() {
  console.log('\n🔧 修复用户文档结构...');
  console.log('='.repeat(50));
  
  try {
    const userCollection = mongoose.connection.collection('users');
    
    // 查找需要修复的用户
    const usersToFix = await userCollection.find({
      $or: [
        { subscription: { $exists: false } },
        { subscription: null },
        { 'subscription.type': { $exists: false } },
        { 'subscription.startDate': { $exists: false } },
        { 'subscription.expiryDate': { $exists: false } }
      ]
    }).toArray();
    
    console.log(`📊 找到 ${usersToFix.length} 个需要修复的用户`);
    
    if (usersToFix.length === 0) {
      console.log('✅ 所有用户文档结构都正确');
      return;
    }
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const user of usersToFix) {
      try {
        // 准备修复数据
        const fixData = {};
        
        // 修复订阅字段
        if (!user.subscription || !user.subscription.type) {
          fixData.subscription = {
            type: 'lifetime',
            isActive: true,
            startDate: user.createdAt || new Date(),
            expiryDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
            autoRenew: false
          };
        }
        
        // 修复学习统计字段
        if (!user.learningStats) {
          fixData.learningStats = {
            totalWordsLearned: 0,
            totalReviews: 0,
            currentStreak: 0,
            longestStreak: 0,
            averageAccuracy: 0,
            totalStudyTime: 0,
            lastStudyDate: null,
            level: 1,
            experience: 0,
            dailyReviewXP: 0,
            dailyStudyTimeXP: 0,
            lastDailyReset: new Date(),
            completedDailyCards: false,
            lastDailyCardsDate: null
          };
        }
        
        // 修复设置字段
        if (!user.settings) {
          fixData.settings = {
            notifications: {
              dailyReminder: true,
              reviewReminder: true,
              achievementNotification: true
            },
            learning: {
              dailyGoal: 20,
              reviewInterval: 24,
              autoPlayAudio: true,
              showPhonetic: true
            },
            privacy: {
              shareProgress: false,
              showInLeaderboard: true
            },
            theme: 'auto',
            language: 'zh-CN'
          };
        }
        
        // 应用修复
        if (Object.keys(fixData).length > 0) {
          await userCollection.updateOne(
            { _id: user._id },
            { $set: fixData }
          );
          
          console.log(`✅ 修复用户: ${user.username || user._id}`);
          fixedCount++;
        }
        
      } catch (error) {
        console.error(`❌ 修复用户失败: ${user.username || user._id}`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📈 修复结果:`);
    console.log(`   ✅ 成功修复: ${fixedCount} 个用户`);
    console.log(`   ❌ 修复失败: ${errorCount} 个用户`);
    
  } catch (error) {
    console.error('❌ 修复用户文档结构失败:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 检查云端USER表结构...');
  
  try {
    await connectDB();
    
    // 检查用户文档结构
    const { missingFields } = await checkUserDocuments();
    
    // 如果有缺失字段，询问是否修复
    if (missingFields.length > 0) {
      console.log('\n❓ 是否要修复缺失的字段？(y/n)');
      // 这里可以添加用户交互，现在直接修复
      await fixUserDocuments();
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
  checkUserDocuments,
  fixUserDocuments
}; 