# 强制重新部署 Render 服务指南

## 🚨 解决 Apple JWT Audience 错误

### 问题分析
虽然 `APPLE_CLIENT_ID` 已经正确设置为 `com.tannibunni.dramawordmobile`，但 Render 可能还在使用旧的环境变量缓存。

### 解决方案：强制重新部署

#### 步骤 1：清除构建缓存
1. 登录 [Render 控制台](https://dashboard.render.com)
2. 找到 `dramaword-api` 服务
3. 点击 "Manual Deploy" 按钮
4. 选择 "Clear build cache & deploy"
5. 点击 "Deploy latest commit"

#### 步骤 2：验证环境变量
重新部署后，检查环境变量是否正确：
- `APPLE_CLIENT_ID` = `com.tannibunni.dramawordmobile`
- `APPLE_TEAM_ID` = `4V789N7WRQ`
- `APPLE_KEY_ID` = `T4BQBQ4NG9`
- `APPLE_PRIVATE_KEY` = 您的私钥

#### 步骤 3：测试 Apple 登录
部署完成后，重新测试 Apple 登录功能。

### 如果问题仍然存在

#### 检查 Apple 开发者账户
1. 登录 [Apple Developer](https://developer.apple.com)
2. 检查 App ID 配置
3. 确认 "Sign in with Apple" 已启用
4. 验证 Bundle ID 匹配

#### 检查客户端配置
确认 `apps/mobile/app.json` 中的 Bundle ID 正确：
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.tannibunni.dramawordmobile"
    }
  }
}
```

### 调试日志
如果问题持续，可以添加更多日志来调试：

1. 在 Apple 登录时检查发送的 idToken
2. 验证 Apple 服务接收到的参数
3. 检查 JWT 验证的具体错误信息

### 预期结果
重新部署后，Apple 登录应该能够正常工作，不再出现 JWT audience 错误。 