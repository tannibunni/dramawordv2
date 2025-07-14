# 用户登录功能集成指南

## 概述

现在用户登录功能已经完全打通，用户可以通过多种方式登录并获得唯一的用户ID，从而完整地连接前端和后端的数据系统。

## 用户ID分配机制

### 后端用户ID生成
- 用户注册时，MongoDB自动为每个用户分配唯一的`_id`
- 这个`_id`作为用户的全局唯一标识符
- 所有后续的API调用都使用这个用户ID

### 前端用户ID存储
- 用户登录成功后，用户ID保存在本地AsyncStorage中
- AuthContext管理用户登录状态和用户信息
- 所有需要用户ID的服务都从本地存储获取

## 登录类型支持

### 1. 游客登录 (Guest)
```typescript
{
  loginType: 'guest',
  guestId: 'unique_guest_id',
  username: 'guest_user',
  nickname: '游客用户'
}
```

### 2. 微信登录 (WeChat)
```typescript
{
  loginType: 'wechat',
  wechatId: 'wechat_openid',
  username: 'wechat_user',
  nickname: '微信用户'
}
```

### 3. Apple登录 (Apple)
```typescript
{
  loginType: 'apple',
  appleId: 'apple_user_id',
  username: 'apple_user',
  nickname: 'Apple用户'
}
```

### 4. 手机号登录 (Phone)
```typescript
{
  loginType: 'phone',
  phoneNumber: '13800138000',
  username: 'phone_user',
  nickname: '手机用户'
}
```

## 完整登录流程

### 1. 用户注册/登录
```typescript
// 调用后端注册API
const response = await fetch('https://dramaword-api.onrender.com/api/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(registerData),
});

// 获取用户ID和token
const result = await response.json();
const userData = {
  id: result.data.user.id,        // MongoDB生成的用户ID
  nickname: result.data.user.nickname,
  loginType: loginType,
  token: result.data.token,
};
```

### 2. 保存到本地存储
```typescript
// 保存用户信息到AsyncStorage
await AsyncStorage.setItem('userData', JSON.stringify(userData));
await AsyncStorage.setItem('loginType', loginType);
```

### 3. 更新AuthContext状态
```typescript
// 更新全局认证状态
await login(userData, loginType);
```

## 用户ID的使用

### 1. 学习统计服务
```typescript
// LearningStatsService自动从本地存储获取用户ID
const userId = await this.getUserId();
const response = await fetch(`${API_BASE_URL}/users/${userId}/learning-stats`);
```

### 2. 徽章系统
```typescript
// 获取用户徽章
const response = await fetch(`${API_BASE_URL}/users/${userId}/badges`);
```

### 3. 词汇管理
```typescript
// 添加单词到用户词汇本
const response = await fetch(`${API_BASE_URL}/users/${userId}/vocabulary`, {
  method: 'POST',
  body: JSON.stringify({ word, sourceShow }),
});
```

### 4. 学习记录
```typescript
// 获取用户学习记录
const response = await fetch(`${API_BASE_URL}/users/${userId}/learning-records`);
```

## 测试功能

### ProfileScreen测试按钮
在ProfileScreen中有测试登录按钮，可以测试不同登录类型：
- 微信登录测试
- Apple登录测试  
- 手机登录测试
- 游客登录测试

### DataIntegrationTest组件
专门的数据集成测试组件，包含：
- 用户登录测试
- 学习统计API测试
- 徽章系统测试
- 数据同步测试
- 本地数据清除

## 数据流程

### 1. 用户登录
```
用户点击登录 → 调用后端注册API → 获得用户ID → 保存到本地 → 更新AuthContext
```

### 2. 数据获取
```
组件需要数据 → 从本地获取用户ID → 调用后端API → 返回用户专属数据
```

### 3. 数据同步
```
用户操作 → 更新本地数据 → 同步到后端 → 更新用户统计
```

## 安全机制

### JWT Token认证
- 用户登录后获得JWT token
- 所有API调用都需要携带token
- Token有效期7天

### 用户状态验证
- 后端验证用户是否存在
- 检查用户账号是否被禁用
- 验证token有效性

## 错误处理

### 网络错误
- API调用失败时使用模拟数据
- 显示友好的错误提示
- 自动重试机制

### 用户未登录
- 检测到用户未登录时显示游客模式
- 提示用户登录以获得完整功能
- 保存用户操作，登录后同步

## 部署状态

### 后端API
- 部署在Render: https://dramaword-api.onrender.com
- 支持所有用户登录类型
- MongoDB数据库连接正常

### 前端应用
- 支持所有登录类型的测试
- 完整的错误处理机制
- 本地存储和状态管理

## 下一步计划

1. **真实登录集成**
   - 集成真实的微信SDK
   - 集成Apple Sign In
   - 集成手机号验证

2. **数据完善**
   - 完善用户学习记录
   - 实现徽章解锁逻辑
   - 添加用户等级系统

3. **功能扩展**
   - 用户设置同步
   - 学习进度备份
   - 社交功能

## 总结

现在用户登录功能已经完全打通，用户可以获得唯一的用户ID，所有后续的数据操作都基于这个ID进行，实现了完整的前后端数据连接。用户可以通过测试按钮体验不同的登录方式，系统会自动分配用户ID并保存到本地存储中。 