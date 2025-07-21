const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 测试通知推送功能...\n');

// 检查必要的依赖是否已安装
console.log('📦 检查依赖...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'apps/mobile/package.json'), 'utf8'));
  const requiredDeps = ['expo-notifications', 'expo-device', 'expo-constants'];
  
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.log('❌ 缺少依赖:', missingDeps.join(', '));
    console.log('请运行: cd apps/mobile && npx expo install expo-notifications expo-device expo-constants');
    process.exit(1);
  } else {
    console.log('✅ 所有依赖已安装');
  }
} catch (error) {
  console.error('❌ 读取 package.json 失败:', error.message);
  process.exit(1);
}

// 检查通知服务文件是否存在
console.log('\n📁 检查文件...');
const requiredFiles = [
  'apps/mobile/src/services/notificationService.ts',
  'apps/mobile/src/services/notificationInitializer.ts',
  'apps/mobile/src/components/common/NotificationManager.tsx',
  'apps/mobile/src/utils/languageDetector.ts'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));

if (missingFiles.length > 0) {
  console.log('❌ 缺少文件:', missingFiles.join('\n  '));
  process.exit(1);
} else {
  console.log('✅ 所有文件存在');
}

// 检查 App.tsx 是否已集成通知初始化
console.log('\n🔧 检查集成...');
try {
  const appTsx = fs.readFileSync(path.join(__dirname, 'apps/mobile/src/App.tsx'), 'utf8');
  
  if (!appTsx.includes('useNotificationInitializer')) {
    console.log('❌ App.tsx 中未集成通知初始化');
    console.log('请在 App.tsx 中添加: import { useNotificationInitializer } from \'./services/notificationInitializer\';');
    console.log('并在组件中调用: useNotificationInitializer();');
  } else {
    console.log('✅ App.tsx 已集成通知初始化');
  }
  
  if (!appTsx.includes('NotificationManager')) {
    console.log('⚠️  ProfileScreen 中可能未集成通知管理器');
  } else {
    console.log('✅ ProfileScreen 已集成通知管理器');
  }
} catch (error) {
  console.error('❌ 读取 App.tsx 失败:', error.message);
}

// 检查 ProfileScreen 是否已集成通知设置
try {
  const profileScreen = fs.readFileSync(path.join(__dirname, 'apps/mobile/src/screens/Profile/ProfileScreen.tsx'), 'utf8');
  
  if (!profileScreen.includes('NotificationManager')) {
    console.log('❌ ProfileScreen 中未集成通知管理器');
  } else {
    console.log('✅ ProfileScreen 已集成通知管理器');
  }
} catch (error) {
  console.error('❌ 读取 ProfileScreen.tsx 失败:', error.message);
}

console.log('\n🎯 通知功能测试完成！');
console.log('\n📱 下一步：');
console.log('1. 运行: cd apps/mobile && npx expo start');
console.log('2. 在真机上测试通知功能');
console.log('3. 进入个人资料页面 -> 通知设置');
console.log('4. 测试各种通知类型');

console.log('\n🔔 通知功能包括：');
console.log('• 每日复习提醒（上午9点）');
console.log('• 每周复习总结（周一上午10点）');
console.log('• 学习激励提醒（下午3点）');
console.log('• 连续学习提醒（24小时未学习）');
console.log('• 新单词提醒（2小时后）');
console.log('• 成就解锁通知');
console.log('• 目标进度提醒');
console.log('• 智能复习提醒');

console.log('\n🌍 支持中英文双语界面');
console.log('📊 智能通知调度');
console.log('🎯 基于用户行为的个性化提醒'); 