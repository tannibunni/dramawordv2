const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// 清理订阅相关缓存
async function clearSubscriptionCache() {
  try {
    console.log('🗑️ 开始清理订阅缓存...');
    
    // 清理所有订阅相关的缓存
    const keysToRemove = [
      'subscription_status',
      'test_subscription_state',
      'subscription_record',
      'userExperienceInfo',
      'userStats',
      'user_vocabulary',
      'shows',
      'searchHistory'
    ];
    
    for (const key of keysToRemove) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`✅ 已清理: ${key}`);
      } catch (error) {
        console.log(`⚠️ 清理失败: ${key} - ${error.message}`);
      }
    }
    
    console.log('🎉 订阅缓存清理完成！');
    console.log('📱 请重新启动应用以应用更改');
    
  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error);
  }
}

clearSubscriptionCache();
