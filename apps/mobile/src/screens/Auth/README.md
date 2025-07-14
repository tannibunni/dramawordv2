# 剧词记登录页面

## 📱 功能特性

### 支持的登录方式
1. **手机号登录** - 短信验证码登录流程
2. **微信登录** - OAuth 第三方登录
3. **Apple 登录** - iOS 设备原生登录
4. **游客登录** - 无需注册，直接体验

### UI 设计特点
- 遵循剧词记设计系统
- 大圆角按钮设计
- 语义化色彩搭配
- 响应式布局
- 流畅的动画效果

## 🧩 组件结构

```
src/screens/Auth/
├── LoginScreen.tsx          # 主登录页面
├── AuthDemo.tsx            # 演示页面
└── README.md              # 说明文档

src/components/auth/
├── LoginButton.tsx         # 登录按钮组件
└── PhoneLoginModal.tsx     # 手机号登录模态框

src/services/
└── authService.ts          # 认证服务

src/types/
└── auth.ts                # 认证相关类型定义
```

## 🚀 快速开始

### 1. 基本使用

```tsx
import { LoginScreen } from './src/screens/Auth/LoginScreen';

const App = () => {
  const handleLoginSuccess = (userData) => {
    console.log('登录成功:', userData);
    // 处理登录成功逻辑
  };

  const handleGuestLogin = () => {
    console.log('游客登录');
    // 处理游客登录逻辑
  };

  return (
    <LoginScreen
      onLoginSuccess={handleLoginSuccess}
      onGuestLogin={handleGuestLogin}
    />
  );
};
```

### 2. 演示页面

```tsx
import { AuthDemo } from './src/screens/Auth/AuthDemo';

// 直接使用演示页面，包含完整的登录流程演示
<AuthDemo />
```

## 🎨 设计系统

### 颜色规范
- **主色**: `#4F6DFF` (手机号登录)
- **成功色**: `#6BCF7A` (微信登录)
- **辅助色**: `#F4B942` (游客登录)
- **错误色**: `#F76C6C` (错误状态)
- **背景色**: `#F9F9FB` (页面背景)

### 按钮样式
- **圆角**: 12px
- **内边距**: 16px 垂直，24px 水平
- **阴影**: 轻微投影效果
- **悬停**: 向上移动 1px

### 字体规范
- **标题**: Inter Semibold
- **正文**: Inter Medium
- **按钮文字**: 16px, 600 字重

## 🔧 技术实现

### 依赖项
```json
{
  "@expo/vector-icons": "^13.0.0",
  "react-native-safe-area-context": "^4.0.0"
}
```

### API 集成
目前使用模拟数据，实际使用时需要：

1. **配置 API 基础 URL**
```tsx
// authService.ts
const API_BASE_URL = 'https://your-api-domain.com/api';
```

2. **实现真实的 API 调用**
- 发送验证码
- 验证码验证
- 第三方登录
- Token 刷新

3. **集成第三方 SDK**
- 微信登录 SDK
- Apple 登录 SDK

### 状态管理
建议使用 Zustand 或 Redux 管理认证状态：

```tsx
// stores/authStore.ts
interface AuthStore {
  isAuthenticated: boolean;
  user: UserInfo | null;
  token: string | null;
  login: (data: LoginData) => void;
  logout: () => void;
}
```

## 📋 TODO 清单

### 功能完善
- [ ] 集成真实的短信验证码服务
- [ ] 实现微信登录 OAuth 流程
- [ ] 集成 Apple 登录 SDK
- [ ] 添加生物识别登录（指纹/面容）
- [ ] 实现自动登录功能

### 用户体验
- [ ] 添加登录动画效果
- [ ] 优化键盘处理
- [ ] 添加网络状态提示
- [ ] 实现离线模式支持

### 安全性
- [ ] 添加 Token 自动刷新
- [ ] 实现安全的本地存储
- [ ] 添加登录失败重试机制
- [ ] 实现设备指纹识别

## 🐛 常见问题

### Q: 如何自定义登录按钮样式？
A: 通过 `LoginButton` 组件的 `style` 和 `textStyle` 属性：

```tsx
<LoginButton
  type="phone"
  onPress={handleLogin}
  style={{ backgroundColor: '#custom-color' }}
  textStyle={{ fontSize: 18 }}
/>
```

### Q: 如何添加新的登录方式？
A: 在 `LoginButtonType` 中添加新类型，并在 `getButtonConfig` 中配置：

```tsx
export type LoginButtonType = 'phone' | 'wechat' | 'apple' | 'guest' | 'new-type';
```

### Q: 如何处理登录失败？
A: 在 `onLoginSuccess` 回调中添加错误处理：

```tsx
const handleLoginSuccess = (userData) => {
  if (userData.error) {
    // 处理登录失败
    Alert.alert('登录失败', userData.error);
  } else {
    // 处理登录成功
    console.log('登录成功:', userData);
  }
};
```

## 📞 技术支持

如有问题，请查看：
1. 设计系统文档
2. API 文档
3. 组件 Props 类型定义
4. 示例代码 