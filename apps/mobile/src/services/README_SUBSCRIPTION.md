# 订阅服务使用说明

## 概述

本项目包含两个核心订阅服务：
- `iapService.ts` - 苹果应用内购买服务
- `subscriptionService.ts` - 订阅业务逻辑服务

## 服务架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI组件        │    │subscriptionService│    │   iapService    │
│                 │◄──►│                 │◄──►│                 │
│ - 订阅页面      │    │ - 业务逻辑      │    │ - 苹果IAP       │
│ - 功能控制      │    │ - 状态管理      │    │ - 支付流程      │
│ - 升级提示      │    │ - 权限检查      │    │ - 收据验证      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 核心功能

### 1. 订阅计划
- **月度订阅**: $2.99/首月 → $3.99/月
- **年度订阅**: $29.99/年 (节省37%)
- **终身会员**: $79.99 (一次付费)

### 2. 功能权限控制
- **免费版**: 中英文查词、基础功能
- **高级版**: 多语言支持、AI释义、无限储存等

### 3. 开发阶段特性
- 模拟购买流程
- 本地状态管理
- 完整的功能权限检查

## 使用方法

### 基本初始化

```typescript
import { subscriptionService } from '../services/subscriptionService';

// 在App启动时初始化
useEffect(() => {
  const initSubscription = async () => {
    await subscriptionService.initialize();
  };
  initSubscription();
}, []);
```

### 检查订阅状态

```typescript
// 获取当前订阅状态
const status = await subscriptionService.checkSubscriptionStatus();

if (status.isActive) {
  console.log('用户已订阅，产品ID:', status.productId);
  console.log('到期时间:', status.expiresAt);
} else {
  console.log('用户未订阅');
}
```

### 订阅产品

```typescript
import { PRODUCT_IDS } from '../types/subscription';

// 订阅月度计划
const result = await subscriptionService.subscribeToPlan(PRODUCT_IDS.MONTHLY);

if (result.success) {
  console.log('订阅成功!');
  console.log('交易ID:', result.transactionId);
} else {
  console.log('订阅失败:', result.error);
}
```

### 功能权限检查

```typescript
// 检查是否可以访问某个功能
const canAccess = subscriptionService.canAccessFeature('ai_definition');

if (canAccess) {
  // 显示AI释义功能
  showAIDefinition();
} else {
  // 显示升级提示
  showUpgradePrompt('ai_definition');
}

// 检查语言支持
const canUseJapanese = subscriptionService.canAccessLanguage('ja');
```

### 状态变化监听

```typescript
// 注册状态变化回调
const unsubscribe = subscriptionService.registerStateCallback((status) => {
  if (status.isActive) {
    // 用户订阅了，解锁功能
    unlockPremiumFeatures();
  } else {
    // 用户取消订阅了，锁定功能
    lockPremiumFeatures();
  }
});

// 在组件卸载时取消监听
useEffect(() => {
  return unsubscribe;
}, []);
```

### 获取功能权限列表

```typescript
// 获取所有功能的权限状态
const permissions = subscriptionService.getFeaturePermissions();

permissions.forEach(permission => {
  console.log(`${permission.feature}: ${permission.isAccessible ? '可用' : '需要订阅'}`);
  if (permission.requiresSubscription) {
    console.log('提示:', permission.message);
  }
});
```

## 开发阶段使用

### 模拟购买

在开发阶段，服务会自动使用模拟数据：

```typescript
// 开发模式下，购买会模拟成功
const result = await subscriptionService.subscribeToPlan(PRODUCT_IDS.MONTHLY);

// 结果包含模拟的交易ID和收据
console.log('模拟交易ID:', result.transactionId);
console.log('模拟收据:', result.receipt);
```

### 模拟产品数据

开发阶段会自动加载模拟产品：

```typescript
const products = await subscriptionService.getSubscriptionPlans();
console.log('模拟产品数据:', products);
```

## 生产环境集成

### 真实IAP集成

当需要集成真实的苹果IAP时，需要：

1. **安装依赖**:
```bash
npm install react-native-iap
```

2. **更新iapService.ts**:
```typescript
// 替换模拟购买逻辑
import { 
  initConnection, 
  getProducts, 
  requestPurchase 
} from 'react-native-iap';

// 实现真实的购买流程
```

3. **配置App Store Connect**:
- 创建应用内购买项目
- 配置产品ID
- 设置价格和描述

### 收据验证

生产环境需要实现收据验证：

```typescript
// 与苹果服务器验证收据
const isValid = await iapService.validateReceipt(receipt);

// 或与自己的后端验证
const response = await fetch('/api/validate-receipt', {
  method: 'POST',
  body: JSON.stringify({ receipt })
});
```

## 错误处理

### 常见错误

```typescript
try {
  const result = await subscriptionService.subscribeToPlan(PRODUCT_IDS.MONTHLY);
  
  if (!result.success) {
    // 处理购买失败
    switch (result.error) {
      case '网络错误':
        showNetworkError();
        break;
      case '用户取消':
        showUserCancelled();
        break;
      case '支付失败':
        showPaymentError();
        break;
      default:
        showGenericError(result.error);
    }
  }
} catch (error) {
  console.error('订阅过程出错:', error);
  showGenericError('订阅失败，请稍后重试');
}
```

## 最佳实践

### 1. 初始化时机
- 在App启动时初始化订阅服务
- 在用户登录后检查订阅状态

### 2. 状态管理
- 使用回调监听订阅状态变化
- 在UI中实时反映订阅状态

### 3. 用户体验
- 在功能受限时显示友好的升级提示
- 提供清晰的免费版vs付费版对比

### 4. 错误处理
- 优雅处理网络错误和支付失败
- 提供重试机制和客服支持

## 注意事项

1. **开发阶段**: 所有功能都使用模拟数据，不会产生真实费用
2. **类型安全**: 使用TypeScript确保类型安全
3. **状态同步**: 订阅状态会自动保存到本地存储
4. **功能控制**: 基于订阅状态自动控制功能访问权限
5. **多语言**: 支持中英文免费，其他语言需要订阅

## 扩展功能

### 试用期支持
```typescript
// 可以扩展试用期逻辑
const trialInfo = subscriptionService.getTrialInfo();
if (trialInfo.hasTrial && !trialInfo.isExpired) {
  console.log(`试用期还剩 ${trialInfo.daysLeft} 天`);
}
```

### 家庭共享
```typescript
// 可以扩展家庭共享功能
const canShareWithFamily = subscriptionService.canShareWithFamily();
```

### 企业订阅
```typescript
// 可以扩展企业订阅功能
const isEnterpriseSubscription = subscriptionService.isEnterpriseSubscription();
```
