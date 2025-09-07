import express from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import axios from 'axios';
import { User } from '../models/User';

const router = express.Router();

// 苹果收据验证接口
interface AppleReceiptValidationRequest {
  'receipt-data': string;
  password: string; // 共享密钥
  'exclude-old-transactions'?: boolean;
}

interface AppleReceiptValidationResponse {
  status: number;
  receipt?: {
    bundle_id: string;
    application_version: string;
    in_app: Array<{
      product_id: string;
      transaction_id: string;
      original_transaction_id: string;
      purchase_date: string;
      expires_date?: string;
    }>;
  };
  'latest_receipt_info'?: Array<{
    product_id: string;
    transaction_id: string;
    expires_date: string;
    is_trial_period: string;
  }>;
}

/**
 * 验证苹果IAP收据
 */
router.post('/validate-receipt', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { receipt, bundleId } = req.body;
    const userId = req.user?.id;

    if (!receipt) {
      return res.status(400).json({
        success: false,
        error: '缺少收据数据'
      });
    }

    logger.info('[IAP] 开始验证收据', { userId, bundleId });

    // 验证bundle ID
    if (bundleId !== 'com.tannibunni.dramawordmobile') {
      return res.status(400).json({
        success: false,
        error: '无效的应用包名'
      });
    }

    // 使用共享密钥验证收据
    const sharedSecret = process.env.APPLE_SHARED_SECRET;
    if (!sharedSecret) {
      throw new Error('Apple共享密钥未配置');
    }

            // 先尝试生产环境验证
        let appleResponse = await validateWithApple(receipt, sharedSecret, false);
        
        // 如果生产环境返回沙盒收据错误，尝试沙盒环境
        if (appleResponse && appleResponse.status === 21007) {
          logger.info('[IAP] 检测到沙盒收据，使用沙盒环境验证');
          appleResponse = await validateWithApple(receipt, sharedSecret, true);
        }

    if (!appleResponse || appleResponse.status !== 0) {
      logger.error('[IAP] 苹果验证失败', { status: appleResponse?.status });
      return res.status(400).json({
        success: false,
        error: `收据验证失败: ${getAppleErrorMessage(appleResponse?.status || -1)}`
      });
    }

    // 解析订阅信息
    const subscriptionInfo = parseSubscriptionInfo(appleResponse);
    
    if (subscriptionInfo) {
      // 更新用户订阅状态到数据库
      try {
        const user = await User.findById(userId);
        if (!user) {
          logger.error(`[IAP] 用户不存在: userId=${userId}`);
          return res.status(404).json({
            success: false,
            error: '用户不存在'
          });
        }

        // 根据产品ID确定订阅类型
        let subscriptionType: 'monthly' | 'yearly' | 'lifetime' = 'monthly';
        if (subscriptionInfo.productId.includes('yearly') || subscriptionInfo.productId.includes('annual')) {
          subscriptionType = 'yearly';
        } else if (subscriptionInfo.productId.includes('lifetime')) {
          subscriptionType = 'lifetime';
        }

        // 计算过期时间
        const now = new Date();
        let expiryDate: Date;
        
        if (subscriptionType === 'lifetime') {
          // 终身订阅设置为100年后过期
          expiryDate = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000);
        } else {
          // 使用苹果返回的过期时间
          expiryDate = subscriptionInfo.expiresAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        // 更新用户订阅信息
        user.subscription = {
          type: subscriptionType,
          isActive: true,
          startDate: now,
          expiryDate: expiryDate,
          autoRenew: subscriptionType !== 'lifetime'
        };

        await user.save();
        
        logger.info('[IAP] 用户订阅状态更新成功', { 
          userId, 
          productId: subscriptionInfo.productId,
          subscriptionType,
          expiresAt: expiryDate
        });
        
        res.json({
          success: true,
          subscription: {
            ...subscriptionInfo,
            subscriptionType,
            isActive: true
          }
        });
      } catch (error) {
        logger.error('[IAP] 更新用户订阅状态失败:', error);
        res.status(500).json({
          success: false,
          error: '更新订阅状态失败'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: '无效的订阅信息'
      });
    }

  } catch (error) {
    logger.error('[IAP] 收据验证异常', { error: error.message });
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

/**
 * 调用苹果验证API
 */
async function validateWithApple(
  receipt: string, 
  password: string, 
  isSandbox: boolean
): Promise<AppleReceiptValidationResponse> {
  const url = isSandbox 
    ? 'https://sandbox.itunes.apple.com/verifyReceipt'
    : 'https://buy.itunes.apple.com/verifyReceipt';

  const requestData: AppleReceiptValidationRequest = {
    'receipt-data': receipt,
    password,
    'exclude-old-transactions': true
  };

  const response = await axios.post<AppleReceiptValidationResponse>(url, requestData, {
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

/**
 * 解析订阅信息
 */
function parseSubscriptionInfo(appleResponse: AppleReceiptValidationResponse) {
  const latestReceipt = appleResponse.latest_receipt_info?.[0];
  
  if (!latestReceipt) {
    return null;
  }

  return {
    productId: latestReceipt.product_id,
    transactionId: latestReceipt.transaction_id,
    expiresAt: new Date(parseInt(latestReceipt.expires_date)),
    isTrialPeriod: latestReceipt.is_trial_period === 'true'
  };
}

/**
 * 获取苹果错误信息
 */
function getAppleErrorMessage(status: number): string {
  const errorMessages: { [key: number]: string } = {
    21000: '请求格式不正确',
    21002: '收据数据格式错误',
    21003: '收据无法验证',
    21004: '共享密钥不匹配',
    21005: '收据服务器暂时不可用',
    21006: '收据有效但订阅已过期',
    21007: '收据来自沙盒环境',
    21008: '收据来自生产环境',
    21010: '用户账户无法找到'
  };

  return errorMessages[status] || `未知错误: ${status}`;
}

/**
 * 获取用户当前订阅状态
 */
router.get('/subscription-status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    // 从数据库查询用户订阅状态
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`[IAP] 用户不存在: userId=${userId}`);
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    const now = new Date();
    const subscription = user.subscription;
    
    // 检查订阅是否过期
    const isExpired = subscription.expiryDate && subscription.expiryDate < now;
    const isActive = subscription.isActive && !isExpired;
    
    // 新用户默认为免费用户，没有试用期
    // 只有通过IAP验证的用户才可能有试用期
    const isTrial = false; // 暂时禁用试用期功能
    const trialEndsAt = undefined;

    logger.info('[IAP] 查询用户订阅状态', { 
      userId, 
      isActive, 
      isTrial, 
      subscriptionType: subscription.type,
      expiryDate: subscription.expiryDate
    });

    res.json({
      success: true,
      subscription: {
        isActive,
        isTrial,
        subscriptionType: subscription.type,
        expiresAt: subscription.expiryDate,
        trialEndsAt,
        autoRenew: subscription.autoRenew
      }
    });

  } catch (error) {
    logger.error('[IAP] 获取订阅状态失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

export default router;
