import express from 'express';
import { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { logger } from '../utils/logger';
import axios from 'axios';

const router = express.Router();

// 苹果收据验证接口
interface AppleReceiptValidationRequest {
  receipt: string;
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
router.post('/validate-receipt', auth, async (req: Request, res: Response) => {
  try {
    const { receipt, bundleId } = req.body;
    const userId = req.user?.userId;

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
    if (appleResponse.status === 21007) {
      logger.info('[IAP] 检测到沙盒收据，使用沙盒环境验证');
      appleResponse = await validateWithApple(receipt, sharedSecret, true);
    }

    if (appleResponse.status !== 0) {
      logger.error('[IAP] 苹果验证失败', { status: appleResponse.status });
      return res.status(400).json({
        success: false,
        error: `收据验证失败: ${getAppleErrorMessage(appleResponse.status)}`
      });
    }

    // 解析订阅信息
    const subscriptionInfo = parseSubscriptionInfo(appleResponse);
    
    if (subscriptionInfo) {
      // TODO: 更新用户订阅状态到数据库
      logger.info('[IAP] 验证成功，更新用户订阅状态', { 
        userId, 
        productId: subscriptionInfo.productId,
        expiresAt: subscriptionInfo.expiresAt
      });
      
      res.json({
        success: true,
        subscription: subscriptionInfo
      });
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

  const response = await axios.post(url, requestData, {
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
router.get('/subscription-status', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    // TODO: 从数据库查询用户订阅状态
    // const subscription = await getUserSubscription(userId);

    // 临时返回模拟数据
    res.json({
      success: true,
      subscription: {
        isActive: false,
        isTrial: true,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
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
