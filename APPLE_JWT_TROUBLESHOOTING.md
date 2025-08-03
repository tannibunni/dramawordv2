# Apple JWT Audience 问题排查指南

## 🚨 **当前问题**
```
🍎 Apple JWT 验证失败: JsonWebTokenError: jwt audience invalid. expected: com.tannibunni.dramawordmobile
```

## ✅ **已确认正确的配置**

### 后端配置
- `APPLE_CLIENT_ID`: `com.tannibunni.dramawordmobile` ✅
- `APPLE_KEY_ID`: `T4BQBQ4NG9` ✅
- `APPLE_PRIVATE_KEY`: 已设置 ✅
- `APPLE_REDIRECT_URI`: `dramaword://apple-login` ✅

### 移动端配置
- Bundle Identifier: `com.tannibunni.dramawordmobile` ✅
- 与后端配置完全匹配

## 🔍 **问题诊断步骤**

### 1. 获取实际的JWT Token
当Apple登录失败时，从日志中获取完整的JWT token，然后运行：

```bash
node services/api/debug-apple-jwt-detailed.js <JWT_TOKEN>
```

### 2. 检查Apple Developer Console配置

#### A. App ID配置
1. 登录 [Apple Developer Console](https://developer.apple.com/account/)
2. 进入 "Certificates, Identifiers & Profiles"
3. 选择 "Identifiers" → "App IDs"
4. 找到 `com.tannibunni.dramawordmobile`
5. 确认以下设置：
   - ✅ "Sign in with Apple" 功能已启用
   - ✅ Bundle ID 正确
   - ✅ 状态为 "Active"

#### B. Service ID配置（如果使用）
1. 在 "Identifiers" 中选择 "Services IDs"
2. 检查是否有相关的Service ID
3. 确认 "Sign in with Apple" 配置

### 3. 检查移动端代码

#### A. Expo配置
```json
{
  "ios": {
    "bundleIdentifier": "com.tannibunni.dramawordmobile"
  }
}
```

#### B. Apple登录实现
检查移动端Apple登录代码是否正确传递了bundle identifier。

### 4. 环境变量验证

在Render控制台中确认环境变量：
```bash
# 检查环境变量
echo $APPLE_CLIENT_ID
echo $APPLE_KEY_ID
echo $APPLE_TEAM_ID
```

## 🛠️ **解决方案**

### 方案1: 检查JWT Token的实际Audience
使用调试脚本分析实际的JWT token：

```bash
# 获取一个失败的JWT token
node services/api/debug-apple-jwt-detailed.js eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMzQ1Njc4OTAifQ...
```

### 方案2: 修改验证逻辑
如果JWT token的audience是数组，修改验证逻辑：

```typescript
// 在 appleService.ts 中
if (Array.isArray(payload.aud) && payload.aud.includes(appleConfig.clientId)) {
  // 使用数组中的第一个元素进行验证
  const result = await appleSigninAuth.verifyIdToken(idToken, {
    audience: payload.aud[0],
    ignoreExpiration: false,
  });
}
```

### 方案3: 检查Apple Developer Console
1. 确认App ID的"Sign in with Apple"功能状态
2. 检查是否有多个App ID或Service ID
3. 确认Team ID和Key ID匹配

### 方案4: 重新生成Apple密钥
1. 在Apple Developer Console中删除现有密钥
2. 重新生成新的密钥
3. 更新环境变量

## 📋 **调试清单**

- [ ] 获取并分析实际的JWT token
- [ ] 检查Apple Developer Console中的App ID配置
- [ ] 确认"Sign in with Apple"功能已启用
- [ ] 验证移动端bundle identifier
- [ ] 检查环境变量设置
- [ ] 测试新的Apple登录流程

## 🎯 **预期结果**

修复后应该看到：
- ✅ Apple登录成功
- ✅ JWT token验证通过
- ✅ 用户创建/登录正常

## 📞 **下一步**

1. **立即执行**: 获取一个失败的JWT token并运行调试脚本
2. **检查配置**: 验证Apple Developer Console设置
3. **测试修复**: 重新测试Apple登录功能

---

**注意**: 如果问题持续存在，可能需要联系Apple Developer Support或检查是否有其他App ID配置冲突。 