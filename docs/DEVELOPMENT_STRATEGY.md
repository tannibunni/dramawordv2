# 开发策略指南

## 🎯 开发环境策略

### 为什么使用生产环境URL开发？

1. **及早发现问题** - 生产环境的问题在开发阶段就能发现
2. **避免部署后的问题** - 不会在用户使用时才发现问题
3. **真实的测试环境** - 更接近用户实际使用场景
4. **减少调试时间** - 避免在开发和生产环境之间切换调试

### 当前配置

#### 前端配置
```typescript
// apps/mobile/src/constants/config.ts
export const API_BASE_URL = 'https://dramawordv2.onrender.com/api';
```

#### 后端配置
```typescript
// services/api/src/utils/urlHelper.ts
export const getApiBaseUrl = (): string => {
  let baseUrl = process.env.API_BASE_URL;
  
  // 强制使用生产环境URL
  if (!baseUrl) {
    baseUrl = 'https://dramawordv2.onrender.com';
  }
  
  return baseUrl;
};
```

### 环境变量配置

#### 开发环境 (.env)
```bash
NODE_ENV=development
PORT=3001
API_BASE_URL=https://dramawordv2.onrender.com
```

#### 生产环境 (Render)
```bash
NODE_ENV=production
PORT=3001
API_BASE_URL=https://dramawordv2.onrender.com
```

## 🚀 开发流程

### 1. 本地开发
- 前端: 使用Expo开发工具
- 后端: 本地运行，但API_BASE_URL指向生产环境
- 数据库: 使用生产环境数据库

### 2. 测试
- 所有测试都在生产环境URL下进行
- 确保功能在生产环境中正常工作

### 3. 部署
- 推送到GitHub自动部署到Render
- 无需修改任何URL配置

## 📋 优势

### ✅ 优点
- **一致性** - 开发和生产环境完全一致
- **及早发现问题** - 网络、权限、配置等问题提前发现
- **真实测试** - 使用真实的云服务进行测试
- **简化部署** - 无需修改任何配置即可部署

### ⚠️ 注意事项
- **网络依赖** - 开发时需要网络连接
- **数据安全** - 开发时使用生产数据库，需要小心操作
- **成本考虑** - 云服务可能产生费用

## 🔧 故障排除

### 常见问题

1. **网络连接问题**
   ```bash
   # 检查网络连接
   curl https://dramawordv2.onrender.com/health
   ```

2. **环境变量问题**
   ```bash
   # 检查环境变量
   echo $API_BASE_URL
   ```

3. **数据库连接问题**
   ```bash
   # 检查数据库连接
   npm run check-database
   ```

## 📚 相关文档

- [部署指南](./DEPLOYMENT.md)
- [环境配置](./ENVIRONMENT.md)
- [故障排除](./TROUBLESHOOTING.md) 