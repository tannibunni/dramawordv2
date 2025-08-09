#!/bin/bash

echo "🔧 修复 require 导入为 import 导入..."

# 修复各个文件的 require 导入
echo "📝 修复 NotificationManager.tsx..."
sed -i '' 's/const { t } = require.*constants\/translations.*;/import { t } from '\''..\/..\/constants\/translations'\'';/' apps/mobile/src/components/common/NotificationManager.tsx

echo "📝 修复 SwipeableWordCard.tsx..."
sed -i '' 's/const { t } = require.*constants\/translations.*;/import { t } from '\''..\/..\/constants\/translations'\'';/' apps/mobile/src/components/cards/SwipeableWordCard.tsx

echo "📝 修复 WordbookEditModal.tsx..."
sed -i '' 's/const { t } = require.*constants\/translations.*;/import { t } from '\''..\/..\/constants\/translations'\'';/' apps/mobile/src/components/wordbook/WordbookEditModal.tsx

echo "📝 修复 ShowsScreen.tsx..."
sed -i '' 's/const { t } = require.*constants\/translations.*;/import { t } from '\''..\/..\/constants\/translations'\'';/' apps/mobile/src/screens/Shows/ShowsScreen.tsx

echo "📝 修复 notificationService.ts..."
sed -i '' 's/const { t } = require.*constants\/translations.*;/import { t } from '\''..\/constants\/translations'\'';/' apps/mobile/src/services/notificationService.ts

echo "✅ require 导入修复完成！"
