# Render 环境变量修复指南

## 🚨 紧急修复：Apple 登录 JWT 错误

### 问题描述
Apple 登录失败，错误信息：`jwt audience invalid. expected: com.tannibunni.dramawordmobile`

### 解决步骤

1. **登录 Render 控制台**
   - 访问 https://dashboard.render.com
   - 登录您的账户

2. **找到 dramaword-api 服务**
   - 在服务列表中找到 `dramaword-api`
   - 点击进入服务详情

3. **更新环境变量**
   - 点击 "Environment" 标签
   - 找到 `APPLE_CLIENT_ID` 变量
   - 将值更新为：`com.tannibunni.dramawordmobile`
   - 点击 "Save Changes"

4. **重新部署服务**
   - 点击 "Manual Deploy"
   - 选择 "Deploy latest commit"
   - 等待部署完成

### 需要检查的其他环境变量

确保以下变量都已正确设置：

```bash
# Apple 登录配置
APPLE_CLIENT_ID=com.tannibunni.dramawordmobile
APPLE_TEAM_ID=你的Apple Team ID
APPLE_KEY_ID=你的Apple Key ID
APPLE_PRIVATE_KEY=你的Apple Private Key

# 微信登录配置
WECHAT_APP_ID=wxa225945508659eb8
WECHAT_APP_SECRET=你的微信应用密钥
WECHAT_BUNDLE_ID=com.tannibunni.dramawordmobile

# 其他必需配置
MONGODB_URI=你的MongoDB连接字符串
JWT_SECRET=你的JWT密钥
OPENAI_API_KEY=你的OpenAI API密钥
```

### 验证修复

部署完成后，重新测试 Apple 登录功能。

---

## 🔍 微信登录 40029 错误分析

### 可能原因
1. **开发环境使用 Mock 模式**：当前在开发模式下，微信登录使用 MockWechatSDK
2. **授权码问题**：Mock 模式可能生成无效的授权码
3. **环境变量未配置**：微信相关环境变量可能未在 Render 中正确设置

### 临时解决方案
在开发阶段，微信登录会使用 Mock 模式，这是正常行为。要测试真实微信登录，需要：
1. 构建生产版本
2. 上传到 TestFlight
3. 在真机上测试

### 开发模式测试建议
- 使用 Apple 登录测试用户信息获取功能
- 微信登录在开发模式下会模拟成功
- 重点测试用户信息保存和显示逻辑 