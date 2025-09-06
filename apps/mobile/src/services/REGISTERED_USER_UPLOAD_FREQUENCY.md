# 📊 注册会员数据上传频率配置

## 🎯 概述

注册会员的数据上传采用**智能上传策略**，根据数据类型、用户活跃状态、网络条件等因素动态调整上传频率，确保数据及时同步的同时优化网络使用和电池消耗。

## ⏰ 基础上传频率

### 按数据类型分类

| 数据类型 | 最小上传间隔 | 变化阈值 | 优先级 | 说明 |
|---------|-------------|----------|--------|------|
| **经验值** | 5秒 | 1点经验 | 高 | 学习进度实时同步 |
| **学习记录** | 10秒 | 1条记录 | 高 | 复习记录及时上传 |
| **词汇数据** | 30秒 | 1个词汇 | 高 | 收藏词汇快速同步 |
| **用户统计** | 1分钟 | 10%变化 | 中 | 统计数据定期更新 |
| **剧单数据** | 2分钟 | 1个剧单 | 中 | 剧单创建/修改 |
| **徽章数据** | 5分钟 | 1个徽章 | 中 | 成就解锁同步 |
| **搜索历史** | 5分钟 | 5条历史 | 低 | 搜索记录批量上传 |
| **用户设置** | 10分钟 | 1%变化 | 低 | 设置变更同步 |

## 🌐 网络环境适配

### 网络类型同步间隔

| 网络类型 | 同步间隔 | 说明 |
|---------|----------|------|
| **WiFi** | 2分钟 | 稳定网络，频繁同步 |
| **移动网络** | 5分钟 | 节省流量，适中频率 |
| **离线模式** | 10分钟 | 网络恢复后批量同步 |

## 🧠 智能上传策略

### 上传触发条件

#### 1. **时间间隔检查**
```typescript
// 最小上传间隔（避免频繁上传）
const minInterval = this.getMinUploadInterval(dataType);
if (timeSinceLastUpload < minInterval) {
  return { passes: false, reason: '上传间隔太短' };
}
```

#### 2. **数据变化量检查**
```typescript
// 数据变化量检查
const changeThreshold = this.getChangeThreshold(dataType);
const dataChange = await this.calculateDataChange(dataType, data);

if (dataChange < changeThreshold) {
  return { passes: false, reason: '数据变化量不足' };
}
```

#### 3. **网络状态检查**
```typescript
// 网络状态检查
const networkQuality = await this.checkNetworkQuality();
if (networkQuality === 'poor' || networkQuality === 'offline') {
  return { passes: false, reason: '网络质量不佳' };
}
```

#### 4. **用户活跃状态**
```typescript
// 用户活跃状态
if (this.isUserActive) {
  return { passes: true, reason: '用户活跃，数据已更新', priority: 'high' };
}
```

#### 5. **数据重要性检查**
```typescript
// 数据重要性检查
const importance = this.getDataImportance(dataType);
if (importance === 'critical' && dataChange > 0) {
  return { passes: true, reason: '关键数据变化', priority: 'high' };
}
```

## 🎯 优先级延迟策略

### 智能延迟配置

| 优先级 | 延迟时间 | 适用场景 |
|--------|----------|----------|
| **高优先级** | 立即同步 | 用户活跃、关键数据变化 |
| **中优先级** | 10秒延迟 | 一般数据更新 |
| **低优先级** | 1分钟延迟 | 非关键数据、批量操作 |
| **最大批量延迟** | 5分钟 | 防止数据积压 |

## 📱 用户活跃状态检测

### 活跃状态定义
- **活跃**：用户正在使用应用（3分钟内）
- **非活跃**：用户离开应用超过3分钟

### 活跃状态影响
```typescript
// 用户活跃时
if (this.isUserActive) {
  // 立即同步高优先级数据
  return { priority: 'high', recommendedDelay: 0 };
}

// 用户非活跃时
// 延迟同步，节省资源
return { priority: 'medium', recommendedDelay: 10 * 1000 };
```

## 🔄 实际上传场景

### 场景1：用户正在学习
```
用户操作 → 数据变化 → 检查条件 → 立即上传
- 经验值：5秒内上传
- 学习记录：10秒内上传
- 词汇收藏：30秒内上传
```

### 场景2：用户离开应用
```
用户离开 → 3分钟后标记非活跃 → 延迟上传
- 非关键数据：1分钟延迟
- 批量数据：最多5分钟延迟
```

### 场景3：网络质量差
```
网络检测 → 质量不佳 → 延迟上传
- 重试间隔：2分钟
- 网络恢复：立即同步积压数据
```

## 📊 数据重要性分级

### Critical（关键）
- **学习记录**：用户学习进度
- **经验值**：等级和成就基础
- **词汇数据**：核心学习内容

### High（高）
- **用户统计**：学习分析数据
- **剧单数据**：用户创建内容

### Medium（中）
- **徽章数据**：成就系统
- **搜索历史**：用户行为分析

### Low（低）
- **用户设置**：个性化配置

## 🚀 优化策略

### 1. **批量上传**
```typescript
// 相同类型数据批量处理
batchSize: 20,  // 每批最多20条数据
maxBatchDelay: 5 * 60 * 1000  // 最大批量延迟5分钟
```

### 2. **增量同步**
```typescript
// 只上传变化的数据
enableIncrementalSync: false,  // 当前禁用（多邻国方案）
// 未来可启用：只同步变化部分
```

### 3. **离线优先**
```typescript
enableOfflineFirst: true,  // 离线优先策略
// 本地数据优先，网络恢复后同步
```

## 📈 性能监控

### 上传统计
```typescript
interface UploadStats {
  totalUploads: number;        // 总上传次数
  successfulUploads: number;   // 成功上传次数
  failedUploads: number;       // 失败上传次数
  averageUploadTime: number;   // 平均上传时间
  lastUploadTime: number;      // 最后上传时间
}
```

### 网络质量检测
```typescript
// 网络质量分级
type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

// 根据网络质量调整策略
if (networkQuality === 'poor') {
  // 降低上传频率，增加延迟
  recommendedDelay = 2 * 60 * 1000;  // 2分钟延迟
}
```

## 🎯 总结

### 核心特点
1. **智能频率**：根据数据类型和用户行为动态调整
2. **网络适配**：不同网络环境使用不同策略
3. **用户友好**：活跃时快速同步，非活跃时节省资源
4. **数据安全**：离线优先，确保数据不丢失

### 实际效果
- **学习时**：数据几乎实时同步（5-30秒）
- **非活跃时**：延迟同步，节省电池和流量
- **网络差时**：智能延迟，避免失败重试
- **批量操作**：合并上传，提高效率

这套智能上传策略确保了注册会员的数据能够及时、高效、安全地同步到云端！🚀
