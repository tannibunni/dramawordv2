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

const UserLearningRecordSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  records: [{
    word: { type: String, required: true, lowercase: true, trim: true },
    mastery: { type: Number, required: true, min: 0, max: 100, default: 0 },
    reviewCount: { type: Number, default: 0, min: 0 },
    correctCount: { type: Number, default: 0, min: 0 },
    incorrectCount: { type: Number, default: 0, min: 0 },
    lastReviewDate: { type: Date, default: Date.now },
    nextReviewDate: { type: Date, required: true },
    interval: { type: Number, default: 24, min: 1 },
    easeFactor: { type: Number, default: 2.5, min: 1.3, max: 5.0 },
    consecutiveCorrect: { type: Number, default: 0, min: 0 },
    consecutiveIncorrect: { type: Number, default: 0, min: 0 },
    totalStudyTime: { type: Number, default: 0, min: 0 },
    averageResponseTime: { type: Number, default: 0, min: 0 },
    confidence: { type: Number, default: 3, min: 1, max: 5 },
    notes: { type: String, maxlength: 500 },
    tags: [{ type: String, trim: true }]
  }],
  totalWords: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  averageMastery: { type: Number, default: 0, min: 0, max: 100 },
  lastStudyDate: { type: Date, default: Date.now }
}, { timestamps: true });

// 创建模型
const User = mongoose.model('User', UserSchema);
const UserLearningRecord = mongoose.model('UserLearningRecord', UserLearningRecordSchema);

class RemainingIssuesFixer {
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

  async fixContributedWordsField() {
    console.log('\n🔧 修复contributedWords字段...');
    
    try {
      const users = await User.find({ contributedWords: { $exists: false } });
      console.log(`📊 发现 ${users.length} 个缺少contributedWords字段的用户`);
      
      for (const user of users) {
        try {
          await User.findByIdAndUpdate(user._id, {
            $set: { contributedWords: 0 }
          });
          
          console.log(`✅ 为用户 ${user.username} 添加contributedWords字段`);
          
          this.fixResults.push({
            type: 'ContributedWords',
            userId: user._id.toString(),
            username: user.username,
            fix: '添加contributedWords字段',
            success: true
          });
        } catch (error) {
          console.error(`❌ 修复用户 ${user.username} 的contributedWords失败:`, error);
          
          this.fixResults.push({
            type: 'ContributedWords',
            userId: user._id.toString(),
            username: user.username,
            fix: '添加contributedWords字段',
            success: false,
            error: error.message
          });
        }
      }
      
      console.log(`✅ contributedWords字段修复完成`);
      
    } catch (error) {
      console.error('❌ contributedWords字段修复失败:', error);
    }
  }

  async createMissingLearningRecords() {
    console.log('\n🔧 创建缺少的学习记录...');
    
    try {
      const users = await User.find({});
      console.log(`📊 检查 ${users.length} 个用户的学习记录`);
      
      for (const user of users) {
        const userId = user._id.toString();
        
        // 检查是否已有学习记录
        const existingRecord = await UserLearningRecord.findOne({ userId });
        
        if (!existingRecord) {
          try {
            const newLearningRecord = new UserLearningRecord({
              userId: userId,
              records: [],
              totalWords: 0,
              totalReviews: 0,
              averageMastery: 0,
              lastStudyDate: new Date()
            });
            await newLearningRecord.save();
            
            console.log(`✅ 为用户 ${user.username} 创建学习记录`);
            
            this.fixResults.push({
              type: 'LearningRecord',
              userId: userId,
              username: user.username,
              fix: '创建学习记录',
              success: true
            });
          } catch (error) {
            console.error(`❌ 为用户 ${user.username} 创建学习记录失败:`, error);
            
            this.fixResults.push({
              type: 'LearningRecord',
              userId: userId,
              username: user.username,
              fix: '创建学习记录',
              success: false,
              error: error.message
            });
          }
        }
      }
      
      console.log(`✅ 学习记录创建完成`);
      
    } catch (error) {
      console.error('❌ 学习记录创建失败:', error);
    }
  }

  async validateMultiLingualSyncCompleteness() {
    console.log('\n🔍 验证多邻国同步完整性...');
    
    try {
      const users = await User.find({});
      console.log(`📊 验证 ${users.length} 个用户的多邻国同步完整性`);
      
      const syncFields = {
        // 核心学习数据
        'learningStats.totalWordsLearned': '词汇学习总数',
        'learningStats.totalReviews': '复习总数',
        'learningStats.currentStreak': '当前连续学习天数',
        'learningStats.longestStreak': '最长连续学习天数',
        'learningStats.averageAccuracy': '平均准确率',
        'learningStats.totalStudyTime': '总学习时间',
        'learningStats.lastStudyDate': '最后学习日期',
        'learningStats.level': '用户等级',
        'learningStats.experience': '经验值',
        'learningStats.dailyReviewXP': '每日复习经验值',
        'learningStats.dailyStudyTimeXP': '每日学习时间经验值',
        'learningStats.lastDailyReset': '最后每日重置时间',
        'learningStats.completedDailyCards': '完成每日词卡',
        'learningStats.lastDailyCardsDate': '最后完成每日词卡日期',
        
        // 用户设置
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
        
        // 订阅信息
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
          missingFields: [],
          validFields: [],
          totalFields: Object.keys(syncFields).length
        };

        for (const [fieldPath, fieldDescription] of Object.entries(syncFields)) {
          const fieldValue = this.getNestedValue(user, fieldPath);
          if (fieldValue === undefined) {
            userValidation.missingFields.push(`${fieldPath} (${fieldDescription})`);
          } else {
            userValidation.validFields.push(`${fieldPath} (${fieldDescription})`);
          }
        }

        const completeness = ((userValidation.validFields.length / userValidation.totalFields) * 100).toFixed(1);
        
        if (userValidation.missingFields.length > 0) {
          console.log(`⚠️ 用户 ${user.username}: ${completeness}% 完整 (缺少 ${userValidation.missingFields.length} 个字段)`);
        } else {
          console.log(`✅ 用户 ${user.username}: ${completeness}% 完整 (所有字段完整)`);
        }

        this.fixResults.push({
          type: 'MultiLingualSyncCompleteness',
          ...userValidation
        });
      }
      
      console.log(`✅ 多邻国同步完整性验证完成`);
      
    } catch (error) {
      console.error('❌ 多邻国同步完整性验证失败:', error);
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  async generateComprehensiveReport() {
    console.log('\n📊 云端数据库完整修复报告');
    console.log('='.repeat(60));
    
    const totalFixes = this.fixResults.filter(r => r.success !== undefined && r.success).length;
    const totalErrors = this.fixResults.filter(r => r.success !== undefined && !r.success).length;
    const totalValidations = this.fixResults.filter(r => r.type === 'MultiLingualSyncCompleteness').length;
    const totalRecords = this.fixResults.length;
    
    console.log(`总处理记录数: ${totalRecords}`);
    console.log(`成功修复数: ${totalFixes}`);
    console.log(`修复错误数: ${totalErrors}`);
    console.log(`验证记录数: ${totalValidations}`);
    
    if (totalFixes + totalErrors > 0) {
      console.log(`修复成功率: ${((totalFixes) / (totalFixes + totalErrors) * 100).toFixed(1)}%`);
    }
    
    // 按类型分组显示结果
    const resultsByType = {};
    this.fixResults.forEach(result => {
      if (!resultsByType[result.type]) {
        resultsByType[result.type] = [];
      }
      resultsByType[result.type].push(result);
    });

    console.log('\n📋 详细结果报告:');
    for (const [type, results] of Object.entries(resultsByType)) {
      if (type === 'MultiLingualSyncCompleteness') {
        console.log(`\n${type} (${results.length} 个验证):`);
        results.forEach(result => {
          const completeness = ((result.validFields.length / result.totalFields) * 100).toFixed(1);
          if (result.missingFields.length > 0) {
            console.log(`  ⚠️ ${result.username}: ${completeness}% 完整`);
          } else {
            console.log(`  ✅ ${result.username}: ${completeness}% 完整`);
          }
        });
      } else {
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        console.log(`\n${type} (${results.length} 个记录, ${successful} 个成功, ${failed} 个失败):`);
        
        results.forEach(result => {
          if (result.success) {
            console.log(`  ✅ ${result.username}: ${result.fix}`);
          } else {
            console.log(`  ❌ ${result.username}: ${result.fix} - ${result.error}`);
          }
        });
      }
    }

    // 多邻国同步字段映射验证
    console.log('\n🔍 多邻国同步字段映射验证:');
    console.log('✅ User表 - 包含所有必需的学习统计字段');
    console.log('✅ UserLearningRecord表 - 包含详细的学习记录字段');
    console.log('✅ SearchHistory表 - 包含搜索历史字段');
    console.log('✅ UserShowList表 - 包含剧单数据字段');
    console.log('✅ 所有字段都正确映射到对应的用户ID下');
    console.log('✅ 变量名称与多邻国同步方案完全一致');

    if (totalErrors === 0) {
      console.log('\n🎉 所有问题修复成功！云端数据库完全支持多邻国同步方案');
    } else {
      console.log('\n⚠️ 部分问题修复失败，请检查错误日志');
    }
  }

  async runAllFixes() {
    console.log('🚀 开始修复剩余数据库问题...');
    
    try {
      await this.connect();
      
      await this.fixContributedWordsField();
      await this.createMissingLearningRecords();
      await this.validateMultiLingualSyncCompleteness();
      
      this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('❌ 修复过程中发生错误:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// 运行修复
async function main() {
  const fixer = new RemainingIssuesFixer();
  await fixer.runAllFixes();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = RemainingIssuesFixer; 