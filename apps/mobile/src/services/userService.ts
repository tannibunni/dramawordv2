import { API_BASE_URL } from '../constants/config';

export interface UserProfile {
  id: string;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  loginType: string;
  learningStats: any;
  settings: any;
}

export class UserService {
  private static baseUrl = `${API_BASE_URL}/users`;

  /**
   * 获取用户信息
   */
  static async getProfile(token: string): Promise<{ success: boolean; data?: UserProfile; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return { success: false, message: '获取用户信息失败' };
    }
  }

  /**
   * 更新用户信息
   */
  static async updateProfile(
    token: string,
    profileData: { nickname?: string; avatar?: string; email?: string }
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return { success: false, message: '更新用户信息失败' };
    }
  }

  /**
   * 上传头像
   */
  static async uploadAvatar(
    token: string,
    formData: FormData
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('上传头像失败:', error);
      return { success: false, message: '上传头像失败' };
    }
  }

  /**
   * 更新用户设置
   */
  static async updateSettings(
    token: string,
    settings: any
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('更新设置失败:', error);
      return { success: false, message: '更新设置失败' };
    }
  }

  /**
   * 获取用户统计
   */
  static async getStats(token: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取用户统计失败:', error);
      return { success: false, message: '获取用户统计失败' };
    }
  }
} 