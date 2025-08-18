// 简单的订阅服务测试
// 在React Native环境中运行

console.log('🧪 开始测试订阅服务功能...\n');

// 测试1: 检查服务是否可用
function testServiceAvailability() {
  console.log('📱 测试1: 检查服务可用性');
  
  try {
    // 检查全局对象中是否有订阅服务
    if (global.subscriptionService) {
      console.log('✅ 订阅服务在全局对象中可用');
    } else {
      console.log('❌ 订阅服务在全局对象中不可用');
    }
    
    if (global.iapService) {
      console.log('✅ IAP服务在全局对象中可用');
    } else {
      console.log('❌ IAP服务在全局对象中不可用');
    }
  } catch (error) {
    console.error('❌ 服务可用性检查失败:', error);
  }
  console.log('');
}

// 测试2: 检查AsyncStorage
async function testAsyncStorage() {
  console.log('💾 测试2: 检查AsyncStorage');
  
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    
    // 测试写入
    await AsyncStorage.setItem('test_key', 'test_value');
    console.log('✅ AsyncStorage写入测试成功');
    
    // 测试读取
    const value = await AsyncStorage.getItem('test_key');
    if (value === 'test_value') {
      console.log('✅ AsyncStorage读取测试成功');
    } else {
      console.log('❌ AsyncStorage读取测试失败');
    }
    
    // 清理测试数据
    await AsyncStorage.removeItem('test_key');
    console.log('✅ AsyncStorage清理测试成功');
    
  } catch (error) {
    console.error('❌ AsyncStorage测试失败:', error);
  }
  console.log('');
}

// 测试3: 检查模块导入
function testModuleImports() {
  console.log('📦 测试3: 检查模块导入');
  
  try {
    // 尝试导入各种模块
    const modules = [
      'react-native',
      '@expo/vector-icons',
      'expo-linear-gradient'
    ];
    
    modules.forEach(moduleName => {
      try {
        require(moduleName);
        console.log(`✅ ${moduleName} 导入成功`);
      } catch (error) {
        console.log(`❌ ${moduleName} 导入失败:`, error.message);
      }
    });
    
  } catch (error) {
    console.error('❌ 模块导入测试失败:', error);
  }
  console.log('');
}

// 测试4: 检查环境变量
function testEnvironment() {
  console.log('🌍 测试4: 检查环境变量');
  
  try {
    console.log('   __DEV__:', __DEV__);
    console.log('   Platform:', require('react-native').Platform.OS);
    console.log('   Node环境:', typeof process !== 'undefined' ? process.version : '不可用');
    
    if (__DEV__) {
      console.log('✅ 开发环境检测成功');
    } else {
      console.log('⚠️  生产环境检测');
    }
    
  } catch (error) {
    console.error('❌ 环境检查失败:', error);
  }
  console.log('');
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始运行所有测试...\n');
  
  testServiceAvailability();
  await testAsyncStorage();
  testModuleImports();
  testEnvironment();
  
  console.log('🎉 所有测试完成!');
  console.log('\n📝 测试总结:');
  console.log('- 如果看到 ✅ 表示功能正常');
  console.log('- 如果看到 ❌ 表示功能异常');
  console.log('- 如果看到 ⚠️  表示需要注意');
}

// 运行测试
runAllTests().catch(console.error);
