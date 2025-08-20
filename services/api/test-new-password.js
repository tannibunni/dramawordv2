const nodemailer = require('nodemailer');

// 测试新的Gmail应用专用密码
async function testNewPassword() {
  console.log('🧪 测试新的Gmail应用专用密码...');
  
  try {
    // 这里需要你提供新的应用专用密码
    const newPassword = 'tayk...lhzq'; // 请替换为完整的新密码
    
    console.log('🔐 使用密码:', newPassword);
    
    // 创建Gmail传输器
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'lt14gs@gmail.com',
        pass: newPassword
      }
    });
    
    console.log('✅ 邮件传输器创建成功');
    
    // 测试连接
    console.log('🔍 测试Gmail连接...');
    await transporter.verify();
    console.log('✅ Gmail连接验证成功');
    
    // 发送简单测试邮件
    console.log('📧 发送测试邮件...');
    const mailOptions = {
      from: {
        name: 'DramaWord Test',
        address: 'noreply@dramaword.com'
      },
      to: 'dt14gs@gmail.com',
      subject: '新密码测试',
      text: '这是一封测试邮件，用于验证新的Gmail应用专用密码是否正确。',
      html: '<h1>新密码测试</h1><p>这是一封测试邮件，用于验证新的Gmail应用专用密码是否正确。</p>'
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ 测试邮件发送成功:', result.messageId);
    console.log('📧 邮件已发送到: dt14gs@gmail.com');
    
  } catch (error) {
    console.error('❌ 新密码测试失败:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('🔐 认证失败 - 新密码可能无效');
      console.error('💡 建议：重新生成Gmail应用专用密码');
    } else if (error.message.includes('Invalid login')) {
      console.error('🔐 登录失败 - 新密码可能无效');
      console.error('💡 建议：检查密码格式和Gmail账户设置');
    } else {
      console.error('❓ 其他错误:', error);
    }
  }
}

testNewPassword();
