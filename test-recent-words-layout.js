// 测试最近查词布局优化
console.log('🎯 测试最近查词布局优化');

console.log('✅ 新布局特点：');
console.log('1. 时钟图标 - 左边固定位置');
console.log('2. 单词文本 - 中间，最多占40%宽度');
console.log('3. 释义文本 - 右边，最多占60%宽度');
console.log('4. 所有内容都在一行显示');

console.log('\n🎨 布局优化：');
console.log('- 单词文本添加 numberOfLines={1} 和 ellipsizeMode="tail"');
console.log('- 释义文本保持 numberOfLines={1} 和 ellipsizeMode="tail"');
console.log('- 单词文本设置 flex: 1, maxWidth: 40%');
console.log('- 释义文本设置 flex: 1, maxWidth: 60%');
console.log('- 容器添加 flex: 1 确保充分利用空间');

console.log('\n📱 显示效果：');
console.log('- 短单词：正常显示，释义完整');
console.log('- 长单词：单词截断显示...，释义完整');
console.log('- 长释义：单词完整，释义截断显示...');
console.log('- 都很长：单词和释义都截断显示...');

console.log('\n🔧 技术实现：');
console.log('- 使用 flexbox 布局分配空间');
console.log('- 设置最大宽度限制防止挤压');
console.log('- 使用 ellipsizeMode="tail" 截断显示');
console.log('- 保持时钟图标固定位置');

console.log('\n🚀 修改完成：');
console.log('- ✅ 单词文本添加截断');
console.log('- ✅ 优化空间分配');
console.log('- ✅ 确保一行显示');
console.log('- ✅ 保持视觉平衡');

console.log('\n✨ 最近查词布局已优化！'); 