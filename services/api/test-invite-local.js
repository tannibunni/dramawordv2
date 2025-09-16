const express = require('express');
const { InviteController } = require('./dist/controllers/inviteController');

const app = express();
app.use(express.json());

// 测试邀请码路由
app.post('/test-invite/validate', InviteController.validateInviteCode);

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🧪 本地测试服务器运行在端口 ${PORT}`);
  
  // 测试邀请码验证
  setTimeout(async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/test-invite/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: 'DWMFN05BRN5PN9S0' })
      });
      
      const result = await response.json();
      console.log('📊 本地邀请码验证结果:', result);
      
      if (result.success) {
        console.log('✅ 邀请码功能工作正常');
      } else {
        console.log('❌ 邀请码功能有问题:', result.message);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('❌ 测试失败:', error);
      process.exit(1);
    }
  }, 1000);
});
