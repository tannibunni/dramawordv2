# 🎁 邀请码系统更新文档

## 📋 更新概述

根据用户反馈，邀请码系统已更新为**仅限注册用户使用**。游客用户需要先注册才能生成邀请码，确保邀请码的真实性和可追溯性。

## 🔄 主要变更

### **1. 邀请码生成限制**
- **注册用户**: 可以生成邀请码
- **游客用户**: 需要先注册，系统会引导到注册页面

### **2. 数据库存储**
- 邀请码与用户ID关联存储
- 每个注册用户只能有一个活跃邀请码
- 支持邀请码历史记录查询

### **3. 用户体验优化**
- 游客用户尝试生成邀请码时显示注册提示
- 提供清晰的错误信息和引导流程
- 支持邀请码重复使用检查

## 🎯 功能特性

### **注册用户功能**
```typescript
// 生成邀请码
POST /api/invite/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "free_trial",
  "freeTrialDays": 30,
  "maxUses": 1,
  "expiresInDays": 30
}
```

**成功响应:**
```json
{
  "success": true,
  "message": "邀请码生成成功",
  "data": {
    "code": "DWMFN4RULYFCG6JR",
    "type": "free_trial",
    "reward": {
      "freeTrialDays": 30,
      "discountPercent": 0,
      "premiumGift": ""
    },
    "maxUses": 1,
    "expiresAt": "2025-10-16T22:34:45.047Z"
  }
}
```

### **游客用户限制**
```json
{
  "success": false,
  "message": "只有注册用户才能生成邀请码",
  "code": "GUEST_USER_NOT_ALLOWED",
  "data": {
    "requireRegistration": true,
    "message": "请先注册成为正式用户，然后才能生成邀请码"
  }
}
```

## 🔧 技术实现

### **后端逻辑**
1. **用户身份验证**: 检查用户登录类型
2. **权限控制**: 只有注册用户才能生成邀请码
3. **重复检查**: 防止用户生成多个活跃邀请码
4. **数据库存储**: 邀请码与用户ID关联

### **前端处理**
1. **错误处理**: 捕获 `GUEST_USER_NOT_ALLOWED` 错误
2. **用户引导**: 显示注册提示弹窗
3. **导航逻辑**: 引导用户到注册页面
4. **状态管理**: 处理邀请码生成状态

## 📊 数据库设计

### **InviteCode 模型**
```typescript
interface IInviteCode {
  code: string;                    // 邀请码
  inviterId: string;              // 邀请者ID（注册用户）
  inviteeId?: string;             // 被邀请者ID
  type: 'free_trial' | 'discount' | 'premium_gift';
  reward: {
    freeTrialDays: number;        // 免费试用天数
    discountPercent?: number;     // 折扣百分比
    premiumGift?: string;         // 高级功能礼物
  };
  status: 'active' | 'used' | 'expired' | 'cancelled';
  maxUses: number;                // 最大使用次数
  usedCount: number;              // 已使用次数
  expiresAt: Date;                // 过期时间
  usedAt?: Date;                  // 使用时间
  createdAt: Date;
  updatedAt: Date;
}
```

### **索引优化**
```typescript
// 复合索引
InviteCodeSchema.index({ inviterId: 1, status: 1 });
InviteCodeSchema.index({ code: 1, status: 1 });
InviteCodeSchema.index({ expiresAt: 1 });
```

## 🎨 前端实现

### **分享页面 (ShareAppModal)**
```typescript
const generateInviteCode = async () => {
  try {
    const response = await fetch('/api/invite/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getUserToken()}`,
      },
      body: JSON.stringify({
        type: 'free_trial',
        freeTrialDays: 30,
        maxUses: 1,
        expiresInDays: 30
      })
    });

    const result = await response.json();
    
    if (result.success) {
      setInviteCode(result.data.code);
    } else if (result.code === 'GUEST_USER_NOT_ALLOWED') {
      // 显示注册提示
      Alert.alert(
        '需要注册',
        '只有注册用户才能生成邀请码。请先注册成为正式用户。',
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '去注册', 
            onPress: () => {
              // 导航到注册页面
              onClose();
            }
          }
        ]
      );
    }
  } catch (error) {
    console.error('生成邀请码失败:', error);
  }
};
```

### **邀请码输入组件 (InviteCodeInput)**
```typescript
const validateInviteCode = async (code: string) => {
  try {
    const response = await fetch('/api/invite/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() })
    });

    const result = await response.json();
    
    if (result.success) {
      setIsValid(true);
      const rewardValue = result.data?.type === 'free_trial' 
        ? result.data.reward?.freeTrialDays || 0
        : result.data?.reward?.discountPercent || 0;
      setDiscount(rewardValue);
    } else {
      setIsValid(false);
      setErrorMessage(result.message || '邀请码无效');
    }
  } catch (error) {
    console.error('验证邀请码失败:', error);
  }
};
```

## 🔒 安全机制

### **权限控制**
- 只有注册用户才能生成邀请码
- 游客用户被引导到注册页面
- 邀请码与用户ID强关联

### **数据完整性**
- 每个用户只能有一个活跃邀请码
- 邀请码使用次数限制
- 过期时间自动检查

### **错误处理**
- 清晰的错误代码和消息
- 用户友好的提示信息
- 完善的异常处理机制

## 📈 业务价值

### **用户增长**
- 鼓励用户注册成为正式用户
- 提高用户粘性和留存率
- 通过邀请机制扩大用户基数

### **数据质量**
- 邀请码与真实用户关联
- 提高邀请数据的准确性
- 便于后续数据分析和运营

### **用户体验**
- 清晰的权限提示
- 流畅的注册引导流程
- 完善的错误处理

## 🚀 部署说明

### **后端更新**
1. 更新邀请码生成逻辑
2. 添加用户身份验证
3. 完善错误处理机制

### **前端更新**
1. 更新分享页面逻辑
2. 添加注册引导功能
3. 完善错误处理

### **数据库更新**
1. 确保邀请码与用户ID关联
2. 添加必要的索引
3. 清理无效的邀请码数据

## 🎉 总结

邀请码系统已成功更新为**仅限注册用户使用**，确保了：

1. **数据真实性**: 邀请码与真实用户关联
2. **用户体验**: 清晰的权限提示和引导流程
3. **系统安全**: 完善的权限控制和错误处理
4. **业务价值**: 鼓励用户注册，提高数据质量

**现在只有注册用户才能生成邀请码，游客用户会被引导到注册页面！** 🎉
