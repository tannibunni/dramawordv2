import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { logger } from '../utils/logger';

/**
 * 验证用户是否有权限访问指定的Apple ID
 * @param userId 用户ID
 * @param appleId Apple ID
 * @returns 是否有权限
 */
export async function validateAppleIdAccess(userId: string, appleId: string): Promise<boolean> {
  try {
    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`⚠️ 用户不存在: ${userId}`);
      return false;
    }

    // 检查用户是否使用Apple ID登录
    if (!user.auth.appleId) {
      logger.warn(`⚠️ 用户 ${userId} 未使用Apple ID登录`);
      return false;
    }

    // 检查Apple ID是否匹配
    if (user.auth.appleId !== appleId) {
      logger.warn(`⚠️ 用户 ${userId} 尝试访问其他Apple ID: ${appleId} (自己的: ${user.auth.appleId})`);
      return false;
    }

    // 检查用户是否已激活
    if (!user.auth.isActive) {
      logger.warn(`⚠️ 用户 ${userId} 账户未激活`);
      return false;
    }

    // 检查用户是否有有效的订阅（可选，根据业务需求调整）
    if (user.subscription && user.subscription.isActive !== true) {
      logger.warn(`⚠️ 用户 ${userId} 订阅状态无效: ${user.subscription.isActive}`);
      // 这里可以根据业务需求决定是否阻止访问
      // return false;
    }

    logger.info(`✅ 用户 ${userId} 验证Apple ID ${appleId} 访问权限成功`);
    return true;

  } catch (error) {
    logger.error('❌ 验证Apple ID访问权限失败:', error);
    return false;
  }
}

/**
 * Apple ID访问验证中间件
 * 用于验证用户是否有权限访问指定的Apple ID数据
 */
export function appleIdAccessMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    const appleId = req.params.appleId;

    if (!userId) {
      logger.warn('⚠️ 未找到用户ID');
      return res.status(401).json({
        success: false,
        message: '未找到用户ID'
      });
    }

    if (!appleId) {
      logger.warn('⚠️ 未找到Apple ID参数');
      return res.status(400).json({
        success: false,
        message: '未找到Apple ID参数'
      });
    }

    // 异步验证权限
    validateAppleIdAccess(userId, appleId)
      .then(hasAccess => {
        if (hasAccess) {
          next();
        } else {
          logger.warn(`⚠️ 用户 ${userId} 无权限访问Apple ID ${appleId}`);
          res.status(403).json({
            success: false,
            message: '无权限访问此Apple ID的数据'
          });
        }
      })
      .catch(error => {
        logger.error('❌ Apple ID访问验证失败:', error);
        res.status(500).json({
          success: false,
          message: '验证失败，请重试'
        });
      });

  } catch (error) {
    logger.error('❌ Apple ID访问验证中间件错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}

/**
 * 批量验证多个Apple ID的访问权限
 * @param userId 用户ID
 * @param appleIds Apple ID数组
 * @returns 验证结果映射
 */
export async function validateMultipleAppleIdAccess(
  userId: string, 
  appleIds: string[]
): Promise<Record<string, boolean>> {
  try {
    const results: Record<string, boolean> = {};
    
    // 并行验证所有Apple ID
    const validationPromises = appleIds.map(async (appleId) => {
      const hasAccess = await validateAppleIdAccess(userId, appleId);
      results[appleId] = hasAccess;
      return { appleId, hasAccess };
    });

    await Promise.all(validationPromises);
    
    logger.info(`✅ 批量验证Apple ID访问权限完成: ${appleIds.length} 个`);
    return results;

  } catch (error) {
    logger.error('❌ 批量验证Apple ID访问权限失败:', error);
    // 返回所有失败的结果
    const results: Record<string, boolean> = {};
    appleIds.forEach(appleId => {
      results[appleId] = false;
    });
    return results;
  }
}

/**
 * 获取用户的Apple ID信息
 * @param userId 用户ID
 * @returns Apple ID信息
 */
export async function getUserAppleIdInfo(userId: string): Promise<{
  hasAppleId: boolean;
  appleId?: string;
  isActive: boolean;
  subscriptionStatus?: string;
}> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        hasAppleId: false,
        isActive: false
      };
    }

    return {
      hasAppleId: !!user.auth.appleId,
      appleId: user.auth.appleId,
      isActive: user.auth.isActive || false,
      subscriptionStatus: user.subscription?.isActive ? 'active' : 'inactive'
    };

  } catch (error) {
    logger.error('❌ 获取用户Apple ID信息失败:', error);
    return {
      hasAppleId: false,
      isActive: false
    };
  }
}

/**
 * 检查用户是否可以使用跨设备同步功能
 * @param userId 用户ID
 * @returns 是否可以使用
 */
export async function canUseCrossDeviceSync(userId: string): Promise<{
  canUse: boolean;
  reason?: string;
  appleId?: string;
}> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        canUse: false,
        reason: '用户不存在'
      };
    }

    if (!user.auth.appleId) {
      return {
        canUse: false,
        reason: '未使用Apple ID登录'
      };
    }

    if (!user.auth.isActive) {
      return {
        canUse: false,
        reason: '账户未激活'
      };
    }

    // 检查订阅状态（可选）
    if (user.subscription && user.subscription.isActive !== true) {
      return {
        canUse: false,
        reason: '订阅已过期',
        appleId: user.auth.appleId
      };
    }

    return {
      canUse: true,
      appleId: user.auth.appleId
    };

  } catch (error) {
    logger.error('❌ 检查跨设备同步权限失败:', error);
    return {
      canUse: false,
      reason: '检查失败'
    };
  }
}
