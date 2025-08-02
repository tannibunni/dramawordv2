// 调试等级计算问题
console.log('🔍 调试等级计算问题...\n');

// 测试不同的等级计算逻辑
function calculateLevel1(exp) {
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

function calculateLevel2(exp) {
  if (exp <= 0) return 1;
  
  let level = 1;
  while (true) {
    const totalExpForLevel = 50 * Math.pow(level, 2);
    if (exp < totalExpForLevel) {
      break;
    }
    level++;
  }
  return level;
}

function calculateLevel3(exp) {
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

// 测试边界值
const testValues = [0, 50, 149, 150, 151, 200, 299, 300, 301, 450, 549, 550, 551];

console.log('🔍 测试不同的等级计算逻辑:');
console.log('经验值 | 逻辑1 | 逻辑2 | 逻辑3');
console.log('-------|-------|-------|-------');

testValues.forEach(exp => {
  const level1 = calculateLevel1(exp);
  const level2 = calculateLevel2(exp);
  const level3 = calculateLevel3(exp);
  
  console.log(`${exp.toString().padStart(6)} | ${level1.toString().padStart(6)} | ${level2.toString().padStart(6)} | ${level3.toString().padStart(6)}`);
});

console.log('\n🔍 分析等级计算公式:');
console.log('逻辑1: 50 * (level + 1)²');
console.log('逻辑2: 50 * level²');
console.log('逻辑3: 50 * (level + 1)² (与逻辑1相同)');

console.log('\n🔍 验证等级边界:');
for (let level = 1; level <= 5; level++) {
  const totalExpForLevel = 50 * Math.pow(level, 2);
  const totalExpForNextLevel = 50 * Math.pow(level + 1, 2);
  const expNeededForLevel = totalExpForNextLevel - totalExpForLevel;
  
  console.log(`等级 ${level}: 需要 ${totalExpForLevel} XP, 升级需要 ${expNeededForLevel} XP, 总计 ${totalExpForNextLevel} XP`);
}

console.log('\n🔍 测试等级1的边界:');
for (let exp = 0; exp <= 200; exp += 25) {
  const level = calculateLevel1(exp);
  console.log(`经验值 ${exp}: 等级 ${level}`);
}

console.log('\n✅ 等级计算调试完成'); 