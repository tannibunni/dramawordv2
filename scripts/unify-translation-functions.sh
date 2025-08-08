#!/bin/bash

# 翻译函数统一脚本
# 将所有的 translationService.translate 和 require('../../constants/translations') 统一为 t 函数

echo "🔧 开始统一翻译函数调用..."

# 1. 替换 translationService.translate 为 t 函数调用
echo "📝 步骤1: 替换 translationService.translate 调用..."

# 基本调用替换
find apps/mobile/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "translationService\.translate" | while read file; do
    echo "处理文件: $file"
    # 替换基本调用
    sed -i '' "s/translationService\.translate('\([^']*\)')/t('\1', appLanguage)/g" "$file"
    # 替换带参数的调用
    sed -i '' "s/translationService\.translate('\([^']*\)', { \([^}]*\) })/t('\1', appLanguage, { \2 })/g" "$file"
    # 替换带变量的调用
    sed -i '' "s/translationService\.translate(\([^,]*\), { \([^}]*\) })/t(\1, appLanguage, { \2 })/g" "$file"
done

# 2. 替换 require 导入为 import 导入
echo "📝 步骤2: 替换 require 导入为 import 导入..."

find apps/mobile/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "require.*constants/translations" | while read file; do
    echo "处理文件: $file"
    # 替换 require 导入
    sed -i '' "s/const { t } = require('.*constants/translations');/import { t } from '..\/..\/constants\/translations';/g" "$file"
    sed -i '' "s/const { t } = require('.*constants/translations');/import { t } from '..\/..\/..\/constants\/translations';/g" "$file"
    sed -i '' "s/const { t } = require('.*constants/translations');/import { t } from '..\/..\/..\/..\/constants\/translations';/g" "$file"
done

# 3. 移除不必要的 translationService.setLanguage 调用
echo "📝 步骤3: 移除不必要的 setLanguage 调用..."

find apps/mobile/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "translationService\.setLanguage" | while read file; do
    echo "处理文件: $file"
    # 替换 setLanguage 调用为注释
    sed -i '' "s/translationService\.setLanguage(appLanguage);/\/\/ 翻译函数会自动使用当前语言，无需手动设置/g" "$file"
done

# 4. 移除 translationService 的导入
echo "📝 步骤4: 移除 translationService 导入..."

find apps/mobile/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "import.*translationService" | while read file; do
    echo "处理文件: $file"
    # 移除 translationService 导入
    sed -i '' "/import.*translationService.*from.*constants\/translations/d" "$file"
done

echo "✅ 翻译函数统一完成！"
echo "📊 检查结果..."

# 检查是否还有遗漏的 translationService 使用
echo "🔍 检查剩余的 translationService 使用:"
find apps/mobile/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "translationService" || echo "✅ 没有发现剩余的 translationService 使用"

# 检查 t 函数的使用
echo "🔍 检查 t 函数的使用:"
find apps/mobile/src -name "*.tsx" -o -name "*.ts" | xargs grep -c "t(" | head -10
