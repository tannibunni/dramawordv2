# Apple 登录问题诊断和解决方案

## 🚨 当前问题

根据错误日志和配置检查，Apple登录出现JWT audience验证失败：

```
🍎 Apple JWT 验证失败: JsonWebTokenError: jwt audience invalid. expected: com.tannibunni.dramawordmobile
```

## 🔍 问题诊断

### 配置检查结果

#### ✅ 正确的配置
- **前端Bundle ID**: `com.tannibunni.dramawordmobile` ✅
- **Apple Sign-In Entitlements**: 已配置 ✅
- **APPLE_PRIVATE_KEY**: 已设置 ✅

#### ❌ 缺失的配置
- **APPLE_CLIENT_ID**: 未设置 ❌
- **APPLE_TEAM_ID**: 未设置 ❌
- **APPLE_KEY_ID**: 未设置 ❌
- **APPLE_REDIRECT_URI**: 未设置 ❌

## 🛠️ 解决方案

### 步骤1: 设置环境变量

在 `services/api/.env` 文件中添加以下配置：

```bash
# Apple 登录配置
APPLE_CLIENT_ID=com.tannibunni.dramawordmobile
APPLE_TEAM_ID=your-apple-team-id-here
APPLE_KEY_ID=your-apple-key-id-here
APPLE_PRIVATE_KEY=your-apple-private-key-here
APPLE_REDIRECT_URI=dramaword://apple-login
```

### 步骤2: 获取Apple开发者配置

#### A. 获取Team ID
1. 登录 [Apple Developer Console](https://developer.apple.com/account/)
2. 进入 "Membership" 页面
3. 复制 "Team ID"（10位数字）

#### B. 获取Key ID
1. 进入 "Certificates, Identifiers & Profiles"
2. 选择 "Keys"
3. 找到用于Apple Sign-In的密钥
4. 复制 "Key ID"

#### C. 获取Private Key
1. 在密钥详情页面下载 `.p8` 文件
2. 将文件内容转换为环境变量格式：
   ```bash
   APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
   MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
   -----END PRIVATE KEY-----"
   ```

### 步骤3: 验证Apple Developer Console配置

#### A. App ID配置
1. 进入 "Identifiers" → "App IDs"
2. 找到 `com.tannibunni.dramawordmobile`
3. 确认以下设置：
   - ✅ "Sign in with Apple" 功能已启用
   - ✅ Bundle ID 正确
   - ✅ 状态为 "Active"

#### B. 密钥配置
1. 确认密钥已启用 "Sign in with Apple"
2. 确认密钥状态为 "Active"
3. 确认密钥与App ID关联

### 步骤4: 测试配置

#### A. 运行配置检查
```bash
node scripts/check-apple-config.js
```

#### B. 测试Apple登录
1. 启动应用
2. 尝试Apple登录
3. 如果失败，获取JWT token进行分析

#### C. 分析JWT Token
如果仍然失败，使用调试脚本分析JWT token：

```bash
node scripts/debug-apple-jwt-audience.js <JWT_TOKEN>
```

## 🔧 技术细节

### JWT Audience验证逻辑

后端已实现多种验证策略：

1. **数组Audience支持**: 如果JWT的audience是数组，直接使用数组验证
2. **多种策略回退**: 尝试配置的clientId、实际audience、常见变体
3. **详细日志**: 记录所有验证尝试和结果

### 常见Audience值

- `com.tannibunni.dramawordmobile` (期望值)
- `com.tannibunni.dramaword` (可能的变体)
- `dramaword` (可能的变体)

## 📱 前端配置确认

### app.json配置
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.tannibunni.dramawordmobile"
    }
  }
}
```

### entitlements配置
```xml
<key>com.apple.developer.applesignin</key>
<array>
    <string>Default</string>
</array>
```

## 🚀 部署注意事项

### Render环境变量
确保在Render控制台中设置所有Apple相关环境变量：

1. `APPLE_CLIENT_ID`
2. `APPLE_TEAM_ID`
3. `APPLE_KEY_ID`
4. `APPLE_PRIVATE_KEY`
5. `APPLE_REDIRECT_URI`

### 环境变量格式
- 私钥需要包含完整的PEM格式
- 确保没有多余的空格或换行符
- 使用正确的引号格式

## 🔍 调试工具

### 1. 配置检查脚本
```bash
node scripts/check-apple-config.js
```

### 2. JWT分析脚本
```bash
node scripts/debug-apple-jwt-audience.js <JWT_TOKEN>
```

### 3. 日志分析
查看后端日志中的详细错误信息：
- JWT payload解码结果
- 验证策略尝试记录
- 最终失败原因

## 📞 获取帮助

如果问题仍然存在：

1. **检查Apple Developer Console**配置
2. **验证环境变量**设置
3. **分析JWT token**的实际audience
4. **查看详细日志**输出
5. **联系Apple开发者支持**

## ✅ 成功标准

修复完成后，应该看到：

- ✅ 配置检查脚本显示所有项目为绿色
- ✅ Apple登录成功
- ✅ 用户信息正确获取
- ✅ 后端日志显示验证成功

---

**最后更新**: 2024年12月
**维护者**: Tanny 