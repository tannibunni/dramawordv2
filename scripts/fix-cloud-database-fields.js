const mongoose = require('../services/api/node_modules/mongoose');

// MongoDB连接字符串
const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

// 定义模型（与后端保持一致）
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  avatar: { type: String, default: null },
  email: { type: String, required: false, unique: true, sparse: true },
  auth: {
    loginType: { type: String, enum: ['phone', 'wechat', 'apple', 'guest'], required: true },
    phoneNumber: { type: String, required: false, unique: true, sparse: true },
    wechatId: { type: String, required: false, unique: true, sparse: true },
    wechatOpenId: { type: String, required: false, unique: true, sparse: true },
    wechatUnionId: { type: String, required: false, unique: true, sparse: true },
    wechatNickname: { type: String, required: false },
    wechatAvatar: { type: String, required: false },
    wechatAccessToken: { type: String, required: false },
    wechatRefreshToken: { type: String, required: false },
    wechatTokenExpiresAt: { type: Date, required: false },
    appleId: { type: String, required: false, unique: true, sparse: true },
    appleEmail: { type: String, required: false },
    appleFullName: {
      givenName: { type: String, required: false },
      familyName: { type: String, required: false }
    },
    guestId: { type: String, required: false, unique: true, sparse: true },
    lastLoginAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  },
  learningStats: {
    totalWordsLearned: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    lastStudyDate: { type: Date, default: null },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    dailyReviewXP: { type: Number, default: 0 },
    dailyStudyTimeXP: { type: Number, default: 0 },
    lastDailyReset: { type: Date, default: Date.now },
    completedDailyCards: { type: Boolean, default: false },
    lastDailyCardsDate: { type: Date, default: null }
  },
  contributedWords: { type: Number, default: 0 },
  settings: {
    notifications: {
      dailyReminder: { type: Boolean, default: true },
      reviewReminder: { type: Boolean, default: true },
      achievementNotification: { type: Boolean, default: true }
    },
    learning: {
      dailyGoal: { type: Number, default: 20, min: 5, max: 100 },
      reviewInterval: { type: Number, default: 24, min: 1, max: 168 },
      autoPlayAudio: { type: Boolean, default: true },
      showPhonetic: { type: Boolean, default: true }
    },
    privacy: {
      shareProgress: { type: Boolean, default: false },
      showInLeaderboard: { type: Boolean, default: true }
    },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    language: { type: String, enum: ['zh-CN', 'en-US'], default: 'zh-CN' }
  },
  subscription: {
    type: { type: String, enum: ['monthly', 'yearly', 'lifetime'], default: 'lifetime' },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: function() {
      return new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
    }},
    autoRenew: { type: Boolean, default: false }
  }
}, { timestamps: true });

const UserShowListSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  shows: [{
    id: { type: Number, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['watching', 'completed', 'plan_to_watch'], required: true },
    wordCount: { type: Number, default: 0 },
    lastWatched: { type: String },
    icon: { type: String },
    poster_path: { type: String },
    backdrop_path: { type: String },
    original_name: { type: String },
    genres: { type: Array },
    genre_ids: { type: Array },
    vote_average: { type: Number }
  }],
  updatedAt: { type: Date, default: Date.now }
});

// 创建模型
const User = mongoose.model('User', UserSchema);
const UserShowList = mongoose.model('UserShowList', UserShowListSchema);

class CloudDatabaseFixer {
  constructor() {
    this.fixResults = [];
  }

  async connect() {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ 成功连接到MongoDB数据库');
    } catch (error) {
      console.error('❌ 连接数据库失败:', error);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('🔌 已断开数据库连接');
  }

  async fixUserFields() {
    console.log('\n🔧 修复User表字段...');
    
    try {
      const users = await User.find({});
      console.log(`📊 检查了 ${users.length} 个用户记录`);
      
      for (const user of users) {
        const userFix = {
          userId: user._id.toString(),
          username: user.username,
          fixes: [],
          errors: []
        };

        // 修复缺少的contributedWords字段
        if (user.contributedWords === undefined) {
          try {
            await User.findByIdAndUpdate(user._id, {
              $set: { contributedWords: 0 }
            });
            userFix.fixes.push('添加contributedWords字段');
            console.log(`✅ 为用户 ${user.username} 添加contributedWords字段`);
          } catch (error) {
            userFix.errors.push(`修复contributedWords失败: ${error.message}`);
            console.error(`❌ 修复用户 ${user.username} 的contributedWords失败:`, error);
          }
        }

        // 确保所有必需字段都有默认值
        const defaultFields = {
          'learningStats.totalWordsLearned': 0,
          'learningStats.totalReviews': 0,
          'learningStats.currentStreak': 0,
          'learningStats.longestStreak': 0,
          'learningStats.averageAccuracy': 0,
          'learningStats.totalStudyTime': 0,
          'learningStats.level': 1,
          'learningStats.experience': 0,
          'learningStats.dailyReviewXP': 0,
          'learningStats.dailyStudyTimeXP': 0,
          'learningStats.completedDailyCards': false,
          'settings.notifications.dailyReminder': true,
          'settings.notifications.reviewReminder': true,
          'settings.notifications.achievementNotification': true,
          'settings.learning.dailyGoal': 20,
          'settings.learning.reviewInterval': 24,
          'settings.learning.autoPlayAudio': true,
          'settings.learning.showPhonetic': true,
          'settings.privacy.shareProgress': false,
          'settings.privacy.showInLeaderboard': true,
          'settings.theme': 'auto',
          'settings.language': 'zh-CN',
          'subscription.type': 'lifetime',
          'subscription.isActive': true,
          'subscription.autoRenew': false
        };

        for (const [fieldPath, defaultValue] of Object.entries(defaultFields)) {
          const fieldValue = this.getNestedValue(user, fieldPath);
          if (fieldValue === undefined) {
            try {
              const updateObj = {};
              updateObj[fieldPath] = defaultValue;
              await User.findByIdAndUpdate(user._id, { $set: updateObj });
              userFix.fixes.push(`添加${fieldPath}字段`);
              console.log(`✅ 为用户 ${user.username} 添加${fieldPath}字段`);
            } catch (error) {
              userFix.errors.push(`修复${fieldPath}失败: ${error.message}`);
              console.error(`❌ 修复用户 ${user.username} 的${fieldPath}失败:`, error);
            }
          }
        }

        this.fixResults.push({
          type: 'User',
          ...userFix
        });
      }

      console.log(`✅ User表字段修复完成`);
      
    } catch (error) {
      console.error('❌ User表字段修复失败:', error);
    }
  }

  async createMissingUserShowLists() {
    console.log('\n🔧 创建缺少的UserShowList...');
    
    try {
      const users = await User.find({});
      console.log(`📊 检查了 ${users.length} 个用户`);
      
      for (const user of users) {
        const userId = user._id.toString();
        
        // 检查是否已有UserShowList
        const existingShowList = await UserShowList.findOne({ userId });
        
        if (!existingShowList) {
          try {
            const newShowList = new UserShowList({
              userId: userId,
              shows: [],
              updatedAt: new Date()
            });
            await newShowList.save();
            
            console.log(`✅ 为用户 ${user.username} 创建UserShowList`);
            
            this.fixResults.push({
              type: 'UserShowList',
              userId: userId,
              username: user.username,
              fixes: ['创建UserShowList'],
              errors: []
            });
          } catch (error) {
            console.error(`❌ 为用户 ${user.username} 创建UserShowList失败:`, error);
            
            this.fixResults.push({
              type: 'UserShowList',
              userId: userId,
              username: user.username,
              fixes: [],
              errors: [`创建UserShowList失败: ${error.message}`]
            });
          }
        }
      }

      console.log(`✅ UserShowList创建完成`);
      
    } catch (error) {
      console.error('❌ UserShowList创建失败:', error);
    }
  }

  async validateMultiLingualSyncFields() {
    console.log('\n🔍 验证多邻国同步字段...');
    
    try {
      const users = await User.find({});
      console.log(`📊 验证 ${users.length} 个用户的多邻国同步字段`);
      
      const syncFields = {
        // 学习记录相关字段
        'learningStats.totalWordsLearned': '词汇学习总数',
        'learningStats.totalReviews': '复习总数',
        'learningStats.currentStreak': '当前连续学习天数',
        'learningStats.longestStreak': '最长连续学习天数',
        'learningStats.averageAccuracy': '平均准确率',
        'learningStats.totalStudyTime': '总学习时间',
        'learningStats.lastStudyDate': '最后学习日期',
        'learningStats.level': '用户等级',
        'learningStats.experience': '经验值',
        
        // 用户设置相关字段
        'settings.notifications.dailyReminder': '每日提醒设置',
        'settings.notifications.reviewReminder': '复习提醒设置',
        'settings.notifications.achievementNotification': '成就通知设置',
        'settings.learning.dailyGoal': '每日学习目标',
        'settings.learning.reviewInterval': '复习间隔设置',
        'settings.learning.autoPlayAudio': '自动播放音频设置',
        'settings.learning.showPhonetic': '显示音标设置',
        'settings.privacy.shareProgress': '分享进度设置',
        'settings.privacy.showInLeaderboard': '排行榜显示设置',
        'settings.theme': '主题设置',
        'settings.language': '语言设置',
        
        // 订阅相关字段
        'subscription.type': '订阅类型',
        'subscription.isActive': '订阅状态',
        'subscription.startDate': '订阅开始日期',
        'subscription.expiryDate': '订阅到期日期',
        'subscription.autoRenew': '自动续费设置',
        
        // 其他字段
        'contributedWords': '贡献词汇数'
      };

      for (const user of users) {
        const userValidation = {
          userId: user._id.toString(),
          username: user.username,
          missingSyncFields: [],
          validSyncFields: []
        };

        for (const [fieldPath, fieldDescription] of Object.entries(syncFields)) {
          const fieldValue = this.getNestedValue(user, fieldPath);
          if (fieldValue === undefined) {
            userValidation.missingSyncFields.push(`${fieldPath} (${fieldDescription})`);
          } else {
            userValidation.validSyncFields.push(`${fieldPath} (${fieldDescription})`);
          }
        }

        if (userValidation.missingSyncFields.length > 0) {
          console.log(`⚠️ 用户 ${user.username} 缺少同步字段: ${userValidation.missingSyncFields.join(', ')}`);
        } else {
          console.log(`✅ 用户 ${user.username} 所有同步字段完整`);
        }

        this.fixResults.push({
          type: 'MultiLingualSync',
          ...userValidation
        });
      }

      console.log(`✅ 多邻国同步字段验证完成`);
      
    } catch (error) {
      console.error('❌ 多邻国同步字段验证失败:', error);
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  async generateFixReport() {
    console.log('\n📊 云端数据库字段修复报告');
    console.log('='.repeat(60));
    
    const totalFixes = this.fixResults.filter(r => r.fixes && r.fixes.length > 0).length;
    const totalErrors = this.fixResults.filter(r => r.errors && r.errors.length > 0).length;
    const totalRecords = this.fixResults.length;
    
    console.log(`总处理记录数: ${totalRecords}`);
    console.log(`成功修复数: ${totalFixes}`);
    console.log(`修复错误数: ${totalErrors}`);
    console.log(`成功率: ${((totalFixes) / totalRecords * 100).toFixed(1)}%`);
    
    // 按类型分组显示修复结果
    const fixesByType = {};
    this.fixResults.forEach(result => {
      if (!fixesByType[result.type]) {
        fixesByType[result.type] = [];
      }
      fixesByType[result.type].push(result);
    });

    console.log('\n📋 详细修复报告:');
    for (const [type, results] of Object.entries(fixesByType)) {
      const successfulFixes = results.filter(r => r.fixes && r.fixes.length > 0).length;
      const errors = results.filter(r => r.errors && r.errors.length > 0).length;
      
      console.log(`\n${type} (${results.length} 个记录, ${successfulFixes} 个成功, ${errors} 个错误):`);
      
      results.forEach(result => {
        if (result.fixes && result.fixes.length > 0) {
          console.log(`  ✅ ${result.username || result.userId}: ${result.fixes.join(', ')}`);
        }
        if (result.errors && result.errors.length > 0) {
          console.log(`  ❌ ${result.username || result.userId}: ${result.errors.join(', ')}`);
        }
      });
    }

    // 多邻国同步字段验证结果
    const syncValidation = this.fixResults.filter(r => r.type === 'MultiLingualSync');
    if (syncValidation.length > 0) {
      console.log('\n🔍 多邻国同步字段验证结果:');
      syncValidation.forEach(validation => {
        if (validation.missingSyncFields && validation.missingSyncFields.length > 0) {
          console.log(`  ⚠️ ${validation.username}: 缺少 ${validation.missingSyncFields.length} 个同步字段`);
        } else {
          console.log(`  ✅ ${validation.username}: 所有同步字段完整`);
        }
      });
    }

    if (totalErrors === 0) {
      console.log('\n🎉 所有字段修复成功！云端数据库结构完整');
    } else {
      console.log('\n⚠️ 部分字段修复失败，请检查错误日志');
    }
  }

  async runAllFixes() {
    console.log('🚀 开始云端数据库字段修复...');
    
    try {
      await this.connect();
      
      await this.fixUserFields();
      await this.createMissingUserShowLists();
      await this.validateMultiLingualSyncFields();
      
      this.generateFixReport();
      
    } catch (error) {
      console.error('❌ 修复过程中发生错误:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// 运行修复
async function main() {
  const fixer = new CloudDatabaseFixer();
  await fixer.runAllFixes();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CloudDatabaseFixer; 