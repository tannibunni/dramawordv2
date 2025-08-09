# Xcode 配置检查指南

## 📱 检查 Bundle Identifier

### 步骤：
1. 打开 Xcode 项目：`apps/mobile/ios/app.xcworkspace`
2. 在左侧导航栏选择项目名称 `app`
3. 选择 `app` target
4. 点击 "General" 标签页
5. 查看 "Bundle Identifier" 字段

### 期望结果：
```
Bundle Identifier: com.tannibunni.dramawordmobile
```

---

## 🍎 检查 "Sign in with Apple" Capability

### 步骤：
1. 在左侧导航栏选择项目名称 `app`
2. 选择 `app` target
3. 点击 "Signing & Capabilities" 标签页
4. 在 "Capabilities" 部分查找 "Sign in with Apple"

### 如果没有找到：
1. 点击 "+ Capability" 按钮
2. 搜索 "Sign in with Apple"
3. 双击添加该 capability

### 期望结果：
- ✅ "Sign in with Apple" 已添加到 Capabilities 列表
- ✅ 状态显示为已启用

---

## 🔐 检查 Signing 配置

### 步骤：
1. 在 "Signing & Capabilities" 标签页
2. 查看 "Team" 选择
3. 查看 "Bundle Identifier" 确认
4. 查看 "Provisioning Profile" 状态

### 期望结果：
- ✅ Team: 您的 Apple Developer Team
- ✅ Bundle Identifier: com.tannibunni.dramawordmobile
- ✅ Provisioning Profile: 自动管理或手动选择正确的 profile

---

## 🚨 常见问题解决

### 问题1: Bundle Identifier 不匹配
**解决方案**：
- 修改 Bundle Identifier 为 `com.tannibunni.dramawordmobile`
- 重新生成 Provisioning Profile

### 问题2: "Sign in with Apple" 未添加
**解决方案**：
- 点击 "+ Capability" 添加
- 确保 Apple Developer 账户中已启用该功能

### 问题3: Provisioning Profile 错误
**解决方案**：
- 选择 "Automatically manage signing"
- 或手动下载正确的 Provisioning Profile

---

## 📋 检查清单

- [ ] Bundle Identifier 是 `com.tannibunni.dramawordmobile`
- [ ] "Sign in with Apple" capability 已添加
- [ ] Team 选择正确
- [ ] Provisioning Profile 状态正常
- [ ] 没有编译错误

---

## 🔧 如果配置都正确但仍然失败

1. **清理项目**：
   - Product → Clean Build Folder
   - 删除 Derived Data

2. **重新生成证书**：
   - 在 Apple Developer Console 重新生成证书
   - 下载并安装到 Xcode

3. **检查 Apple Developer Console**：
   - 确认 App ID 配置正确
   - 确认 "Sign in with Apple" 已启用 