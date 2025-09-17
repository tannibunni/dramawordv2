import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { InviteCode, IInviteCode } from '../models/InviteCode';
import { InviteReward, IInviteReward } from '../models/InviteReward';
import { User } from '../models/User';

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

      // 从数据库查询邀请码
      const inviteCode = await InviteCode.findOne({ 
        code: code.toUpperCase(),
        status: 'active'
      });
      
      if (!inviteCode) {
        return res.status(404).json({
          success: false,
          message: '邀请码不存在或已失效',
          code: 'INVITE_CODE_NOT_FOUND'
        });
      }

      if (inviteCode.usedCount >= inviteCode.maxUses) {
        return res.status(400).json({
          success: false,
          message: '邀请码使用次数已达上限',
          code: 'INVITE_CODE_MAX_USES_REACHED'
        });
      }

      if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
        return res.status(400).json({
          success: false,
          message: '邀请码已过期',
          code: 'INVITE_CODE_EXPIRED'
        });
      }

      logger.info(`✅ 邀请码验证成功: ${code}, 类型: ${inviteCode.type}`);

      res.json({
        success: true,
        message: '邀请码验证成功',
        data: {
          code: inviteCode.code,
          type: inviteCode.type,
          reward: inviteCode.reward,
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

      // 查找邀请码
      const inviteCode = await InviteCode.findOne({ 
        code: code.toUpperCase(),
        status: 'active'
      });
      
      if (!inviteCode) {
        return res.status(400).json({
          success: false,
          message: '邀请码不存在或已失效'
        });
      }

      // 检查是否已经使用过
      if (inviteCode.usedCount >= inviteCode.maxUses) {
        return res.status(400).json({
          success: false,
          message: '邀请码使用次数已达上限'
        });
      }

      // 检查是否过期
      if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
        return res.status(400).json({
          success: false,
          message: '邀请码已过期'
        });
      }

      // 检查用户是否已经使用过此邀请码
      const existingUsage = await InviteCode.findOne({
        inviteeId: userId,
        status: 'used'
      });
      
      if (existingUsage) {
        return res.status(400).json({
          success: false,
          message: '您已经使用过邀请码'
        });
      }

      // 开始事务处理
      const session = await InviteCode.startSession();
      session.startTransaction();

      try {
        // 更新邀请码状态
        inviteCode.inviteeId = userId;
        inviteCode.usedCount += 1;
        inviteCode.status = inviteCode.usedCount >= inviteCode.maxUses ? 'used' : 'active';
        inviteCode.usedAt = new Date();
        await inviteCode.save({ session });

        // 根据邀请码类型处理奖励
        let rewardResult = null;
        if (inviteCode.type === 'free_trial') {
          rewardResult = await InviteController.activateFreeTrial(userId, inviteCode.reward.freeTrialDays, session);
        }

        // 创建邀请奖励记录
        await InviteController.createInviteRewards(inviteCode, userId, session);

        // 提交事务
        await session.commitTransaction();
        session.endSession();

        logger.info(`✅ 邀请码应用成功: ${code}, 用户: ${userId}, 类型: ${inviteCode.type}`);

        res.json({
          success: true,
          message: '邀请码应用成功',
          data: {
            code: inviteCode.code,
            type: inviteCode.type,
            reward: inviteCode.reward,
            rewardResult: rewardResult,
            appliedAt: new Date()
          }
        });

      } catch (error) {
        // 回滚事务
        await session.abortTransaction();
        session.endSession();
        throw error;
      }

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
      const userLoginType = (req as any).user?.loginType;
      const { 
        type = 'free_trial', 
        freeTrialDays = 30, 
        maxUses = 1, 
        expiresInDays = 30 
      } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        });
      }

      // 检查用户是否为注册用户
      if (userLoginType === 'guest') {
        return res.status(403).json({
          success: false,
          message: '只有注册用户才能生成邀请码',
          code: 'GUEST_USER_NOT_ALLOWED',
          data: {
            requireRegistration: true,
            message: '请先注册成为正式用户，然后才能生成邀请码'
          }
        });
      }

      logger.info(`🎫 生成邀请码: 用户 ${userId}, 类型 ${type}, 登录类型 ${userLoginType}`);

      // 检查用户是否已经有活跃的邀请码
      const existingInviteCode = await InviteCode.findOne({
        inviterId: userId,
        status: 'active',
        expiresAt: { $gt: new Date() }
      });

      if (existingInviteCode) {
        logger.info(`✅ 返回现有邀请码: ${existingInviteCode.code}`);
        return res.json({
          success: true,
          message: '您已有一个活跃的邀请码',
          data: {
            code: existingInviteCode.code,
            type: existingInviteCode.type,
            reward: existingInviteCode.reward,
            maxUses: existingInviteCode.maxUses,
            usedCount: existingInviteCode.usedCount,
            expiresAt: existingInviteCode.expiresAt,
            inviteLink: `https://dramaword.com/invite/${existingInviteCode.code}`
          }
        });
      }

      // 生成邀请码
      const code = InviteController.generateCode();
      
      // 计算过期时间
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // 创建邀请码记录
      const inviteCode = new InviteCode({
        code,
        inviterId: userId,
        type,
        reward: {
          freeTrialDays,
          discountPercent: 0,
          premiumGift: ''
        },
        status: 'active',
        maxUses,
        usedCount: 0,
        expiresAt
      });

      await inviteCode.save();

      logger.info(`✅ 邀请码生成成功: ${code}`);

      res.json({
        success: true,
        message: '邀请码生成成功',
        data: {
          code: inviteCode.code,
          type: inviteCode.type,
          reward: inviteCode.reward,
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

  // 激活免费试用
  private static async activateFreeTrial(userId: string, days: number, session: any) {
    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 计算试用结束时间
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + days);

      // 更新用户订阅状态
      user.subscription = {
        ...user.subscription,
        isActive: true,
        startDate: new Date(),
        expiryDate: trialEndDate
      };

      await user.save({ session });

      logger.info(`✅ 激活免费试用: 用户 ${userId}, ${days} 天`);
      
      return {
        success: true,
        trialDays: days,
        endDate: trialEndDate
      };
    } catch (error) {
      logger.error('❌ 激活免费试用失败:', error);
      throw error;
    }
  }

  // 创建邀请奖励
  private static async createInviteRewards(inviteCode: IInviteCode, inviteeId: string, session: any) {
    try {
      const rewards = [];

      // 邀请者奖励
      const inviterReward = new InviteReward({
        inviterId: inviteCode.inviterId,
        inviteeId: inviteeId,
        inviteCodeId: inviteCode._id.toString(),
        rewardType: 'experience',
        rewardValue: 100, // 邀请者获得100经验值
        rewardDescription: '成功邀请好友',
        status: 'pending'
      });
      rewards.push(inviterReward);

      // 被邀请者奖励
      const inviteeReward = new InviteReward({
        inviterId: inviteCode.inviterId,
        inviteeId: inviteeId,
        inviteCodeId: inviteCode._id.toString(),
        rewardType: 'experience',
        rewardValue: 50, // 被邀请者获得50经验值
        rewardDescription: '使用邀请码注册',
        status: 'claimed' // 被邀请者立即获得奖励
      });
      rewards.push(inviteeReward);

      // 保存奖励记录
      await InviteReward.insertMany(rewards, { session });

      // 立即给被邀请者发放奖励
      await InviteController.claimReward(inviteeId, inviteeReward._id.toString(), session);

      logger.info(`✅ 创建邀请奖励: 邀请者 ${inviteCode.inviterId}, 被邀请者 ${inviteeId}`);
    } catch (error) {
      logger.error('❌ 创建邀请奖励失败:', error);
      throw error;
    }
  }

  // 领取奖励
  private static async claimReward(userId: string, rewardId: string, session: any) {
    try {
      const reward = await InviteReward.findById(rewardId).session(session);
      if (!reward || reward.status !== 'pending') {
        return;
      }

      // 更新用户经验值
      const user = await User.findById(userId).session(session);
      if (user) {
        // 使用addExperience方法或直接更新experience字段
        if (user.addExperience) {
          user.addExperience(reward.rewardValue);
        } else {
          (user as any).experience = ((user as any).experience || 0) + reward.rewardValue;
        }
        await user.save({ session });
      }

      // 更新奖励状态
      reward.status = 'claimed';
      reward.claimedAt = new Date();
      await reward.save({ session });

      logger.info(`✅ 领取奖励成功: 用户 ${userId}, 奖励 ${reward.rewardValue} ${reward.rewardType}`);
    } catch (error) {
      logger.error('❌ 领取奖励失败:', error);
      throw error;
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