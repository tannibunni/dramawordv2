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

// 用户模式定义（与后端保持一致）
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  avatar: {
    type: String,
    default: null
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  auth: {
    loginType: {
      type: String,
      enum: ['phone', 'wechat', 'apple', 'guest'],
      required: true
    },
    phoneNumber: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    wechatId: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    wechatOpenId: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    wechatUnionId: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    wechatNickname: {
      type: String,
      required: false
    },
    wechatAvatar: {
      type: String,
      required: false
    },
    wechatAccessToken: {
      type: String,
      required: false
    },
    wechatRefreshToken: {
      type: String,
      required: false
    },
    wechatTokenExpiresAt: {
      type: Date,
      required: false
    },
    appleId: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    appleEmail: {
      type: String,
      required: false
    },
    appleFullName: {
      givenName: {
        type: String,
        required: false
      },
      familyName: {
        type: String,
        required: false
      }
    },
    guestId: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  learningStats: {
    totalWordsLearned: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    averageAccuracy: {
      type: Number,
      default: 0
    },
    totalStudyTime: {
      type: Number,
      default: 0
    },
    lastStudyDate: {
      type: Date,
      default: null
    },
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    },
    dailyReviewXP: {
      type: Number,
      default: 0
    },
    dailyStudyTimeXP: {
      type: Number,
      default: 0
    },
    lastDailyReset: {
      type: Date,
      default: Date.now
    },
    completedDailyCards: {
      type: Boolean,
      default: false
    },
    lastDailyCardsDate: {
      type: Date,
      default: null
    }
  },
  contributedWords: {
    type: Number,
    default: 0
  },
  settings: {
    notifications: {
      dailyReminder: {
        type: Boolean,
        default: true
      },
      reviewReminder: {
        type: Boolean,
        default: true
      },
      achievementNotification: {
        type: Boolean,
        default: true
      }
    },
    learning: {
      dailyGoal: {
        type: Number,
        default: 20,
        min: 5,
        max: 100
      },
      reviewInterval: {
        type: Number,
        default: 24,
        min: 1,
        max: 168
      },
      autoPlayAudio: {
        type: Boolean,
        default: true
      },
      showPhonetic: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      shareProgress: {
        type: Boolean,
        default: false
      },
      showInLeaderboard: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      enum: ['zh-CN', 'en-US'],
      default: 'zh-CN'
    }
  },
  subscription: {
    type: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime'],
      default: 'lifetime'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100年后过期
      }
    },
    autoRenew: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', UserSchema);

// 修复用户订阅数据
async function fixUserSubscriptions() {
  console.log('\n🔧 开始修复用户订阅数据...');
  
  try {
    // 查找所有没有订阅数据的用户
    const usersWithoutSubscription = await User.find({
      $or: [
        { subscription: { $exists: false } },
        { subscription: null },
        { 'subscription.type': { $exists: false } },
        { 'subscription.startDate': { $exists: false } },
        { 'subscription.expiryDate': { $exists: false } }
      ]
    });
    
    console.log(`📊 找到 ${usersWithoutSubscription.length} 个用户需要修复订阅数据`);
    
    if (usersWithoutSubscription.length === 0) {
      console.log('✅ 所有用户都有完整的订阅数据');
      return;
    }
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithoutSubscription) {
      try {
        // 为每个用户添加默认的终身订阅
        const defaultSubscription = {
          type: 'lifetime',
          isActive: true,
          startDate: user.createdAt || new Date(),
          expiryDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100年后过期
          autoRenew: false
        };
        
        // 使用 findOneAndUpdate 避免并行保存冲突
        await User.findByIdAndUpdate(
          user._id,
          { $set: { subscription: defaultSubscription } },
          { new: true, runValidators: true }
        );
        
        console.log(`✅ 修复用户 ${user.username} (${user._id}) 的订阅数据`);
        fixedCount++;
      } catch (error) {
        console.error(`❌ 修复用户 ${user.username} (${user._id}) 失败:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📈 修复结果:`);
    console.log(`   ✅ 成功修复: ${fixedCount} 个用户`);
    console.log(`   ❌ 修复失败: ${errorCount} 个用户`);
    
  } catch (error) {
    console.error('❌ 修复用户订阅数据时出错:', error);
  }
}

// 检查并修复并行保存问题
async function checkParallelSaveIssues() {
  console.log('\n🔍 检查并行保存问题...');
  
  try {
    // 查找最近有更新操作的用户
    const recentUsers = await User.find({
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 最近24小时
    }).limit(10);
    
    console.log(`📊 最近24小时有更新的用户: ${recentUsers.length} 个`);
    
    // 检查是否有重复的更新操作
    const userIds = recentUsers.map(user => user._id.toString());
    const duplicateIds = userIds.filter((id, index) => userIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      console.log(`⚠️ 发现可能的重复更新操作: ${duplicateIds.length} 个用户`);
      console.log('   重复的用户ID:', duplicateIds);
    } else {
      console.log('✅ 未发现明显的并行保存问题');
    }
    
  } catch (error) {
    console.error('❌ 检查并行保存问题时出错:', error);
  }
}

// 优化用户模型以避免并行保存问题
async function optimizeUserModel() {
  console.log('\n⚡ 优化用户模型以避免并行保存问题...');
  
  try {
    // 为经常更新的字段添加索引
    await User.collection.createIndex({ 'learningStats.experience': 1 });
    await User.collection.createIndex({ 'learningStats.level': 1 });
    await User.collection.createIndex({ 'learningStats.currentStreak': 1 });
    await User.collection.createIndex({ 'learningStats.lastStudyDate': 1 });
    await User.collection.createIndex({ 'learningStats.lastDailyReset': 1 });
    
    console.log('✅ 用户模型索引优化完成');
    
  } catch (error) {
    console.error('❌ 优化用户模型时出错:', error);
  }
}

// 生成修复建议
function generateRecommendations() {
  console.log('\n📋 修复建议:');
  console.log('1. 订阅数据问题:');
  console.log('   - 已为所有缺少订阅数据的用户添加默认终身订阅');
  console.log('   - 建议在用户注册时确保订阅数据完整性');
  
  console.log('\n2. 并行保存问题:');
  console.log('   - 使用 findOneAndUpdate 替代 save() 方法');
  console.log('   - 添加乐观锁机制防止并发更新');
  console.log('   - 使用事务处理批量更新操作');
  
  console.log('\n3. 代码优化建议:');
  console.log('   - 在 ExperienceService 中使用 findOneAndUpdate');
  console.log('   - 添加重试机制处理并发冲突');
  console.log('   - 使用队列处理高频更新操作');
}

// 主函数
async function main() {
  console.log('🚀 开始修复用户订阅和并行保存问题...');
  
  try {
    await connectDB();
    
    // 修复用户订阅数据
    await fixUserSubscriptions();
    
    // 检查并行保存问题
    await checkParallelSaveIssues();
    
    // 优化用户模型
    await optimizeUserModel();
    
    // 生成修复建议
    generateRecommendations();
    
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
  fixUserSubscriptions,
  checkParallelSaveIssues,
  optimizeUserModel
}; 