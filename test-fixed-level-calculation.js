// 测试修复后的等级计算
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

// 测试等级计算
console.log('=== 修复后的等级计算测试 ===');
const testExp = [0, 25, 50, 75, 100, 112, 150, 168, 200, 252, 300, 400, 500];

testExp.forEach(exp => {
  const level = calculateLevel(exp);
  const levelRequired = calculateLevelRequiredExp(level);
  const currentLevelExp = getExperienceInCurrentLevel(exp);
  const nextLevelExp = calculateLevelRequiredExp(level + 1);
  const expToNext = nextLevelExp - exp;
  
  console.log(`经验值 ${exp} -> 等级 ${level} (当前等级内: ${currentLevelExp}, 升级还需: ${expToNext})`);
});

console.log('\n=== 验证LEVEL 2是否为LEVEL 1的1.5倍 ===');
const level1Required = calculateLevelRequiredExp(1);  // 50
const level2Required = calculateLevelRequiredExp(2);  // 75
const ratio = level2Required / level1Required;

console.log(`LEVEL 1所需经验值: ${level1Required}`);
console.log(`LEVEL 2所需经验值: ${level2Required}`);
console.log(`比例: ${ratio} (应该是1.5)`);
console.log(`是否满足1.5倍要求: ${ratio === 1.5 ? '✅ 是' : '❌ 否'}`);

console.log('\n=== 验证LEVEL 3是否为LEVEL 2的1.5倍 ===');
const level3Required = calculateLevelRequiredExp(3);  // 112
const ratio2 = level3Required / level2Required;

console.log(`LEVEL 2所需经验值: ${level2Required}`);
console.log(`LEVEL 3所需经验值: ${level3Required}`);
console.log(`比例: ${ratio2} (应该是1.5)`);
console.log(`是否满足1.5倍要求: ${Math.abs(ratio2 - 1.5) < 0.1 ? '✅ 是' : '❌ 否'}`);

console.log('\n=== 测试经验值显示逻辑 ===');
const testExpForDisplay = [0, 25, 50, 75, 100, 112, 150, 168, 200];

testExpForDisplay.forEach(exp => {
  const level = calculateLevel(exp);
  const currentLevelExp = getExperienceInCurrentLevel(exp);
  const previousLevelExp = level === 1 ? 0 : calculateLevelRequiredExp(level - 1);
  const expNeededForCurrentLevel = calculateLevelRequiredExp(level) - previousLevelExp;
  
  console.log(`经验值 ${exp} (等级 ${level}): ${currentLevelExp}/${expNeededForCurrentLevel} XP`);
});
