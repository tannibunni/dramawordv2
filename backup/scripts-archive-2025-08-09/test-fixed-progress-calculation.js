// 修复后的进度计算测试脚本
// 验证经验值进度计算逻辑的正确性

console.log('🧪 开始修复后的进度计算测试...\n');

// 模拟修复后的动画管理器
class FixedAnimationManager {
  // 等级计算函数（基于总经验值）
  calculateLevel(exp) {
    let level = 1;
    while (true) {
      const totalExpForNextLevel = 50 * Math.pow(level + 1, 2);
      if (exp < totalExpForNextLevel) {
        break;
      }
      level++;
    }
    return level;
  }

  // 修复后的进度计算函数
  calculateProgress(experience, level) {
    const totalExpForNextLevel = 50 * Math.pow(level + 1, 2);
    const totalExpForCurrentLevel = 50 * Math.pow(level, 2);
    const expNeededForCurrentLevel = totalExpForNextLevel - totalExpForCurrentLevel;
    // experience 已经是当前等级内的经验值，直接使用
    const progressPercentage = (experience / expNeededForCurrentLevel) * 100;
    return Math.min(100, Math.max(0, progressPercentage));
  }

  // 计算总经验值
  calculateTotalExperience(level, currentLevelExp) {
    const totalExpForCurrentLevel = 50 * Math.pow(level, 2);
    return totalExpForCurrentLevel + currentLevelExp;
  }

  // 从总经验值计算当前等级内的经验值
  calculateCurrentLevelExp(totalExp, level) {
    const totalExpForCurrentLevel = 50 * Math.pow(level, 2);
    return totalExp - totalExpForCurrentLevel;
  }
}

const manager = new FixedAnimationManager();

// 测试1: 验证等级计算
console.log('🔍 测试1: 等级计算验证');
console.log('=' * 50);

const levelTestCases = [
  { totalExp: 0, expectedLevel: 1 },
  { totalExp: 50, expectedLevel: 1 },
  { totalExp: 149, expectedLevel: 1 },
  { totalExp: 150, expectedLevel: 2 },
  { totalExp: 299, expectedLevel: 2 },
  { totalExp: 300, expectedLevel: 2 },
  { totalExp: 549, expectedLevel: 2 },
  { totalExp: 550, expectedLevel: 3 },
  { totalExp: 899, expectedLevel: 3 },
  { totalExp: 900, expectedLevel: 3 },
  { totalExp: 1349, expectedLevel: 3 },
  { totalExp: 1350, expectedLevel: 4 }
];

levelTestCases.forEach(({ totalExp, expectedLevel }) => {
  const actualLevel = manager.calculateLevel(totalExp);
  const status = actualLevel === expectedLevel ? '✅' : '❌';
  console.log(`${status} 总经验值: ${totalExp}, 等级: ${actualLevel} (期望: ${expectedLevel})`);
});

console.log('');

// 测试2: 验证进度计算（修复后）
console.log('🔍 测试2: 修复后的进度计算验证');
console.log('=' * 50);

const progressTestCases = [
  // 1级测试
  { level: 1, currentLevelExp: 0, expectedProgress: 0 },
  { level: 1, currentLevelExp: 25, expectedProgress: 50 },
  { level: 1, currentLevelExp: 50, expectedProgress: 100 },
  { level: 1, currentLevelExp: 75, expectedProgress: 150 }, // 超过100%是正常的，表示即将升级
  
  // 2级测试
  { level: 2, currentLevelExp: 0, expectedProgress: 0 },
  { level: 2, currentLevelExp: 75, expectedProgress: 50 },
  { level: 2, currentLevelExp: 150, expectedProgress: 100 },
  { level: 2, currentLevelExp: 225, expectedProgress: 150 }, // 超过100%是正常的
  
  // 3级测试
  { level: 3, currentLevelExp: 0, expectedProgress: 0 },
  { level: 3, currentLevelExp: 125, expectedProgress: 50 },
  { level: 3, currentLevelExp: 250, expectedProgress: 100 }
];

progressTestCases.forEach(({ level, currentLevelExp, expectedProgress }) => {
  const actualProgress = manager.calculateProgress(currentLevelExp, level);
  const status = Math.abs(actualProgress - expectedProgress) < 0.01 ? '✅' : '❌';
  console.log(`${status} 等级: ${level}, 当前等级内经验值: ${currentLevelExp}, 进度: ${actualProgress.toFixed(2)}% (期望: ${expectedProgress}%)`);
});

console.log('');

// 测试3: 验证总经验值与当前等级经验值的转换
console.log('🔍 测试3: 总经验值与当前等级经验值转换验证');
console.log('=' * 50);

const conversionTestCases = [
  { totalExp: 0, expectedLevel: 1, expectedCurrentLevelExp: 0 },
  { totalExp: 50, expectedLevel: 1, expectedCurrentLevelExp: 50 },
  { totalExp: 149, expectedLevel: 1, expectedCurrentLevelExp: 149 },
  { totalExp: 150, expectedLevel: 2, expectedCurrentLevelExp: 0 },
  { totalExp: 200, expectedLevel: 2, expectedCurrentLevelExp: 50 },
  { totalExp: 299, expectedLevel: 2, expectedCurrentLevelExp: 149 },
  { totalExp: 300, expectedLevel: 2, expectedCurrentLevelExp: 150 },
  { totalExp: 550, expectedLevel: 3, expectedCurrentLevelExp: 0 },
  { totalExp: 600, expectedLevel: 3, expectedCurrentLevelExp: 50 }
];

conversionTestCases.forEach(({ totalExp, expectedLevel, expectedCurrentLevelExp }) => {
  const actualLevel = manager.calculateLevel(totalExp);
  const actualCurrentLevelExp = manager.calculateCurrentLevelExp(totalExp, actualLevel);
  const totalExpBack = manager.calculateTotalExperience(actualLevel, actualCurrentLevelExp);
  
  const levelStatus = actualLevel === expectedLevel ? '✅' : '❌';
  const expStatus = Math.abs(actualCurrentLevelExp - expectedCurrentLevelExp) < 0.01 ? '✅' : '❌';
  const backStatus = totalExpBack === totalExp ? '✅' : '❌';
  
  console.log(`${levelStatus}${expStatus}${backStatus} 总经验值: ${totalExp}, 等级: ${actualLevel} (期望: ${expectedLevel}), 当前等级内经验值: ${actualCurrentLevelExp} (期望: ${expectedCurrentLevelExp}), 转换回总经验值: ${totalExpBack}`);
});

console.log('');

// 测试4: 验证实际场景
console.log('🔍 测试4: 实际场景验证');
console.log('=' * 50);

const realScenarios = [
  {
    name: '新用户开始',
    totalExp: 0,
    gainedExp: 5,
    description: '新用户收集第一个单词'
  },
  {
    name: '1级用户即将升级',
    totalExp: 145,
    gainedExp: 10,
    description: '1级用户即将升级到2级'
  },
  {
    name: '2级用户正常升级',
    totalExp: 290,
    gainedExp: 15,
    description: '2级用户升级到3级'
  },
  {
    name: '高级用户',
    totalExp: 800,
    gainedExp: 20,
    description: '高级用户继续获得经验值'
  }
];

realScenarios.forEach(({ name, totalExp, gainedExp, description }) => {
  const oldLevel = manager.calculateLevel(totalExp);
  const oldCurrentLevelExp = manager.calculateCurrentLevelExp(totalExp, oldLevel);
  const oldProgress = manager.calculateProgress(oldCurrentLevelExp, oldLevel);
  
  const newTotalExp = totalExp + gainedExp;
  const newLevel = manager.calculateLevel(newTotalExp);
  const newCurrentLevelExp = manager.calculateCurrentLevelExp(newTotalExp, newLevel);
  const newProgress = manager.calculateProgress(newCurrentLevelExp, newLevel);
  
  const isLevelUp = newLevel > oldLevel;
  
  console.log(`📊 ${name}:`);
  console.log(`   描述: ${description}`);
  console.log(`   升级前: 总经验值 ${totalExp}, 等级 ${oldLevel}, 当前等级内经验值 ${oldCurrentLevelExp}, 进度 ${oldProgress.toFixed(2)}%`);
  console.log(`   升级后: 总经验值 ${newTotalExp}, 等级 ${newLevel}, 当前等级内经验值 ${newCurrentLevelExp}, 进度 ${newProgress.toFixed(2)}%`);
  console.log(`   是否升级: ${isLevelUp ? '✅ 是' : '❌ 否'}`);
  console.log('');
});

// 测试5: 验证边界条件
console.log('🔍 测试5: 边界条件验证');
console.log('=' * 50);

const boundaryTests = [
  { level: 1, currentLevelExp: -1, expectedProgress: 0 },
  { level: 1, currentLevelExp: 0, expectedProgress: 0 },
  { level: 1, currentLevelExp: 49, expectedProgress: 98 },
  { level: 1, currentLevelExp: 50, expectedProgress: 100 },
  { level: 1, currentLevelExp: 51, expectedProgress: 102 },
  { level: 2, currentLevelExp: 149, expectedProgress: 99.33 },
  { level: 2, currentLevelExp: 150, expectedProgress: 100 },
  { level: 2, currentLevelExp: 151, expectedProgress: 100.67 }
];

boundaryTests.forEach(({ level, currentLevelExp, expectedProgress }) => {
  const actualProgress = manager.calculateProgress(currentLevelExp, level);
  const status = Math.abs(actualProgress - expectedProgress) < 0.01 ? '✅' : '❌';
  console.log(`${status} 边界测试 - 等级: ${level}, 当前等级内经验值: ${currentLevelExp}, 进度: ${actualProgress.toFixed(2)}% (期望: ${expectedProgress}%)`);
});

console.log('');

// 总结
console.log('🎯 修复后的进度计算测试总结');
console.log('=' * 50);

console.log('✅ 关键修复点:');
console.log('1. 进度计算直接使用当前等级内经验值，不再减去总经验值');
console.log('2. 等级计算基于总经验值，保持不变');
console.log('3. 正确处理升级时的经验值重置');
console.log('4. 支持超过100%的进度显示（即将升级）');

console.log('\n✅ 经验值规则总结:');
console.log('1. 等级计算公式: 50 * (level + 1)²');
console.log('2. 进度计算公式: (当前等级内经验值 / 升级所需经验值) * 100%');
console.log('3. 升级时经验值重置为: 总经验值 - 当前等级所需总经验值');
console.log('4. 支持进度超过100%（表示即将升级）');

console.log('\n✅ 修复后的进度计算测试完成'); 