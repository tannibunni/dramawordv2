#!/bin/bash

# 开发环境支付测试构建脚本
echo "🧪 开始构建开发环境支付测试版本..."

# 检查EAS CLI
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI 未安装，请先安装: npm install -g @expo/eas-cli"
    exit 1
fi

# 检查登录状态
if ! eas whoami &> /dev/null; then
    echo "❌ 未登录EAS，请先登录: eas login"
    exit 1
fi

# 设置环境变量
export EXPO_PUBLIC_ENVIRONMENT=development
export EXPO_PUBLIC_IAP_SANDBOX=true
export EXPO_PUBLIC_IAP_TEST_MODE=true

echo "🔧 环境配置:"
echo "  - 环境: $EXPO_PUBLIC_ENVIRONMENT"
echo "  - 沙盒模式: $EXPO_PUBLIC_IAP_SANDBOX"
echo "  - 测试模式: $EXPO_PUBLIC_IAP_TEST_MODE"

# 构建iOS开发版本
echo "🍎 构建iOS开发版本..."
eas build --platform ios --profile development --non-interactive

if [ $? -eq 0 ]; then
    echo "✅ iOS开发版本构建成功！"
else
    echo "❌ iOS开发版本构建失败"
    exit 1
fi

echo "🎉 开发环境支付测试版本构建完成！"
echo "📱 现在可以在开发环境中测试苹果支付系统了"
echo "💡 提示：使用沙盒测试账户进行支付测试"
