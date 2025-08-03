# 头像文件配置说明

## 📁 文件位置
所有头像文件应放在 `apps/mobile/assets/images/` 目录下。

## 🎨 需要的头像文件

### 1. 微信登录头像
- **文件名**: `wechat-avatar.png`
- **设计建议**: 微信绿色背景 (#1AAD19)，白色微信图标
- **尺寸**: 80x80 像素或更高
- **用途**: 微信登录用户的默认头像

### 2. 苹果登录头像
- **文件名**: `apple-avatar.png`
- **设计建议**: 黑色背景，白色苹果logo
- **尺寸**: 80x80 像素或更高
- **用途**: 苹果登录用户的默认头像

### 3. 手机登录头像
- **文件名**: `phone-avatar.png`
- **设计建议**: 蓝色背景 (#007AFF)，白色手机图标
- **尺寸**: 80x80 像素或更高
- **用途**: 手机登录用户的默认头像

### 4. 游客头像
- **文件名**: `guest-avatar.png`
- **设计建议**: 灰色背景，白色用户图标
- **尺寸**: 80x80 像素或更高
- **用途**: 游客用户的默认头像

## 🔧 技术说明

### 头像优先级
1. **用户自定义头像** - 如果用户上传了自定义头像，优先显示
2. **登录类型默认头像** - 根据登录类型显示对应的默认头像
3. **游客头像** - 作为最后的默认选项

### 代码实现
```typescript
const getUserAvatar = () => {
  // 如果用户有自定义头像，优先使用
  if (user?.avatar && user.avatar !== '') {
    return { uri: user.avatar };
  }

  // 根据登录类型返回不同的默认头像
  switch (loginType) {
    case 'wechat':
      return require('../../../assets/images/wechat-avatar.png');
    case 'apple':
      return require('../../../assets/images/apple-avatar.png');
    case 'phone':
      return require('../../../assets/images/phone-avatar.png');
    case 'guest':
    default:
      return require('../../../assets/images/guest-avatar.png');
  }
};
```

## 📝 添加步骤

1. **准备头像图片**
   - 使用设计工具创建符合要求的头像
   - 确保文件名完全匹配
   - 推荐使用PNG格式

2. **放入目录**
   - 将头像文件放入 `apps/mobile/assets/images/` 目录
   - 确保文件名正确（区分大小写）

3. **测试验证**
   - 重新启动应用
   - 测试不同登录类型的头像显示
   - 确认头像正确显示

## 🎯 设计规范

- **尺寸**: 80x80 像素（最小），建议 120x120 或更高
- **格式**: PNG（推荐，支持透明背景）
- **风格**: 简洁、现代、与应用整体风格一致
- **颜色**: 使用各平台的标准品牌色

## ⚠️ 注意事项

- 文件名必须完全匹配，区分大小写
- 如果文件不存在，应用会显示错误或使用备用头像
- 建议使用矢量图形设计，确保在不同尺寸下都清晰
- 头像文件大小建议控制在 100KB 以内 