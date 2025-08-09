#!/bin/bash

echo "🔧 修复 import 语句位置问题..."

# 修复 SwipeableWordCard.tsx
echo "📝 修复 SwipeableWordCard.tsx..."
sed -i '' '/import { t } from '\''..\/..\/constants\/translations'\'';/d' apps/mobile/src/components/cards/SwipeableWordCard.tsx
sed -i '' 's/import { useAppLanguage } from '\''..\/..\/context\/AppLanguageContext'\'';/import { useAppLanguage } from '\''..\/..\/context\/AppLanguageContext'\'';\nimport { t } from '\''..\/..\/constants\/translations'\'';/' apps/mobile/src/components/cards/SwipeableWordCard.tsx

# 修复 NotificationManager.tsx
echo "📝 修复 NotificationManager.tsx..."
sed -i '' '/import { t } from '\''..\/..\/constants\/translations'\'';/d' apps/mobile/src/components/common/NotificationManager.tsx
sed -i '' 's/import { useAppLanguage } from '\''..\/..\/context\/AppLanguageContext'\'';/import { useAppLanguage } from '\''..\/..\/context\/AppLanguageContext'\'';\nimport { t } from '\''..\/..\/constants\/translations'\'';/' apps/mobile/src/components/common/NotificationManager.tsx

# 修复 WordbookEditModal.tsx
echo "📝 修复 WordbookEditModal.tsx..."
sed -i '' '/import { t } from '\''..\/..\/constants\/translations'\'';/d' apps/mobile/src/components/wordbook/WordbookEditModal.tsx
sed -i '' 's/import { useAppLanguage } from '\''..\/..\/context\/AppLanguageContext'\'';/import { useAppLanguage } from '\''..\/..\/context\/AppLanguageContext'\'';\nimport { t } from '\''..\/..\/constants\/translations'\'';/' apps/mobile/src/components/wordbook/WordbookEditModal.tsx

# 修复 ShowsScreen.tsx
echo "📝 修复 ShowsScreen.tsx..."
sed -i '' '/import { t } from '\''..\/..\/constants\/translations'\'';/d' apps/mobile/src/screens/Shows/ShowsScreen.tsx
sed -i '' 's/import { useAppLanguage } from '\''..\/..\/context\/AppLanguageContext'\'';/import { useAppLanguage } from '\''..\/..\/context\/AppLanguageContext'\'';\nimport { t } from '\''..\/..\/constants\/translations'\'';/' apps/mobile/src/screens/Shows/ShowsScreen.tsx

# 修复 notificationService.ts
echo "📝 修复 notificationService.ts..."
sed -i '' '/import { t } from '\''..\/constants\/translations'\'';/d' apps/mobile/src/services/notificationService.ts
sed -i '' 's/import { AppLanguage } from '\''..\/constants\/translations'\'';/import { AppLanguage } from '\''..\/constants\/translations'\'';\nimport { t } from '\''..\/constants\/translations'\'';/' apps/mobile/src/services/notificationService.ts

echo "✅ import 语句位置修复完成！"
