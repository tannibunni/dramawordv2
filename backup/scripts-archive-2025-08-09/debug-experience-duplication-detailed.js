const fs = require('fs');
const path = require('path');

console.log('🔍 详细检查经验值重复计算问题...\n');

// 模拟AsyncStorage
class MockAsyncStorage {
  constructor() {
    this.storage = new Map();
    this.accessLog = [];
  }
  
  async getItem(key) {
    this.accessLog.push({ type: 'get', key, timestamp: Date.now() });
    return this.storage.get(key) || null;
  }
  
  async setItem(key, value) {
    this.accessLog.push({ type: 'set', key, value, timestamp: Date.now() });
    this.storage.set(key, value);
  }
  
  async removeItem(key) {
    this.accessLog.push({ type: 'remove', key, timestamp: Date.now() });
    this.storage.delete(key);
  }
  
  getAccessLog() {
    return this.accessLog;
  }
  
  clear() {
    this.storage.clear();
    this.accessLog = [];
  }
}

// 模拟经验值重复计算问题
function simulateExperienceDuplication() {
  console.log('🎭 模拟经验值重复计算问题...\n');
  
  const mockStorage = new MockAsyncStorage();
  
  // 初始状态
  mockStorage.setItem('userStats', JSON.stringify({
    experience: 100,
    level: 1,
    collectedWords: 10,
    contributedWords: 5,
    totalReviews: 20,
    currentStreak: 3
  }));
  
  // 设置经验值增益
  mockStorage.setItem('experienceGain', '50');
  
  console.log('📊 初始状态:');
  console.log('  userStats.experience: 100');
  console.log('  experienceGain: 50');
  console.log('');
  
  // 模拟loadUserStats函数的行为
  async function simulateLoadUserStats() {
    console.log('🔄 模拟 loadUserStats 函数执行...');
    
    const localStatsData = await mockStorage.getItem('userStats');
    const localStats = JSON.parse(localStatsData);
    
    // 检查是否有待处理的经验值增益
    const gainData = await mockStorage.getItem('experienceGain');
    let finalExperience = localStats.experience || 0;
    
    if (gainData) {
      const gainedExp = JSON.parse(gainData);
      finalExperience += gainedExp;
      console.log(`  ✅ 检测到经验值增益: ${gainedExp}`);
      console.log(`  📈 经验值更新: ${localStats.experience} + ${gainedExp} = ${finalExperience}`);
    }
    
    const updatedStats = {
      ...localStats,
      experience: finalExperience
    };
    
    await mockStorage.setItem('userStats', JSON.stringify(updatedStats));
    console.log(`  💾 保存更新后的统计数据: experience = ${updatedStats.experience}`);
    console.log('');
    
    return updatedStats;
  }
  
  // 模拟loadBackendData函数的行为
  async function simulateLoadBackendData() {
    console.log('🔄 模拟 loadBackendData 函数执行...');
    
    // 模拟后端返回的数据
    const backendData = {
      experience: 100, // 后端还没有更新经验值
      level: 1,
      collectedWords: 10,
      contributedWords: 5,
      totalReviews: 20,
      currentStreak: 3
    };
    
    // 检查是否有待处理的经验值增益
    const gainData = await mockStorage.getItem('experienceGain');
    let finalExperience = backendData.experience || 0;
    
    if (gainData) {
      const gainedExp = JSON.parse(gainData);
      finalExperience += gainedExp;
      console.log(`  ✅ 检测到经验值增益: ${gainedExp}`);
      console.log(`  📈 经验值更新: ${backendData.experience} + ${gainedExp} = ${finalExperience}`);
    }
    
    const backendStats = {
      experience: finalExperience,
      level: backendData.level || 1,
      collectedWords: 10,
      contributedWords: backendData.contributedWords || 0,
      totalReviews: backendData.totalReviews || 0,
      currentStreak: backendData.currentStreak || 0
    };
    
    await mockStorage.setItem('userStats', JSON.stringify(backendStats));
    console.log(`  💾 保存更新后的统计数据: experience = ${backendStats.experience}`);
    console.log('');
    
    return backendStats;
  }
  
  // 模拟getCurrentUserData函数的行为
  async function simulateGetCurrentUserData() {
    console.log('🔄 模拟 getCurrentUserData 函数执行...');
    
    const statsData = await mockStorage.getItem('userStats');
    const stats = JSON.parse(statsData);
    const gainData = await mockStorage.getItem('experienceGain');
    let finalExperience = stats.experience || 0;
    
    if (gainData) {
      const gainedExp = JSON.parse(gainData);
      finalExperience += gainedExp;
      console.log(`  ✅ 检测到经验值增益: ${gainedExp}`);
      console.log(`  📈 经验值更新: ${stats.experience} + ${gainedExp} = ${finalExperience}`);
    }
    
    console.log(`  📊 返回用户数据: experience = ${finalExperience}`);
    console.log('');
    
    return {
      currentExperience: finalExperience,
      userStats: { ...stats, experience: finalExperience }
    };
  }
  
  return {
    simulateLoadUserStats,
    simulateLoadBackendData,
    simulateGetCurrentUserData,
    mockStorage
  };
}

// 分析代码中的问题模式
function analyzeCodePatterns() {
  console.log('🔍 分析代码中的问题模式...\n');
  
  const filePath = 'apps/mobile/src/screens/Review/ReviewIntroScreen.tsx';
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // 查找所有经验值累加的位置
    const expAdditionLines = [];
    lines.forEach((line, index) => {
      if (line.includes('finalExperience') && line.includes('+=')) {
        expAdditionLines.push({
          lineNumber: index + 1,
          content: line.trim(),
          context: lines.slice(Math.max(0, index - 2), index + 3).map((l, i) => 
            `${index - 1 + i}: ${l.trim()}`
          ).join('\n')
        });
      }
    });
    
    console.log(`📍 发现 ${expAdditionLines.length} 处经验值累加:`);
    expAdditionLines.forEach((item, index) => {
      console.log(`\n  ${index + 1}. 行 ${item.lineNumber}:`);
      console.log(`     ${item.content}`);
      console.log(`     上下文:`);
      item.context.split('\n').forEach(ctx => {
        console.log(`       ${ctx}`);
      });
    });
    
    // 查找experienceGain的使用模式
    const gainUsagePatterns = [];
    lines.forEach((line, index) => {
      if (line.includes('experienceGain') && line.includes('AsyncStorage')) {
        gainUsagePatterns.push({
          lineNumber: index + 1,
          content: line.trim(),
          type: line.includes('getItem') ? '读取' : line.includes('setItem') ? '设置' : '删除'
        });
      }
    });
    
    console.log(`\n📋 experienceGain 使用模式:`);
    gainUsagePatterns.forEach((item, index) => {
      console.log(`  ${index + 1}. 行 ${item.lineNumber} (${item.type}): ${item.content}`);
    });
    
    return { expAdditionLines, gainUsagePatterns };
    
  } catch (error) {
    console.error(`❌ 读取文件失败: ${error.message}`);
    return { expAdditionLines: [], gainUsagePatterns: [] };
  }
}

// 生成修复建议
function generateFixRecommendations() {
  console.log('\n🔧 修复建议:\n');
  
  const recommendations = [
    {
      title: '1. 添加经验值增益状态跟踪',
      description: '使用时间戳或状态标记来跟踪经验值增益是否已经应用',
      code: `
// 建议的修复方案
const checkAndApplyExperienceGain = async () => {
  const gainData = await AsyncStorage.getItem('experienceGain');
  const gainAppliedKey = await AsyncStorage.getItem('experienceGainApplied');
  
  if (gainData && !gainAppliedKey) {
    const gainedExp = JSON.parse(gainData);
    const currentExp = userStats.experience;
    const finalExperience = currentExp + gainedExp;
    
    // 标记为已应用
    await AsyncStorage.setItem('experienceGainApplied', Date.now().toString());
    
    return finalExperience;
  }
  
  return userStats.experience;
};
      `
    },
    {
      title: '2. 使用事务性操作',
      description: '确保经验值更新的原子性，避免并发问题',
      code: `
// 事务性经验值更新
const updateExperienceAtomically = async (gainedExp) => {
  const lockKey = 'experienceUpdateLock';
  const lock = await AsyncStorage.getItem(lockKey);
  
  if (lock) {
    console.log('经验值更新进行中，跳过重复操作');
    return;
  }
  
  try {
    await AsyncStorage.setItem(lockKey, Date.now().toString());
    
    const currentStats = await AsyncStorage.getItem('userStats');
    const stats = JSON.parse(currentStats);
    const newExperience = stats.experience + gainedExp;
    
    await AsyncStorage.setItem('userStats', JSON.stringify({
      ...stats,
      experience: newExperience
    }));
    
    await AsyncStorage.removeItem('experienceGain');
  } finally {
    await AsyncStorage.removeItem(lockKey);
  }
};
      `
    },
    {
      title: '3. 统一经验值处理逻辑',
      description: '创建一个统一的经验值处理函数，避免在多个地方重复逻辑',
      code: `
// 统一的经验值处理函数
const experienceManager = {
  async getCurrentExperience() {
    const stats = await this.getUserStats();
    const gainData = await AsyncStorage.getItem('experienceGain');
    
    if (!gainData) {
      return stats.experience;
    }
    
    const gainedExp = JSON.parse(gainData);
    const appliedKey = await AsyncStorage.getItem('experienceGainApplied');
    
    if (appliedKey) {
      // 已经应用过，返回当前经验值
      return stats.experience;
    }
    
    // 标记为已应用
    await AsyncStorage.setItem('experienceGainApplied', Date.now().toString());
    return stats.experience + gainedExp;
  },
  
  async applyExperienceGain(gainedExp) {
    const currentExp = await this.getCurrentExperience();
    const newExp = currentExp + gainedExp;
    
    await this.updateUserStats({ experience: newExp });
    await AsyncStorage.removeItem('experienceGain');
    await AsyncStorage.removeItem('experienceGainApplied');
    
    return newExp;
  }
};
      `
    },
    {
      title: '4. 添加调试日志和监控',
      description: '添加详细的日志来跟踪经验值变化',
      code: `
// 调试日志
const experienceLogger = {
  info(message, data) {
    console.log('[经验值] ' + message, data);
  },
  
  logExperienceChange(oldExp, newExp, reason) {
    this.info('经验值变化', {
      oldExp,
      newExp,
      change: newExp - oldExp,
      reason,
      timestamp: new Date().toISOString()
    });
  }
};
      `
    }
  ];
  
  recommendations.forEach((rec, index) => {
    console.log(`${rec.title}`);
    console.log(`${rec.description}`);
    console.log(`代码示例:`);
    console.log(rec.code);
    console.log('');
  });
}

// 主函数
async function main() {
  console.log('🎯 经验值重复计算问题详细分析报告\n');
  console.log('=' .repeat(80));
  
  // 1. 分析代码模式
  const codeAnalysis = analyzeCodePatterns();
  
  // 2. 模拟问题
  const simulation = simulateExperienceDuplication();
  
  // 3. 运行模拟
  console.log('🚀 开始模拟经验值重复计算场景...\n');
  
  // 第一次调用 - 应该正常应用经验值
  const result1 = await simulation.simulateLoadUserStats();
  console.log(`📊 第一次调用结果: experience = ${result1.experience}`);
  
  // 第二次调用 - 可能重复应用经验值
  const result2 = await simulation.simulateLoadBackendData();
  console.log(`📊 第二次调用结果: experience = ${result2.experience}`);
  
  // 第三次调用 - 再次可能重复应用
  const result3 = await simulation.simulateGetCurrentUserData();
  console.log(`📊 第三次调用结果: experience = ${result3.currentExperience}`);
  
  // 分析访问日志
  console.log('\n📋 AsyncStorage 访问日志:');
  simulation.mockStorage.getAccessLog().forEach((log, index) => {
    console.log(`  ${index + 1}. ${log.type} ${log.key}${log.value ? ` = ${log.value}` : ''}`);
  });
  
  // 4. 生成修复建议
  generateFixRecommendations();
  
  console.log('=' .repeat(80));
  console.log('✅ 详细分析完成');
}

// 运行分析
main().catch(console.error); 