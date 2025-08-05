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

const SearchHistorySchema = new mongoose.Schema({
  word: { type: String, required: true, lowercase: true, trim: true },
  definition: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, required: false }
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
const UserLearningRecord = mongoose.model('UserLearningRecord', UserLearningRecordSchema);
const SearchHistory = mongoose.model('SearchHistory', SearchHistorySchema);
const UserShowList = mongoose.model('UserShowList', UserShowListSchema);

class CloudDatabaseValidator {
  constructor() {
    this.validationResults = [];
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

  async validateUserFields() {
    console.log('\n📋 验证User表字段结构...');
    
    try {
      const users = await User.find({}).limit(5);
      console.log(`📊 检查了 ${users.length} 个用户记录`);
      
      for (const user of users) {
        const userValidation = {
          userId: user._id.toString(),
          username: user.username,
          issues: [],
          missingFields: [],
          extraFields: []
        };

        // 检查必需字段
        const requiredFields = [
          'username', 'nickname', 'auth', 'learningStats', 
          'contributedWords', 'settings', 'subscription'
        ];

        for (const field of requiredFields) {
          if (!user[field]) {
            userValidation.missingFields.push(field);
          }
        }

        // 检查auth字段
        if (user.auth) {
          const requiredAuthFields = ['loginType', 'lastLoginAt', 'isActive'];
          for (const field of requiredAuthFields) {
            if (!user.auth[field]) {
              userValidation.missingFields.push(`auth.${field}`);
            }
          }
        }

        // 检查learningStats字段
        if (user.learningStats) {
          const requiredStatsFields = [
            'totalWordsLearned', 'totalReviews', 'currentStreak', 
            'longestStreak', 'averageAccuracy', 'totalStudyTime',
            'lastStudyDate', 'level', 'experience'
          ];
          for (const field of requiredStatsFields) {
            if (user.learningStats[field] === undefined) {
              userValidation.missingFields.push(`learningStats.${field}`);
            }
          }
        }

        // 检查settings字段
        if (user.settings) {
          const requiredSettingsFields = ['notifications', 'learning', 'privacy', 'theme', 'language'];
          for (const field of requiredSettingsFields) {
            if (!user.settings[field]) {
              userValidation.missingFields.push(`settings.${field}`);
            }
          }
        }

        // 检查subscription字段
        if (user.subscription) {
          const requiredSubscriptionFields = ['type', 'isActive', 'startDate', 'expiryDate', 'autoRenew'];
          for (const field of requiredSubscriptionFields) {
            if (user.subscription[field] === undefined) {
              userValidation.missingFields.push(`subscription.${field}`);
            }
          }
        }

        if (userValidation.missingFields.length > 0 || userValidation.extraFields.length > 0) {
          userValidation.issues.push('字段结构不完整');
        }

        this.validationResults.push({
          type: 'User',
          ...userValidation
        });
      }

      console.log(`✅ User表字段验证完成，发现 ${this.validationResults.filter(r => r.type === 'User' && r.issues.length > 0).length} 个问题`);
      
    } catch (error) {
      console.error('❌ User表字段验证失败:', error);
    }
  }

  async validateUserLearningRecordFields() {
    console.log('\n📋 验证UserLearningRecord表字段结构...');
    
    try {
      const records = await UserLearningRecord.find({}).limit(5);
      console.log(`📊 检查了 ${records.length} 个学习记录文档`);
      
      for (const record of records) {
        const recordValidation = {
          userId: record.userId,
          issues: [],
          missingFields: [],
          recordCount: record.records ? record.records.length : 0
        };

        // 检查必需字段
        const requiredFields = ['userId', 'records', 'totalWords', 'totalReviews', 'averageMastery', 'lastStudyDate'];
        for (const field of requiredFields) {
          if (record[field] === undefined) {
            recordValidation.missingFields.push(field);
          }
        }

        // 检查records数组中的字段
        if (record.records && record.records.length > 0) {
          const sampleRecord = record.records[0];
          const requiredRecordFields = [
            'word', 'mastery', 'reviewCount', 'correctCount', 'incorrectCount',
            'lastReviewDate', 'nextReviewDate', 'interval', 'easeFactor',
            'consecutiveCorrect', 'consecutiveIncorrect', 'totalStudyTime',
            'averageResponseTime', 'confidence'
          ];

          for (const field of requiredRecordFields) {
            if (sampleRecord[field] === undefined) {
              recordValidation.missingFields.push(`records.${field}`);
            }
          }
        }

        if (recordValidation.missingFields.length > 0) {
          recordValidation.issues.push('字段结构不完整');
        }

        this.validationResults.push({
          type: 'UserLearningRecord',
          ...recordValidation
        });
      }

      console.log(`✅ UserLearningRecord表字段验证完成，发现 ${this.validationResults.filter(r => r.type === 'UserLearningRecord' && r.issues.length > 0).length} 个问题`);
      
    } catch (error) {
      console.error('❌ UserLearningRecord表字段验证失败:', error);
    }
  }

  async validateSearchHistoryFields() {
    console.log('\n📋 验证SearchHistory表字段结构...');
    
    try {
      const histories = await SearchHistory.find({}).limit(10);
      console.log(`📊 检查了 ${histories.length} 个搜索历史记录`);
      
      for (const history of histories) {
        const historyValidation = {
          id: history._id.toString(),
          issues: [],
          missingFields: []
        };

        // 检查必需字段
        const requiredFields = ['word', 'definition', 'timestamp'];
        for (const field of requiredFields) {
          if (!history[field]) {
            historyValidation.missingFields.push(field);
          }
        }

        if (historyValidation.missingFields.length > 0) {
          historyValidation.issues.push('字段结构不完整');
        }

        this.validationResults.push({
          type: 'SearchHistory',
          ...historyValidation
        });
      }

      console.log(`✅ SearchHistory表字段验证完成，发现 ${this.validationResults.filter(r => r.type === 'SearchHistory' && r.issues.length > 0).length} 个问题`);
      
    } catch (error) {
      console.error('❌ SearchHistory表字段验证失败:', error);
    }
  }

  async validateUserShowListFields() {
    console.log('\n📋 验证UserShowList表字段结构...');
    
    try {
      const showLists = await UserShowList.find({}).limit(5);
      console.log(`📊 检查了 ${showLists.length} 个剧单文档`);
      
      for (const showList of showLists) {
        const showListValidation = {
          userId: showList.userId,
          issues: [],
          missingFields: [],
          showCount: showList.shows ? showList.shows.length : 0
        };

        // 检查必需字段
        const requiredFields = ['userId', 'shows', 'updatedAt'];
        for (const field of requiredFields) {
          if (!showList[field]) {
            showListValidation.missingFields.push(field);
          }
        }

        // 检查shows数组中的字段
        if (showList.shows && showList.shows.length > 0) {
          const sampleShow = showList.shows[0];
          const requiredShowFields = ['id', 'name', 'status'];
          for (const field of requiredShowFields) {
            if (!sampleShow[field]) {
              showListValidation.missingFields.push(`shows.${field}`);
            }
          }
        }

        if (showListValidation.missingFields.length > 0) {
          showListValidation.issues.push('字段结构不完整');
        }

        this.validationResults.push({
          type: 'UserShowList',
          ...showListValidation
        });
      }

      console.log(`✅ UserShowList表字段验证完成，发现 ${this.validationResults.filter(r => r.type === 'UserShowList' && r.issues.length > 0).length} 个问题`);
      
    } catch (error) {
      console.error('❌ UserShowList表字段验证失败:', error);
    }
  }

  async validateDataConsistency() {
    console.log('\n📋 验证数据一致性...');
    
    try {
      // 检查用户ID的一致性
      const users = await User.find({});
      const userIds = users.map(u => u._id.toString());
      
      for (const userId of userIds.slice(0, 5)) { // 只检查前5个用户
        const learningRecord = await UserLearningRecord.findOne({ userId });
        const showList = await UserShowList.findOne({ userId });
        const searchHistories = await SearchHistory.find({ userId });
        
        const consistencyCheck = {
          userId,
          issues: [],
          dataExists: {
            user: true,
            learningRecord: !!learningRecord,
            showList: !!showList,
            searchHistories: searchHistories.length
          }
        };

        // 检查数据完整性
        if (!learningRecord) {
          consistencyCheck.issues.push('缺少学习记录');
        }
        
        if (!showList) {
          consistencyCheck.issues.push('缺少剧单数据');
        }

        if (consistencyCheck.issues.length > 0) {
          this.validationResults.push({
            type: 'DataConsistency',
            ...consistencyCheck
          });
        }
      }

      console.log(`✅ 数据一致性验证完成，发现 ${this.validationResults.filter(r => r.type === 'DataConsistency').length} 个一致性问题`);
      
    } catch (error) {
      console.error('❌ 数据一致性验证失败:', error);
    }
  }

  async generateReport() {
    console.log('\n📊 云端数据库字段验证报告');
    console.log('='.repeat(60));
    
    const totalIssues = this.validationResults.filter(r => r.issues.length > 0).length;
    const totalRecords = this.validationResults.length;
    
    console.log(`总检查记录数: ${totalRecords}`);
    console.log(`发现问题数: ${totalIssues}`);
    console.log(`通过率: ${((totalRecords - totalIssues) / totalRecords * 100).toFixed(1)}%`);
    
    // 按类型分组显示问题
    const issuesByType = {};
    this.validationResults.forEach(result => {
      if (result.issues.length > 0) {
        if (!issuesByType[result.type]) {
          issuesByType[result.type] = [];
        }
        issuesByType[result.type].push(result);
      }
    });

    console.log('\n📋 详细问题报告:');
    for (const [type, issues] of Object.entries(issuesByType)) {
      console.log(`\n${type} (${issues.length} 个问题):`);
      issues.forEach(issue => {
        console.log(`  - ${issue.userId || issue.id}: ${issue.issues.join(', ')}`);
        if (issue.missingFields && issue.missingFields.length > 0) {
          console.log(`    缺少字段: ${issue.missingFields.join(', ')}`);
        }
      });
    }

    // 提供修复建议
    if (totalIssues > 0) {
      console.log('\n🔧 修复建议:');
      console.log('1. 检查数据库Schema是否与代码中的模型定义一致');
      console.log('2. 确保所有必需字段都有默认值或正确处理');
      console.log('3. 运行数据迁移脚本修复现有数据');
      console.log('4. 验证多邻国同步方案中的字段映射是否正确');
    } else {
      console.log('\n🎉 所有字段验证通过！云端数据库结构完整');
    }
  }

  async runAllValidations() {
    console.log('🚀 开始云端数据库字段验证...');
    
    try {
      await this.connect();
      
      await this.validateUserFields();
      await this.validateUserLearningRecordFields();
      await this.validateSearchHistoryFields();
      await this.validateUserShowListFields();
      await this.validateDataConsistency();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ 验证过程中发生错误:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// 运行验证
async function main() {
  const validator = new CloudDatabaseValidator();
  await validator.runAllValidations();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CloudDatabaseValidator; 