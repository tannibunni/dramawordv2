// 智能同步策略测试脚本
const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// 测试用户数据
const testUsers = [
  {
    userId: 'high_activity_user',
    activityData: {
      userId: 'high_activity_user',
      lastLoginAt: new Date(),
      loginCount: 50,
      totalSessionTime: 7200000, // 2小时
      averageSessionTime: 1800000, // 30分钟
      actionsPerDay: 200,
      dataSyncFrequency: 100,
      lastSyncAt: new Date(),
      deviceCount: 3,
      timezone: 'Asia/Shanghai',
      language: 'zh-CN'
    },
    context: {
      networkType: 'wifi',
      batteryLevel: 80,
      timeOfDay: 14,
      deviceType: 'mobile'
    }
  },
  {
    userId: 'medium_activity_user',
    activityData: {
      userId: 'medium_activity_user',
      lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
      loginCount: 20,
      totalSessionTime: 3600000, // 1小时
      averageSessionTime: 900000, // 15分钟
      actionsPerDay: 80,
      dataSyncFrequency: 30,
      lastSyncAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6小时前
      deviceCount: 2,
      timezone: 'America/New_York',
      language: 'en-US'
    },
    context: {
      networkType: 'cellular',
      batteryLevel: 60,
      timeOfDay: 20,
      deviceType: 'tablet'
    }
  },
  {
    userId: 'low_activity_user',
    activityData: {
      userId: 'low_activity_user',
      lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
      loginCount: 5,
      totalSessionTime: 900000, // 15分钟
      averageSessionTime: 300000, // 5分钟
      actionsPerDay: 20,
      dataSyncFrequency: 5,
      lastSyncAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
      deviceCount: 1,
      timezone: 'Europe/London',
      language: 'en-GB'
    },
    context: {
      networkType: 'cellular',
      batteryLevel: 30,
      timeOfDay: 22,
      deviceType: 'mobile'
    }
  },
  {
    userId: 'inactive_user',
    activityData: {
      userId: 'inactive_user',
      lastLoginAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
      loginCount: 1,
      totalSessionTime: 300000, // 5分钟
      averageSessionTime: 300000, // 5分钟
      actionsPerDay: 2,
      dataSyncFrequency: 1,
      lastSyncAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
      deviceCount: 1,
      timezone: 'UTC',
      language: 'en-US'
    },
    context: {
      networkType: 'offline',
      batteryLevel: 10,
      timeOfDay: 2,
      deviceType: 'mobile'
    }
  }
];

// 测试智能同步策略
async function testSmartSyncStrategy() {
  console.log('🧪 开始测试智能同步策略\n');
  
  const results = [];
  
  for (const testUser of testUsers) {
    try {
      console.log(`👤 测试用户: ${testUser.userId}`);
      console.log(`📊 活跃度数据:`, {
        loginCount: testUser.activityData.loginCount,
        totalSessionTime: Math.round(testUser.activityData.totalSessionTime / 1000 / 60) + '分钟',
        actionsPerDay: testUser.activityData.actionsPerDay,
        deviceCount: testUser.activityData.deviceCount
      });
      console.log(`🌐 上下文:`, testUser.context);
      
      // 测试获取同步策略
      const strategyResponse = await fetch(`${API_BASE_URL}/api/smart-sync/strategy/${testUser.userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Network-Type': testUser.context.networkType,
          'X-Battery-Level': testUser.context.batteryLevel.toString(),
          'X-Timezone': testUser.activityData.timezone,
          'Accept-Language': testUser.activityData.language
        }
      });
      
      if (!strategyResponse.ok) {
        throw new Error(`HTTP ${strategyResponse.status}: ${strategyResponse.statusText}`);
      }
      
      const strategyResult = await strategyResponse.json();
      
      if (strategyResult.success) {
        const strategy = strategyResult.data.strategy;
        const activityLevel = strategyResult.data.context.activityLevel;
        
        console.log(`✅ 同步策略获取成功:`);
        console.log(`  - 活跃度等级: ${activityLevel.level}`);
        console.log(`  - 活跃度分数: ${activityLevel.score}`);
        console.log(`  - 同步间隔: ${strategy.syncInterval}ms (${Math.round(strategy.syncInterval / 1000)}秒)`);
        console.log(`  - 批量大小: ${strategy.batchSize}`);
        console.log(`  - 实时同步: ${strategy.enableRealTimeSync ? '是' : '否'}`);
        console.log(`  - 压缩传输: ${strategy.enableCompression ? '是' : '否'}`);
        console.log(`  - 去重处理: ${strategy.enableDeduplication ? '是' : '否'}`);
        console.log(`  - 网络优化: ${strategy.networkOptimization ? '是' : '否'}`);
        console.log(`  - 电池优化: ${strategy.batteryOptimization ? '是' : '否'}`);
        console.log(`  - 离线优先: ${strategy.offlineFirst ? '是' : '否'}`);
        console.log(`  - 影响因素: ${activityLevel.factors.join(', ')}`);
        console.log(`  - 优化建议: ${activityLevel.recommendations.join(', ')}`);
        
        results.push({
          userId: testUser.userId,
          success: true,
          activityLevel: activityLevel.level,
          score: activityLevel.score,
          syncInterval: strategy.syncInterval,
          batchSize: strategy.batchSize,
          enableRealTimeSync: strategy.enableRealTimeSync,
          enableCompression: strategy.enableCompression,
          factors: activityLevel.factors,
          recommendations: activityLevel.recommendations
        });
      } else {
        throw new Error(strategyResult.message || '获取同步策略失败');
      }
      
    } catch (error) {
      console.error(`❌ 测试用户 ${testUser.userId} 失败:`, error.message);
      results.push({
        userId: testUser.userId,
        success: false,
        error: error.message
      });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
  
  return results;
}

// 测试活跃度分析
async function testActivityAnalysis() {
  console.log('📊 开始测试活跃度分析\n');
  
  const results = [];
  
  for (const testUser of testUsers) {
    try {
      console.log(`👤 分析用户: ${testUser.userId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/smart-sync/activity/${testUser.userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const activityLevel = result.data.activityLevel;
        const activityData = result.data.activityData;
        
        console.log(`✅ 活跃度分析成功:`);
        console.log(`  - 等级: ${activityLevel.level}`);
        console.log(`  - 分数: ${activityLevel.score}`);
        console.log(`  - 置信度: ${(activityLevel.confidence * 100).toFixed(1)}%`);
        console.log(`  - 影响因素: ${activityLevel.factors.join(', ')}`);
        console.log(`  - 优化建议: ${activityLevel.recommendations.join(', ')}`);
        console.log(`  - 登录次数: ${activityData.loginCount}`);
        console.log(`  - 总会话时间: ${Math.round(activityData.totalSessionTime / 1000 / 60)}分钟`);
        console.log(`  - 每日操作: ${activityData.actionsPerDay}`);
        console.log(`  - 设备数量: ${activityData.deviceCount}`);
        
        results.push({
          userId: testUser.userId,
          success: true,
          activityLevel: activityLevel.level,
          score: activityLevel.score,
          confidence: activityLevel.confidence,
          factors: activityLevel.factors,
          recommendations: activityLevel.recommendations
        });
      } else {
        throw new Error(result.message || '活跃度分析失败');
      }
      
    } catch (error) {
      console.error(`❌ 分析用户 ${testUser.userId} 失败:`, error.message);
      results.push({
        userId: testUser.userId,
        success: false,
        error: error.message
      });
    }
    
    console.log('\n' + '-'.repeat(60) + '\n');
  }
  
  return results;
}

// 测试智能同步统计
async function testSmartSyncStats() {
  console.log('📈 开始测试智能同步统计\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/smart-sync/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      const data = result.data;
      const activityStats = data.activityStats;
      const strategyStats = data.strategyStats;
      const summary = data.summary;
      
      console.log(`✅ 智能同步统计获取成功:`);
      console.log(`📊 活跃度统计:`);
      console.log(`  - 总用户数: ${activityStats.totalUsers}`);
      console.log(`  - 高活跃用户: ${activityStats.highActivity}`);
      console.log(`  - 中活跃用户: ${activityStats.mediumActivity}`);
      console.log(`  - 低活跃用户: ${activityStats.lowActivity}`);
      console.log(`  - 非活跃用户: ${activityStats.inactiveUsers}`);
      console.log(`  - 平均活跃度分数: ${activityStats.averageScore}`);
      
      console.log(`⚙️ 策略统计:`);
      console.log(`  - 总用户数: ${strategyStats.totalUsers}`);
      console.log(`  - 高活跃用户: ${strategyStats.highActivityUsers}`);
      console.log(`  - 中活跃用户: ${strategyStats.mediumActivityUsers}`);
      console.log(`  - 低活跃用户: ${strategyStats.lowActivityUsers}`);
      console.log(`  - 非活跃用户: ${strategyStats.inactiveUsers}`);
      console.log(`  - 平均同步间隔: ${Math.round(strategyStats.averageSyncInterval / 1000)}秒`);
      console.log(`  - 平均批量大小: ${strategyStats.averageBatchSize}`);
      
      console.log(`📈 总结:`);
      console.log(`  - 总活跃用户: ${summary.totalActiveUsers}`);
      console.log(`  - 高活跃比例: ${summary.highActivityPercentage}`);
      console.log(`  - 平均活跃度分数: ${summary.averageActivityScore}`);
      console.log(`  - 平均同步间隔: ${summary.averageSyncInterval}`);
      console.log(`  - 平均批量大小: ${summary.averageBatchSize}`);
      
      return data;
    } else {
      throw new Error(result.message || '获取统计失败');
    }
  } catch (error) {
    console.error(`❌ 获取智能同步统计失败:`, error.message);
    return null;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始智能同步策略测试\n');
  
  try {
    // 测试同步策略
    const strategyResults = await testSmartSyncStrategy();
    
    // 测试活跃度分析
    const analysisResults = await testActivityAnalysis();
    
    // 测试统计
    const statsResult = await testSmartSyncStats();
    
    // 输出测试总结
    console.log('\n🎯 测试总结:');
    console.log('='.repeat(80));
    
    console.log(`\n📊 同步策略测试结果:`);
    const successfulStrategies = strategyResults.filter(r => r.success);
    const failedStrategies = strategyResults.filter(r => !r.success);
    
    console.log(`  - 成功: ${successfulStrategies.length}/${strategyResults.length}`);
    console.log(`  - 失败: ${failedStrategies.length}/${strategyResults.length}`);
    
    if (successfulStrategies.length > 0) {
      console.log(`\n📈 策略分布:`);
      const highActivity = successfulStrategies.filter(r => r.activityLevel === 'high').length;
      const mediumActivity = successfulStrategies.filter(r => r.activityLevel === 'medium').length;
      const lowActivity = successfulStrategies.filter(r => r.activityLevel === 'low').length;
      const inactive = successfulStrategies.filter(r => r.activityLevel === 'inactive').length;
      
      console.log(`  - 高活跃: ${highActivity} 个`);
      console.log(`  - 中活跃: ${mediumActivity} 个`);
      console.log(`  - 低活跃: ${lowActivity} 个`);
      console.log(`  - 非活跃: ${inactive} 个`);
      
      console.log(`\n⚙️ 策略配置:`);
      const avgSyncInterval = successfulStrategies.reduce((sum, r) => sum + r.syncInterval, 0) / successfulStrategies.length;
      const avgBatchSize = successfulStrategies.reduce((sum, r) => sum + r.batchSize, 0) / successfulStrategies.length;
      const realTimeSyncCount = successfulStrategies.filter(r => r.enableRealTimeSync).length;
      const compressionCount = successfulStrategies.filter(r => r.enableCompression).length;
      
      console.log(`  - 平均同步间隔: ${Math.round(avgSyncInterval / 1000)}秒`);
      console.log(`  - 平均批量大小: ${Math.round(avgBatchSize)}`);
      console.log(`  - 实时同步用户: ${realTimeSyncCount} 个`);
      console.log(`  - 压缩传输用户: ${compressionCount} 个`);
    }
    
    console.log(`\n📊 活跃度分析测试结果:`);
    const successfulAnalysis = analysisResults.filter(r => r.success);
    const failedAnalysis = analysisResults.filter(r => !r.success);
    
    console.log(`  - 成功: ${successfulAnalysis.length}/${analysisResults.length}`);
    console.log(`  - 失败: ${failedAnalysis.length}/${analysisResults.length}`);
    
    if (successfulAnalysis.length > 0) {
      const avgScore = successfulAnalysis.reduce((sum, r) => sum + r.score, 0) / successfulAnalysis.length;
      const avgConfidence = successfulAnalysis.reduce((sum, r) => sum + r.confidence, 0) / successfulAnalysis.length;
      
      console.log(`  - 平均活跃度分数: ${Math.round(avgScore)}`);
      console.log(`  - 平均置信度: ${(avgConfidence * 100).toFixed(1)}%`);
    }
    
    if (failedStrategies.length > 0) {
      console.log(`\n❌ 失败详情:`);
      failedStrategies.forEach(result => {
        console.log(`  - ${result.userId}: ${result.error}`);
      });
    }
    
    console.log('\n✅ 智能同步策略测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
runAllTests().catch(console.error);
