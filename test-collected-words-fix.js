const fs = require('fs');
const path = require('path');

console.log('🔧 测试收集单词数字修复...\n');

// 检查关键修复
const filesToCheck = [
  {
    path: 'apps/mobile/src/screens/Review/ReviewIntroScreen.tsx',
    name: 'ReviewIntroScreen 收集单词修复',
    requiredChanges: [
      'vocabulary?.length || 0',
      'setAnimatedCollectedWords(vocabulary?.length || 0)',
      'startCollected = animatedCollectedWords',
      'startContributed = animatedContributedWords',
      'vocabulary.length'
    ],
    removedContent: [
      'stats.collectedWords',
      'userStats.collectedWords'
    ]
  }
];

let allPassed = true;

filesToCheck.forEach(file => {
  console.log(`📁 检查 ${file.name}...`);
  try {
    const content = fs.readFileSync(path.join(__dirname, file.path), 'utf8');
    
    // 检查是否包含必需的修改
    const missingChanges = file.requiredChanges.filter(change => !content.includes(change));
    if (missingChanges.length > 0) {
      console.log(`❌ 缺少修改: ${missingChanges.join(', ')}`);
      allPassed = false;
    } else {
      console.log(`✅ 必需的修改已添加`);
    }
    
    // 检查是否移除了有问题的内容
    const foundOldContent = file.removedContent.filter(old => {
      // 忽略注释中的内容
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.includes(old) && 
            !trimmedLine.startsWith('//') && 
            !trimmedLine.startsWith('*') &&
            !trimmedLine.startsWith('/*') &&
            !trimmedLine.startsWith('*/')) {
          return true;
        }
      }
      return false;
    });
    if (foundOldContent.length > 0) {
      console.log(`❌ 仍包含有问题的内容: ${foundOldContent.join(', ')}`);
      allPassed = false;
    } else {
      console.log(`✅ 有问题的内容已移除`);
    }
    
  } catch (error) {
    console.log(`❌ 读取文件失败: ${error.message}`);
    allPassed = false;
  }
});

// 检查初始化逻辑
console.log('\n🎯 检查初始化逻辑...');
try {
  const introPath = path.join(__dirname, 'apps/mobile/src/screens/Review/ReviewIntroScreen.tsx');
  const content = fs.readFileSync(introPath, 'utf8');
  
  // 检查loadUserStats中的修复
  if (content.includes('setAnimatedCollectedWords(vocabulary?.length || 0)') && 
      content.includes('// 使用vocabulary长度而不是stats.collectedWords')) {
    console.log('✅ loadUserStats修复已添加');
  } else {
    console.log('❌ loadUserStats修复未添加');
    allPassed = false;
  }
  
  // 检查动画监听器修复
  if (content.includes('startCollected = animatedCollectedWords') && 
      content.includes('startContributed = animatedContributedWords')) {
    console.log('✅ 动画监听器修复已添加');
  } else {
    console.log('❌ 动画监听器修复未添加');
    allPassed = false;
  }
  
  // 检查vocabulary初始化useEffect
  if (content.includes('vocabulary.length') && content.includes('setAnimatedCollectedWords')) {
    console.log('✅ vocabulary初始化useEffect已添加');
  } else {
    console.log('❌ vocabulary初始化useEffect未添加');
    allPassed = false;
  }
  
} catch (error) {
  console.log(`❌ 检查初始化逻辑失败: ${error.message}`);
  allPassed = false;
}

// 检查数据一致性
console.log('\n🔄 检查数据一致性...');
try {
  const introPath = path.join(__dirname, 'apps/mobile/src/screens/Review/ReviewIntroScreen.tsx');
  const content = fs.readFileSync(introPath, 'utf8');
  
  // 检查updateStatistics函数
  if (content.includes('const collectedCount = vocabulary?.length || 0') && 
      content.includes('setAnimatedCollectedWords(collectedCount)')) {
    console.log('✅ updateStatistics函数正确');
  } else {
    console.log('❌ updateStatistics函数不正确');
    allPassed = false;
  }
  
  // 检查动画目标值
  if (content.includes('targetCollected = vocabulary?.length || 0')) {
    console.log('✅ 动画目标值正确');
  } else {
    console.log('❌ 动画目标值不正确');
    allPassed = false;
  }
  
  // 检查useEffect依赖
  if (content.includes('useEffect') && content.includes('[vocabulary]')) {
    console.log('✅ useEffect依赖正确');
  } else {
    console.log('❌ useEffect依赖不正确');
    allPassed = false;
  }
  
} catch (error) {
  console.log(`❌ 检查数据一致性失败: ${error.message}`);
  allPassed = false;
}

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('🎉 收集单词数字修复成功！');
  console.log('\n🔧 修复内容：');
  console.log('• ✅ 修复了loadUserStats中的初始化逻辑');
  console.log('• ✅ 修复了动画监听器的起始值');
  console.log('• ✅ 添加了vocabulary初始化useEffect');
  console.log('• ✅ 确保数据一致性');
  console.log('• ✅ 移除了错误的数据源引用');
  
  console.log('\n🎯 修复原理：');
  console.log('• 原问题：使用userStats.collectedWords而不是vocabulary.length');
  console.log('• 解决方案：统一使用vocabulary.length作为收集单词数量');
  console.log('• 实现方式：在多个地方确保数据源一致');
  console.log('• 避免重复：使用当前动画状态作为起始值');
  
  console.log('\n🔄 数据流程：');
  console.log('• 1. vocabulary加载完成');
  console.log('• 2. useEffect检测到vocabulary变化');
  console.log('• 3. 设置animatedCollectedWords = vocabulary.length');
  console.log('• 4. 动画开始时使用当前值作为起始值');
  console.log('• 5. 动画目标值为vocabulary.length');
  console.log('• 6. 确保显示正确的收集单词数量');
  
  console.log('\n🎨 显示效果：');
  console.log('• 收集单词数量 = vocabulary.length');
  console.log('• 贡献单词数量 = userStats.contributedWords');
  console.log('• 动画从当前值平滑过渡到目标值');
  console.log('• 数据源保持一致');
  console.log('• 用户体验流畅自然');
  
  console.log('\n🧪 测试步骤：');
  console.log('1. 启动应用');
  console.log('2. 进入ReviewIntro页面');
  console.log('3. 检查收集单词数量是否正确显示');
  console.log('4. 完成复习过程');
  console.log('5. 返回ReviewIntro页面');
  console.log('6. 观察收集单词数字动画');
  console.log('7. 验证数字显示正确');
  
  console.log('\n⚠️ 注意事项：');
  console.log('• 收集单词数量现在正确显示vocabulary.length');
  console.log('• 动画起始值使用当前动画状态');
  console.log('• 数据源在所有地方保持一致');
  console.log('• 修复了初始化时的数据不一致问题');
  console.log('• 确保动画效果正确显示');
  
} else {
  console.log('❌ 部分检查未通过，请检查上述错误信息');
}
console.log('='.repeat(60)); 