# TestFlight 数据隔离问题解决方案

## 🚨 问题描述

在TestFlight中，同一个team的测试者可能会共享应用数据，导致不同用户的数据混合在一起。

## 🔍 问题原因

### **1. TestFlight数据共享机制**
- TestFlight可能在不同测试者间共享应用数据
- 同一个team的测试者可能使用相同的应用沙盒
- 本地存储可能在不同用户间共享

### **2. 游客ID生成不够唯一**
- 基于时间戳的ID可能在同一时间生成
- 缺少设备特定的标识符
- 随机性不够强

### **3. 数据清理不彻底**
- 登录时没有完全清理旧数据
- 应用启动时没有清理共享数据
- 缓存数据可能残留

## ✅ 解决方案

### **1. 增强游客ID唯一性**

#### **改进前**
```javascript
const now = Date.now().toString();
const shortId = now.slice(-6); // 只有6位时间戳
```

#### **改进后**
```javascript
const now = Date.now().toString();
const random = Math.random().toString(36).substr(2, 4); // 4位随机字符
const deviceId = Device.deviceName || Device.modelName || 'unknown';
const deviceHash = deviceId.split('').reduce((a, b) => a + b.charCodeAt(0), 0).toString(36).slice(-3);
const shortId = now.slice(-6) + random + deviceHash; // 6位时间戳 + 4位随机字符 + 3位设备哈希
```

### **2. 添加设备特定标识**

```javascript
// 使用设备信息生成唯一标识
const deviceId = Device.deviceName || Device.modelName || 'unknown';
const deviceHash = deviceId.split('').reduce((a, b) => a + b.charCodeAt(0), 0).toString(36).slice(-3);
```

### **3. 完善数据清理机制**

#### **登录时清理**
```javascript
const clearAllSharedData = async () => {
  const keysToRemove = [
    'userData',
    'searchHistory',
    'vocabulary',
    'learningRecords',
    'userStats',
    'badges',
    'last_sync_time',
    'user_stats_cache',
    'user_vocabulary_cache',
    'badges_cache',
    'selectedLanguage',
    'learningLanguages',
    'appLanguage',
    'initialLanguageSetup'
  ];
  
  await AsyncStorage.multiRemove(keysToRemove);
};
```

#### **应用启动时清理**
```javascript
const clearSharedDataOnStartup = async () => {
  const userData = await AsyncStorage.getItem('userData');
  if (!userData) {
    // 如果没有用户数据，清理可能存在的共享数据
    const keysToRemove = [
      'searchHistory',
      'vocabulary',
      'learningRecords',
      'userStats',
      'badges'
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
  }
};
```

## 🧪 测试验证

### **1. 测试步骤**
1. 在TestFlight中邀请朋友安装应用
2. 朋友使用游客登录
3. 朋友搜索一些单词
4. 检查你的历史记录是否包含朋友的搜索记录

### **2. 验证方法**
```javascript
// 检查游客ID的唯一性
console.log('游客ID:', shortId);
console.log('设备信息:', deviceId);
console.log('设备哈希:', deviceHash);

// 检查数据清理
console.log('清理前的数据:', await AsyncStorage.getAllKeys());
await clearAllSharedData();
console.log('清理后的数据:', await AsyncStorage.getAllKeys());
```

### **3. 预期结果**
- 每个游客都有唯一的ID
- 不同用户的数据完全隔离
- 登录时完全清理旧数据
- 应用启动时清理共享数据

## 🔧 额外建议

### **1. 使用更严格的ID生成**
```javascript
// 可以考虑使用UUID
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const guestId = uuidv4().replace(/-/g, '').slice(0, 12);
```

### **2. 添加数据验证**
```javascript
// 在数据操作前验证用户身份
const validateUserData = async (userId: string) => {
  const userData = await AsyncStorage.getItem('userData');
  if (userData) {
    const parsed = JSON.parse(userData);
    if (parsed.id !== userId) {
      // 用户ID不匹配，清理数据
      await clearAllSharedData();
      return false;
    }
  }
  return true;
};
```

### **3. 使用加密存储**
```javascript
// 考虑使用加密的AsyncStorage
import EncryptedStorage from 'react-native-encrypted-storage';

await EncryptedStorage.setItem('userData', JSON.stringify(userData));
```

## 📱 TestFlight特定设置

### **1. 应用配置**
```json
// app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIFileSharingEnabled": false, // 禁用文件共享
        "LSSupportsOpeningDocumentsInPlace": false // 禁用文档共享
      }
    }
  }
}
```

### **2. 构建配置**
```json
// eas.json
{
  "build": {
    "preview": {
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      }
    }
  }
}
```

## 🚀 部署建议

### **1. 测试环境**
- 在TestFlight中充分测试数据隔离
- 邀请多个朋友进行测试
- 验证不同设备间的数据隔离

### **2. 生产环境**
- 确保数据隔离机制在生产环境中正常工作
- 监控用户数据隔离情况
- 定期检查数据隔离的有效性

### **3. 监控和日志**
```javascript
// 添加详细的日志记录
logger.info(`游客登录: ${guestId}, 设备: ${deviceId}`);
logger.info(`数据清理: ${clearedKeys.length} 个键被清理`);
logger.info(`数据验证: 用户ID ${userId} 验证${isValid ? '通过' : '失败'}`);
```

---

**总结**: 通过增强游客ID唯一性、完善数据清理机制和添加设备特定标识，可以有效解决TestFlight中的数据共享问题。 