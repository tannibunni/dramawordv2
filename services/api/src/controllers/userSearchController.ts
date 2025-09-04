import { Request, Response } from 'express';
import { User } from '../models/User';
import UserVocabulary from '../models/UserVocabulary';
import { logger } from '../utils/logger';

export class UserSearchController {
  // 通过邮箱查询用户
  static async getUserByEmail(req: Request, res: Response) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: '邮箱不能为空'
        });
      }

      logger.info(`开始查询邮箱为 ${email} 的用户`);

      // 查询用户
      const user = await User.findOne({ email: email });
      
      if (!user) {
        logger.info(`未找到邮箱为 ${email} 的用户`);
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 查询用户的词汇数量
      const wordCount = await UserVocabulary.countDocuments({ userId: user._id.toString() });

      logger.info(`找到用户: ${user._id}, 词汇数量: ${wordCount}`);

      res.json({
        success: true,
        message: '用户查询成功',
        data: {
          userId: user._id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          loginType: (user as any).loginType,
          hasAvatar: !!user.avatar,
          wordCount: wordCount,
          userInfo: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            loginType: (user as any).loginType,
            avatar: user.avatar
          }
        }
      });

    } catch (error) {
      logger.error('通过邮箱查询用户失败:', error);
      res.status(500).json({
        success: false,
        message: '查询用户失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 查询所有Apple用户
  static async getAllAppleUsers(req: Request, res: Response) {
    try {
      logger.info('开始查询所有Apple用户');

      // 查询所有Apple用户
      const appleUsers = await User.find({ loginType: 'apple' });
      
      logger.info(`找到 ${appleUsers.length} 个Apple用户`);

      // 为每个用户查询词汇数量
      const usersWithWordCount = await Promise.all(
        appleUsers.map(async (user) => {
          const wordCount = await UserVocabulary.countDocuments({ userId: user._id.toString() });
          return {
            userId: user._id,
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            loginType: (user as any).loginType,
            hasAvatar: !!user.avatar,
            wordCount: wordCount
          };
        })
      );

      // 按词汇数量排序
      usersWithWordCount.sort((a, b) => b.wordCount - a.wordCount);

      res.json({
        success: true,
        message: 'Apple用户查询成功',
        data: {
          totalUsers: appleUsers.length,
          users: usersWithWordCount
        }
      });

    } catch (error) {
      logger.error('查询Apple用户失败:', error);
      res.status(500).json({
        success: false,
        message: '查询Apple用户失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
