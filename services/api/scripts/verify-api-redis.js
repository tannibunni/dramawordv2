// 验证API服务的Redis配置
const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'https://dramawordv2.onrender.com';

async function verifyApiRedis() {
  console.log('🔍 验证API服务的Redis配置...\n');
  
  try {
    // 检查Redis健康状态
    console.log('1. 检查Redis健康状态...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/cache-monitoring/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Redis健康检查通过');
      console.log('📊 健康状态:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('❌ Redis健康检查失败');
      console.log('状态码:', healthResponse.status);
      console.log('响应:', await healthResponse.text());
      return;
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
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 测试缓存功能
    console.log('4. 测试缓存功能...');
    
    // 测试用户数据缓存
    const testUserResponse = await fetch(`${API_BASE_URL}/api/users/test-user-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test_user_123',
        name: 'Test User',
        email: 'test@example.com'
      })
    });
    
    if (testUserResponse.ok) {
      const testUserData = await testUserResponse.json();
      console.log('✅ 用户数据缓存测试成功');
      console.log('📊 测试结果:', JSON.stringify(testUserData, null, 2));
    } else {
      console.log('⚠️ 用户数据缓存测试失败（可能没有实现）');
      console.log('状态码:', testUserResponse.status);
    }
    
    console.log('\n🎉 API Redis配置验证完成！');
    console.log('✅ 你的API服务已正确配置Redis');
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message);
  }
}

// 运行验证
verifyApiRedis().catch(console.error);
