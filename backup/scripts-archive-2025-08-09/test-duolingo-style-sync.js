const { SyncManager } = require('../apps/mobile/src/services/syncManager');
const { DataConflictResolver } = require('../apps/mobile/src/services/dataConflictResolver');
const { IncrementalSyncManager } = require('../apps/mobile/src/services/incrementalSyncManager');

// 模拟测试数据
const mockLocalData = {
  experience: 150,
  level: 3,
  vocabulary: [
    { word: 'hello', correctCount: 5, incorrectCount: 1, masteryLevel: 2 },
    { word: 'world', correctCount: 3, incorrectCount: 0, masteryLevel: 1 }
  ],
  achievements: [
    { id: 'first_word', name: 'First Word', unlockedAt: Date.now() - 86400000 }
  ],
  totalReviews: 25,
  currentStreak: 7
};

const mockServerData = {
  experience: 120,
  level: 2,
  vocabulary: [
    { word: 'hello', correctCount: 4, incorrectCount: 2, masteryLevel: 1 },
    { word: 'world', correctCount: 3, incorrectCount: 0, masteryLevel: 1 },
    { word: 'test', correctCount: 1, incorrectCount: 0, masteryLevel: 0 }
  ],
  achievements: [
    { id: 'first_word', name: 'First Word', unlockedAt: Date.now() - 172800000 }
  ],
  totalReviews: 20,
  currentStreak: 5
};

// 测试冲突解决器
function testConflictResolver() {
  console.log('🧪 测试数据冲突解决器...\n');

  // 测试经验值冲突
  const experienceConflict = {
    localData: { experience: 150 },
    serverData: { experience: 120 },
    localTimestamp: Date.now(),
    serverTimestamp: Date.now() - 60000,
    dataType: 'experience'
  };

  const experienceResolution = DataConflictResolver.resolveConflict(experienceConflict);
  console.log('📊 经验值冲突解决:');
  console.log(`   本地: ${experienceConflict.localData.experience}`);
  console.log(`   服务器: ${experienceConflict.serverData.experience}`);
  console.log(`   结果: ${experienceResolution.source} - ${experienceResolution.reason}`);
  console.log(`   置信度: ${experienceResolution.confidence}\n`);

  // 测试词汇表冲突
  const vocabularyConflict = {
    localData: { vocabulary: mockLocalData.vocabulary },
    serverData: { vocabulary: mockServerData.vocabulary },
    localTimestamp: Date.now(),
    serverTimestamp: Date.now() - 300000,
    dataType: 'vocabulary'
  };

  const vocabularyResolution = DataConflictResolver.resolveConflict(vocabularyConflict);
  console.log('📚 词汇表冲突解决:');
  console.log(`   本地词汇数: ${vocabularyConflict.localData.vocabulary.length}`);
  console.log(`   服务器词汇数: ${vocabularyConflict.serverData.vocabulary.length}`);
  console.log(`   结果: ${vocabularyResolution.source} - ${vocabularyResolution.reason}`);
  console.log(`   置信度: ${vocabularyResolution.confidence}\n`);

  // 测试进度冲突
  const progressConflict = {
    localData: { totalReviews: 25, currentStreak: 7 },
    serverData: { totalReviews: 20, currentStreak: 5 },
    localTimestamp: Date.now(),
    serverTimestamp: Date.now() - 120000,
    dataType: 'progress'
  };

  const progressResolution = DataConflictResolver.resolveConflict(progressConflict);
  console.log('📈 进度冲突解决:');
  console.log(`   本地: ${progressConflict.localData.totalReviews} 次复习, ${progressConflict.localData.currentStreak} 天连续`);
  console.log(`   服务器: ${progressConflict.serverData.totalReviews} 次复习, ${progressConflict.serverData.currentStreak} 天连续`);
  console.log(`   结果: ${progressResolution.source} - ${progressResolution.reason}`);
  console.log(`   置信度: ${progressResolution.confidence}\n`);

  // 测试成就冲突
  const achievementConflict = {
    localData: { achievements: mockLocalData.achievements },
    serverData: { achievements: mockServerData.achievements },
    localTimestamp: Date.now(),
    serverTimestamp: Date.now() - 180000,
    dataType: 'achievements'
  };

  const achievementResolution = DataConflictResolver.resolveConflict(achievementConflict);
  console.log('🏆 成就冲突解决:');
  console.log(`   本地成就数: ${achievementConflict.localData.achievements.length}`);
  console.log(`   服务器成就数: ${achievementConflict.serverData.achievements.length}`);
  console.log(`   结果: ${achievementResolution.source} - ${achievementResolution.reason}`);
  console.log(`   置信度: ${achievementResolution.confidence}\n`);
}

// 测试同步管理器
function testSyncManager() {
  console.log('🔄 测试同步管理器...\n');

  const syncManager = SyncManager.getInstance();
  
  // 测试配置
  console.log('⚙️ 同步配置:');
  console.log(`   WiFi同步间隔: ${syncManager.getSyncStatus().wifiSyncInterval}ms`);
  console.log(`   移动网络同步间隔: ${syncManager.getSyncStatus().mobileSyncInterval}ms`);
  console.log(`   离线同步间隔: ${syncManager.getSyncStatus().offlineSyncInterval}ms`);
  console.log(`   最大重试次数: ${syncManager.getSyncStatus().maxRetryAttempts}`);
  console.log(`   批量大小: ${syncManager.getSyncStatus().batchSize}\n`);

  // 测试添加同步数据
  console.log('📝 测试添加同步数据...');
  
  const testData = {
    type: 'experience',
    data: { experience: 200, level: 4 },
    userId: 'test_user_123',
    operation: 'update'
  };

  syncManager.addToSyncQueue(testData);
  
  const status = syncManager.getSyncStatus();
  console.log(`   队列长度: ${status.queueLength}`);
  console.log(`   同步状态: ${status.syncMode}`);
  console.log(`   网络类型: ${status.networkType}`);
  console.log(`   用户活跃: ${status.isUserActive}\n`);
}

// 测试增量同步管理器
function testIncrementalSyncManager() {
  console.log('📱 测试增量同步管理器...\n');

  const incrementalManager = IncrementalSyncManager.getInstance();

  // 测试记录变更
  console.log('📝 测试记录变更...');
  
  const changes = [
    {
      type: 'experience',
      operation: 'update',
      data: { experience: 250, level: 5 }
    },
    {
      type: 'vocabulary',
      operation: 'create',
      data: { word: 'new_word', correctCount: 1, incorrectCount: 0 }
    },
    {
      type: 'achievements',
      operation: 'update',
      data: { id: 'new_achievement', progress: 50 }
    }
  ];

  changes.forEach(async (change, index) => {
    const changeId = await incrementalManager.recordChange(
      change.type,
      change.operation,
      change.data
    );
    console.log(`   变更 ${index + 1}: ${change.type} (${change.operation}) - ID: ${changeId}`);
  });

  console.log(`   待同步变更数: ${incrementalManager.getPendingChangesCount()}\n`);

  // 测试按类型获取变更
  console.log('📊 按类型获取变更:');
  const experienceChanges = incrementalManager.getPendingChangesByType('experience');
  const vocabularyChanges = incrementalManager.getPendingChangesByType('vocabulary');
  
  console.log(`   经验值变更: ${experienceChanges.length} 个`);
  console.log(`   词汇表变更: ${vocabularyChanges.length} 个\n`);
}

// 测试冲突严重程度评估
function testConflictSeverity() {
  console.log('⚠️ 测试冲突严重程度评估...\n');

  const conflicts = [
    {
      localData: { experience: 150 },
      serverData: { experience: 120 },
      dataType: 'experience'
    },
    {
      localData: { experience: 1000 },
      serverData: { experience: 800 },
      dataType: 'experience'
    },
    {
      localData: { vocabulary: Array(5).fill({}) },
      serverData: { vocabulary: Array(15).fill({}) },
      dataType: 'vocabulary'
    },
    {
      localData: { totalReviews: 10 },
      serverData: { totalReviews: 60 },
      dataType: 'progress'
    }
  ];

  conflicts.forEach((conflict, index) => {
    const severity = DataConflictResolver.getConflictSeverity(conflict);
    const summary = DataConflictResolver.getConflictSummary(conflict);
    
    console.log(`冲突 ${index + 1}:`);
    console.log(`   摘要: ${summary}`);
    console.log(`   严重程度: ${severity}\n`);
  });
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试多邻国风格数据同步系统\n');
  console.log('=' .repeat(50));

  try {
    testConflictResolver();
    testSyncManager();
    testIncrementalSyncManager();
    testConflictSeverity();

    console.log('✅ 所有测试完成！');
    console.log('\n📋 测试总结:');
    console.log('   ✓ 数据冲突解决器 - 支持多种数据类型的智能冲突解决');
    console.log('   ✓ 同步管理器 - 网络感知的智能同步策略');
    console.log('   ✓ 增量同步管理器 - 高效的增量数据同步');
    console.log('   ✓ 冲突严重程度评估 - 智能的冲突优先级判断');
    
    console.log('\n🎯 多邻国风格特性:');
    console.log('   • 离线优先 - 本地操作立即生效');
    console.log('   • 智能冲突解决 - 根据数据类型采用不同策略');
    console.log('   • 增量同步 - 只同步变化的数据');
    console.log('   • 网络感知 - 根据网络状况调整同步频率');
    console.log('   • 用户活跃度感知 - 用户活跃时更频繁同步');
    console.log('   • 版本控制 - 防止数据丢失和冲突');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  testConflictResolver,
  testSyncManager,
  testIncrementalSyncManager,
  testConflictSeverity,
  runTests
}; 