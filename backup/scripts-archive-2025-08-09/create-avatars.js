const fs = require('fs');
const path = require('path');

console.log('🎨 创建登录类型头像文件...');

// 确保assets/images目录存在
const assetsDir = path.join(__dirname, '../apps/mobile/assets/images');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 创建头像文件的说明
const avatarFiles = [
  {
    name: 'wechat-avatar.png',
    description: '微信登录默认头像 - 绿色微信图标风格'
  },
  {
    name: 'apple-avatar.png', 
    description: '苹果登录默认头像 - 黑色苹果图标风格'
  },
  {
    name: 'phone-avatar.png',
    description: '手机登录默认头像 - 蓝色手机图标风格'
  },
  {
    name: 'guest-avatar.png',
    description: '游客登录默认头像 - 灰色用户图标风格'
  }
];

console.log('\n📋 需要创建的头像文件:');
avatarFiles.forEach(file => {
  console.log(`   - ${file.name}: ${file.description}`);
});

console.log('\n📝 请手动创建以下头像文件:');
console.log('   1. 将头像图片文件放入 apps/mobile/assets/images/ 目录');
console.log('   2. 确保文件名与上述列表完全匹配');
console.log('   3. 建议尺寸: 80x80 像素或更高');
console.log('   4. 格式: PNG (推荐) 或 JPG');

console.log('\n🎯 头像设计建议:');
console.log('   - 微信头像: 使用微信绿色 (#1AAD19) 背景，白色微信图标');
console.log('   - 苹果头像: 使用黑色背景，白色苹果logo');
console.log('   - 手机头像: 使用蓝色背景，白色手机图标');
console.log('   - 游客头像: 使用灰色背景，白色用户图标');

console.log('\n✅ 脚本执行完成！请手动添加头像文件。'); 