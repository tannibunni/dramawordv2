# 剧词记 API 部署指南

## Render 部署步骤

### 1. 准备工作
- ✅ 代码已推送到 GitHub
- ✅ Dockerfile 已创建
- ✅ render.yaml 配置文件已创建
- ✅ MongoDB Atlas 云数据库已配置
- ✅ 环境变量模板已准备

### 2. Render 部署步骤

#### 2.1 登录 Render
1. 访问 [Render Dashboard](https://dashboard.render.com/)
2. 使用 GitHub 账号登录

#### 2.2 创建新服务
1. 点击 "New +" 按钮
2. 选择 "Web Service"
3. 连接 GitHub 仓库：`tannibunni/dramawordv2`

#### 2.3 配置服务
- **Name**: `dramaword-api`
- **Environment**: `Node`
- **Region**: `Singapore (Asia)`
- **Branch**: `main`
- **Root Directory**: `services/api`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### 2.4 环境变量配置
在 Render Dashboard 中添加以下环境变量：

```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://dramaword:your_password@cluster0.mongodb.net/dramaword?retryWrites=true&w=majority
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret_key
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY=your_apple_private_key
TMDB_API_KEY=your_tmdb_api_key
```

#### 2.5 高级设置
- **Health Check Path**: `/health`
- **Auto-Deploy**: 启用
- **Plan**: Starter (免费)

### 3. 部署验证

#### 3.1 健康检查
```bash
curl https://your-app-name.onrender.com/health
```

#### 3.2 API 测试
```bash
# TMDB API 测试
curl "https://your-app-name.onrender.com/api/tmdb/search?query=Friends"

# 用户注册测试
curl -X POST https://your-app-name.onrender.com/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "nickname": "测试用户",
    "loginType": "guest",
    "guestId": "test-guest-id"
  }'
```

### 4. 域名配置
- Render 会自动分配域名：`https://your-app-name.onrender.com`
- 可以配置自定义域名（需要付费计划）

### 5. 监控和日志
- 在 Render Dashboard 查看部署日志
- 监控服务状态和性能
- 设置告警通知

### 6. 故障排除

#### 常见问题
1. **构建失败**
   - 检查 package.json 中的依赖
   - 确认 TypeScript 编译配置

2. **数据库连接失败**
   - 验证 MONGODB_URI 格式
   - 检查 Atlas 网络访问设置

3. **环境变量缺失**
   - 确认所有必需的环境变量已设置
   - 检查变量名拼写

4. **端口冲突**
   - 确保使用 PORT 环境变量
   - 检查 start 命令配置

### 7. 更新部署
- 推送代码到 GitHub main 分支
- Render 会自动触发重新部署
- 或手动触发部署

### 8. 回滚
- 在 Render Dashboard 中选择之前的部署版本
- 点击 "Promote" 回滚到该版本

## 部署检查清单

- [ ] GitHub 仓库连接成功
- [ ] 构建命令执行成功
- [ ] 所有环境变量已配置
- [ ] 健康检查通过
- [ ] API 端点响应正常
- [ ] 数据库连接成功
- [ ] 日志输出正常
- [ ] 性能监控正常

## 安全注意事项

1. **环境变量安全**
   - 不要在代码中硬编码敏感信息
   - 使用 Render 的环境变量功能
   - 定期轮换 API 密钥

2. **数据库安全**
   - 使用强密码
   - 限制 IP 访问范围
   - 启用数据库审计

3. **API 安全**
   - 启用 CORS 保护
   - 实施速率限制
   - 验证请求参数

## 性能优化

1. **数据库优化**
   - 创建适当的索引
   - 优化查询语句
   - 使用连接池

2. **应用优化**
   - 启用压缩
   - 缓存静态资源
   - 优化 TypeScript 编译

3. **监控优化**
   - 设置性能指标
   - 监控错误率
   - 跟踪响应时间 