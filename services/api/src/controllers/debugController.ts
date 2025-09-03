import { Request, Response } from 'express';
import UserVocabulary from '../models/UserVocabulary';
import { User } from '../models/User';
import { logger } from '../utils/logger';

export class DebugController {
  // 调试用户词汇数据
  static async debugUserVocabulary(req: Request, res: Response) {
    try {
      logger.info('开始调试用户词汇数据');

      // 获取UserVocabulary表的总记录数
      const totalVocabularyRecords = await UserVocabulary.countDocuments();
      
      // 获取所有用户词汇记录（限制前20条）
      const allVocabularyRecords = await UserVocabulary.find().limit(20);
      
      // 获取所有用户ID
      const allUserIds = await UserVocabulary.distinct('userId');
      
      // 获取用户总数
      const totalUsers = await User.countDocuments();
      
      // 获取有词汇记录的用户数
      const usersWithVocabulary = allUserIds.length;
      
      // 获取Apple用户数
      const appleUsers = await User.countDocuments({ loginType: 'apple' });
      
      // 获取Apple用户的词汇记录
      const appleUserIds = await User.find({ loginType: 'apple' }).distinct('_id');
      const appleUserVocabularyCount = await UserVocabulary.countDocuments({ 
        userId: { $in: appleUserIds } 
      });

      logger.info(`调试结果: 总词汇记录=${totalVocabularyRecords}, 总用户=${totalUsers}, 有词汇用户=${usersWithVocabulary}`);

      res.json({
        success: true,
        message: '用户词汇数据调试成功',
        data: {
          totalVocabularyRecords,
          totalUsers,
          usersWithVocabulary,
          appleUsers,
          appleUserVocabularyCount,
          allUserIds: allUserIds.slice(0, 10), // 只显示前10个
          sampleRecords: allVocabularyRecords.map(record => ({
            userId: record.userId,
            word: record.word,
            language: record.language,
            mastery: record.mastery
          }))
        }
      });

    } catch (error) {
      logger.error('调试用户词汇数据失败:', error);
      res.status(500).json({
        success: false,
        message: '调试用户词汇数据失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
