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

// 修复用户文档结构
async function fixUserDocuments() {
  console.log('\n🔧 修复用户文档结构...');
  console.log('='.repeat(50));
  
  try {
    const userCollection = mongoose.connection.collection('users');
    
    // 获取所有用户
    const allUsers = await userCollection.find({}).toArray();
    console.log(`📊 总用户数: ${allUsers.length}`);
    
    if (allUsers.length === 0) {
      console.log('✅ 没有用户需要修复');
      return;
    }
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const user of allUsers) {
      try {
        const fixData = {};
        let needsUpdate = false;
        
        // 1. 修复subscription字段
        if (!user.subscription || typeof user.subscription !== 'object') {
          fixData.subscription = {
            type: 'lifetime',
            isActive: true,
            startDate: user.createdAt || new Date(),
            expiryDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
            autoRenew: false
          };
          needsUpdate = true;
          console.log(`   🔧 修复subscription字段: ${user.username || user._id}`);
        } else {
          // 检查subscription字段是否完整
          const subscription = user.subscription;
          const subscriptionFix = {};
          
          if (!subscription.type) {
            subscriptionFix.type = 'lifetime';
            needsUpdate = true;
          }
          if (!subscription.isActive) {
            subscriptionFix.isActive = true;
            needsUpdate = true;
          }
          if (!subscription.startDate) {
            subscriptionFix.startDate = user.createdAt || new Date();
            needsUpdate = true;
          }
          if (!subscription.expiryDate) {
            subscriptionFix.expiryDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
            needsUpdate = true;
          }
          if (subscription.autoRenew === undefined) {
            subscriptionFix.autoRenew = false;
            needsUpdate = true;
          }
          
          if (Object.keys(subscriptionFix).length > 0) {
            fixData.subscription = { ...subscription, ...subscriptionFix };
            console.log(`   🔧 完善subscription字段: ${user.username || user._id}`);
          }
        }
        
        // 2. 修复learningStats字段
        if (!user.learningStats || typeof user.learningStats !== 'object') {
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
          needsUpdate = true;
          console.log(`   🔧 修复learningStats字段: ${user.username || user._id}`);
        } else {
          // 检查learningStats字段是否完整
          const learningStats = user.learningStats;
          const learningStatsFix = {};
          
          const requiredFields = [
            'totalWordsLearned', 'totalReviews', 'currentStreak', 'longestStreak',
            'averageAccuracy', 'totalStudyTime', 'level', 'experience',
            'dailyReviewXP', 'dailyStudyTimeXP', 'completedDailyCards'
          ];
          
          for (const field of requiredFields) {
            if (learningStats[field] === undefined) {
              learningStatsFix[field] = field === 'level' ? 1 : 0;
              needsUpdate = true;
            }
          }
          
          if (!learningStats.lastDailyReset) {
            learningStatsFix.lastDailyReset = new Date();
            needsUpdate = true;
          }
          
          if (Object.keys(learningStatsFix).length > 0) {
            fixData.learningStats = { ...learningStats, ...learningStatsFix };
            console.log(`   🔧 完善learningStats字段: ${user.username || user._id}`);
          }
        }
        
        // 3. 修复settings字段
        if (!user.settings || typeof user.settings !== 'object') {
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
          needsUpdate = true;
          console.log(`   🔧 修复settings字段: ${user.username || user._id}`);
        } else {
          // 检查settings字段是否完整
          const settings = user.settings;
          const settingsFix = {};
          
          if (!settings.notifications) {
            settingsFix.notifications = {
              dailyReminder: true,
              reviewReminder: true,
              achievementNotification: true
            };
            needsUpdate = true;
          }
          
          if (!settings.learning) {
            settingsFix.learning = {
              dailyGoal: 20,
              reviewInterval: 24,
              autoPlayAudio: true,
              showPhonetic: true
            };
            needsUpdate = true;
          }
          
          if (!settings.privacy) {
            settingsFix.privacy = {
              shareProgress: false,
              showInLeaderboard: true
            };
            needsUpdate = true;
          }
          
          if (!settings.theme) {
            settingsFix.theme = 'auto';
            needsUpdate = true;
          }
          
          if (!settings.language) {
            settingsFix.language = 'zh-CN';
            needsUpdate = true;
          }
          
          if (Object.keys(settingsFix).length > 0) {
            fixData.settings = { ...settings, ...settingsFix };
            console.log(`   🔧 完善settings字段: ${user.username || user._id}`);
          }
        }
        
        // 4. 修复auth字段
        if (!user.auth || typeof user.auth !== 'object') {
          fixData.auth = {
            loginType: 'guest',
            lastLoginAt: new Date(),
            isActive: true
          };
          needsUpdate = true;
          console.log(`   🔧 修复auth字段: ${user.username || user._id}`);
        } else {
          // 检查auth字段是否完整
          const auth = user.auth;
          const authFix = {};
          
          if (!auth.loginType) {
            authFix.loginType = 'guest';
            needsUpdate = true;
          }
          
          if (!auth.lastLoginAt) {
            authFix.lastLoginAt = new Date();
            needsUpdate = true;
          }
          
          if (auth.isActive === undefined) {
            authFix.isActive = true;
            needsUpdate = true;
          }
          
          if (Object.keys(authFix).length > 0) {
            fixData.auth = { ...auth, ...authFix };
            console.log(`   🔧 完善auth字段: ${user.username || user._id}`);
          }
        }
        
        // 5. 修复contributedWords字段
        if (user.contributedWords === undefined) {
          fixData.contributedWords = 0;
          needsUpdate = true;
          console.log(`   🔧 修复contributedWords字段: ${user.username || user._id}`);
        }
        
        // 应用修复
        if (needsUpdate) {
          await userCollection.updateOne(
            { _id: user._id },
            { $set: fixData }
          );
          
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
    console.log(`   📊 总用户数: ${allUsers.length}`);
    
  } catch (error) {
    console.error('❌ 修复用户文档结构失败:', error);
  }
}

// 验证修复结果
async function verifyFix() {
  console.log('\n🔍 验证修复结果...');
  console.log('='.repeat(30));
  
  try {
    const userCollection = mongoose.connection.collection('users');
    
    // 检查是否还有问题用户
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
    
    const usersWithoutAuth = await userCollection.countDocuments({
      $or: [
        { auth: { $exists: false } },
        { auth: null }
      ]
    });
    
    console.log(`缺少subscription字段的用户: ${usersWithoutSubscription}`);
    console.log(`缺少learningStats字段的用户: ${usersWithoutLearningStats}`);
    console.log(`缺少settings字段的用户: ${usersWithoutSettings}`);
    console.log(`缺少auth字段的用户: ${usersWithoutAuth}`);
    
    if (usersWithoutSubscription === 0 && 
        usersWithoutLearningStats === 0 && 
        usersWithoutSettings === 0 && 
        usersWithoutAuth === 0) {
      console.log('✅ 所有用户文档结构都正确！');
    } else {
      console.log('⚠️ 仍有用户文档结构不完整');
    }
    
  } catch (error) {
    console.error('❌ 验证修复结果失败:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 直接检查并修复云端数据库...');
  
  try {
    await connectDB();
    
    // 检查用户集合
    const stats = await inspectUserCollection();
    
    // 修复用户文档
    await fixUserDocuments();
    
    // 验证修复结果
    await verifyFix();
    
    console.log('\n✅ 修复完成！');
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
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
  fixUserDocuments,
  verifyFix
}; 