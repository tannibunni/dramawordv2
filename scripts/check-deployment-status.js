const axios = require('axios');

async function checkDeploymentStatus() {
  console.log('🔍 检查部署状态...\n');
  
  try {
    // 检查健康状态
    const healthResponse = await axios.get('https://dramawordv2.onrender.com/health');
    console.log('✅ 服务健康状态:', healthResponse.status);
    
    // 检查版本信息（如果有的话）
    console.log('📊 服务响应时间:', healthResponse.headers['x-response-time'] || 'N/A');
    
    // 检查最近的日志时间戳
    console.log('🕐 当前时间:', new Date().toISOString());
    
    console.log('\n📋 部署状态总结:');
    console.log('- 服务状态: 运行中');
    console.log('- 健康检查: 通过');
    console.log('- 等待最新代码部署...');
    
    console.log('\n💡 建议:');
    console.log('1. 等待 2-3 分钟让 Render 完成部署');
    console.log('2. 如果问题持续，手动触发 "Clear build cache & deploy"');
    console.log('3. 重新测试微信登录功能');
    
  } catch (error) {
    console.error('❌ 服务检查失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 可能的原因:');
      console.log('- 服务正在重新部署中');
      console.log('- 网络连接问题');
      console.log('- 服务暂时不可用');
    }
  }
}

// 运行检查
checkDeploymentStatus(); 