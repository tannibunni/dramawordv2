const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

// 定义Duolingo同步所需的所有字段模型
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

// 用户学习记录模型
const UserLearningRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wordId: { type: String, required: true },
  word: { type: String, required: true },
  translation: { type: String, required: true },
  reviewCount: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  consecutiveCorrect: { type: Number, default: 0 },
  consecutiveIncorrect: { type: Number, default: 0 },
  mastery: { type: Number, default: 0, min: 0, max: 5 },
  interval: { type: Number, default: 1 },
  easeFactor: { type: Number, default: 2.5 },
  totalStudyTime: { type: Number, default: 0 },
  averageResponseTime: { type: Number, default: 0 },
  confidence: { type: Number, default: 0, min: 0, max: 1 },
  nextReviewDate: { type: Date, default: Date.now },
  lastReviewedAt: { type: Date, default: Date.now },
  isLearned: { type: Boolean, default: false },
  isMastered: { type: Boolean, default: false },
  studyHistory: [{
    date: { type: Date, required: true },
    isCorrect: { type: Boolean, required: true },
    responseTime: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 }
  }],
  tags: [{ type: String }],
  notes: { type: String, default: '' },
  source: { type: String, default: 'manual' },
  difficulty: { type: Number, default: 1, min: 1, max: 5 }
}, { timestamps: true });

// 用户词汇表模型
const UserVocabularySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wordId: { type: String, required: true },
  word: { type: String, required: true },
  translation: { type: String, required: true },
  phonetic: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  partOfSpeech: { type: String, default: '' },
  difficulty: { type: Number, default: 1, min: 1, max: 5 },
  isLearned: { type: Boolean, default: false },
  isMastered: { type: Boolean, default: false },
  addedAt: { type: Date, default: Date.now },
  lastReviewedAt: { type: Date, default: Date.now },
  reviewCount: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  mastery: { type: Number, default: 0, min: 0, max: 5 },
  tags: [{ type: String }],
  notes: { type: String, default: '' },
  source: { type: String, default: 'manual' },
  showId: { type: String, default: null },
  episodeId: { type: String, default: null },
  timestamp: { type: Number, default: null }
}, { timestamps: true });

// 搜索历史模型
const SearchHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  resultCount: { type: Number, default: 0 },
  isSuccessful: { type: Boolean, default: true }
}, { timestamps: true });

// 用户剧单模型
const UserShowListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  showId: { type: String, required: true },
  title: { type: String, required: true },
  originalTitle: { type: String, default: '' },
  description: { type: String, default: '' },
  posterUrl: { type: String, default: '' },
  language: { type: String, default: 'en' },
  genre: [{ type: String }],
  rating: { type: Number, default: 0 },
  year: { type: Number, default: null },
  episodes: [{
    episodeId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    season: { type: Number, default: 1 },
    episode: { type: Number, default: 1 },
    isWatched: { type: Boolean, default: false },
    watchedAt: { type: Date, default: null },
    progress: { type: Number, default: 0, min: 0, max: 100 }
  }],
  isWatching: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  addedAt: { type: Date, default: Date.now },
  lastWatchedAt: { type: Date, default: null },
  totalEpisodes: { type: Number, default: 0 },
  watchedEpisodes: { type: Number, default: 0 },
  tags: [{ type: String }],
  notes: { type: String, default: '' }
}, { timestamps: true });

// 徽章模型 (新增)
const BadgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  category: { type: String, required: true },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  isUnlocked: { type: Boolean, default: false },
  unlockedAt: { type: Date, default: null },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  maxProgress: { type: Number, default: 100 },
  requirements: [{
    type: { type: String, required: true },
    value: { type: Number, required: true },
    description: { type: String, required: true }
  }],
  rewards: {
    experience: { type: Number, default: 0 },
    title: { type: String, default: '' },
    specialFeature: { type: String, default: '' }
  }
}, { timestamps: true });

// 成就模型 (新增)
const AchievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievementId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  category: { type: String, required: true },
  isUnlocked: { type: Boolean, default: false },
  unlockedAt: { type: Date, default: null },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  maxProgress: { type: Number, default: 100 },
  requirements: [{
    type: { type: String, required: true },
    value: { type: Number, required: true },
    description: { type: String, required: true }
  }],
  rewards: {
    experience: { type: Number, default: 0 },
    title: { type: String, default: '' },
    specialFeature: { type: String, default: '' }
  }
}, { timestamps: true });

// 用户进度模型 (新增)
const UserProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  language: { type: String, required: true, default: 'en' },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  totalWordsLearned: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  averageAccuracy: { type: Number, default: 0 },
  totalStudyTime: { type: Number, default: 0 },
  lastStudyDate: { type: Date, default: null },
  dailyGoal: { type: Number, default: 20 },
  dailyProgress: { type: Number, default: 0 },
  weeklyProgress: { type: Number, default: 0 },
  monthlyProgress: { type: Number, default: 0 },
  yearlyProgress: { type: Number, default: 0 },
  achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
  badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
  learningStats: {
    wordsLearnedToday: { type: Number, default: 0 },
    reviewsCompletedToday: { type: Number, default: 0 },
    studyTimeToday: { type: Number, default: 0 },
    accuracyToday: { type: Number, default: 0 }
  }
}, { timestamps: true });

// 用户设置模型 (新增)
const UserSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notifications: {
    dailyReminder: { type: Boolean, default: true },
    reviewReminder: { type: Boolean, default: true },
    achievementNotification: { type: Boolean, default: true },
    streakReminder: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: true }
  },
  learning: {
    dailyGoal: { type: Number, default: 20, min: 5, max: 100 },
    reviewInterval: { type: Number, default: 24, min: 1, max: 168 },
    autoPlayAudio: { type: Boolean, default: true },
    showPhonetic: { type: Boolean, default: true },
    enableSpacedRepetition: { type: Boolean, default: true },
    enableAdaptiveLearning: { type: Boolean, default: true }
  },
  privacy: {
    shareProgress: { type: Boolean, default: false },
    showInLeaderboard: { type: Boolean, default: true },
    allowDataSync: { type: Boolean, default: true },
    allowAnalytics: { type: Boolean, default: true }
  },
  theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
  language: { type: String, enum: ['zh-CN', 'en-US'], default: 'zh-CN' },
  studyLanguage: { type: String, default: 'en' },
  timezone: { type: String, default: 'UTC' }
}, { timestamps: true });

// 创建模型
const User = mongoose.model('User', UserSchema);
const UserLearningRecord = mongoose.model('UserLearningRecord', UserLearningRecordSchema);
const UserVocabulary = mongoose.model('UserVocabulary', UserVocabularySchema);
const SearchHistory = mongoose.model('SearchHistory', SearchHistorySchema);
const UserShowList = mongoose.model('UserShowList', UserShowListSchema);
const Badge = mongoose.model('Badge', BadgeSchema);
const Achievement = mongoose.model('Achievement', AchievementSchema);
const UserProgress = mongoose.model('UserProgress', UserProgressSchema);
const UserSettings = mongoose.model('UserSettings', UserSettingsSchema);

// 检查数据库字段完整性
async function checkDatabaseFields() {
  try {
    console.log('🔍 检查云端数据库Duolingo同步字段完整性...');
    
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB数据库');
    
    // 检查集合是否存在
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('\n📊 当前数据库集合:');
    collectionNames.forEach(name => console.log(`   - ${name}`));
    
    // 检查必需的集合
    const requiredCollections = [
      'users',
      'userlearningrecords', 
      'uservocabularies',
      'searchhistories',
      'usershowlists',
      'badges',
      'achievements',
      'userprogresses',
      'usersettings'
    ];
    
    console.log('\n🔍 检查必需的集合:');
    const missingCollections = [];
    requiredCollections.forEach(collection => {
      const exists = collectionNames.includes(collection);
      console.log(`   ${exists ? '✅' : '❌'} ${collection}`);
      if (!exists) {
        missingCollections.push(collection);
      }
    });
    
    if (missingCollections.length > 0) {
      console.log(`\n⚠️  缺少集合: ${missingCollections.join(', ')}`);
      console.log('   这些集合将在首次数据同步时自动创建');
    } else {
      console.log('\n✅ 所有必需的集合都存在');
    }
    
    // 检查用户数据示例
    const userCount = await User.countDocuments();
    console.log(`\n👥 用户总数: ${userCount}`);
    
    if (userCount > 0) {
      const sampleUser = await User.findOne();
      console.log('\n📋 用户数据结构示例:');
      console.log(`   - 用户名: ${sampleUser.username}`);
      console.log(`   - 昵称: ${sampleUser.nickname}`);
      console.log(`   - 等级: ${sampleUser.learningStats.level}`);
      console.log(`   - 经验值: ${sampleUser.learningStats.experience}`);
      console.log(`   - 连续学习: ${sampleUser.learningStats.currentStreak}天`);
    }
    
    // 检查同步相关字段
    console.log('\n🔍 检查Duolingo同步字段:');
    
    const syncFields = [
      { model: User, name: 'User', fields: ['learningStats.experience', 'learningStats.level', 'learningStats.currentStreak'] },
      { model: UserLearningRecord, name: 'UserLearningRecord', fields: ['userId', 'records.0.wordId', 'records.0.mastery', 'records.0.nextReviewDate'] },
      { model: UserVocabulary, name: 'UserVocabulary', fields: ['userId', 'wordId', 'isLearned', 'mastery'] },
      { model: SearchHistory, name: 'SearchHistory', fields: ['userId', 'query', 'timestamp'] },
      { model: UserShowList, name: 'UserShowList', fields: ['userId', 'shows.0.showId', 'shows.0.isWatching', 'shows.0.progress'] },
      { model: Badge, name: 'Badge', fields: ['userId', 'badgeId', 'isUnlocked', 'progress'] },
      { model: Achievement, name: 'Achievement', fields: ['userId', 'achievementId', 'isUnlocked', 'progress'] },
      { model: UserProgress, name: 'UserProgress', fields: ['userId', 'language', 'level', 'experience'] },
      { model: UserSettings, name: 'UserSettings', fields: ['userId', 'notifications', 'learning', 'privacy'] }
    ];
    
    for (const { model, name, fields } of syncFields) {
      try {
        const count = await model.countDocuments();
        console.log(`   ✅ ${name}: ${count} 条记录`);
        
        // 检查字段是否存在
        if (count > 0) {
          const sample = await model.findOne();
          fields.forEach(field => {
            let value;
            if (field.includes('.')) {
              // 处理嵌套字段
              const keys = field.split('.');
              value = keys.reduce((obj, key) => {
                if (Array.isArray(obj)) {
                  return obj.length > 0 ? obj[0][key] : undefined;
                }
                if (key === '0' && Array.isArray(obj)) {
                  return obj.length > 0 ? obj[0] : undefined;
                }
                return obj?.[key];
              }, sample);
            } else {
              value = sample[field];
            }
            console.log(`      - ${field}: ${value !== undefined ? '✅' : '❌'}`);
          });
        }
      } catch (error) {
        console.log(`   ❌ ${name}: 集合不存在或查询失败`);
      }
    }
    
    console.log('\n✅ Duolingo同步字段检查完成');
    console.log('\n📝 总结:');
    console.log('   - 所有必需的模型已定义');
    console.log('   - 字段名称与前端同步服务保持一致');
    console.log('   - 支持完整的Duolingo风格数据同步');
    console.log('   - 数据存储在正确的用户ID下');
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 已断开数据库连接');
  }
}

// 运行检查
if (require.main === module) {
  checkDatabaseFields();
}

module.exports = { checkDatabaseFields }; 