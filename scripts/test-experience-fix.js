const fs = require('fs');

console.log('🧪 测试经验值重复计算修复方案...\n');

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

// 模拟修复后的经验值管理器
class MockExperienceManager {
  constructor(storage) {
    this.storage = storage;
  }
  
  async checkAndApplyExperienceGain(currentExperience) {
    try {
      const gainData = await this.storage.getItem('experienceGain');
      if (!gainData) {
        return currentExperience;
      }
      
      // 检查是否已经应用过该经验值增益
      const gainAppliedKey = await this.storage.getItem('experienceGainApplied');
      if (gainAppliedKey) {
        console.log('  ✅ 经验值增益已应用过，跳过重复计算');
        return currentExperience;
      }
      
      const gainedExp = JSON.parse(gainData);
      const finalExperience = currentExperience + gainedExp;
      
      // 标记为已应用
      await this.storage.setItem('experienceGainApplied', Date.now().toString());
      
      console.log(`  📈 应用经验值增益: ${currentExperience} + ${gainedExp} = ${finalExperience}`);
      
      return finalExperience;
    } catch (error) {
      console.error('  ❌ 检查并应用经验值增益失败:', error);
      return currentExperience;
    }
  }
  
  async clearExperienceGainStatus() {
    try {
      await this.storage.removeItem('experienceGain');
      await this.storage.removeItem('experienceGainApplied');
      console.log('  🧹 清理经验值增益状态');
    } catch (error) {
      console.error('  ❌ 清理经验值增益状态失败:', error);
    }
  }
  
  async setExperienceGain(gainedExp) {
    try {
      await this.storage.setItem('experienceGain', JSON.stringify(gainedExp));
      // 清除之前的应用状态
      await this.storage.removeItem('experienceGainApplied');
      console.log(`  📝 设置新的经验值增益: ${gainedExp}`);
    } catch (error) {
      console.error('  ❌ 设置经验值增益失败:', error);
    }
  }
}

// 模拟修复后的函数
class MockFixedFunctions {
  constructor(storage, experienceManager) {
    this.storage = storage;
    this.experienceManager = experienceManager;
  }
  
  // 模拟修复后的loadUserStats函数
  async simulateLoadUserStats() {
    console.log('🔄 模拟修复后的 loadUserStats 函数执行...');
    
    const localStatsData = await this.storage.getItem('userStats');
    const localStats = JSON.parse(localStatsData);
    
    // 使用统一的经验值处理函数，防止重复计算
    const finalExperience = await this.experienceManager.checkAndApplyExperienceGain(localStats.experience || 0);
    
    const updatedStats = {
      ...localStats,
      experience: finalExperience
    };
    
    await this.storage.setItem('userStats', JSON.stringify(updatedStats));
    console.log(`  💾 保存更新后的统计数据: experience = ${updatedStats.experience}`);
    console.log('');
    
    return updatedStats;
  }
  
  // 模拟修复后的loadBackendData函数
  async simulateLoadBackendData() {
    console.log('🔄 模拟修复后的 loadBackendData 函数执行...');
    
    // 模拟后端返回的数据 - 后端可能已经更新了经验值
    const currentStats = await this.storage.getItem('userStats');
    const currentData = JSON.parse(currentStats);
    
    const backendData = {
      experience: currentData.experience, // 使用当前已更新的经验值
      level: 1,
      collectedWords: 10,
      contributedWords: 5,
      totalReviews: 20,
      currentStreak: 3
    };
    
    // 使用统一的经验值处理函数，防止重复计算
    const finalExperience = await this.experienceManager.checkAndApplyExperienceGain(backendData.experience || 0);
    
    const backendStats = {
      experience: finalExperience,
      level: backendData.level || 1,
      collectedWords: 10,
      contributedWords: backendData.contributedWords || 0,
      totalReviews: backendData.totalReviews || 0,
      currentStreak: backendData.currentStreak || 0
    };
    
    await this.storage.setItem('userStats', JSON.stringify(backendStats));
    console.log(`  💾 保存更新后的统计数据: experience = ${backendStats.experience}`);
    console.log('');
    
    return backendStats;
  }
  
  // 模拟修复后的getCurrentUserData函数
  async simulateGetCurrentUserData() {
    console.log('🔄 模拟修复后的 getCurrentUserData 函数执行...');
    
    const statsData = await this.storage.getItem('userStats');
    const stats = JSON.parse(statsData);
    
    // 使用统一的经验值处理函数，防止重复计算
    const finalExperience = await this.experienceManager.checkAndApplyExperienceGain(stats.experience || 0);
    
    console.log(`  📊 返回用户数据: experience = ${finalExperience}`);
    console.log('');
    
    return {
      currentExperience: finalExperience,
      userStats: { ...stats, experience: finalExperience }
    };
  }
}

// 测试修复效果
async function testFix() {
  console.log('🎯 开始测试修复效果...\n');
  
  const mockStorage = new MockAsyncStorage();
  const experienceManager = new MockExperienceManager(mockStorage);
  const fixedFunctions = new MockFixedFunctions(mockStorage, experienceManager);
  
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
  await experienceManager.setExperienceGain(50);
  
  console.log('📊 初始状态:');
  console.log('  userStats.experience: 100');
  console.log('  experienceGain: 50');
  console.log('');
  
  // 第一次调用 - 应该正常应用经验值
  const result1 = await fixedFunctions.simulateLoadUserStats();
  console.log(`📊 第一次调用结果: experience = ${result1.experience}`);
  
  // 第二次调用 - 应该跳过重复应用
  const result2 = await fixedFunctions.simulateLoadBackendData();
  console.log(`📊 第二次调用结果: experience = ${result2.experience}`);
  
  // 第三次调用 - 应该跳过重复应用
  const result3 = await fixedFunctions.simulateGetCurrentUserData();
  console.log(`📊 第三次调用结果: experience = ${result3.currentExperience}`);
  
  // 分析访问日志
  console.log('\n📋 AsyncStorage 访问日志:');
  mockStorage.getAccessLog().forEach((log, index) => {
    console.log(`  ${index + 1}. ${log.type} ${log.key}${log.value ? ` = ${log.value}` : ''}`);
  });
  
  // 验证修复效果
  console.log('\n🔍 修复效果验证:');
  const expectedExperience = 150; // 100 + 50
  const actualExperience = result3.currentExperience;
  
  if (actualExperience === expectedExperience) {
    console.log('  ✅ 修复成功！经验值没有重复计算');
    console.log(`     期望经验值: ${expectedExperience}`);
    console.log(`     实际经验值: ${actualExperience}`);
  } else {
    console.log('  ❌ 修复失败！经验值仍然重复计算');
    console.log(`     期望经验值: ${expectedExperience}`);
    console.log(`     实际经验值: ${actualExperience}`);
  }
  
  // 检查是否设置了应用标记
  const gainAppliedKey = await mockStorage.getItem('experienceGainApplied');
  if (gainAppliedKey) {
    console.log('  ✅ 经验值增益应用标记已设置');
  } else {
    console.log('  ❌ 经验值增益应用标记未设置');
  }
  
  return {
    success: actualExperience === expectedExperience,
    expectedExperience,
    actualExperience,
    gainAppliedKey: !!gainAppliedKey
  };
}

// 测试清理功能
async function testCleanup() {
  console.log('\n🧹 测试清理功能...\n');
  
  const mockStorage = new MockAsyncStorage();
  const experienceManager = new MockExperienceManager(mockStorage);
  
  // 设置一些数据
  await experienceManager.setExperienceGain(30);
  await experienceManager.checkAndApplyExperienceGain(100);
  
  console.log('📊 清理前状态:');
  console.log(`  experienceGain: ${await mockStorage.getItem('experienceGain')}`);
  console.log(`  experienceGainApplied: ${await mockStorage.getItem('experienceGainApplied')}`);
  
  // 执行清理
  await experienceManager.clearExperienceGainStatus();
  
  console.log('\n📊 清理后状态:');
  console.log(`  experienceGain: ${await mockStorage.getItem('experienceGain')}`);
  console.log(`  experienceGainApplied: ${await mockStorage.getItem('experienceGainApplied')}`);
  
  const gainCleared = !(await mockStorage.getItem('experienceGain'));
  const appliedCleared = !(await mockStorage.getItem('experienceGainApplied'));
  
  if (gainCleared && appliedCleared) {
    console.log('  ✅ 清理功能正常');
  } else {
    console.log('  ❌ 清理功能异常');
  }
  
  return { gainCleared, appliedCleared };
}

// 主测试函数
async function main() {
  console.log('🎯 经验值重复计算修复测试报告\n');
  console.log('=' .repeat(60));
  
  try {
    // 测试修复效果
    const fixResult = await testFix();
    
    // 测试清理功能
    const cleanupResult = await testCleanup();
    
    // 总结
    console.log('\n📝 测试总结:');
    console.log(`  修复效果: ${fixResult.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`  清理功能: ${cleanupResult.gainCleared && cleanupResult.appliedCleared ? '✅ 正常' : '❌ 异常'}`);
    
    if (fixResult.success && cleanupResult.gainCleared && cleanupResult.appliedCleared) {
      console.log('\n🎉 所有测试通过！修复方案有效');
    } else {
      console.log('\n⚠️ 部分测试失败，需要进一步检查');
    }
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ 测试完成');
}

// 运行测试
main().catch(console.error); 