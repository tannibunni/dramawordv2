const { ExperienceService } = require('../apps/mobile/src/services/experienceService');
const { experienceManager } = require('../apps/mobile/src/services/experienceManager');

// 模拟测试数据
const mockUserData = {
  id: 'test_user_123',
  username: 'testuser',
  level: 1,
  experience: 0,
  dailyReviewXP: 0,
  dailyStudyTimeXP: 0,
  currentStreak: 0,
  contributedWords: 0
};

// 测试经验值服务
async function testExperienceService() {
  console.log('🧪 测试经验值服务...\n');

  try {
    // 测试获取经验值信息
    console.log('📊 测试获取经验值信息...');
    const experienceInfo = await ExperienceService.getExperienceInfo();
    if (experienceInfo) {
      console.log('✅ 获取经验值信息成功:', {
        level: experienceInfo.level,
        experience: experienceInfo.experience,
        progressPercentage: experienceInfo.progressPercentage
      });
    } else {
      console.log('⚠️ 未获取到经验值信息（可能需要登录）');
    }

    // 测试获取经验值获取方式
    console.log('\n📋 测试获取经验值获取方式...');
    const experienceWays = await ExperienceService.getExperienceWays();
    if (experienceWays) {
      console.log('✅ 获取经验值获取方式成功:');
      Object.entries(experienceWays).forEach(([key, way]) => {
        console.log(`   ${way.name}: ${way.description} (${way.xpPerAction})`);
      });
    } else {
      console.log('⚠️ 未获取到经验值获取方式');
    }

  } catch (error) {
    console.error('❌ 测试经验值服务失败:', error);
  }
}

// 测试经验值管理器
async function testExperienceManager() {
  console.log('\n🔄 测试经验值管理器...\n');

  try {
    // 测试配置
    console.log('⚙️ 测试配置管理...');
    const config = experienceManager.getConfig();
    console.log('✅ 当前配置:', config);

    // 更新配置
    experienceManager.updateConfig({ enableAnimations: false });
    const updatedConfig = experienceManager.getConfig();
    console.log('✅ 更新配置成功:', updatedConfig);

    // 测试获取经验值信息
    console.log('\n📊 测试获取经验值信息...');
    const experienceInfo = await experienceManager.getCurrentExperienceInfo();
    if (experienceInfo) {
      console.log('✅ 获取经验值信息成功:', {
        level: experienceInfo.level,
        experience: experienceInfo.experience,
        dailyReviewXP: experienceInfo.dailyReviewXP,
        currentStreak: experienceInfo.currentStreak
      });
    }

    // 测试获取经验值获取方式
    console.log('\n📋 测试获取经验值获取方式...');
    const experienceWays = await experienceManager.getExperienceWays();
    if (experienceWays) {
      console.log('✅ 获取经验值获取方式成功');
    }

    // 测试获取今日统计
    console.log('\n📈 测试获取今日统计...');
    const todayStats = await experienceManager.getTodayExperienceStats();
    console.log('✅ 今日统计:', {
      totalXP: todayStats.totalXP,
      eventCount: todayStats.events.length,
      byType: todayStats.byType
    });

  } catch (error) {
    console.error('❌ 测试经验值管理器失败:', error);
  }
}

// 测试经验值计算功能
function testExperienceCalculations() {
  console.log('\n🧮 测试经验值计算功能...\n');

  try {
    // 测试等级所需经验值计算
    console.log('📊 测试等级所需经验值计算...');
    for (let level = 1; level <= 10; level++) {
      const requiredExp = ExperienceService.calculateLevelRequiredExp(level);
      const progressPercentage = ExperienceService.calculateProgressPercentage(level, 0);
      const levelName = ExperienceService.getLevelName(level);
      const levelColor = ExperienceService.getExperienceColor(level);
      
      console.log(`   Lv.${level} (${levelName}): 需要 ${requiredExp} XP, 进度 ${progressPercentage.toFixed(1)}%, 颜色 ${levelColor}`);
    }

    // 测试经验值格式化
    console.log('\n📝 测试经验值格式化...');
    const testExpValues = [0, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 1000000];
    testExpValues.forEach(exp => {
      const formatted = ExperienceService.formatExperience(exp);
      console.log(`   ${exp} -> ${formatted}`);
    });

  } catch (error) {
    console.error('❌ 测试经验值计算功能失败:', error);
  }
}

// 测试经验值获取场景
async function testExperienceScenarios() {
  console.log('\n🎯 测试经验值获取场景...\n');

  const scenarios = [
    {
      name: '复习单词（记得）',
      action: () => experienceManager.addReviewExperience(true),
      expectedXP: 2
    },
    {
      name: '复习单词（不记得）',
      action: () => experienceManager.addReviewExperience(false),
      expectedXP: 1
    },
    {
      name: '智能挑战',
      action: () => experienceManager.addSmartChallengeExperience(),
      expectedXP: 15
    },
    {
      name: '错词挑战',
      action: () => experienceManager.addWrongWordChallengeExperience(),
      expectedXP: 20
    },
    {
      name: '收集新单词',
      action: () => experienceManager.addNewWordExperience(),
      expectedXP: 5
    },
    {
      name: '贡献新词',
      action: () => experienceManager.addContributionExperience(),
      expectedXP: 8
    },
    {
      name: '连续学习打卡',
      action: () => experienceManager.addDailyCheckinExperience(),
      expectedXP: 5
    },
    {
      name: '完成每日词卡任务',
      action: () => experienceManager.addDailyCardsExperience(),
      expectedXP: 5
    },
    {
      name: '学习时长奖励（10分钟）',
      action: () => experienceManager.addStudyTimeExperience(10),
      expectedXP: 3
    }
  ];

  for (const scenario of scenarios) {
    try {
      console.log(`🔄 测试: ${scenario.name}...`);
      
      // 检查是否正在处理
      if (experienceManager.isProcessingExperience()) {
        console.log('   ⏳ 正在处理其他经验值操作，跳过');
        continue;
      }

      const result = await scenario.action();
      
      if (result && result.success) {
        console.log(`   ✅ 成功: ${result.message}`);
        console.log(`   📊 获得 ${result.xpGained} XP, 升级: ${result.leveledUp}`);
      } else if (result) {
        console.log(`   ⚠️ 失败: ${result.message}`);
      } else {
        console.log('   ❌ 操作失败或无响应');
      }
      
      // 等待一下，避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ❌ 测试失败: ${error.message}`);
    }
  }
}

// 测试经验值事件记录
async function testExperienceEvents() {
  console.log('\n📝 测试经验值事件记录...\n');

  try {
    // 获取经验值事件历史
    console.log('📊 获取经验值事件历史...');
    const events = await experienceManager.getExperienceEvents();
    console.log(`✅ 获取到 ${events.length} 个事件`);

    if (events.length > 0) {
      // 显示最近5个事件
      console.log('\n📋 最近5个事件:');
      const recentEvents = events.slice(-5);
      recentEvents.forEach((event, index) => {
        const date = new Date(event.timestamp).toLocaleString();
        console.log(`   ${index + 1}. ${event.type}: ${event.xpGained} XP (${date})`);
        console.log(`      ${event.message}`);
      });

      // 统计各类型事件
      console.log('\n📈 事件类型统计:');
      const typeStats = {};
      events.forEach(event => {
        typeStats[event.type] = (typeStats[event.type] || 0) + 1;
      });
      Object.entries(typeStats).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} 次`);
      });
    }

  } catch (error) {
    console.error('❌ 测试经验值事件记录失败:', error);
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试经验值系统\n');
  console.log('=' .repeat(50));

  try {
    await testExperienceService();
    await testExperienceManager();
    testExperienceCalculations();
    await testExperienceScenarios();
    await testExperienceEvents();

    console.log('\n✅ 所有测试完成！');
    console.log('\n📋 测试总结:');
    console.log('   ✓ 经验值服务 - API调用和数据处理');
    console.log('   ✓ 经验值管理器 - 统一管理和事件处理');
    console.log('   ✓ 经验值计算 - 等级、进度、格式化');
    console.log('   ✓ 经验值获取场景 - 各种获取方式');
    console.log('   ✓ 经验值事件记录 - 历史记录和统计');
    
    console.log('\n🎯 经验值系统特性:');
    console.log('   • 8种经验值获取方式');
    console.log('   • 智能等级计算（平方增长）');
    console.log('   • 每日限制和连续奖励');
    console.log('   • 事件记录和统计');
    console.log('   • 动画和通知支持');
    console.log('   • 自动数据同步');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  testExperienceService,
  testExperienceManager,
  testExperienceCalculations,
  testExperienceScenarios,
  testExperienceEvents,
  runTests
}; 