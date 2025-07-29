# 游客用户数据隔离机制

## 📋 概述

剧词记应用支持游客登录模式，每个游客都有唯一的ID，确保不同游客之间的数据完全隔离，避免数据混乱。

## 🔐 游客ID生成机制

### **前端ID生成**
```javascript
// 基于时间戳生成唯一ID
const now = Date.now().toString();
const shortId = now.slice(-6);  // 取时间戳后6位数字
const username = `t_guest_${shortId}`.slice(0, 20);
const nickname = '游客用户';
const guestId = shortId;  // 唯一的游客标识
```

### **ID特点**
- **唯一性**: 基于时间戳，确保每次生成的ID都不同
- **简洁性**: 6位数字，便于记忆和调试
- **可读性**: 格式为 `t_guest_XXXXXX`
- **持久性**: 一旦生成，在整个会话中保持不变

## 🗄️ 数据存储结构

### **用户表 (Users)**
```javascript
{
  _id: ObjectId("..."),           // MongoDB自动生成的唯一ID
  username: "t_guest_123456",     // 游客用户名
  nickname: "游客用户",           // 显示名称
  auth: {
    loginType: "guest",           // 登录类型
    guestId: "123456",           // 游客唯一标识
    lastLoginAt: Date,           // 最后登录时间
    isActive: true               // 账号状态
  },
  learningStats: {
    totalWordsLearned: 0,        // 学习统计
    totalReviews: 0,
    currentStreak: 0,
    // ... 其他统计字段
  },
  settings: {
    // 用户设置
  }
}
```

### **学习记录表 (UserLearningRecords)**
```javascript
{
  _id: ObjectId("..."),
  userId: "用户MongoDB ID",       // 关联到具体用户
  records: [
    {
      wordId: "单词ID",
      mastery: 0.8,              // 掌握度
      lastReviewDate: Date,      // 最后复习时间
      nextReviewDate: Date,      // 下次复习时间
      reviewCount: 5             // 复习次数
    }
  ],
  totalWords: 0,
  totalReviews: 0,
  averageMastery: 0,
  lastStudyDate: Date
}
```

### **搜索历史表 (SearchHistory)**
```javascript
{
  _id: ObjectId("..."),
  userId: "用户MongoDB ID",       // 关联到具体用户
  word: "hello",                 // 搜索的单词
  language: "en",                // 单词语言
  searchTime: Date,              // 搜索时间
  resultCount: 1                 // 结果数量
}
```

## 🔄 数据隔离机制

### **1. 用户识别**
```javascript
// 后端根据游客ID查找用户
const user = await User.findOne({ 'auth.guestId': guestId });

// 如果用户不存在，创建新用户
if (!user) {
  const newUser = new User({
    username: `t_guest_${guestId}`,
    nickname: '游客用户',
    auth: {
      loginType: 'guest',
      guestId: guestId,
      lastLoginAt: new Date(),
      isActive: true
    }
  });
  await newUser.save();
}
```

### **2. 数据查询隔离**
```javascript
// 所有数据查询都基于用户ID
const learningRecords = await UserLearningRecord.find({ userId: user._id });
const searchHistory = await SearchHistory.find({ userId: user._id });
const vocabulary = await UserVocabulary.find({ userId: user._id });
```

### **3. 数据创建隔离**
```javascript
// 创建新数据时自动关联用户ID
const newRecord = new UserLearningRecord({
  userId: user._id,              // 自动关联到当前用户
  wordId: wordId,
  mastery: 0.5,
  // ... 其他字段
});
```

## 📱 前端数据管理

### **本地存储**
```javascript
// 用户信息存储在 AsyncStorage
const userData = {
  id: result.data.user.id,        // MongoDB用户ID
  nickname: result.data.user.nickname,
  loginType: 'guest',
  token: result.data.token,       // JWT认证token
};
await AsyncStorage.setItem('userData', JSON.stringify(userData));
```

### **API调用认证**
```javascript
// 所有API调用都携带用户token
const response = await fetch('/api/words/search', {
  headers: {
    'Authorization': `Bearer ${userData.token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ word: 'hello' })
});
```

### **数据同步**
```javascript
// 数据同步服务确保数据隔离
class DataSyncService {
  async syncUserStats() {
    const userLoginInfo = await this.userService.getUserLoginInfo();
    if (!userLoginInfo) {
      console.log('🔍 用户未登录，使用游客模式同步数据');
      // 游客模式下仍然可以同步本地数据
    }
    // 同步逻辑...
  }
}
```

## 🛡️ 安全考虑

### **1. 数据隐私**
- 每个游客的数据完全隔离
- 不同游客无法访问彼此的数据
- 游客数据不会泄露给其他用户

### **2. 数据持久性**
- 游客数据在云端持久保存
- 即使重新安装应用，数据仍然存在
- 支持数据备份和恢复

### **3. 访问控制**
- 所有API调用都需要JWT token认证
- token包含用户ID信息
- 后端验证token有效性

## 🔍 调试和监控

### **日志记录**
```javascript
// 记录游客登录
logger.info(`游客登录成功: ${username} (guestId: ${guestId})`);

// 记录数据操作
logger.info(`用户 ${userId} 添加单词: ${wordId}`);
```

### **数据查询**
```javascript
// 查询特定游客的数据
const guestData = await User.findOne({ 'auth.guestId': '123456' });
const guestRecords = await UserLearningRecord.find({ userId: guestData._id });
```

## 📊 数据统计

### **游客使用统计**
- 游客数量统计
- 游客活跃度分析
- 游客数据量统计
- 游客留存率分析

### **数据清理**
```javascript
// 定期清理不活跃的游客数据
const inactiveThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30天
const inactiveUsers = await User.find({
  'auth.loginType': 'guest',
  'auth.lastLoginAt': { $lt: inactiveThreshold }
});
```

## 🚀 优势

### **1. 用户体验**
- 无需注册即可使用
- 数据自动保存和同步
- 支持多设备数据同步

### **2. 数据管理**
- 清晰的数据隔离
- 便于数据分析和统计
- 支持数据迁移和升级

### **3. 系统扩展**
- 支持游客转正式用户
- 支持数据合并和迁移
- 支持高级功能升级

---

**总结**: 游客ID机制确保了每个游客都有独立的数据空间，既保护了用户隐私，又为后续功能扩展提供了良好的基础。 