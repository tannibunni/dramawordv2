// 测试徽章图片加载
console.log('Testing badge image loading...');

try {
  const collector10 = require('./assets/images/collector_10.png');
  console.log('✅ collector_10.png loaded successfully:', collector10);
} catch (error) {
  console.error('❌ Failed to load collector_10.png:', error.message);
}

try {
  const collector50 = require('./assets/images/collector_50.png');
  console.log('✅ collector_50.png loaded successfully:', collector50);
} catch (error) {
  console.error('❌ Failed to load collector_50.png:', error.message);
}

console.log('Test completed.');
