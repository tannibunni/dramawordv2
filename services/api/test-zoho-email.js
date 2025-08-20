const nodemailer = require('nodemailer');

// 测试Zoho邮件服务配置
async function testZohoEmailService() {
  console.log('🧪 测试Zoho邮件服务配置...');
  
  try {
    // 创建Zoho传输器
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 587,
      secure: false, // Zoho使用STARTTLS
      auth: {
        user: 'noreply@dramaword.com', // 请替换为实际的Zoho邮箱
        pass: 'your-zoho-password' // 请替换为实际的Zoho密码
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('✅ Zoho邮件传输器创建成功');
    
    // 测试连接
    console.log('🔍 测试Zoho连接...');
    await transporter.verify();
    console.log('✅ Zoho邮件服务连接验证成功');
    
    // 发送测试邮件
    const mailOptions = {
      from: {
        name: 'DramaWord Test',
        address: 'noreply@dramaword.com'
      },
      to: 'dt14gs@gmail.com', // 测试收件人
      subject: 'DramaWord Zoho邮件服务测试',
      text: '这是一封测试邮件，用于验证Zoho邮件服务配置是否正确。',
      html: `
        <h1>DramaWord Zoho邮件服务测试</h1>
        <p>这是一封测试邮件，用于验证Zoho邮件服务配置是否正确。</p>
        <p><strong>发送时间：</strong> ${new Date().toISOString()}</p>
        <p><strong>邮件服务：</strong> Zoho</p>
        <hr>
        <p style="color: #666; font-size: 12px;">如果收到此邮件，说明Zoho邮件服务配置正确。</p>
      `
    };
    
    console.log('📧 发送测试邮件...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ 测试邮件发送成功:', result.messageId);
    console.log('📧 邮件已发送到: dt14gs@gmail.com');
    console.log('📧 发件人: noreply@dramaword.com');
    
  } catch (error) {
    console.error('❌ Zoho邮件服务测试失败:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('🔐 认证失败 - 请检查Zoho用户名和密码');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 连接失败 - 请检查网络连接');
    } else if (error.message.includes('Invalid login')) {
      console.error('🔐 登录失败 - Zoho凭据可能无效');
    } else {
      console.error('❓ 其他错误:', error);
    }
  }
}

testZohoEmailService();
