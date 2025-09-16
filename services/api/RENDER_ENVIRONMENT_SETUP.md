# 🚀 Render环境变量配置指南

## 📋 问题诊断

当前Render部署失败的原因：
- ❌ `MONGODB_URI` 未设置
- ❌ `JWT_SECRET` 未设置  
- ❌ `OPENAI_API_KEY` 未设置

## 🔧 解决方案

### 步骤1：登录Render控制台
1. 访问 [Render Dashboard](https://dashboard.render.com/)
2. 找到你的 `dramawordv2` 服务
3. 点击进入服务详情页

### 步骤2：配置环境变量
在服务设置中找到 "Environment" 部分，添加以下环境变量：

#### 必需环境变量：
```bash
# MongoDB连接字符串
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dramaword?retryWrites=true&w=majority

# JWT密钥 (生成一个随机字符串)
JWT_SECRET=your-super-secret-jwt-key-here

# OpenAI API密钥
OPENAI_API_KEY=sk-your-openai-api-key-here
```

#### 可选环境变量：
```bash
# Redis连接字符串 (如果使用Redis)
REDIS_URL=redis://username:password@host:port/db

# 环境类型
NODE_ENV=production

# 端口号 (Render会自动设置)
PORT=3001
```

### 步骤3：获取MongoDB URI
1. 登录 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 选择你的集群
3. 点击 "Connect" 按钮
4. 选择 "Connect your application"
5. 复制连接字符串
6. 替换 `<username>` 和 `<password>` 为实际的数据库用户凭据

### 步骤4：生成JWT密钥
```bash
# 在本地运行以下命令生成随机密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 步骤5：获取OpenAI API密钥
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 登录你的账户
3. 进入 "API Keys" 页面
4. 创建新的API密钥
5. 复制密钥值

## 🔍 验证配置

### 检查环境变量是否设置正确：
1. 在Render控制台查看 "Environment" 部分
2. 确认所有必需变量都已设置
3. 检查变量值是否正确（注意不要有多余的空格）

### 重新部署服务：
1. 保存环境变量设置
2. 手动触发重新部署
3. 查看部署日志确认连接成功

## 🚨 常见问题

### 问题1：MongoDB连接失败
**错误信息**: `Could not connect to any servers in your MongoDB Atlas cluster`

**解决方案**:
1. 检查MongoDB Atlas IP白名单
2. 添加 `0.0.0.0/0` 到白名单（允许所有IP）
3. 确认数据库用户有正确的权限

### 问题2：JWT密钥错误
**错误信息**: `JWT_SECRET is required`

**解决方案**:
1. 确保JWT_SECRET已设置
2. 使用足够长的随机字符串
3. 不要使用默认值或简单密码

### 问题3：OpenAI API错误
**错误信息**: `OpenAI API key is required`

**解决方案**:
1. 确保OPENAI_API_KEY已设置
2. 检查API密钥是否有效
3. 确认账户有足够的额度

## 📊 部署后验证

### 检查服务状态：
```bash
curl https://dramawordv2.onrender.com/health
```

### 检查邀请码API：
```bash
curl -X POST https://dramawordv2.onrender.com/api/invite/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"DWMFN05BRN5PN9S0"}'
```

## 🎉 完成后的效果

配置完成后，你应该看到：
- ✅ MongoDB连接成功
- ✅ 服务正常启动
- ✅ 邀请码API可以正常访问
- ✅ 前端可以正常使用邀请码功能

## 📞 需要帮助？

如果遇到问题，请检查：
1. Render服务日志
2. MongoDB Atlas连接状态
3. 环境变量设置
4. 网络连接状态
