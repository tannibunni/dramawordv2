// Redis配置检查脚本
const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function checkRedisConfig() {
  console.log('🔍 检查Redis配置状态\n');
  
  try {
    // 检查Redis健康状态
    console.log('1. 检查Redis健康状态...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/cache-monitoring/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Redis健康检查通过');
      console.log('📊 健康状态:', healthData);
    } else {
      console.log('❌ Redis健康检查失败');
      console.log('状态码:', healthResponse.status);
      console.log('响应:', await healthResponse.text());
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 检查Redis统计信息
    console.log('2. 检查Redis统计信息...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/cache-monitoring/stats`);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Redis统计信息获取成功');
      console.log('📊 统计信息:', JSON.stringify(statsData, null, 2));
    } else {
      console.log('❌ Redis统计信息获取失败');
      console.log('状态码:', statsResponse.status);
      console.log('响应:', await statsResponse.text());
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 检查智能同步策略
    console.log('3. 检查智能同步策略...');
    const syncResponse = await fetch(`${API_BASE_URL}/api/smart-sync/stats`);
    
    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      console.log('✅ 智能同步策略检查通过');
      console.log('📊 同步统计:', JSON.stringify(syncData, null, 2));
    } else {
      console.log('❌ 智能同步策略检查失败');
      console.log('状态码:', syncResponse.status);
      console.log('响应:', await syncResponse.text());
    }
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message);
  }
}

// 运行检查
checkRedisConfig().catch(console.error);
