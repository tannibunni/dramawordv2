# 微信登录日志功能

## 概述

为微信登录功能添加了全面的日志记录系统，帮助调试和监控微信登录流程的各个环节。

## 新增的日志功能

### 1. 专门的微信日志工具 (`wechatLogger`)

**文件位置**: `apps/mobile/src/utils/wechatLogger.ts`

**功能特点**:
- 统一的日志前缀 `💬 [WeChat]`
- 支持调试模式开关
- 单例模式，全局统一管理
- 自动时间戳记录

### 2. 日志类型

#### 2.1 基本日志
- `log(message, data)` - 普通日志
- `warn(message, data)` - 警告日志  
- `error(message, data)` - 错误日志

#### 2.2 登录流程日志
- `logLoginStart(context)` - 记录登录流程开始
- `logLoginComplete(success, context)` - 记录登录流程完成

#### 2.3 SDK操作日志
- `logSDKOperation(operation, details)` - 记录SDK相关操作

#### 2.4 回调处理日志
- `logCallback(url, success, details)` - 记录微信回调处理

#### 2.5 错误日志
- `logError(error, context)` - 详细记录错误信息，包括：
  - 错误类型
  - 错误消息
  - 错误堆栈
  - 错误代码
  - 错误原因

#### 2.6 性能监控日志
- `logPerformance(operation, startTime, endTime)` - 记录操作耗时

#### 2.7 用户数据日志
- `logUserData(userData, context)` - 记录用户数据信息

#### 2.8 网络请求日志
- `logNetworkRequest(url, method, data)` - 记录网络请求
- `logNetworkResponse(response, duration)` - 记录网络响应

#### 2.9 设备信息日志
- `logDeviceInfo(deviceInfo)` - 记录设备信息

#### 2.10 配置信息日志
- `logConfig(config)` - 记录配置信息

### 3. 更新的文件

#### 3.1 登录界面 (`LoginScreen.tsx`)
- 添加了详细的微信登录流程日志
- 记录按钮点击事件
- 记录回调处理过程
- 记录错误处理和用户提示

#### 3.2 微信服务 (`WechatService.ts`)
- 使用新的日志工具替换原有日志
- 记录完整的登录流程
- 记录SDK操作
- 记录网络请求和响应
- 记录性能数据

#### 3.3 登录按钮组件 (`LoginButton.tsx`)
- 记录按钮初始化
- 记录按钮点击事件

### 4. 日志示例

#### 4.1 登录流程开始
```
💬 [WeChat] ===== 微信登录流程开始 =====
💬 [WeChat] 时间戳: 2025-08-02T16:04:13.382Z
💬 [WeChat] 上下文: performLogin
```

#### 4.2 SDK操作
```
💬 [WeChat] SDK操作: 注册微信应用
💬 [WeChat] 详情: { step: 1 }
💬 [WeChat] SDK操作: 注册结果
💬 [WeChat] 详情: { success: true }
```

#### 4.3 网络请求
```
💬 [WeChat] ===== 网络请求 =====
💬 [WeChat] URL: https://api.dramaword.com/wechat/login
💬 [WeChat] 方法: POST
💬 [WeChat] 数据: { code: 'auth_code_123', state: 'state_456' }
```

#### 4.4 错误记录
```
💬 [WeChat] ===== 微信登录错误 =====
💬 [WeChat] 上下文: performLogin
💬 [WeChat] 错误类型: Error
💬 [WeChat] 错误消息: 微信SDK初始化失败
💬 [WeChat] 错误堆栈: Error: 微信SDK初始化失败...
💬 [WeChat] 错误详情: { name: 'Error', code: undefined, cause: undefined }
```

#### 4.5 性能监控
```
💬 [WeChat] 性能: 微信登录流程
💬 [WeChat] 耗时: 2345ms
💬 [WeChat] 开始时间: 2025-08-02T16:04:13.382Z
💬 [WeChat] 结束时间: 2025-08-02T16:04:15.727Z
```

### 5. 调试模式控制

```typescript
// 关闭调试模式（生产环境）
wechatLogger.setDebugMode(false);

// 开启调试模式（开发环境）
wechatLogger.setDebugMode(true);

// 检查当前模式
const isDebug = wechatLogger.getDebugMode();
```

### 6. 测试脚本

**文件位置**: `scripts/test-wechat-logging.js`

**功能**:
- 测试所有日志功能
- 验证日志格式
- 测试调试模式控制
- 模拟各种登录场景

**运行方式**:
```bash
node scripts/test-wechat-logging.js
```

### 7. 使用建议

#### 7.1 开发环境
- 保持调试模式开启
- 关注性能日志，优化慢操作
- 详细记录错误信息

#### 7.2 生产环境
- 关闭调试模式减少日志输出
- 保留关键错误日志
- 监控性能指标

#### 7.3 问题排查
1. 查看登录流程开始日志
2. 检查SDK操作是否成功
3. 验证网络请求和响应
4. 分析错误详情和堆栈
5. 检查性能瓶颈

### 8. 日志级别

- **INFO**: 正常流程日志
- **WARN**: 警告信息
- **ERROR**: 错误信息
- **PERFORMANCE**: 性能监控
- **DEBUG**: 调试信息

### 9. 注意事项

1. 日志中包含敏感信息时要注意脱敏
2. 生产环境建议关闭详细日志
3. 定期清理日志文件
4. 监控日志文件大小
5. 重要错误要及时告警

## 总结

通过添加全面的日志功能，我们能够：
- 快速定位微信登录问题
- 监控登录性能
- 追踪用户行为
- 优化用户体验
- 提高系统稳定性

这些日志功能将大大提升微信登录功能的可维护性和可调试性。 