#!/bin/bash

# 翻译函数统一替换脚本
# 将 translationService.translate 替换为 t 函数调用

echo "🔧 开始统一翻译函数调用..."

# 替换 ReviewIntroScreen.tsx 中的翻译函数调用
echo "📝 处理 ReviewIntroScreen.tsx..."
sed -i '' "s/translationService\.translate('\([^']*\)')/t('\1', appLanguage)/g" apps/mobile/src/screens/Review/ReviewIntroScreen.tsx
sed -i '' "s/translationService\.translate('\([^']*\)', { \([^}]*\) })/t('\1', appLanguage, { \2 })/g" apps/mobile/src/screens/Review/ReviewIntroScreen.tsx

# 替换 ReviewScreen.tsx 中的翻译函数调用
echo "📝 处理 ReviewScreen.tsx..."
sed -i '' "s/translationService\.translate('\([^']*\)')/t('\1', appLanguage)/g" apps/mobile/src/screens/Review/ReviewScreen.tsx
sed -i '' "s/translationService\.translate('\([^']*\)', { \([^}]*\) })/t('\1', appLanguage, { \2 })/g" apps/mobile/src/screens/Review/ReviewScreen.tsx

# 替换其他可能使用 translationService.translate 的文件
echo "📝 处理其他文件..."
find apps/mobile/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "translationService\.translate" | while read file; do
    echo "处理文件: $file"
    sed -i '' "s/translationService\.translate('\([^']*\)')/t('\1', appLanguage)/g" "$file"
    sed -i '' "s/translationService\.translate('\([^']*\)', { \([^}]*\) })/t('\1', appLanguage, { \2 })/g" "$file"
done

echo "✅ 翻译函数统一替换完成！"
