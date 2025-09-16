import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export interface InviteCode {
  code: string;
  discount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export class InviteController {
  // 验证邀请码
  static async validateInviteCode(req: Request, res: Response) {
    try {
      const { code } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          success: false,
          message: '邀请码不能为空'
        });
      }

      logger.info(`🔍 验证邀请码: ${code}`);

      // 这里应该从数据库查询邀请码
      // 目前使用模拟数据
      const inviteCode = await InviteController.getInviteCodeFromDB(code);
      
      if (!inviteCode) {
        return res.status(404).json({
          success: false,
          message: '邀请码不存在'
        });
      }

      if (!inviteCode.isActive) {
        return res.status(400).json({
          success: false,
          message: '邀请码已失效'
        });
      }

      if (inviteCode.usedCount >= inviteCode.maxUses) {
        return res.status(400).json({
          success: false,
          message: '邀请码使用次数已达上限'
        });
      }

      if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
        return res.status(400).json({
          success: false,
          message: '邀请码已过期'
        });
      }

      logger.info(`✅ 邀请码验证成功: ${code}, 折扣: ${inviteCode.discount}%`);

      res.json({
        success: true,
        message: '邀请码验证成功',
        data: {
          code: inviteCode.code,
          discount: inviteCode.discount,
          maxUses: inviteCode.maxUses,
          usedCount: inviteCode.usedCount,
          expiresAt: inviteCode.expiresAt
        }
      });

    } catch (error) {
      logger.error('❌ 验证邀请码失败:', error);
      res.status(500).json({
        success: false,
        message: '验证邀请码失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 应用邀请码
  static async applyInviteCode(req: Request, res: Response) {
    try {
      const { code } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        });
      }

      logger.info(`🎁 应用邀请码: ${code}, 用户: ${userId}`);

      // 验证邀请码
      const inviteCode = await InviteController.getInviteCodeFromDB(code);
      
      if (!inviteCode || !inviteCode.isActive) {
        return res.status(400).json({
          success: false,
          message: '邀请码无效'
        });
      }

      // 检查用户是否已经使用过此邀请码
      const hasUsed = await InviteController.checkUserHasUsedCode(userId, code);
      if (hasUsed) {
        return res.status(400).json({
          success: false,
          message: '您已经使用过此邀请码'
        });
      }

      // 记录邀请码使用
      await InviteController.recordInviteCodeUsage(userId, code);

      // 更新邀请码使用次数
      await InviteController.updateInviteCodeUsage(code);

      logger.info(`✅ 邀请码应用成功: ${code}, 用户: ${userId}, 折扣: ${inviteCode.discount}%`);

      res.json({
        success: true,
        message: '邀请码应用成功',
        data: {
          code: inviteCode.code,
          discount: inviteCode.discount,
          appliedAt: new Date()
        }
      });

    } catch (error) {
      logger.error('❌ 应用邀请码失败:', error);
      res.status(500).json({
        success: false,
        message: '应用邀请码失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 生成邀请码
  static async generateInviteCode(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { discount = 10, maxUses = 100, expiresInDays = 30 } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        });
      }

      logger.info(`🎫 生成邀请码: 用户 ${userId}, 折扣 ${discount}%`);

      // 生成邀请码
      const code = InviteController.generateCode();
      
      // 计算过期时间
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // 保存邀请码到数据库
      const inviteCode: InviteCode = {
        code,
        discount,
        maxUses,
        usedCount: 0,
        expiresAt,
        isActive: true,
        createdBy: userId,
        createdAt: new Date()
      };

      await InviteController.saveInviteCodeToDB(inviteCode);

      logger.info(`✅ 邀请码生成成功: ${code}`);

      res.json({
        success: true,
        message: '邀请码生成成功',
        data: {
          code: inviteCode.code,
          discount: inviteCode.discount,
          maxUses: inviteCode.maxUses,
          expiresAt: inviteCode.expiresAt,
          inviteLink: `https://dramaword.com/invite/${code}`
        }
      });

    } catch (error) {
      logger.error('❌ 生成邀请码失败:', error);
      res.status(500).json({
        success: false,
        message: '生成邀请码失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 获取用户邀请码列表
  static async getUserInviteCodes(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        });
      }

      logger.info(`📋 获取用户邀请码列表: ${userId}`);

      // 从数据库获取用户的邀请码
      const inviteCodes = await InviteController.getUserInviteCodesFromDB(userId);

      res.json({
        success: true,
        message: '获取邀请码列表成功',
        data: inviteCodes
      });

    } catch (error) {
      logger.error('❌ 获取邀请码列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取邀请码列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 生成邀请码字符串
  private static generateCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `DW${timestamp}${random}`.toUpperCase();
  }

  // 从数据库获取邀请码（模拟实现）
  private static async getInviteCodeFromDB(code: string): Promise<InviteCode | null> {
    // 这里应该从数据库查询
    // 目前使用模拟数据
    const mockInviteCodes: InviteCode[] = [
      {
        code: 'DWMFN05BRN5PN9S0',
        discount: 20,
        maxUses: 100,
        usedCount: 5,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
        isActive: true,
        createdBy: 'mock_user_1',
        createdAt: new Date()
      },
      {
        code: 'DWTEST123456789',
        discount: 10,
        maxUses: 50,
        usedCount: 10,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
        isActive: true,
        createdBy: 'mock_user_2',
        createdAt: new Date()
      }
    ];

    return mockInviteCodes.find(invite => invite.code === code) || null;
  }

  // 检查用户是否已使用过邀请码（模拟实现）
  private static async checkUserHasUsedCode(userId: string, code: string): Promise<boolean> {
    // 这里应该从数据库查询
    // 目前返回false（未使用过）
    return false;
  }

  // 记录邀请码使用（模拟实现）
  private static async recordInviteCodeUsage(userId: string, code: string): Promise<void> {
    // 这里应该保存到数据库
    logger.info(`📝 记录邀请码使用: 用户 ${userId}, 邀请码 ${code}`);
  }

  // 更新邀请码使用次数（模拟实现）
  private static async updateInviteCodeUsage(code: string): Promise<void> {
    // 这里应该更新数据库
    logger.info(`📊 更新邀请码使用次数: ${code}`);
  }

  // 保存邀请码到数据库（模拟实现）
  private static async saveInviteCodeToDB(inviteCode: InviteCode): Promise<void> {
    // 这里应该保存到数据库
    logger.info(`💾 保存邀请码到数据库: ${inviteCode.code}`);
  }

  // 获取用户邀请码列表（模拟实现）
  private static async getUserInviteCodesFromDB(userId: string): Promise<InviteCode[]> {
    // 这里应该从数据库查询
    // 目前返回模拟数据
    return [
      {
        code: 'DWMFN05BRN5PN9S0',
        discount: 20,
        maxUses: 100,
        usedCount: 5,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdBy: userId,
        createdAt: new Date()
      }
    ];
  }
}