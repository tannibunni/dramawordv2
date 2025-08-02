# 强制重新部署 Render 服务指南

## 🚨 当前问题
- 微信登录用户名长度超限错误
- Apple 登录 JWT audience 错误
- 环境变量缓存问题

## 🔧 解决方案

### 步骤1: 强制重新部署
1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 找到 `dramawordv2` 服务
3. 点击 **"Manual Deploy"** 按钮
4. 选择 **"Clear build cache & deploy"**
5. 点击 **"Deploy latest commit"**

### 步骤2: 等待部署完成
- 部署时间：约 3-5 分钟
- 状态：从 "Building" 到 "Live"

### 步骤3: 验证修复
1. 测试微信登录
2. 测试 Apple 登录
3. 检查后端日志

## 📋 修复内容

### ✅ 微信登录修复
- 用户名格式：`w123456ab` (8字符)
- 符合数据库 20 字符限制
- 保持唯一性

### ✅ Apple 登录修复
- 清除环境变量缓存
- 重新加载 APPLE_CLIENT_ID
- 修复 JWT audience 验证

## 🎯 预期结果

### 微信登录
- ✅ 不再出现用户名长度错误
- ✅ 成功创建用户
- ✅ 正确返回用户信息

### Apple 登录
- ✅ 不再出现 JWT audience 错误
- ✅ 成功验证 Apple ID Token
- ✅ 正确创建/更新用户

## 📞 如果问题持续

1. **检查 Render 日志**
2. **验证环境变量**
3. **联系技术支持**

---
*最后更新: 2025-08-02* 