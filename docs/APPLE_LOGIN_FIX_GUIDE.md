# Apple 登录问题修复指南

## 🚨 问题描述

Apple 登录时出现错误：
```
❌ 苹果登录失败: [Error: Apple登录失败] 
苹果出现弹窗和 FACE ID，但是显示失败：
[ERROR] 2025-08-01T17:18:29.440Z - Apple登录失败: JsonWebTokenError: jwt audience invalid. expected: com.tannibunni.dramawordmobile
```

## 🔍 问题分析

### **错误原因**
JWT audience 不匹配错误表明：
1. Apple 返回的 JWT token 中的 audience 字段
2. 与后端期望的 audience 不匹配
3. 后端期望的是：`com.tannibunni.dramawordmobile`

### **根本原因**
Render 环境变量 `APPLE_CLIENT_ID` 可能设置不正确，导致后端使用错误的 audience 验证 Apple 的 JWT token。

## ✅ 解决方案

### **步骤 1: 检查 Render 环境变量**

1. **登录 Render 控制台**
   - 访问：https://dashboard.render.com
   - 使用您的账户登录

2. **找到服务**
   - 在服务列表中找到 `dramaword-api`
   - 点击进入服务详情

3. **检查环境变量**
   - 点击 `Environment` 标签页
   - 找到 `APPLE_CLIENT_ID` 环境变量
   - 确保值为：`com.tannibunni.dramawordmobile`

4. **更新环境变量**
   - 如果值不正确，点击编辑
   - 将值更新为：`com.tannibunni.dramawordmobile`
   - 保存更改

### **步骤 2: 重新部署后端服务**

1. **自动重新部署**
   - 推送代码到 Git 仓库
   - Render 会自动重新部署

2. **手动重新部署**
   - 在 Render 控制台中点击 `Manual Deploy`
   - 选择 `Deploy latest commit`

### **步骤 3: 验证修复**

1. **等待部署完成**
   - 查看部署日志确认成功

2. **测试 Apple 登录**
   - 重新启动应用
   - 测试 Apple 登录功能
   - 检查是否还有错误

## 🔧 配置检查清单

### **✅ 已确认正确的配置**

1. **iOS Bundle ID**
   - 文件：`apps/mobile/app.json`
   - 值：`com.tannibunni.dramawordmobile`

2. **后端默认配置**
   - 文件：`services/api/src/config/apple.ts`
   - 默认值：`com.tannibunni.dramawordmobile`

3. **环境变量模板**
   - 文件：`services/api/env.template`
   - 值：`com.tannibunni.dramawordmobile`

### **⚠️ 需要检查的配置**

1. **Render 环境变量**
   - 位置：Render 控制台
   - 变量：`APPLE_CLIENT_ID`
   - 期望值：`com.tannibunni.dramawordmobile`

2. **Apple Developer Console**
   - App ID：`com.tannibunni.dramawordmobile`
   - Sign In with Apple：已启用

## 🧪 测试验证

### **自动化测试**
运行以下脚本验证配置：
```bash
# 检查配置
node scripts/fix-apple-login-config.js

# 测试后端连接
node scripts/test-apple-login-debug.js
```

### **手动测试步骤**
1. 启动应用
2. 进入 Profile 页面
3. 点击"登录"按钮
4. 选择"使用 Apple 登录"
5. 完成 Face ID/Touch ID 验证
6. 检查是否成功登录

## 📋 故障排除

### **如果问题仍然存在**

1. **检查 Apple Developer Console**
   - 确认 App ID 配置正确
   - 确认 Sign In with Apple 功能已启用
   - 检查 Services ID 配置

2. **检查应用配置**
   - 确认 `app.json` 中的 `bundleIdentifier` 正确
   - 确认 Apple 登录权限已配置
   - 重新构建应用

3. **检查后端日志**
   - 查看 Render 服务日志
   - 确认环境变量已正确加载
   - 检查 JWT 验证过程

### **常见问题**

1. **环境变量未生效**
   - 确保重新部署了后端服务
   - 检查环境变量名称是否正确
   - 确认没有多余的空格

2. **Apple 配置问题**
   - 确认 Apple Developer 账户有效
   - 检查 App ID 是否在正确的团队下
   - 确认 Sign In with Apple 功能已启用

3. **网络问题**
   - 检查后端服务是否正常运行
   - 确认网络连接正常
   - 检查防火墙设置

## 🎯 预期结果

修复成功后：
- ✅ Apple 登录不再出现 JWT audience 错误
- ✅ 用户可以正常使用 Face ID/Touch ID 登录
- ✅ 登录后用户信息正确显示
- ✅ 登录状态正确保存

## 📞 技术支持

如果按照以上步骤仍然无法解决问题，请：

1. **收集错误信息**
   - 完整的错误日志
   - 后端服务日志
   - 应用端日志

2. **检查配置状态**
   - 运行配置检查脚本
   - 确认所有配置项正确

3. **联系开发团队**
   - 提供详细的错误信息
   - 说明已尝试的解决步骤

---

**最后更新**: 2025-08-01
**状态**: 待修复
**优先级**: 高 