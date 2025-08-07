import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  needsReauth: boolean;
  error?: string;
}

export class TokenValidationService {
  private static instance: TokenValidationService;
  private reauthCallbacks: Array<() => void> = [];
  private navigationCallback: ((screen: string) => void) | null = null;

  public static getInstance(): TokenValidationService {
    if (!TokenValidationService.instance) {
      TokenValidationService.instance = new TokenValidationService();
    }
    return TokenValidationService.instance;
  }

  // 验证token格式
  private validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // 检查JWT格式 (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // 检查每个部分是否都是有效的base64
    try {
      parts.forEach(part => {
        if (part) {
          // 使用更兼容的base64解码方法
          this.decodeBase64(part.replace(/-/g, '+').replace(/_/g, '/'));
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  // 兼容的base64解码方法
  private decodeBase64(str: string): string {
    try {
      // 尝试使用Buffer（Node.js环境）
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(str, 'base64').toString();
      }
      // 尝试使用atob（浏览器环境）
      else if (typeof atob !== 'undefined') {
        return atob(str);
      }
      // 手动实现base64解码
      else {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        while (i < str.length) {
          const encoded1 = chars.indexOf(str.charAt(i++));
          const encoded2 = chars.indexOf(str.charAt(i++));
          const encoded3 = chars.indexOf(str.charAt(i++));
          const encoded4 = chars.indexOf(str.charAt(i++));
          
          const byte1 = (encoded1 << 2) | (encoded2 >> 4);
          const byte2 = ((encoded2 & 15) << 4) | (encoded3 >> 2);
          const byte3 = ((encoded3 & 3) << 6) | encoded4;
          
          result += String.fromCharCode(byte1);
          if (encoded3 !== 64) result += String.fromCharCode(byte2);
          if (encoded4 !== 64) result += String.fromCharCode(byte3);
        }
        return result;
      }
    } catch {
      throw new Error('Invalid base64 string');
    }
  }

  // 检查token是否过期
  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }
      
      const payload = JSON.parse(this.decodeBase64(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const exp = payload.exp;
      
      if (!exp) {
        return true;
      }
      
      // 检查是否过期（提前5分钟认为过期）
      const now = Math.floor(Date.now() / 1000);
      return now >= (exp - 300);
    } catch {
      return true;
    }
  }

  // 验证token有效性
  public async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      console.log('🔍 [TokenValidationService] 开始验证token:', token.substring(0, 50) + '...');
      
      // 1. 检查token格式
      const formatValid = this.validateTokenFormat(token);
      console.log('🔍 [TokenValidationService] Token格式验证:', formatValid ? '通过' : '失败');
      
      if (!formatValid) {
        return {
          isValid: false,
          isExpired: false,
          needsReauth: true,
          error: 'Token格式无效'
        };
      }

      // 2. 检查token是否过期
      const isExpired = this.isTokenExpired(token);
      console.log('🔍 [TokenValidationService] Token过期检查:', isExpired ? '已过期' : '未过期');
      
      if (isExpired) {
        return {
          isValid: false,
          isExpired: true,
          needsReauth: true,
          error: 'Token已过期'
        };
      }

      // 3. 调用后端验证token
      try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          return {
            isValid: false,
            isExpired: false,
            needsReauth: true,
            error: 'Token验证失败'
          };
        }

        if (response.ok) {
          return {
            isValid: true,
            isExpired: false,
            needsReauth: false
          };
        }

        return {
          isValid: false,
          isExpired: false,
          needsReauth: true,
          error: `Token验证失败: ${response.status}`
        };

      } catch (error) {
        console.error('Token验证请求失败:', error);
        return {
          isValid: false,
          isExpired: false,
          needsReauth: true,
          error: '网络错误'
        };
      }

    } catch (error) {
      console.error('Token验证异常:', error);
      return {
        isValid: false,
        isExpired: false,
        needsReauth: true,
        error: '验证异常'
      };
    }
  }

  // 获取并验证当前token
  public async validateCurrentToken(): Promise<TokenValidationResult> {
    try {
      // 获取token
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        // 尝试从userData获取
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            if (parsed.token) {
              return await this.validateToken(parsed.token);
            }
          } catch {
            // 解析失败
          }
        }
        
        return {
          isValid: false,
          isExpired: false,
          needsReauth: true,
          error: '未找到token'
        };
      }

      return await this.validateToken(authToken);
    } catch (error) {
      console.error('验证当前token失败:', error);
      return {
        isValid: false,
        isExpired: false,
        needsReauth: true,
        error: '验证失败'
      };
    }
  }

  // 清除无效token
  public async clearInvalidToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('authToken');
      
      // 清除userData中的token
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          if (parsed.token) {
            delete parsed.token;
            await AsyncStorage.setItem('userData', JSON.stringify(parsed));
          }
        } catch {
          // 解析失败，直接删除
          await AsyncStorage.removeItem('userData');
        }
      }
      
      console.log('✅ 无效token已清除');
    } catch (error) {
      console.error('清除无效token失败:', error);
    }
  }

  // 注册重新认证回调
  public onReauthRequired(callback: () => void): void {
    this.reauthCallbacks.push(callback);
  }

  // 设置导航回调
  public setNavigationCallback(callback: (screen: string) => void): void {
    this.navigationCallback = callback;
  }

  // 触发重新认证
  public triggerReauth(): void {
    console.log('🔄 触发重新认证...');
    
    // 如果有导航回调，直接导航到登录页面
    if (this.navigationCallback) {
      console.log('🔄 导航到登录页面');
      this.navigationCallback('login');
      return;
    }
    
    // 否则执行其他回调
    this.reauthCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('重新认证回调执行失败:', error);
      }
    });
  }

  // 移除重新认证回调
  public removeReauthCallback(callback: () => void): void {
    const index = this.reauthCallbacks.indexOf(callback);
    if (index > -1) {
      this.reauthCallbacks.splice(index, 1);
    }
  }
}

export const tokenValidationService = TokenValidationService.getInstance(); 