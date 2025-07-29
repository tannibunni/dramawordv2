import { Payment, IPayment } from '../models/Payment';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// 支付配置
const PAYMENT_CONFIG = {
  // 订阅价格配置（分）
  prices: {
    monthly: 990, // ¥9.9
    yearly: 8800, // ¥88
    lifetime: 9900, // ¥99
  },
  // 订阅时长配置（天）
  durations: {
    monthly: 30,
    yearly: 365,
    lifetime: 36500, // 100年，相当于永久
  }
};

export interface CreatePaymentRequest {
  userId: string;
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

export class PaymentService {
  /**
   * 生成订单ID
   */
  static generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `DW${timestamp}${random}`.toUpperCase();
  }

  /**
   * 创建支付订单
   */
  static async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const { userId, subscriptionType, paymentMethod } = request;

      // 验证用户
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: '用户不存在'
        };
      }

      // 获取价格和时长
      const amount = PAYMENT_CONFIG.prices[subscriptionType];
      const duration = PAYMENT_CONFIG.durations[subscriptionType];

      // 生成订单ID
      const orderId = this.generateOrderId();

      // 创建支付记录
      const payment = new Payment({
        userId,
        orderId,
        amount,
        currency: 'CNY',
        paymentMethod,
        subscriptionType,
        subscriptionDuration: duration,
        status: 'pending'
      });

      await payment.save();

      // 根据支付方式生成支付参数
      let paymentParams;
      if (paymentMethod === 'wechat') {
        paymentParams = await this.createWechatPayment(orderId, amount);
      } else if (paymentMethod === 'alipay') {
        paymentParams = await this.createAlipayPayment(orderId, amount);
      }

      logger.info(`创建支付订单成功: orderId=${orderId}, userId=${userId}, amount=${amount}`);

      return {
        success: true,
        data: {
          orderId,
          amount,
          paymentParams
        }
      };
    } catch (error) {
      logger.error('创建支付订单失败:', error);
      return {
        success: false,
        message: '创建支付订单失败'
      };
    }
  }

  /**
   * 创建微信支付参数
   */
  static async createWechatPayment(orderId: string, amount: number): Promise<any> {
    // 这里应该调用微信支付API
    // 由于需要真实的微信支付商户号，这里返回模拟数据
    return {
      appId: process.env.WECHAT_APP_ID,
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: crypto.randomBytes(16).toString('hex'),
      package: `prepay_id=mock_prepay_id_${orderId}`,
      signType: 'MD5',
      paySign: crypto.randomBytes(32).toString('hex')
    };
  }

  /**
   * 创建支付宝支付参数
   */
  static async createAlipayPayment(orderId: string, amount: number): Promise<any> {
    // 这里应该调用支付宝API
    // 由于需要真实的支付宝商户号，这里返回模拟数据
    return {
      orderStr: `mock_alipay_order_${orderId}`,
      orderId
    };
  }

  /**
   * 处理支付回调
   */
  static async handlePaymentCallback(
    orderId: string, 
    paymentMethod: 'wechat' | 'alipay',
    paymentData: any
  ): Promise<boolean> {
    try {
      // 查找支付记录
      const payment = await Payment.findOne({ orderId });
      if (!payment) {
        logger.error(`支付记录不存在: orderId=${orderId}`);
        return false;
      }

      // 验证支付状态
      if (payment.status === 'success') {
        logger.warn(`支付已完成: orderId=${orderId}`);
        return true;
      }

      // 更新支付状态
      payment.status = 'success';
      payment.paidAt = new Date();

      if (paymentMethod === 'wechat') {
        payment.wechatPayData = {
          transactionId: paymentData.transaction_id,
          timeEnd: paymentData.time_end
        };
      } else if (paymentMethod === 'alipay') {
        payment.alipayData = {
          tradeNo: paymentData.trade_no,
          buyerId: paymentData.buyer_id,
          gmtPayment: paymentData.gmt_payment
        };
      }

      await payment.save();

      // 更新用户订阅状态
      await this.updateUserSubscription(payment.userId.toString(), payment.subscriptionType, payment.subscriptionDuration);

      logger.info(`支付成功: orderId=${orderId}, userId=${payment.userId}`);
      return true;
    } catch (error) {
      logger.error('处理支付回调失败:', error);
      return false;
    }
  }

  /**
   * 更新用户订阅状态
   */
  static async updateUserSubscription(
    userId: string, 
    subscriptionType: string, 
    duration: number
  ): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        logger.error(`用户不存在: userId=${userId}`);
        return;
      }

      const now = new Date();
      const expiryDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

      // 更新用户订阅信息
      user.subscription = {
        type: subscriptionType,
        isActive: true,
        startDate: now,
        expiryDate: expiryDate,
        autoRenew: subscriptionType !== 'lifetime'
      };

      await user.save();
      logger.info(`用户订阅更新成功: userId=${userId}, type=${subscriptionType}`);
    } catch (error) {
      logger.error('更新用户订阅失败:', error);
    }
  }

  /**
   * 查询支付状态
   */
  static async getPaymentStatus(orderId: string): Promise<any> {
    try {
      const payment = await Payment.findOne({ orderId });
      if (!payment) {
        return {
          success: false,
          message: '支付记录不存在'
        };
      }

      return {
        success: true,
        data: {
          orderId: payment.orderId,
          status: payment.status,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt
        }
      };
    } catch (error) {
      logger.error('查询支付状态失败:', error);
      return {
        success: false,
        message: '查询支付状态失败'
      };
    }
  }

  /**
   * 获取用户支付历史
   */
  static async getUserPayments(userId: string): Promise<any> {
    try {
      const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20);

      return {
        success: true,
        data: payments.map(payment => ({
          orderId: payment.orderId,
          amount: payment.amount,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          subscriptionType: payment.subscriptionType,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt
        }))
      };
    } catch (error) {
      logger.error('获取用户支付历史失败:', error);
      return {
        success: false,
        message: '获取支付历史失败'
      };
    }
  }
} 