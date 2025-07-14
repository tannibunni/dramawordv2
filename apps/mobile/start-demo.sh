#!/bin/bash

echo "🚀 启动剧词记移动端应用..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 apps/mobile 目录下运行此脚本"
    exit 1
fi

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动开发服务器
echo "🔥 启动 Expo 开发服务器..."
echo ""
echo "📱 预览方式："
echo "1. 使用 Expo Go 应用扫描二维码"
echo "2. 按 'i' 启动 iOS 模拟器"
echo "3. 按 'a' 启动 Android 模拟器"
echo "4. 按 'w' 在浏览器中打开"
echo "5. 按 'r' 重新加载应用"
echo "6. 按 'q' 退出"
echo ""

npx expo start 