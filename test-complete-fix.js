// 完整的修复测试脚本
function calculateLevel(experience) {
  if (experience < 50) return 1;
  if (experience < 75) return 2;   // 50 × 1.5 = 75
  if (experience < 112) return 3;  // 75 × 1.5 = 112.5 ≈ 112
  if (experience < 168) return 4;  // 112 × 1.5 = 168
  if (experience < 252) return 5;  // 168 × 1.5 = 252
  return Math.floor((experience - 252) / 200) + 6;
}

function calculateLevelRequiredExp(level) {
  if (level === 1) return 50;
  if (level === 2) return 75;   // 50 × 1.5
  if (level === 3) return 112;  // 75 × 1.5
  if (level === 4) return 168;  // 112 × 1.5
  if (level === 5) return 252;  // 168 × 1.5
  // 后续等级：252 + (level - 6) * 200
  return 252 + (level - 6) * 200;
}

function getExperienceInCurrentLevel(experience) {
  const currentLevel = calculateLevel(experience);
  if (currentLevel === 1) return experience;
  
  const previousLevelExp = calculateLevelRequiredExp(currentLevel - 1);
  return experience - previousLevelExp;
}

function calculateProgressPercentage(experience) {
  const currentLevel = calculateLevel(experience);
  if (currentLevel === 1) {
    return experience / 50;  // LEVEL 1: 0-50
  }
  
  const previousLevelExp = calculateLevelRequiredExp(currentLevel - 1);
  const currentLevelExp = experience - previousLevelExp;
  const expNeededForCurrentLevel = calculateLevelRequiredExp(currentLevel) - previousLevelExp;
  
  return currentLevelExp / expNeededForCurrentLevel;
}

function checkLevelUp(oldExperience, newExperience) {
  const oldLevel = calculateLevel(oldExperience);
  const newLevel = calculateLevel(newExperience);
  const leveledUp = newLevel > oldLevel;
  const levelsGained = newLevel - oldLevel;
  
  return {
    leveledUp,
    oldLevel,
    newLevel,
    levelsGained
  };
}

// 测试场景1：从LEVEL 1升级到LEVEL 2
console.log('=== 测试场景1：从LEVEL 1升级到LEVEL 2 ===');
const oldExp1 = 49;  // LEVEL 1，差1点升级
const newExp1 = 50;  // 刚好升级到LEVEL 2
const levelUpInfo1 = checkLevelUp(oldExp1, newExp1);

console.log(`经验值: ${oldExp1} -> ${newExp1}`);
console.log(`等级: ${levelUpInfo1.oldLevel} -> ${levelUpInfo1.newLevel}`);
console.log(`是否升级: ${levelUpInfo1.leveledUp ? '✅ 是' : '❌ 否'}`);
console.log(`升级数量: ${levelUpInfo1.levelsGained}`);

// 测试场景2：从LEVEL 2升级到LEVEL 3
console.log('\n=== 测试场景2：从LEVEL 2升级到LEVEL 3 ===');
const oldExp2 = 74;  // LEVEL 2，差1点升级
const newExp2 = 75;  // 刚好升级到LEVEL 3
const levelUpInfo2 = checkLevelUp(oldExp2, newExp2);

console.log(`经验值: ${oldExp2} -> ${newExp2}`);
console.log(`等级: ${levelUpInfo2.oldLevel} -> ${levelUpInfo2.newLevel}`);
console.log(`是否升级: ${levelUpInfo2.leveledUp ? '✅ 是' : '❌ 否'}`);
console.log(`升级数量: ${levelUpInfo2.levelsGained}`);

// 测试场景3：一次性升级多个等级
console.log('\n=== 测试场景3：一次性升级多个等级 ===');
const oldExp3 = 25;  // LEVEL 1
const newExp3 = 100; // LEVEL 3
const levelUpInfo3 = checkLevelUp(oldExp3, newExp3);

console.log(`经验值: ${oldExp3} -> ${newExp3}`);
console.log(`等级: ${levelUpInfo3.oldLevel} -> ${levelUpInfo3.newLevel}`);
console.log(`是否升级: ${levelUpInfo3.leveledUp ? '✅ 是' : '❌ 否'}`);
console.log(`升级数量: ${levelUpInfo3.levelsGained}`);

// 测试场景4：经验值显示数据
console.log('\n=== 测试场景4：经验值显示数据 ===');
const testExpForDisplay = [0, 25, 50, 75, 100, 112, 150, 168, 200];

testExpForDisplay.forEach(exp => {
  const level = calculateLevel(exp);
  const currentLevelExp = getExperienceInCurrentLevel(exp);
  const previousLevelExp = level === 1 ? 0 : calculateLevelRequiredExp(level - 1);
  const expNeededForCurrentLevel = calculateLevelRequiredExp(level) - previousLevelExp;
  const progressPercentage = calculateProgressPercentage(exp);
  
  console.log(`经验值 ${exp} (等级 ${level}): ${currentLevelExp}/${expNeededForCurrentLevel} XP (进度: ${(progressPercentage * 100).toFixed(1)}%)`);
});

// 测试场景5：验证LEVEL 2的1.5倍要求
console.log('\n=== 测试场景5：验证LEVEL 2的1.5倍要求 ===');
const level1Required = calculateLevelRequiredExp(1);
const level2Required = calculateLevelRequiredExp(2);
const ratio = level2Required / level1Required;

console.log(`LEVEL 1所需经验值: ${level1Required}`);
console.log(`LEVEL 2所需经验值: ${level2Required}`);
console.log(`比例: ${ratio} (应该是1.5)`);
console.log(`是否满足1.5倍要求: ${ratio === 1.5 ? '✅ 是' : '❌ 否'}`);

// 测试场景6：模拟升级弹窗信息
console.log('\n=== 测试场景6：模拟升级弹窗信息 ===');
const upgradeScenarios = [
  { oldExp: 49, newExp: 50, description: 'LEVEL 1 -> LEVEL 2' },
  { oldExp: 74, newExp: 75, description: 'LEVEL 2 -> LEVEL 3' },
  { oldExp: 25, newExp: 100, description: 'LEVEL 1 -> LEVEL 3 (连升2级)' }
];

upgradeScenarios.forEach(scenario => {
  const levelUpInfo = checkLevelUp(scenario.oldExp, scenario.newExp);
  
  if (levelUpInfo.leveledUp) {
    console.log(`\n${scenario.description}:`);
    console.log(`  旧等级: ${levelUpInfo.oldLevel}`);
    console.log(`  新等级: ${levelUpInfo.newLevel}`);
    console.log(`  升级数量: ${levelUpInfo.levelsGained}`);
    console.log(`  旧经验值: ${scenario.oldExp}`);
    console.log(`  新经验值: ${scenario.newExp}`);
    
    // 模拟升级弹窗信息
    const modalInfo = {
      oldLevel: levelUpInfo.oldLevel,
      newLevel: levelUpInfo.newLevel,
      levelsGained: levelUpInfo.levelsGained,
      oldExperience: scenario.oldExp,
      newExperience: scenario.newExp
    };
    
    console.log(`  弹窗信息:`, modalInfo);
  }
});
