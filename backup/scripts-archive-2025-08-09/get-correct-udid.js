const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function getCorrectUDID() {
  console.log('📱 获取正确的设备 UDID...\n');
  
  try {
    // 方法1: 使用 xcrun devicectl
    console.log('🔍 方法1: 使用 xcrun devicectl');
    const { stdout: devicectlOutput } = await execAsync('xcrun devicectl list devices');
    console.log(devicectlOutput);
    
    console.log('\n🔍 方法2: 使用 instruments');
    try {
      const { stdout: instrumentsOutput } = await execAsync('xcrun instruments -s devices');
      console.log(instrumentsOutput);
    } catch (error) {
      console.log('❌ instruments 命令失败:', error.message);
    }
    
    console.log('\n🔍 方法3: 使用 system_profiler');
    try {
      const { stdout: systemProfilerOutput } = await execAsync('system_profiler SPUSBDataType | grep -A 20 "iPhone"');
      console.log(systemProfilerOutput);
    } catch (error) {
      console.log('❌ system_profiler 命令失败:', error.message);
    }
    
  } catch (error) {
    console.log('❌ 无法获取设备信息:', error.message);
  }
  
  console.log('\n📋 手动获取 UDID 的步骤:');
  console.log('1. 连接 iPhone 到 Mac');
  console.log('2. 打开 Xcode');
  console.log('3. Window → Devices and Simulators');
  console.log('4. 选择您的设备');
  console.log('5. 复制 "Identifier" 字段（这是真正的 UDID）');
  console.log('');
  console.log('💡 重要提示:');
  console.log('- UDID 应该是 40 个字符的十六进制字符串');
  console.log('- 格式类似: 00008120-001C25D40C0A002E');
  console.log('- 如果看到的是 UUID 格式，可能不是正确的 UDID');
}

getCorrectUDID(); 