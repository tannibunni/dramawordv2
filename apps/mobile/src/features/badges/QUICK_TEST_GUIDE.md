# 🧪 徽章状态调试快速测试指南

## 🚀 立即测试步骤

### 1. 清理存储空间
```bash
# 在终端中运行
xcrun simctl erase all
```

### 2. 重启应用
- 完全关闭模拟器
- 重新启动模拟器
- 重新运行应用

### 3. 测试调试按钮

#### 测试锁定状态
1. 进入 MyBadge 页面
2. 点击 **🔒 锁定状态** 按钮
3. 查看控制台日志：
   ```
   [BadgeWallScreen] 锁定状态设置完成，进度数据: [...]
   [BadgeService] 使用调试状态数据，跳过规则引擎计算
   [BadgeCard] 渲染徽章: { status: "locked", unlocked: false, ... }
   ```
4. 检查徽章显示：应该显示灰色锁图标

#### 测试宝箱状态
1. 点击 **🎁 宝箱状态** 按钮
2. 查看控制台日志：
   ```
   [BadgeWallScreen] 宝箱状态设置完成，进度数据: [...]
   [BadgeService] 使用调试状态数据，跳过规则引擎计算
   [BadgeCard] 渲染徽章: { status: "ready_to_unlock", unlocked: false, ... }
   ```
3. 检查徽章显示：应该显示橙色宝箱图标，带光晕效果

#### 测试解锁状态
1. 点击 **🏆 解锁所有徽章** 按钮
2. 检查徽章显示：应该显示彩色徽章图片

## 🔍 关键日志检查

### 成功标志
- ✅ `[BadgeWallScreen] 宝箱状态设置完成，进度数据:`
- ✅ `[BadgeService] 使用调试状态数据，跳过规则引擎计算`
- ✅ `[BadgeCard] 渲染徽章: { status: "ready_to_unlock", ... }`

### 失败标志
- ❌ `No space left on device`
- ❌ `Failed to write manifest file`
- ❌ 没有看到调试状态日志

## 🎯 预期结果

### 锁定状态
- **图标**：灰色锁图标
- **光晕**：无光晕效果
- **状态**：`status: "locked"`, `unlocked: false`

### 宝箱状态
- **图标**：橙色宝箱图标
- **光晕**：有光晕效果
- **状态**：`status: "ready_to_unlock"`, `unlocked: false`

### 解锁状态
- **图标**：彩色徽章图片
- **光晕**：无光晕效果
- **状态**：`status: "unlocked"`, `unlocked: true`

## 🚨 常见问题解决

### 问题1：存储空间不足
**症状**：看到 "No space left on device" 错误
**解决**：
```bash
xcrun simctl erase all
```

### 问题2：状态没有变化
**症状**：点击按钮后徽章显示没有变化
**解决**：
1. 检查控制台日志
2. 确认看到调试状态设置日志
3. 重启应用重试

### 问题3：徽章显示错误
**症状**：徽章显示状态与预期不符
**解决**：
1. 检查 `[BadgeCard] 渲染徽章` 日志
2. 确认状态值正确
3. 检查 BadgeCard 组件逻辑

## 📱 测试流程

### 完整测试序列
```
1. 清理存储空间
2. 重启应用
3. 进入 MyBadge 页面
4. 点击"锁定状态" → 验证显示
5. 点击"宝箱状态" → 验证显示
6. 点击"解锁所有徽章" → 验证显示
7. 点击"重置所有徽章" → 验证显示
```

### 快速验证
```
锁定状态 → 宝箱状态 → 解锁状态 → 重置
```

## 🎉 成功标志

如果看到以下日志序列，说明调试功能正常工作：

```
[BadgeWallScreen] 宝箱状态设置完成，进度数据: [...]
[BadgeService] 使用调试状态数据，跳过规则引擎计算
[BadgeService] 调试状态数据: [...]
[BadgeWallScreen] 加载的徽章进度: [...]
[BadgeCard] 渲染徽章: { status: "ready_to_unlock", ... }
```

## 🔧 如果仍然有问题

### 检查清单
- [ ] 存储空间充足
- [ ] 应用已重启
- [ ] 开发模式已启用
- [ ] 控制台日志正常
- [ ] 状态数据正确

### 进一步调试
1. 检查 AsyncStorage 数据
2. 验证 BadgeService 逻辑
3. 检查 BadgeCard 渲染
4. 确认状态传递正确

现在可以开始测试了！🚀
