#!/bin/bash

echo "🎉 翻译函数统一完成！"
echo "=================================="
echo ""
echo "📊 统一结果统计："
echo ""

# 检查 t 函数的使用情况
echo "🔍 t 函数使用统计："
find apps/mobile/src -name "*.tsx" -o -name "*.ts" | xargs grep -c "t(" | sort -t: -k2 -nr | head -10

echo ""
echo "🔍 检查是否还有 translationService 使用："
find apps/mobile/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "translationService" | grep -v "constants/translations.ts" || echo "✅ 没有发现剩余的 translationService 使用"

echo ""
echo "🔍 检查是否还有 require 导入："
find apps/mobile/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "require.*translations" || echo "✅ 没有发现剩余的 require 导入"

echo ""
echo "✅ 翻译函数统一完成！"
echo "📝 主要更改："
echo "  1. 将 translationService.translate 替换为 t 函数"
echo "  2. 统一参数顺序：t(key, appLanguage, params?)"
echo "  3. 移除不必要的 setLanguage 调用"
echo "  4. 修复所有 import 语句位置"
echo "  5. 处理类型兼容性问题"
