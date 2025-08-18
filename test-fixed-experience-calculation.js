// 测试修复后的经验值计算逻辑
function calculateLevel(experience) {
  if (experience < 50) return 1;
  if (experience < 125) return 2;  // 50 + 75 = 125
  if (experience < 225) return 3;  // 125 + 100 = 225
  if (experience < 350) return 4;  // 225 + 125 = 350
  if (experience < 500) return 5;  // 350 + 150 = 500
  return Math.floor((experience - 500) / 200) + 6;
}

function calculateLevelRequiredExp(level) {
  if (level === 1) return 50;
  if (level === 2) return 125;  // 50 + 75
  if (level === 3) return 225;  // 125 + 100
  if (level === 4) return 350;  // 225 + 125
  if (level === 5) return 500;  // 350 + 150
  return 500 + (level - 6) * 200;
}

function getExperienceInCurrentLevel(experience) {
  const currentLevel = calculateLevel(experience);
  if (currentLevel === 1) return experience;
  
  const previousLevelExp = calculateLevelRequiredExp(currentLevel - 1);
  return experience - previousLevelExp;
}

function calculateProgressPercentage(experience) {
  const currentLevel = calculateLevel(experience);
  const currentLevelExp = getExperienceInCurrentLevel(experience);
  const previousLevelExp = currentLevel === 1 ? 0 : calculateLevelRequiredExp(currentLevel - 1);
  const expNeededForCurrentLevel = calculateLevelRequiredExp(currentLevel) - previousLevelExp;
  
  return currentLevelExp / expNeededForCurrentLevel;
}

function calculateExpToNextLevel(experience) {
  const currentLevel = calculateLevel(experience);
  const previousLevelExp = currentLevel === 1 ? 0 : calculateLevelRequiredExp(currentLevel - 1);
  const expNeededForCurrentLevel = calculateLevelRequiredExp(currentLevel) - previousLevelExp;
  const currentLevelExp = getExperienceInCurrentLevel(experience);
  return expNeededForCurrentLevel - currentLevelExp;
}

function getCurrentLevelRequiredExp(level) {
  if (level === 1) return 50;
  const previousLevelExp = calculateLevelRequiredExp(level - 1);
  return calculateLevelRequiredExp(level) - previousLevelExp;
}

// 测试用例
console.log('=== 修复后的经验值计算逻辑测试 ===\n');

// 测试 Level 1
console.log('Level 1 测试:');
for (let exp = 0; exp <= 50; exp += 10) {
  const level = calculateLevel(exp);
  const currentLevelExp = getExperienceInCurrentLevel(exp);
  const requiredExp = getCurrentLevelRequiredExp(level);
  const progress = calculateProgressPercentage(exp);
  const toNext = calculateExpToNextLevel(exp);
  
  console.log(`  ${exp} XP: Level ${level}, 当前等级内: ${currentLevelExp}/${requiredExp} XP, 进度: ${(progress * 100).toFixed(1)}%, 到下一级: ${toNext} XP`);
}

// 测试 Level 2
console.log('\nLevel 2 测试:');
for (let exp = 50; exp <= 125; exp += 15) {
  const level = calculateLevel(exp);
  const currentLevelExp = getExperienceInCurrentLevel(exp);
  const requiredExp = getCurrentLevelRequiredExp(level);
  const progress = calculateProgressPercentage(exp);
  const toNext = calculateExpToNextLevel(exp);
  
  console.log(`  ${exp} XP: Level ${level}, 当前等级内: ${currentLevelExp}/${requiredExp} XP, 进度: ${(progress * 100).toFixed(1)}%, 到下一级: ${toNext} XP`);
}

// 测试 Level 3
console.log('\nLevel 3 测试:');
for (let exp = 125; exp <= 225; exp += 20) {
  const level = calculateLevel(exp);
  const currentLevelExp = getExperienceInCurrentLevel(exp);
  const requiredExp = getCurrentLevelRequiredExp(level);
  const progress = calculateProgressPercentage(exp);
  const toNext = calculateExpToNextLevel(exp);
  
  console.log(`  ${exp} XP: Level ${level}, 当前等级内: ${currentLevelExp}/${requiredExp} XP, 进度: ${(progress * 100).toFixed(1)}%, 到下一级: ${toNext} XP`);
}

// 测试升级场景
console.log('\n=== 升级场景测试 ===');
console.log('用户从 Level 1 (50 XP) 升级到 Level 2 (56 XP):');
const oldExp = 50;
const newExp = 56;
const oldLevel = calculateLevel(oldExp);
const newLevel = calculateLevel(newExp);
const leveledUp = newLevel > oldLevel;

console.log(`  升级前: ${oldExp} XP (Level ${oldLevel})`);
console.log(`  升级后: ${newExp} XP (Level ${newLevel})`);
console.log(`  是否升级: ${leveledUp ? '是' : '否'}`);

if (leveledUp) {
  const currentLevelExp = getExperienceInCurrentLevel(newExp);
  const requiredExp = getCurrentLevelRequiredExp(newLevel);
  const progress = calculateProgressPercentage(newExp);
  
  console.log(`  新等级显示: Level ${newLevel}: ${currentLevelExp}/${requiredExp} XP`);
  console.log(`  进度条: ${(progress * 100).toFixed(1)}% (从0开始)`);
} else {
  const currentLevelExp = getExperienceInCurrentLevel(newExp);
  const requiredExp = getCurrentLevelRequiredExp(newLevel);
  const progress = calculateProgressPercentage(newExp);
  
  console.log(`  当前等级: Level ${newLevel}: ${currentLevelExp}/${requiredExp} XP`);
  console.log(`  进度条: ${(progress * 100).toFixed(1)}%`);
}

console.log('\n=== 等级边界测试 ===');
console.log('Level 1 边界: 49 XP -> Level 1, 50 XP -> Level 2');
console.log(`  49 XP: Level ${calculateLevel(49)}`);
console.log(`  50 XP: Level ${calculateLevel(50)}`);

console.log('Level 2 边界: 124 XP -> Level 2, 125 XP -> Level 3');
console.log(`  124 XP: Level ${calculateLevel(124)}`);
console.log(`  125 XP: Level ${calculateLevel(125)}`);

console.log('\n=== 测试完成 ===');
