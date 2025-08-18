import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

export interface EmailAuthUser {
  id: string;
  username: string;
  nickname: string;
  email: string;
  emailVerified: boolean;
  loginType: 'email';
}

export interface EmailAuthResult {
  success: boolean;
  message?: string;
  user?: EmailAuthUser;
  token?: string;
  error?: string;
}

class EmailAuthService {
  private static instance: EmailAuthService;

  public static getInstance(): EmailAuthService {
    if (!EmailAuthService.instance) {
      EmailAuthService.instance = new EmailAuthService();
    }
    return EmailAuthService.instance;
  }

  /**
   * 邮箱注册
   */
  public async register(email: string, password: string, nickname: string): Promise<EmailAuthResult> {
    try {
      console.log('[EmailAuthService] 🚀 开始邮箱注册:', { email, nickname });

      const response = await fetch(`${API_BASE_URL}/api/email-auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          nickname: nickname.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('[EmailAuthService] ✅ 注册成功:', result.user);

        // 保存用户信息到本地存储
        const userData = {
          id: result.user.id,
          nickname: result.user.nickname,
          email: result.user.email,
          loginType: 'email',
          token: result.token,
        };

        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('loginType', JSON.stringify('email'));

        return {
          success: true,
          message: result.message,
          user: result.user,
          token: result.token,
        };
      } else {
        console.error('[EmailAuthService] ❌ 注册失败:', result.error);
        return {
          success: false,
          error: result.error || '注册失败',
        };
      }
    } catch (error) {
      console.error('[EmailAuthService] ❌ 注册请求失败:', error);
      return {
        success: false,
        error: '网络错误，请稍后重试',
      };
    }
  }

  /**
   * 邮箱登录
   */
  public async login(email: string, password: string): Promise<EmailAuthResult> {
    try {
      console.log('[EmailAuthService] 🚀 开始邮箱登录:', { email });

      const response = await fetch(`${API_BASE_URL}/api/email-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('[EmailAuthService] ✅ 登录成功:', result.user);

        // 保存用户信息到本地存储
        const userData = {
          id: result.user.id,
          nickname: result.user.nickname,
          email: result.user.email,
          loginType: 'email',
          token: result.token,
        };

        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('loginType', JSON.stringify('email'));

        return {
          success: true,
          message: result.message,
          user: result.user,
          token: result.token,
        };
      } else {
        console.error('[EmailAuthService] ❌ 登录失败:', result.error);
        return {
          success: false,
          error: result.error || '登录失败',
        };
      }
    } catch (error) {
      console.error('[EmailAuthService] ❌ 登录请求失败:', error);
      return {
        success: false,
        error: '网络错误，请稍后重试',
      };
    }
  }

  /**
   * 重新发送验证邮件
   */
  public async resendVerificationEmail(email: string): Promise<EmailAuthResult> {
    try {
      console.log('[EmailAuthService] 🚀 重新发送验证邮件:', { email });

      const response = await fetch(`${API_BASE_URL}/api/email-auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('[EmailAuthService] ✅ 验证邮件发送成功');
        return {
          success: true,
          message: result.message,
        };
      } else {
        console.error('[EmailAuthService] ❌ 发送验证邮件失败:', result.error);
        return {
          success: false,
          error: result.error || '发送失败',
        };
      }
    } catch (error) {
      console.error('[EmailAuthService] ❌ 发送验证邮件请求失败:', error);
      return {
        success: false,
        error: '网络错误，请稍后重试',
      };
    }
  }

  /**
   * 忘记密码
   */
  public async forgotPassword(email: string): Promise<EmailAuthResult> {
    try {
      console.log('[EmailAuthService] 🚀 发送密码重置邮件:', { email });

      const response = await fetch(`${API_BASE_URL}/api/email-auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('[EmailAuthService] ✅ 密码重置邮件发送成功');
        return {
          success: true,
          message: result.message,
        };
      } else {
        console.error('[EmailAuthService] ❌ 发送密码重置邮件失败:', result.error);
        return {
          success: false,
          error: result.error || '发送失败',
        };
      }
    } catch (error) {
      console.error('[EmailAuthService] ❌ 发送密码重置邮件请求失败:', error);
      return {
        success: false,
        error: '网络错误，请稍后重试',
      };
    }
  }

  /**
   * 验证邮箱格式
   */
  public validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * 验证密码强度
   */
  public validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: '密码长度至少6位' };
    }
    return { valid: true };
  }

  /**
   * 验证昵称
   */
  public validateNickname(nickname: string): { valid: boolean; message?: string } {
    const trimmed = nickname.trim();
    if (trimmed.length === 0) {
      return { valid: false, message: '请输入昵称' };
    }
    if (trimmed.length > 30) {
      return { valid: false, message: '昵称不能超过30个字符' };
    }
    return { valid: true };
  }

  /**
   * 获取当前用户信息
   */
  public async getCurrentUser(): Promise<EmailAuthUser | null> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.loginType === 'email') {
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error('[EmailAuthService] ❌ 获取当前用户失败:', error);
      return null;
    }
  }

  /**
   * 登出
   */
  public async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('loginType');
      console.log('[EmailAuthService] ✅ 登出成功');
    } catch (error) {
      console.error('[EmailAuthService] ❌ 登出失败:', error);
    }
  }
}

export const emailAuthService = EmailAuthService.getInstance();
