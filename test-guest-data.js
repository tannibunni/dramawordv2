const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// 模拟游客模式的数据存储
async function testGuestDataStorage() {
  console.log('🧪 测试游客模式数据存储...');
  
  // 模拟游客ID
  const guestId = 'guest_1234567890_abc123';
  
  // 测试数据
  const testStats = {
    collectedWords: 10,
    contributedWords: 5,
    totalReviews: 25,
    currentStreak: 7,
    lastStudyDate: new Date().toDateString()
  };
  
  try {
    // 1. 存储数据到游客专用键
    const guestKey = `guest_${guestId}_userStats`;
    await AsyncStorage.setItem(guestKey, JSON.stringify({
      data: testStats,
      timestamp: Date.now(),
      guestId: guestId,
      version: 1
    }));
    console.log('✅ 数据已存储到:', guestKey);
    
    // 2. 读取数据
    const storedData = await AsyncStorage.getItem(guestKey);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      console.log('✅ 读取到的数据:', parsed.data);
      console.log('📊 totalReviews:', parsed.data.totalReviews);
      console.log('📅 currentStreak:', parsed.data.currentStreak);
    }
    
    // 3. 模拟增加复习次数
    const updatedStats = {
      ...testStats,
      totalReviews: testStats.totalReviews + 1
    };
    
    await AsyncStorage.setItem(guestKey, JSON.stringify({
      data: updatedStats,
      timestamp: Date.now(),
      guestId: guestId,
      version: 1
    }));
    console.log('✅ 复习次数已更新:', updatedStats.totalReviews);
    
    // 4. 再次读取验证
    const finalData = await AsyncStorage.getItem(guestKey);
    if (finalData) {
      const finalParsed = JSON.parse(finalData);
      console.log('✅ 最终数据:', finalParsed.data);
      console.log('📊 最终totalReviews:', finalParsed.data.totalReviews);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testGuestDataStorage();
