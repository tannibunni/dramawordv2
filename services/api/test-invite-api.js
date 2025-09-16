const fetch = require('node-fetch');

async function testInviteAPI() {
  console.log('🧪 测试邀请码API...');
  
  try {
    // 测试邀请码验证
    const response = await fetch('https://dramawordv2.onrender.com/api/invite/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'DWMFN05BRN5PN9S0' })
    });
    
    const result = await response.json();
    console.log('📊 邀请码验证结果:', result);
    
    if (result.success) {
      console.log('✅ 邀请码API工作正常');
    } else {
      console.log('❌ 邀请码API有问题:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 测试邀请码API失败:', error);
  }
}

testInviteAPI();
