const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function getDeviceInfo() {
  console.log('📱 获取设备信息...\n');
  
  try {
    // 尝试获取连接的设备
    const { stdout } = await execAsync('xcrun devicectl list devices');
    console.log('🔍 连接的设备:');
    console.log(stdout);
    
  } catch (error) {
    console.log('❌ 无法获取设备列表，可能原因:');
    console.log('- 没有设备连接');
    console.log('- Xcode 命令行工具未安装');
    console.log('- 需要管理员权限');
  }
  
  console.log('\n📋 手动获取 UDID 的方法:');
  console.log('1. 连接 iPhone 到 Mac');
  console.log('2. 打开 Xcode → Window → Devices and Simulators');
  console.log('3. 选择您的设备，复制 Identifier');
  console.log('');
  console.log('或者:');
  console.log('1. 在 iPhone 上：设置 → 通用 → 关于本机');
  console.log('2. 点击序列号几次，会显示 UDID');
  console.log('');
  console.log('💡 建议:');
  console.log('- 确保设备已解锁');
  console.log('- 确保设备信任了这台 Mac');
  console.log('- 如果设备已注册，直接回到 Xcode 点击 "Try Again"');
}

getDeviceInfo(); 