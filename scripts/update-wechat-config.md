# 微信开放平台配置更新指南

## 🎉 好消息
您已经开通了"使用微信账号登录App"功能！

## 📋 需要完成的配置

### 1. 微信开放平台配置
请在微信开放平台确认以下配置：

- **AppID**: `wxa225945508659eb8`
- **Bundle ID**: `com.tannibunni.dramawordmobile`
- **Universal Links**: `https://dramaword.com/app/`
- **授权回调域名**: `dramaword.com`
- **JS接口安全域名**: `dramaword.com`
- **网页授权域名**: `dramaword.com`
- **业务域名**: `dramaword.com`

### 2. 环境变量更新

#### 在 Render.com 中更新以下环境变量：

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 找到 `dramawordv2` 服务
3. 点击 "Environment" 标签页
4. 更新以下变量：

```
WECHAT_APP_ID=wxa225945508659eb8
WECHAT_APP_SECRET=[您的实际AppSecret]
WECHAT_BUNDLE_ID=com.tannibunni.dramawordmobile
WECHAT_UNIVERSAL_LINKS=https://dramaword.com/app/
```

**重要**: 请将 `[您的实际AppSecret]` 替换为微信开放平台提供的真实 AppSecret。

### 3. 域名配置检查

确认以下文件存在且内容正确：

```
https://dramaword.com/app/.well-known/apple-app-site-association
```

文件内容应该包含：
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "4V789N7WRQ.com.tannibunni.dramawordmobile",
        "paths": ["/app/*"]
      }
    ]
  }
}
```

### 4. Apple Developer 配置

确认 Apple Developer 中的 Associated Domains 配置：

1. 登录 [Apple Developer](https://developer.apple.com)
2. 进入 "Certificates, Identifiers & Profiles"
3. 选择 "Identifiers" → 找到 `com.tannibunni.dramawordmobile`
4. 确认 "Associated Domains" 已启用
5. 确认包含 `applinks:dramaword.com`

## 🔧 更新步骤

### 步骤1: 更新环境变量
1. 在 Render.com 中更新环境变量
2. 点击 "Manual Deploy" → "Clear build cache & deploy"

### 步骤2: 重新构建前端
```bash
cd apps/mobile
npx eas build --platform ios --profile production
```

### 步骤3: 测试功能
1. 下载新构建的应用
2. 测试微信登录功能
3. 观察是否出现微信授权弹窗

## 🎯 预期结果

配置完成后，微信登录应该：
- ✅ 显示真实的微信授权弹窗
- ✅ 用户可以选择授权或拒绝
- ✅ 授权后获取真实的用户信息
- ✅ 不再出现SDK初始化失败错误

## 📞 如果仍有问题

1. 检查微信开放平台的所有配置
2. 确认环境变量已正确更新
3. 确认域名配置正确
4. 检查 Apple Developer 配置
5. 重新部署后端和前端

---

**注意**: 请确保将实际的 AppSecret 填入环境变量，这是微信登录功能正常工作的关键！ 