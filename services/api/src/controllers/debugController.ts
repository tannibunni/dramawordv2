import { Request, Response } from 'express';
import UserVocabulary from '../models/UserVocabulary';
import { User } from '../models/User';
import { logger } from '../utils/logger';

export class DebugController {
  // 调试用户统计
  static async debugUserStats(req: Request, res: Response) {
    try {
      logger.info('开始调试用户统计');

      // 获取所有用户
      const allUsers = await User.find({});
      
      // 按登录类型分组
      const usersByType = allUsers.reduce((acc, user) => {
        const type = user.auth?.loginType || 'unknown';
        if (!acc[type]) acc[type] = [];
        acc[type].push({
          id: user._id,
          deviceId: user.auth?.deviceId,
          createdAt: user.createdAt,
          lastLogin: user.auth?.lastLoginAt
        });
        return acc;
      }, {} as any);

      // 检查重复的deviceId
      const deviceIdMap = new Map();
      const duplicateDeviceIds = [];
      
      allUsers.forEach(user => {
        if (user.auth?.deviceId) {
          if (deviceIdMap.has(user.auth.deviceId)) {
            duplicateDeviceIds.push({
              deviceId: user.auth.deviceId,
              users: [deviceIdMap.get(user.auth.deviceId), user._id]
            });
          } else {
            deviceIdMap.set(user.auth.deviceId, user._id);
          }
        }
      });

      // 统计信息
      const stats = {
        totalUsers: allUsers.length,
        usersByType: Object.keys(usersByType).reduce((acc, type) => {
          acc[type] = usersByType[type].length;
          return acc;
        }, {} as any),
        duplicateDeviceIds: duplicateDeviceIds.length,
        duplicateDetails: duplicateDeviceIds,
        allUsers: allUsers.map(user => ({
          id: user._id,
          deviceId: user.auth?.deviceId,
          loginType: user.auth?.loginType || 'unknown',
          createdAt: user.createdAt,
          lastLogin: user.auth?.lastLoginAt
        }))
      };

      logger.info(`用户统计: 总用户=${stats.totalUsers}, 重复设备=${stats.duplicateDeviceIds}`);

      res.json({
        success: true,
        message: '用户统计调试成功',
        data: stats
      });

    } catch (error) {
      logger.error('调试用户统计失败:', error);
      res.status(500).json({
        success: false,
        message: '调试用户统计失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

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
      
      // 获取所有用户详情
      const allUsers = await User.find({}).select('_id username nickname auth createdAt');
      
      // 按登录类型分组
      const usersByType = allUsers.reduce((acc, user) => {
        const type = user.auth?.loginType || 'unknown';
        if (!acc[type]) acc[type] = [];
        acc[type].push({
          id: user._id,
          username: user.username,
          nickname: user.nickname,
          deviceId: user.auth?.deviceId,
          guestId: user.auth?.guestId,
          createdAt: user.createdAt,
          lastLogin: user.auth?.lastLoginAt
        });
        return acc;
      }, {} as any);

      // 检查重复的deviceId
      const deviceIdMap = new Map();
      const duplicateDeviceIds = [];
      
      allUsers.forEach(user => {
        if (user.auth?.deviceId) {
          if (deviceIdMap.has(user.auth.deviceId)) {
            duplicateDeviceIds.push({
              deviceId: user.auth.deviceId,
              users: [deviceIdMap.get(user.auth.deviceId), user._id]
            });
          } else {
            deviceIdMap.set(user.auth.deviceId, user._id);
          }
        }
      });
      
      // 获取Apple用户数
      const appleUsers = await User.countDocuments({ 'auth.loginType': 'apple' });
      
      // 获取Apple用户的词汇记录
      const appleUserIds = await User.find({ 'auth.loginType': 'apple' }).distinct('_id');
      const appleUserVocabularyCount = await UserVocabulary.countDocuments({ 
        userId: { $in: appleUserIds } 
      });

      logger.info(`调试结果: 总词汇记录=${totalVocabularyRecords}, 总用户=${totalUsers}, 有词汇用户=${usersWithVocabulary}, 重复设备=${duplicateDeviceIds.length}`);

      res.json({
        success: true,
        message: '用户词汇数据调试成功',
        data: {
          totalVocabularyRecords,
          totalUsers,
          usersWithVocabulary,
          appleUsers,
          appleUserVocabularyCount,
          duplicateDeviceIds: duplicateDeviceIds.length,
          duplicateDetails: duplicateDeviceIds,
          usersByType: Object.keys(usersByType).reduce((acc, type) => {
            acc[type] = usersByType[type].length;
            return acc;
          }, {} as any),
          allUsers: allUsers.map(user => ({
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            loginType: user.auth?.loginType || 'unknown',
            deviceId: user.auth?.deviceId || 'none',
            guestId: user.auth?.guestId || 'none',
            createdAt: user.createdAt,
            lastLogin: user.auth?.lastLoginAt
          })),
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
