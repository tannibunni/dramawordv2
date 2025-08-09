# Apple 开发者账户配置检查指南

## 🚨 问题诊断

根据调试日志，后端配置完全正确，但 JWT audience 验证失败。这表明问题在于 Apple 开发者账户的 App ID 配置。

## 🔍 需要检查的配置

### 1. Apple Developer App ID 配置

**步骤**：
1. 登录 [Apple Developer](https://developer.apple.com)
2. 进入 "Certificates, Identifiers & Profiles"
3. 点击 "Identifiers"
4. 找到您的 App ID: `com.tannibunni.dramawordmobile`

**检查项目**：
- ✅ **Bundle ID**: `com.tannibunni.dramawordmobile`
- ✅ **Sign in with Apple**: 必须启用
- ✅ **App ID Prefix**: 确认 Team ID 正确

### 2. Sign in with Apple 配置

**在 App ID 详情页面**：
1. 找到 "Sign in with Apple" 部分
2. 确认状态为 "Enabled"
3. 检查 "Primary App ID" 设置
4. 确认 "Domains and Subdomains" 配置

### 3. 可能的配置问题

**常见问题**：
1. **App ID 未启用 Sign in with Apple**
2. **Bundle ID 不匹配**
3. **Team ID 配置错误**
4. **App ID 状态不是 "Active"**

## 🔧 解决方案

### 方案 1: 检查并修复 App ID 配置

1. **确认 Bundle ID**：
   ```
   com.tannibunni.dramawordmobile
   ```

2. **启用 Sign in with Apple**：
   - 在 App ID 配置中启用 "Sign in with Apple"
   - 保存配置

3. **检查 App ID 状态**：
   - 确保 App ID 状态为 "Active"
   - 如果不是，需要重新配置

### 方案 2: 创建新的 App ID

如果现有 App ID 有问题，可以：
1. 创建新的 App ID
2. 使用正确的 Bundle ID
3. 启用 Sign in with Apple
4. 更新应用配置

### 方案 3: 检查客户端配置

确认 `apps/mobile/app.json` 中的配置：
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.tannibunni.dramawordmobile"
    }
  }
}
```

## 📱 测试步骤

1. **修复 Apple Developer 配置**
2. **重新构建应用**（如果需要）
3. **测试 Apple 登录**
4. **检查调试日志**

## 🎯 预期结果

修复后，您应该看到：
- Apple 登录成功
- 用户信息正确获取
- 不再出现 JWT audience 错误

## 💡 重要提示

- Apple Developer 配置更改可能需要几分钟生效
- 如果修改了 Bundle ID，需要重新构建应用
- 确保所有相关配置都正确匹配 