import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// 配置邮件传输器
const createTransporter = () => {
  // 开发环境使用Ethereal Email测试
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_EMAIL || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASSWORD || 'ethereal-password'
      }
    });
  }

  // 生产环境使用实际邮件服务
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  
  if (emailService === 'zoho') {
    return nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 587,
      secure: false, // Zoho使用STARTTLS
      auth: {
        user: process.env.ZOHO_USER || 'noreply@dramaword.com',
        pass: process.env.ZOHO_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  
  if (emailService === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // 使用应用专用密码
      }
    });
  }

  if (emailService === 'smtp') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  throw new Error('未配置有效的邮件服务');
};

// 发送验证邮件
export const sendVerificationEmail = async (
  email: string, 
  token: string, 
  nickname: string
): Promise<void> => {
  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'dramaword://';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: {
        name: 'DramaWord',
        address: process.env.EMAIL_FROM || 'noreply@dramaword.com'
      },
      to: email,
      subject: '验证您的 DramaWord 账户 | Verify Your DramaWord Account',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #7C3AED 0%, #3A8DFF 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">欢迎来到 DramaWord！</h1>
            <h2 style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px; font-weight: 400;">Welcome to DramaWord!</h2>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              你好 ${nickname}！<br>
              Hello ${nickname}!
            </p>
            
            <p style="font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 30px;">
              感谢您注册 DramaWord！请点击下面的按钮验证您的邮箱地址，完成账户激活。<br><br>
              Thank you for signing up for DramaWord! Please click the button below to verify your email address and complete your account activation.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #7C3AED 0%, #3A8DFF 100%); 
                        color: white; 
                        text-decoration: none; 
                        padding: 16px 32px; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: 600; 
                        font-size: 16px;">
                验证邮箱 / Verify Email
              </a>
            </div>
            
            <p style="font-size: 14px; color: #999; line-height: 1.6;">
              如果按钮无法点击，请复制以下链接到浏览器：<br>
              If the button doesn't work, copy this link to your browser:<br>
              <a href="${verificationUrl}" style="color: #7C3AED; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <p style="font-size: 14px; color: #999; margin-top: 30px;">
              该链接将在24小时后过期。如果您没有注册此账户，请忽略此邮件。<br>
              This link will expire in 24 hours. If you didn't create this account, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            © 2024 DramaWord. All rights reserved.
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`[EmailService] 验证邮件发送成功: ${email}, MessageId: ${info.messageId}`);

    // 开发环境输出预览链接
    if (process.env.NODE_ENV === 'development' && nodemailer.getTestMessageUrl(info)) {
      logger.info(`[EmailService] 邮件预览链接: ${nodemailer.getTestMessageUrl(info)}`);
    }

  } catch (error) {
    logger.error('[EmailService] 发送验证邮件失败:', error);
    throw new Error('邮件发送失败');
  }
};

// 发送密码重置邮件
export const sendPasswordResetEmail = async (
  email: string, 
  token: string, 
  nickname: string
): Promise<void> => {
  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'dramaword://';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: {
        name: 'DramaWord',
        address: process.env.EMAIL_FROM || 'noreply@dramaword.com'
      },
      to: email,
      subject: '重置您的 DramaWord 密码 | Reset Your DramaWord Password',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">密码重置</h1>
            <h2 style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px; font-weight: 400;">Password Reset</h2>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              你好 ${nickname}！<br>
              Hello ${nickname}!
            </p>
            
            <p style="font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 30px;">
              我们收到了重置您 DramaWord 账户密码的请求。请点击下面的按钮重置密码。<br><br>
              We received a request to reset your DramaWord account password. Please click the button below to reset your password.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); 
                        color: white; 
                        text-decoration: none; 
                        padding: 16px 32px; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: 600; 
                        font-size: 16px;">
                重置密码 / Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #999; line-height: 1.6;">
              如果按钮无法点击，请复制以下链接到浏览器：<br>
              If the button doesn't work, copy this link to your browser:<br>
              <a href="${resetUrl}" style="color: #FF6B6B; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="font-size: 14px; color: #999; margin-top: 30px;">
              该链接将在1小时后过期。如果您没有请求重置密码，请忽略此邮件。<br>
              This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            © 2024 DramaWord. All rights reserved.
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`[EmailService] 密码重置邮件发送成功: ${email}, MessageId: ${info.messageId}`);

    // 开发环境输出预览链接
    if (process.env.NODE_ENV === 'development' && nodemailer.getTestMessageUrl(info)) {
      logger.info(`[EmailService] 邮件预览链接: ${nodemailer.getTestMessageUrl(info)}`);
    }

  } catch (error) {
    logger.error('[EmailService] 发送密码重置邮件失败:', error);
    throw new Error('邮件发送失败');
  }
};

// 测试邮件配置
export const testEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('[EmailService] 邮件配置测试成功');
    return true;
  } catch (error) {
    logger.error('[EmailService] 邮件配置测试失败:', error);
    return false;
  }
};
