import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_STATS_KEY = 'reviewStats';

export const UserService = {
  updateReviewStats: async (stats: { correctCount: number; incorrectCount: number }) => {
    try {
      await AsyncStorage.setItem(REVIEW_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('保存复习统计失败', error);
    }
  },
  getReviewStats: async () => {
    try {
      const value = await AsyncStorage.getItem(REVIEW_STATS_KEY);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('获取复习统计失败', error);
      return null;
    }
  },
  login: async (username: string, password: string) => {
    const res = await axios.post('/api/user/login', { username, password });
    return res.data;
  },
  getProfile: async (token: string) => {
    try {
      const res = await axios.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, message: '获取用户信息失败' };
    }
  },
}; 