# 通知推送系统开发指南

## 📱 功能概述

为剧词记应用开发了完整的通知推送系统，通过智能提醒刺激用户复习，提高学习效果和用户粘性。

## 🏗️ 系统架构

### 核心组件

1. **NotificationService** (`apps/mobile/src/services/notificationService.ts`)
   - 通知服务的核心类
   - 处理权限请求、令牌获取、通知调度
   - 支持多种通知类型和时间触发

2. **NotificationInitializer** (`apps/mobile/src/services/notificationInitializer.ts`)
   - 应用启动时的通知初始化
   - 监听通知事件和用户响应
   - 智能通知调度器

3. **NotificationManager** (`apps/mobile/src/components/common/NotificationManager.tsx`)
   - 用户界面组件
   - 通知设置管理
   - 实时状态显示

## 🔔 通知类型

### 1. 定时通知
- **每日复习提醒**: 每天上午9点
- **每周复习总结**: 每周一上午10点
- **学习激励提醒**: 每天下午3点

### 2. 智能通知
- **连续学习提醒**: 24小时未学习时触发
- **新单词提醒**: 添加新单词后2小时提醒
- **智能复习提醒**: 基于用户学习模式

### 3. 成就通知
- **目标达成**: 每日/每周/每月目标进度
- **成就解锁**: 学习里程碑达成
- **学习激励**: 随机激励消息

## 🌍 国际化支持

### 中英文双语界面
- 根据系统语言自动切换
- 所有通知文本都支持中英文
- 图标标签本地化

### 翻译示例
```typescript
const translations = {
  'review_reminder': isChinese ? '复习提醒' : 'Review Reminder',
  'daily_review': isChinese ? '每日复习时间到了！' : 'Time for daily review!',
  'weekly_review': isChinese ? '本周复习总结' : 'Weekly Review Summary',
  // ... 更多翻译
};
```

## 🚀 使用方法

### 1. 基本使用

```typescript
import notificationService from '../services/notificationService';

// 请求权限
const hasPermission = await notificationService.requestPermissions();

// 设置默认时间表
await notificationService.setupDefaultNotificationSchedule();

// 发送测试通知
await notificationService.scheduleAchievementNotification('测试成就');
```

### 2. 智能调度

```typescript
import SmartNotificationScheduler from '../services/notificationInitializer';

const scheduler = SmartNotificationScheduler.getInstance();

// 根据用户行为智能调度
await scheduler.scheduleSmartNotifications({
  lastStudyTime: new Date(),
  averageStudyInterval: 24 * 60 * 60 * 1000, // 24小时
  dailyGoal: 20,
  weeklyGoal: 100,
  monthlyGoal: 400,
  currentProgress: {
    daily: 15,
    weekly: 80,
    monthly: 320,
  },
  streakDays: 7,
  newWordsCount: 5,
});
```

### 3. 成就通知

```typescript
await scheduler.sendAchievementNotification({
  name: '连续学习7天',
  description: '恭喜你连续学习7天！',
  type: 'milestone'
});
```

## 📱 用户界面

### 通知设置页面
- 主开关：启用/禁用通知
- 每日复习提醒开关
- 每周复习总结开关
- 学习激励提醒开关
- 连续学习提醒开关
- 测试通知按钮
- 清除所有通知按钮

### 集成位置
- **ProfileScreen**: 个人资料页面的通知设置入口
- **App.tsx**: 应用启动时自动初始化

## 🔧 技术实现

### 依赖包
```json
{
  "expo-notifications": "~0.27.6",
  "expo-device": "~6.0.2",
  "expo-constants": "~16.0.1"
}
```

### 权限处理
```typescript
// 请求通知权限
const { status } = await Notifications.requestPermissionsAsync();
if (status !== 'granted') {
  console.log('通知权限被拒绝');
  return false;
}
```

### 通知配置
```typescript
// 配置通知行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
```

## 🎯 智能特性

### 1. 个性化提醒
- 基于用户学习习惯调整提醒时间
- 根据学习进度发送相应提醒
- 避免过度打扰用户

### 2. 时间段优化
- 早晨（6-9点）：发送激励通知
- 中午（12-14点）：发送复习提醒
- 晚上（18-21点）：发送总结通知

### 3. 行为分析
- 跟踪用户学习间隔
- 分析学习模式
- 优化通知频率

## 📊 通知数据

### 通知内容结构
```typescript
interface NotificationConfig {
  id: string;
  title: string;
  body: string;
  data?: any;
  trigger?: any;
}
```

### 通知类型标识
```typescript
// 通知数据类型
type NotificationType = 
  | 'daily_review'
  | 'weekly_review'
  | 'streak_reminder'
  | 'new_words'
  | 'achievement'
  | 'motivation'
  | 'goal_reminder'
  | 'smart_review';
```

## 🧪 测试

### 运行测试
```bash
# 检查通知功能
node test-notifications.js

# 启动应用
cd apps/mobile && npx expo start
```

### 测试步骤
1. 在真机上安装应用
2. 进入个人资料页面
3. 点击"通知设置"
4. 启用通知权限
5. 测试各种通知类型

## 🔄 生命周期

### 应用启动
1. 初始化通知服务
2. 请求通知权限
3. 设置默认时间表
4. 获取推送令牌

### 通知接收
1. 监听通知事件
2. 根据类型处理逻辑
3. 记录用户行为

### 用户响应
1. 监听通知点击
2. 导航到相应页面
3. 更新学习状态

## 🎨 自定义配置

### 修改通知时间
```typescript
// 修改每日复习时间
await notificationService.scheduleDailyReview(10, 30); // 上午10:30

// 修改每周复习时间
await notificationService.scheduleWeeklyReview(2, 14, 0); // 周二下午2点
```

### 添加新通知类型
```typescript
// 在 NotificationService 中添加新方法
async scheduleCustomNotification(message: string, delay: number) {
  const config: NotificationConfig = {
    id: `custom_${Date.now()}`,
    title: this.t('custom_notification'),
    body: message,
    data: { type: 'custom' },
    trigger: {
      seconds: delay,
      repeats: false,
    },
  };
  
  return this.scheduleLocalNotification(config);
}
```

## 📈 效果预期

### 用户参与度提升
- 增加每日活跃用户
- 提高学习连续性
- 减少用户流失

### 学习效果改善
- 定期复习提醒
- 及时巩固记忆
- 建立学习习惯

### 用户体验优化
- 个性化提醒
- 智能时间安排
- 减少打扰

## 🔮 未来扩展

### 计划功能
1. **远程推送**: 服务器端推送通知
2. **A/B测试**: 测试不同通知策略
3. **机器学习**: 更智能的提醒算法
4. **社交功能**: 好友学习提醒
5. **游戏化**: 通知解锁成就

### 技术优化
1. **性能优化**: 减少通知延迟
2. **电池优化**: 智能调度算法
3. **数据分析**: 通知效果统计
4. **用户反馈**: 通知偏好设置

---

## 📞 技术支持

如有问题或建议，请联系开发团队。

**开发完成时间**: 2024年12月
**版本**: v1.0.0
**兼容性**: Expo SDK 53, React Native 0.79.5 