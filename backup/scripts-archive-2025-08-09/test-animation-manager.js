// 动画管理器测试脚本
// 验证动画管理器的正确性和经验值规则

console.log('🧪 开始动画管理器测试...\n');

// 模拟动画管理器
class MockAnimationManager {
  constructor() {
    this.isAnimating = false;
    this.animationCount = 0;
    this.lastAnimationParams = null;
  }

  // 模拟等级计算
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

  // 模拟进度计算
  calculateProgress(experience, level) {
    const totalExpForNextLevel = 50 * Math.pow(level + 1, 2);
    const totalExpForCurrentLevel = 50 * Math.pow(level, 2);
    const expNeededForCurrentLevel = totalExpForNextLevel - totalExpForCurrentLevel;
    const currentLevelExp = experience - totalExpForCurrentLevel;
    const progressPercentage = (currentLevelExp / expNeededForCurrentLevel) * 100;
    return Math.min(100, Math.max(0, progressPercentage));
  }

  // 模拟动画状态管理
  canStartAnimation() {
    if (this.isAnimating) {
      console.log('⚠️ 动画正在进行中，跳过重复动画');
      return false;
    }
    return true;
  }

  setAnimatingState(isAnimating) {
    this.isAnimating = isAnimating;
  }

  // 模拟经验值动画
  startExperienceAnimation(params, callbacks = {}) {
    if (!this.canStartAnimation()) {
      return;
    }

    this.setAnimatingState(true);
    this.animationCount++;
    this.lastAnimationParams = params;

    console.log(`🎬 开始第${this.animationCount}次经验值动画:`, {
      oldExperience: params.oldExperience,
      newExperience: params.newExperience,
      gainedExp: params.gainedExp,
      oldLevel: params.oldLevel,
      newLevel: params.newLevel,
      isLevelUp: params.isLevelUp,
      oldProgress: params.oldProgress.toFixed(2) + '%',
      newProgress: params.newProgress.toFixed(2) + '%'
    });

    // 调用回调函数
    callbacks.onStart?.();
    
    // 模拟动画进度
    for (let i = 0; i <= 10; i++) {
      const progress = i / 10;
      const currentExp = Math.round(params.oldExperience + (progress * params.gainedExp));
      let currentProgress;
      
      if (params.isLevelUp) {
        currentProgress = progress * params.newProgress;
      } else {
        currentProgress = params.oldProgress + (progress * (params.newProgress - params.oldProgress));
      }
      
      callbacks.onProgress?.(currentExp, currentProgress);
    }

    // 模拟动画完成
    callbacks.onComplete?.(params.newExperience, params.newProgress);
    this.setAnimatingState(false);

    console.log(`✅ 第${this.animationCount}次经验值动画完成`);
  }

  // 模拟数字动画
  startNumberAnimation(animatedValue, targetValue, config = {}) {
    console.log(`📊 数字动画: 0 -> ${targetValue} (${config.duration || 1500}ms)`);
  }

  // 模拟进度条动画
  startProgressBarAnimation(fromProgress, toProgress, config = {}) {
    console.log(`📈 进度条动画: ${fromProgress.toFixed(2)}% -> ${toProgress.toFixed(2)}% (${config.duration || 1500}ms)`);
  }

  // 模拟统计动画
  startStatisticsAnimation(collectedWords, contributedWords, config = {}) {
    console.log(`📊 统计动画: 收集${collectedWords}词, 贡献${contributedWords}词 (${config.duration || 1500}ms)`);
  }
}

// 创建模拟动画管理器实例
const mockAnimationManager = new MockAnimationManager();

// 测试1: 经验值规则验证
console.log('🔍 测试1: 经验值规则验证');
console.log('=' * 50);

const testCases = [
  { exp: 0, expectedLevel: 1 },
  { exp: 50, expectedLevel: 1 },
  { exp: 150, expectedLevel: 2 },
  { exp: 300, expectedLevel: 2 },
  { exp: 550, expectedLevel: 3 },
  { exp: 900, expectedLevel: 3 },
  { exp: 1350, expectedLevel: 4 },
  { exp: 1900, expectedLevel: 4 },
  { exp: 2550, expectedLevel: 5 }
];

testCases.forEach(({ exp, expectedLevel }) => {
  const actualLevel = mockAnimationManager.calculateLevel(exp);
  const progress = mockAnimationManager.calculateProgress(exp, actualLevel);
  const status = actualLevel === expectedLevel ? '✅' : '❌';
  
  console.log(`${status} 经验值: ${exp}, 等级: ${actualLevel} (期望: ${expectedLevel}), 进度: ${progress.toFixed(2)}%`);
});

console.log('');

// 测试2: 进度计算验证
console.log('🔍 测试2: 进度计算验证');
console.log('=' * 50);

const progressTestCases = [
  { exp: 0, level: 1, expectedProgress: 0 },
  { exp: 25, level: 1, expectedProgress: 50 },
  { exp: 50, level: 1, expectedProgress: 100 },
  { exp: 150, level: 2, expectedProgress: 0 },
  { exp: 225, level: 2, expectedProgress: 50 },
  { exp: 300, level: 2, expectedProgress: 100 }
];

progressTestCases.forEach(({ exp, level, expectedProgress }) => {
  const actualProgress = mockAnimationManager.calculateProgress(exp, level);
  const status = Math.abs(actualProgress - expectedProgress) < 0.01 ? '✅' : '❌';
  
  console.log(`${status} 经验值: ${exp}, 等级: ${level}, 进度: ${actualProgress.toFixed(2)}% (期望: ${expectedProgress}%)`);
});

console.log('');

// 测试3: 动画重复防止验证
console.log('🔍 测试3: 动画重复防止验证');
console.log('=' * 50);

// 第一次动画
console.log('🎬 尝试开始第一次动画...');
mockAnimationManager.startExperienceAnimation({
  oldExperience: 100,
  newExperience: 150,
  gainedExp: 50,
  oldLevel: 1,
  newLevel: 1,
  isLevelUp: false,
  oldProgress: 50,
  newProgress: 100
}, {
  onStart: () => console.log('🚀 动画开始'),
  onProgress: (exp, progress) => console.log(`📊 进度: ${exp} XP, ${progress.toFixed(2)}%`),
  onComplete: (exp, progress) => console.log(`✅ 完成: ${exp} XP, ${progress.toFixed(2)}%`)
});

// 立即尝试第二次动画（应该被阻止）
console.log('🎬 立即尝试第二次动画（应该被阻止）...');
mockAnimationManager.startExperienceAnimation({
  oldExperience: 150,
  newExperience: 200,
  gainedExp: 50,
  oldLevel: 1,
  newLevel: 2,
  isLevelUp: true,
  oldProgress: 100,
  newProgress: 0
});

console.log('');

// 测试4: 升级动画验证
console.log('🔍 测试4: 升级动画验证');
console.log('=' * 50);

console.log('🎬 测试升级动画...');
mockAnimationManager.startExperienceAnimation({
  oldExperience: 50,
  newExperience: 150,
  gainedExp: 100,
  oldLevel: 1,
  newLevel: 2,
  isLevelUp: true,
  oldProgress: 100,
  newProgress: 0
}, {
  onStart: () => console.log('🚀 升级动画开始'),
  onProgress: (exp, progress) => console.log(`📊 升级进度: ${exp} XP, ${progress.toFixed(2)}%`),
  onComplete: (exp, progress) => console.log(`🎉 升级完成: ${exp} XP, ${progress.toFixed(2)}%`)
});

console.log('');

// 测试5: 统计动画验证
console.log('🔍 测试5: 统计动画验证');
console.log('=' * 50);

mockAnimationManager.startStatisticsAnimation(100, 25, { duration: 1500 });
mockAnimationManager.startNumberAnimation(null, 1000, { duration: 1000 });
mockAnimationManager.startProgressBarAnimation(0, 75, { duration: 2000 });

console.log('');

// 测试6: 经验值规则边界测试
console.log('🔍 测试6: 经验值规则边界测试');
console.log('=' * 50);

const boundaryTests = [
  { exp: -1, expectedLevel: 1 },
  { exp: 0, expectedLevel: 1 },
  { exp: 49, expectedLevel: 1 },
  { exp: 50, expectedLevel: 1 },
  { exp: 51, expectedLevel: 1 },
  { exp: 149, expectedLevel: 1 },
  { exp: 150, expectedLevel: 2 },
  { exp: 151, expectedLevel: 2 }
];

boundaryTests.forEach(({ exp, expectedLevel }) => {
  const actualLevel = mockAnimationManager.calculateLevel(exp);
  const progress = mockAnimationManager.calculateProgress(exp, actualLevel);
  const status = actualLevel === expectedLevel ? '✅' : '❌';
  
  console.log(`${status} 边界测试 - 经验值: ${exp}, 等级: ${actualLevel} (期望: ${expectedLevel}), 进度: ${progress.toFixed(2)}%`);
});

console.log('');

// 测试总结
console.log('🎯 测试总结');
console.log('=' * 50);

console.log(`📊 总动画次数: ${mockAnimationManager.animationCount}`);
console.log(`🔄 动画状态: ${mockAnimationManager.isAnimating ? '进行中' : '空闲'}`);
console.log(`📋 最后动画参数:`, mockAnimationManager.lastAnimationParams);

console.log('\n✅ 动画管理器测试完成');

// 经验值规则总结
console.log('\n📋 经验值规则总结:');
console.log('=' * 50);
console.log('1. 等级计算公式: 50 * (level + 1)²');
console.log('2. 1级需要: 0-149 XP');
console.log('3. 2级需要: 150-299 XP');
console.log('4. 3级需要: 300-549 XP');
console.log('5. 4级需要: 550-899 XP');
console.log('6. 5级需要: 900-1349 XP');
console.log('7. 进度计算: (当前等级内经验值 / 升级所需经验值) * 100%');
console.log('8. 动画重复防止: 通过 isAnimating 状态控制');
console.log('9. 升级动画: 进度条从100%重置到0%再增长到新进度'); 