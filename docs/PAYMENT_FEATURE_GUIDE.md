# 支付功能集成指南

## 📱 功能概述

剧词记应用现已集成微信支付和支付宝支付功能，用户可以通过以下方式订阅会员：

- **月度订阅**: ¥9.9/月
- **年度订阅**: ¥88/年  
- **终身买断**: ¥99

## 🏗️ 技术架构

### 后端架构
```
services/api/src/
├── models/Payment.ts          # 支付数据模型
├── services/paymentService.ts # 支付业务逻辑
├── controllers/paymentController.ts # 支付API控制器
└── routes/payment.ts          # 支付API路由
```

### 前端架构
```
apps/mobile/src/
├── services/paymentService.ts # 前端支付服务
└── screens/Profile/SubscriptionScreen.tsx # 订阅页面
```

## 🔧 配置说明

### 1. 环境变量配置

在 `services/api/.env` 中添加以下配置：

```bash
# 微信支付配置
WECHAT_PAY_MCH_ID=your_merchant_id
WECHAT_PAY_KEY=your_api_key
WECHAT_PAY_CERT_PATH=path/to/cert.pem
WECHAT_PAY_KEY_PATH=path/to/key.pem

# 支付宝配置
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=alipay_public_key
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
```

### 2. 微信支付配置

#### 微信开放平台设置
1. 登录微信开放平台
2. 创建移动应用
3. 配置Bundle ID: `com.tannibunni.dramawordmobile`
4. 配置Universal Links: `https://dramaword.com/app/`
5. 获取AppID和AppSecret

#### 微信支付商户号设置
1. 申请微信支付商户号
2. 配置支付回调地址: `https://your-api-domain.com/api/payment/callback/wechat`
3. 下载API证书文件

### 3. 支付宝配置

#### 支付宝开放平台设置
1. 登录支付宝开放平台
2. 创建移动应用
3. 配置Bundle ID: `com.tannibunni.dramawordmobile`
4. 获取AppID和密钥

#### 支付宝商户号设置
1. 申请支付宝商户号
2. 配置支付回调地址: `https://your-api-domain.com/api/payment/callback/alipay`
3. 配置RSA密钥对

## 📋 API接口说明

### 1. 创建支付订单
```
POST /api/payment/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "subscriptionType": "monthly|yearly|lifetime",
  "paymentMethod": "wechat|alipay"
}
```

### 2. 查询支付状态
```
GET /api/payment/status/:orderId
Authorization: Bearer <token>
```

### 3. 获取支付历史
```
GET /api/payment/history
Authorization: Bearer <token>
```

### 4. 支付回调
```
POST /api/payment/callback/wechat
POST /api/payment/callback/alipay
```

## 🎯 使用流程

### 用户支付流程
1. 用户在订阅页面选择套餐
2. 选择支付方式（微信支付/支付宝）
3. 点击"立即支付"按钮
4. 调用后端创建支付订单
5. 跳转到对应的支付SDK
6. 用户完成支付
7. 支付回调更新订单状态
8. 更新用户订阅信息

### 开发测试流程
1. 启动后端API服务
2. 启动前端应用
3. 登录用户账号
4. 进入订阅页面
5. 选择套餐和支付方式
6. 测试支付流程（目前为模拟支付）

## 🔒 安全考虑

### 1. 数据安全
- 所有敏感信息通过环境变量配置
- 支付密钥不在代码中硬编码
- 使用HTTPS传输所有支付数据

### 2. 订单安全
- 生成唯一订单ID防止重复支付
- 验证支付回调签名
- 检查订单状态防止重复处理

### 3. 用户安全
- 验证用户身份和权限
- 记录支付日志便于审计
- 异常情况及时告警

## 🚀 部署说明

### 1. 后端部署
```bash
# 在Render.com或其他平台部署
cd services/api
npm install
npm start
```

### 2. 前端部署
```bash
# 构建iOS应用
cd apps/mobile
eas build --platform ios --profile production
```

### 3. 环境配置
确保生产环境配置了正确的：
- 微信支付商户号和证书
- 支付宝商户号和密钥
- 支付回调地址
- HTTPS证书

## 🐛 常见问题

### 1. 支付失败
- 检查商户号配置是否正确
- 验证API密钥是否有效
- 确认回调地址是否可访问

### 2. 订单状态异常
- 检查数据库连接
- 验证支付回调处理逻辑
- 查看服务器日志

### 3. 用户订阅未更新
- 检查用户模型中的订阅字段
- 验证支付成功后的更新逻辑
- 确认数据库事务处理

## 📞 技术支持

如遇到支付相关问题，请：
1. 查看服务器日志
2. 检查支付平台文档
3. 联系技术支持团队

---

**注意**: 当前版本为开发测试版本，支付功能为模拟实现。生产环境需要配置真实的支付商户号和证书。 