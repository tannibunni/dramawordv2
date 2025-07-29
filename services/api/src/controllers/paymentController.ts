import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { logger } from '../utils/logger';

export class PaymentController {
  /**
   * 创建支付订单
   */
  static async createPayment(req: Request, res: Response) {
    try {
      const { subscriptionType, paymentMethod } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        });
      }

      if (!subscriptionType || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      const result = await PaymentService.createPayment({
        userId,
        subscriptionType,
        paymentMethod
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      logger.error('创建支付订单失败:', error);
      res.status(500).json({
        success: false,
        message: '创建支付订单失败'
      });
    }
  }

  /**
   * 查询支付状态
   */
  static async getPaymentStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: '订单ID不能为空'
        });
      }

      const result = await PaymentService.getPaymentStatus(orderId);
      res.json(result);
    } catch (error) {
      logger.error('查询支付状态失败:', error);
      res.status(500).json({
        success: false,
        message: '查询支付状态失败'
      });
    }
  }

  /**
   * 获取用户支付历史
   */
  static async getUserPayments(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        });
      }

      const result = await PaymentService.getUserPayments(userId);
      res.json(result);
    } catch (error) {
      logger.error('获取用户支付历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取支付历史失败'
      });
    }
  }

  /**
   * 微信支付回调
   */
  static async wechatPayCallback(req: Request, res: Response) {
    try {
      const { orderId, paymentData } = req.body;

      if (!orderId || !paymentData) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      const success = await PaymentService.handlePaymentCallback(orderId, 'wechat', paymentData);

      if (success) {
        res.json({ success: true, message: '支付成功' });
      } else {
        res.status(400).json({ success: false, message: '支付失败' });
      }
    } catch (error) {
      logger.error('微信支付回调处理失败:', error);
      res.status(500).json({
        success: false,
        message: '支付回调处理失败'
      });
    }
  }

  /**
   * 支付宝支付回调
   */
  static async alipayCallback(req: Request, res: Response) {
    try {
      const { orderId, paymentData } = req.body;

      if (!orderId || !paymentData) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      const success = await PaymentService.handlePaymentCallback(orderId, 'alipay', paymentData);

      if (success) {
        res.json({ success: true, message: '支付成功' });
      } else {
        res.status(400).json({ success: false, message: '支付失败' });
      }
    } catch (error) {
      logger.error('支付宝支付回调处理失败:', error);
      res.status(500).json({
        success: false,
        message: '支付回调处理失败'
      });
    }
  }
} 