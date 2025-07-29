import express from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 需要认证的路由
router.use(authenticateToken);

// 创建支付订单
router.post('/create', PaymentController.createPayment);

// 查询支付状态
router.get('/status/:orderId', PaymentController.getPaymentStatus);

// 获取用户支付历史
router.get('/history', PaymentController.getUserPayments);

// 支付回调（不需要认证）
router.post('/callback/wechat', PaymentController.wechatPayCallback);
router.post('/callback/alipay', PaymentController.alipayCallback);

export default router; 