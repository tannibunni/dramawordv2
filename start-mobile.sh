#!/bin/bash

echo "🚀 启动剧词记移动端应用..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 进入移动端目录
cd apps/mobile

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 清理缓存
echo "🧹 清理缓存..."
rm -rf .expo
rm -rf node_modules/.cache

# 启动开发服务器
echo "🎯 启动Expo开发服务器..."
echo "📱 使用Expo Go扫描二维码，或在模拟器中运行"
echo ""

npx expo start --clear 