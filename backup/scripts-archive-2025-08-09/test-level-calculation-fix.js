// 测试等级计算修复
console.log('🧪 测试等级计算修复...\n');

// 模拟动画管理器的等级计算逻辑
class TestAnimationManager {
  calculateLevel(exp) {
    if (exp <= 0) return 1;
    
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

  calculateProgress(experience, level) {
    if (experience <= 0) return 0;
    
    const totalExpForNextLevel = 50 * Math.pow(level + 1, 2);
    const totalExpForCurrentLevel = 50 * Math.pow(level, 2);
    const expNeededForCurrentLevel = totalExpForNextLevel - totalExpForCurrentLevel;
    
    // 计算当前等级内的经验值
    const expInCurrentLevel = experience - totalExpForCurrentLevel;
    const progressPercentage = (expInCurrentLevel / expNeededForCurrentLevel) * 100;
    
    return Math.min(100, Math.max(0, progressPercentage));
  }
}

const animationManager = new TestAnimationManager();

// 验证等级计算公式
console.log('🔍 验证等级计算公式: 50 * (level + 1)²');
for (let level = 1; level <= 10; level++) {
  const totalExpForLevel = 50 * Math.pow(level, 2);
  const totalExpForNextLevel = 50 * Math.pow(level + 1, 2);
  const expNeededForLevel = totalExpForNextLevel - totalExpForLevel;
  
  console.log(`等级 ${level}: 需要 ${totalExpForLevel} XP, 升级需要 ${expNeededForLevel} XP, 总计 ${totalExpForNextLevel} XP`);
}

console.log('\n🔍 测试等级计算');
const levelTestCases = [
  { exp: 0, expectedLevel: 1 },
  { exp: 50, expectedLevel: 1 },
  { exp: 149, expectedLevel: 1 },
  { exp: 150, expectedLevel: 2 },
  { exp: 299, expectedLevel: 2 },
  { exp: 300, expectedLevel: 3 },
  { exp: 549, expectedLevel: 3 },
  { exp: 550, expectedLevel: 4 },
  { exp: 899, expectedLevel: 4 },
  { exp: 900, expectedLevel: 5 },
  { exp: 1349, expectedLevel: 5 },
  { exp: 1350, expectedLevel: 6 },
];

levelTestCases.forEach(({ exp, expectedLevel }) => {
  const level = animationManager.calculateLevel(exp);
  const isCorrect = level === expectedLevel;
  
  console.log(`${isCorrect ? '✅' : '❌'} 经验值: ${exp}, 等级: ${level} (期望: ${expectedLevel})`);
});

console.log('\n🔍 测试进度计算');
const progressTestCases = [
  { exp: 0, expectedProgress: 0 },
  { exp: 25, expectedProgress: 0 },
  { exp: 50, expectedProgress: 0 },
  { exp: 75, expectedProgress: 0 },
  { exp: 100, expectedProgress: 0 },
  { exp: 150, expectedProgress: 0 },
  { exp: 200, expectedProgress: 10 },
  { exp: 250, expectedProgress: 20 },
  { exp: 300, expectedProgress: 40 },
];

progressTestCases.forEach(({ exp, expectedProgress }) => {
  const level = animationManager.calculateLevel(exp);
  const progress = animationManager.calculateProgress(exp, level);
  const isCorrect = Math.abs(progress - expectedProgress) < 0.1;
  
  console.log(`${isCorrect ? '✅' : '❌'} 经验值: ${exp}, 等级: ${level}, 进度: ${progress.toFixed(2)}% (期望: ${expectedProgress}%)`);
});

console.log('\n🎯 等级计算规则总结');
console.log('1. 等级计算公式: 50 * (level + 1)²');
console.log('2. 1级需要: 0-149 XP (0-149)');
console.log('3. 2级需要: 150-299 XP (150-299)');
console.log('4. 3级需要: 300-549 XP (300-549)');
console.log('5. 4级需要: 550-899 XP (550-899)');
console.log('6. 5级需要: 900-1349 XP (900-1349)');
console.log('7. 进度计算: (当前等级内经验值 / 升级所需经验值) * 100%');

console.log('\n✅ 等级计算修复测试完成'); 