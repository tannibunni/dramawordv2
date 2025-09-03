import { Request, Response } from 'express';
import { User } from '../models/User';
import { UserVocabulary } from '../models/UserVocabulary';
import { logger } from '../utils/logger';

export class UserStatsController {
  // 获取用户词汇排行榜
  static async getTopUsers(req: Request, res: Response) {
    try {
      logger.info('开始查询用户词汇排行榜');

      // 聚合查询：按用户ID分组，统计每个用户的词汇数量
      const userWordCounts = await UserVocabulary.aggregate([
        {
          $group: {
            _id: '$userId',
            wordCount: { $sum: 1 }
          }
        },
        {
          $sort: { wordCount: -1 }
        },
        {
          $limit: 10  // 获取前10名
        }
      ]);

      logger.info(`找到 ${userWordCounts.length} 个有词汇记录的用户`);

      if (userWordCounts.length === 0) {
        return res.json({
          success: true,
          message: '没有找到任何用户词汇记录',
          data: []
        });
      }

      // 获取用户详细信息
      const topUsers = [];
      for (const userWordCount of userWordCounts) {
        const user = await User.findById(userWordCount._id);
        if (user) {
          topUsers.push({
            userId: userWordCount._id,
            wordCount: userWordCount.wordCount,
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            loginType: user.loginType,
            hasAvatar: !!user.avatar
          });
        }
      }

      logger.info(`成功获取 ${topUsers.length} 个用户的详细信息`);

      res.json({
        success: true,
        message: '用户词汇排行榜获取成功',
        data: {
          topUsers,
          totalUsers: topUsers.length,
          topUser: topUsers.length > 0 ? topUsers[0] : null
        }
      });

    } catch (error) {
      logger.error('获取用户词汇排行榜失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户词汇排行榜失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取用户词汇统计
  static async getUserWordStats(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }

      // 获取用户词汇数量
      const wordCount = await UserVocabulary.countDocuments({ userId });

      // 获取用户信息
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        message: '用户词汇统计获取成功',
        data: {
          userId,
          wordCount,
          user: {
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            loginType: user.loginType,
            hasAvatar: !!user.avatar
          }
        }
      });

    } catch (error) {
      logger.error('获取用户词汇统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户词汇统计失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
