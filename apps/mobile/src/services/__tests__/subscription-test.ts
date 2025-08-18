// 订阅服务功能测试脚本
// 在开发环境中运行此脚本来测试订阅功能

import { subscriptionService } from '../subscriptionService';
import { iapService } from '../iapService';

console.log('🧪 开始测试订阅服务功能...\n');

// 测试1: 初始化服务
async function testInitialization() {
  console.log('📱 测试1: 服务初始化');
  try {
    await subscriptionService.initialize();
    console.log('✅ 订阅服务初始化成功');
    
    await iapService.initialize();
    console.log('✅ IAP服务初始化成功');
  } catch (error) {
    console.error('❌ 服务初始化失败:', error);
  }
  console.log('');
}

// 测试2: 获取订阅计划
async function testGetSubscriptionPlans() {
  console.log('📋 测试2: 获取订阅计划');
  try {
    const plans = subscriptionService.getSubscriptionPlans();
    console.log('✅ 获取订阅计划成功:', plans.length, '个计划');
    
    plans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.name}: ${plan.price}`);
      console.log(`      描述: ${plan.description}`);
    });
  } catch (error) {
    console.error('❌ 获取订阅计划失败:', error);
  }
  console.log('');
}

// 测试3: 检查订阅状态
async function testSubscriptionStatus() {
  console.log('🔍 测试3: 检查订阅状态');
  try {
    const status = await subscriptionService.checkSubscriptionStatus();
    console.log('✅ 订阅状态检查成功');
    console.log('   当前状态:', status.isActive ? '已订阅' : '未订阅');
    
    if (status.isActive) {
      console.log('   产品ID:', status.productId);
      console.log('   到期时间:', status.expiresAt?.toLocaleDateString());
    }
  } catch (error) {
    console.error('❌ 订阅状态检查失败:', error);
  }
  console.log('');
}

// 测试4: 功能权限检查
async function testFeaturePermissions() {
  console.log('🔒 测试4: 功能权限检查');
  try {
    const permissions = subscriptionService.getFeaturePermissions();
    console.log('✅ 功能权限检查成功:', permissions.length, '个功能');
    
    permissions.forEach(permission => {
      const status = permission.isAccessible ? '✅ 可用' : '❌ 需要订阅';
      console.log(`   ${permission.feature}: ${status}`);
      if (permission.requiresSubscription) {
        console.log(`      提示: ${permission.message}`);
      }
    });
  } catch (error) {
    console.error('❌ 功能权限检查失败:', error);
  }
  console.log('');
}

// 测试5: 语言权限检查
async function testLanguagePermissions() {
  console.log('🌍 测试5: 语言权限检查');
  try {
    const languages = ['zh', 'en', 'ja', 'ko', 'es'];
    
    languages.forEach(lang => {
      const canAccess = subscriptionService.canAccessLanguage(lang);
      const status = canAccess ? '✅ 支持' : '❌ 需要订阅';
      console.log(`   ${lang}: ${status}`);
    });
  } catch (error) {
    console.error('❌ 语言权限检查失败:', error);
  }
  console.log('');
}

// 测试6: 模拟订阅流程
async function testMockSubscription() {
  console.log('💳 测试6: 模拟订阅流程');
  try {
    // 选择月度订阅
    const monthlyPlan = subscriptionService.getSubscriptionPlans().find(p => p.id.includes('monthly'));
    if (!monthlyPlan) {
      console.log('❌ 未找到月度订阅计划');
      return;
    }
    
    console.log(`   尝试订阅: ${monthlyPlan.name}`);
    const result = await subscriptionService.subscribeToPlan(monthlyPlan.id);
    
    if (result.success) {
      console.log('✅ 模拟订阅成功!');
      console.log('   交易ID:', result.transactionId);
      console.log('   收据:', result.receipt);
      
      // 检查订阅状态变化
      const newStatus = await subscriptionService.checkSubscriptionStatus();
      console.log('   新订阅状态:', newStatus.isActive ? '已订阅' : '未订阅');
    } else {
      console.log('❌ 模拟订阅失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 模拟订阅流程失败:', error);
  }
  console.log('');
}

// 测试7: 恢复购买
async function testRestorePurchases() {
  console.log('🔄 测试7: 恢复购买');
  try {
    const results = await subscriptionService.restorePurchases();
    console.log('✅ 恢复购买检查完成');
    
    if (results.some(r => r.success)) {
      console.log('   找到可恢复的购买记录');
      results.forEach((result, index) => {
        if (result.success) {
          console.log(`   ${index + 1}. 产品ID: ${result.productId}`);
        }
      });
    } else {
      console.log('   没有找到可恢复的购买记录');
    }
  } catch (error) {
    console.error('❌ 恢复购买失败:', error);
  }
  console.log('');
}

// 测试8: 升级提示消息
async function testUpgradePrompts() {
  console.log('💡 测试8: 升级提示消息');
  try {
    const features = ['other_languages', 'word_storage', 'ai_definition'];
    
    features.forEach(feature => {
      const shouldShow = subscriptionService.shouldShowUpgradePrompt(feature);
      const message = subscriptionService.getUpgradePromptMessage(feature);
      
      console.log(`   ${feature}:`);
      console.log(`      需要显示提示: ${shouldShow ? '是' : '否'}`);
      console.log(`      提示消息: ${message}`);
    });
  } catch (error) {
    console.error('❌ 升级提示测试失败:', error);
  }
  console.log('');
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始运行所有测试...\n');
  
  await testInitialization();
  await testGetSubscriptionPlans();
  await testSubscriptionStatus();
  await testFeaturePermissions();
  await testLanguagePermissions();
  await testMockSubscription();
  await testRestorePurchases();
  await testUpgradePrompts();
  
  console.log('🎉 所有测试完成!');
  console.log('\n📝 测试总结:');
  console.log('- 如果看到 ✅ 表示功能正常');
  console.log('- 如果看到 ❌ 表示功能异常');
  console.log('- 开发阶段使用模拟数据，不会产生真实费用');
}

// 运行测试
runAllTests().catch(console.error);
