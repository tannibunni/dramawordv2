import { API_BASE_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface PaymentRequest {
  subscriptionType: 'monthly' | 'yearly' | 'lifetime';
  paymentMethod: 'wechat' | 'alipay';
}

export interface PaymentResponse {
  success: boolean;
  data?: {
    orderId: string;
    amount: number;
    paymentParams: any;
  };
  message?: string;
}

export interface PaymentStatus {
  success: boolean;
  data?: {
    orderId: string;
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    amount: number;
    paymentMethod: string;
    createdAt: string;
    paidAt?: string;
  };
  message?: string;
}

export class PaymentService {
  private static baseUrl = `${API_BASE_URL}/payment`;

  /**
   * 获取用户token
   */
  private static async getAuthToken(): Promise<string | null> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.token;
      }
      return null;
    } catch (error) {
      console.error('获取用户token失败:', error);
      return null;
    }
  }

  /**
   * 创建支付订单
   */
  static async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return {
          success: false,
          message: '用户未登录'
        };
      }

      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '创建支付订单失败');
      }

      return data;
    } catch (error) {
      console.error('创建支付订单失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '创建支付订单失败'
      };
    }
  }

  /**
   * 查询支付状态
   */
  static async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return {
          success: false,
          message: '用户未登录'
        };
      }

      const response = await fetch(`${this.baseUrl}/status/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '查询支付状态失败');
      }

      return data;
    } catch (error) {
      console.error('查询支付状态失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '查询支付状态失败'
      };
    }
  }

  /**
   * 执行微信支付
   */
  static async performWechatPayment(orderId: string, paymentParams: any): Promise<boolean> {
    try {
      // 这里应该调用微信支付SDK
      // 由于需要真实的微信支付商户号，这里模拟支付流程
      console.log('微信支付参数:', paymentParams);
      
      // 模拟支付成功
      Alert.alert(
        '支付成功',
        `订单 ${orderId} 支付成功！`,
        [{ text: '确定' }]
      );
      
      return true;
    } catch (error) {
      console.error('微信支付失败:', error);
      Alert.alert('支付失败', '微信支付失败，请重试');
      return false;
    }
  }

  /**
   * 执行支付宝支付
   */
  static async performAlipayPayment(orderId: string, paymentParams: any): Promise<boolean> {
    try {
      // 这里应该调用支付宝SDK
      // 由于需要真实的支付宝商户号，这里模拟支付流程
      console.log('支付宝支付参数:', paymentParams);
      
      // 模拟支付成功
      Alert.alert(
        '支付成功',
        `订单 ${orderId} 支付成功！`,
        [{ text: '确定' }]
      );
      
      return true;
    } catch (error) {
      console.error('支付宝支付失败:', error);
      Alert.alert('支付失败', '支付宝支付失败，请重试');
      return false;
    }
  }

  /**
   * 完整的支付流程
   */
  static async processPayment(request: PaymentRequest): Promise<boolean> {
    try {
      // 1. 创建支付订单
      const createResult = await this.createPayment(request);
      if (!createResult.success || !createResult.data) {
        Alert.alert('支付失败', createResult.message || '创建支付订单失败');
        return false;
      }

      const { orderId, paymentParams } = createResult.data;

      // 2. 执行支付
      let paymentSuccess = false;
      if (request.paymentMethod === 'wechat') {
        paymentSuccess = await this.performWechatPayment(orderId, paymentParams);
      } else if (request.paymentMethod === 'alipay') {
        paymentSuccess = await this.performAlipayPayment(orderId, paymentParams);
      }

      if (!paymentSuccess) {
        return false;
      }

      // 3. 查询支付状态
      const statusResult = await this.getPaymentStatus(orderId);
      if (statusResult.success && statusResult.data?.status === 'success') {
        Alert.alert('订阅成功', '恭喜您成为剧词记会员！');
        return true;
      } else {
        Alert.alert('支付验证失败', '请稍后重试或联系客服');
        return false;
      }
    } catch (error) {
      console.error('支付流程失败:', error);
      Alert.alert('支付失败', '支付过程中出现错误，请重试');
      return false;
    }
  }

  /**
   * 获取用户支付历史
   */
  static async getPaymentHistory(): Promise<any> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return {
          success: false,
          message: '用户未登录'
        };
      }

      const response = await fetch(`${this.baseUrl}/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取支付历史失败');
      }

      return data;
    } catch (error) {
      console.error('获取支付历史失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取支付历史失败'
      };
    }
  }
} 