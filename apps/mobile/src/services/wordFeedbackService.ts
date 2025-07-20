import { API_BASE_URL } from '../constants/config';

export interface WordFeedbackStats {
  word: string;
  positive: number;
  negative: number;
  total: number;
}

export interface WordFeedbackResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

class WordFeedbackService {
  private baseURL = `${API_BASE_URL}/word-feedback`;

  // 提交反馈
  async submitFeedback(word: string, feedback: 'positive' | 'negative'): Promise<WordFeedbackResponse> {
    try {
      const response = await fetch(`${this.baseURL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word, feedback }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('提交反馈失败:', error);
      return {
        success: false,
        error: '网络连接失败'
      };
    }
  }

  // 获取单词反馈统计
  async getFeedbackStats(word: string): Promise<WordFeedbackResponse> {
    try {
      const response = await fetch(`${this.baseURL}/feedback/stats/${encodeURIComponent(word)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取反馈统计失败:', error);
      return {
        success: false,
        error: '网络连接失败'
      };
    }
  }

  // 获取用户对特定单词的反馈
  async getUserFeedback(word: string): Promise<WordFeedbackResponse> {
    try {
      const response = await fetch(`${this.baseURL}/feedback/user/${encodeURIComponent(word)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取用户反馈失败:', error);
      return {
        success: false,
        error: '网络连接失败'
      };
    }
  }
}

export const wordFeedbackService = new WordFeedbackService(); 