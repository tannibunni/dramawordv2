/**
 * 徽章控制器 - 处理徽章相关请求
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export class BadgeController {
  /**
   * 获取所有徽章定义
   */
  static async getBadgeDefinitions(req: Request, res: Response) {
    try {
      // 模拟徽章定义数据
      const badgeDefinitions = [
        {
          id: 'first_word',
          name: '第一个单词',
          description: '收集你的第一个单词',
          icon: '📚',
          category: 'learning',
          target: 1,
          xpReward: 10
        },
        {
          id: 'word_collector_10',
          name: '单词收集家',
          description: '收集10个单词',
          icon: '📖',
          category: 'learning',
          target: 10,
          xpReward: 50
        },
        {
          id: 'word_collector_50',
          name: '单词大师',
          description: '收集50个单词',
          icon: '📚',
          category: 'learning',
          target: 50,
          xpReward: 200
        },
        {
          id: 'streak_7',
          name: '一周坚持',
          description: '连续学习7天',
          icon: '🔥',
          category: 'streak',
          target: 7,
          xpReward: 100
        },
        {
          id: 'streak_30',
          name: '月度坚持',
          description: '连续学习30天',
          icon: '💪',
          category: 'streak',
          target: 30,
          xpReward: 500
        }
      ];

      res.json({
        success: true,
        data: badgeDefinitions
      });
    } catch (error) {
      logger.error('获取徽章定义失败:', error);
      res.status(500).json({
        success: false,
        message: '获取徽章定义失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取用户徽章进度
   */
  static async getUserBadgeProgress(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      // 模拟用户徽章进度数据
      const userBadgeProgress = [
        {
          badgeId: 'first_word',
          progress: 1,
          target: 1,
          unlocked: true,
          unlockedAt: new Date('2024-01-01'),
          status: 'unlocked'
        },
        {
          badgeId: 'word_collector_10',
          progress: 8,
          target: 10,
          unlocked: false,
          unlockedAt: null,
          status: 'locked'
        },
        {
          badgeId: 'word_collector_50',
          progress: 8,
          target: 50,
          unlocked: false,
          unlockedAt: null,
          status: 'locked'
        },
        {
          badgeId: 'streak_7',
          progress: 3,
          target: 7,
          unlocked: false,
          unlockedAt: null,
          status: 'locked'
        },
        {
          badgeId: 'streak_30',
          progress: 3,
          target: 30,
          unlocked: false,
          unlockedAt: null,
          status: 'locked'
        }
      ];

      res.json({
        success: true,
        data: userBadgeProgress
      });
    } catch (error) {
      logger.error('获取用户徽章进度失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户徽章进度失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取用户徽章摘要
   */
  static async getUserBadgeSummary(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      // 模拟用户徽章摘要数据
      const summary = {
        totalBadges: 5,
        unlockedBadges: 1,
        lockedBadges: 4,
        readyToUnlock: 0,
        totalXP: 10,
        recentUnlocks: [
          {
            badgeId: 'first_word',
            name: '第一个单词',
            icon: '📚',
            unlockedAt: new Date('2024-01-01')
          }
        ]
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('获取用户徽章摘要失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户徽章摘要失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 更新用户徽章进度
   */
  static async updateBadgeProgress(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { badgeId, progress, action } = req.body;
      
      logger.info(`更新用户徽章进度: ${userId} - ${badgeId} - ${progress}`);

      // 模拟更新徽章进度
      const result = {
        badgeId,
        progress,
        target: 10, // 模拟目标值
        unlocked: progress >= 10,
        leveledUp: progress >= 10,
        xpGained: 10
      };

      res.json({
        success: true,
        message: '徽章进度更新成功',
        data: result
      });
    } catch (error) {
      logger.error('更新徽章进度失败:', error);
      res.status(500).json({
        success: false,
        message: '更新徽章进度失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 解锁徽章
   */
  static async unlockBadge(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { badgeId } = req.body;
      
      logger.info(`解锁徽章: ${userId} - ${badgeId}`);

      // 模拟解锁徽章
      const result = {
        badgeId,
        unlocked: true,
        unlockedAt: new Date(),
        xpReward: 50
      };

      res.json({
        success: true,
        message: '徽章解锁成功',
        data: result
      });
    } catch (error) {
      logger.error('解锁徽章失败:', error);
      res.status(500).json({
        success: false,
        message: '解锁徽章失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取用户最近获得的徽章
   */
  static async getRecentBadges(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      // 模拟最近获得的徽章数据
      const recentBadges = [
        {
          badgeId: 'first_word',
          name: '第一个单词',
          icon: '📚',
          unlockedAt: new Date('2024-01-01'),
          xpReward: 10
        }
      ];

      res.json({
        success: true,
        data: recentBadges
      });
    } catch (error) {
      logger.error('获取最近徽章失败:', error);
      res.status(500).json({
        success: false,
        message: '获取最近徽章失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取用户成就统计
   */
  static async getUserAchievements(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      // 模拟用户成就统计数据
      const achievements = {
        totalWords: 8,
        totalDays: 3,
        totalXP: 10,
        badgesUnlocked: 1,
        currentStreak: 3,
        longestStreak: 3,
        favoriteCategory: 'learning'
      };

      res.json({
        success: true,
        data: achievements
      });
    } catch (error) {
      logger.error('获取用户成就失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户成就失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 检查并更新所有徽章进度
   */
  static async checkAllBadges(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      logger.info(`检查所有徽章进度: ${userId}`);

      // 模拟检查所有徽章
      const result = {
        checked: 5,
        updated: 2,
        unlocked: 1,
        newBadges: [
          {
            badgeId: 'word_collector_10',
            name: '单词收集家',
            icon: '📖'
          }
        ]
      };

      res.json({
        success: true,
        message: '徽章检查完成',
        data: result
      });
    } catch (error) {
      logger.error('检查徽章失败:', error);
      res.status(500).json({
        success: false,
        message: '检查徽章失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取徽章排行榜
   */
  static async getBadgeLeaderboard(req: Request, res: Response) {
    try {
      // 模拟徽章排行榜数据
      const leaderboard = [
        {
          userId: 'user1',
          username: '学习达人',
          badgesUnlocked: 15,
          totalXP: 1500,
          rank: 1
        },
        {
          userId: 'user2',
          username: '单词收集家',
          badgesUnlocked: 12,
          totalXP: 1200,
          rank: 2
        },
        {
          userId: 'user3',
          username: '坚持者',
          badgesUnlocked: 10,
          totalXP: 1000,
          rank: 3
        }
      ];

      res.json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      logger.error('获取徽章排行榜失败:', error);
      res.status(500).json({
        success: false,
        message: '获取徽章排行榜失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取徽章分类
   */
  static async getBadgeCategories(req: Request, res: Response) {
    try {
      // 模拟徽章分类数据
      const categories = [
        {
          id: 'learning',
          name: '学习成就',
          description: '与学习相关的徽章',
          icon: '📚',
          badgeCount: 3
        },
        {
          id: 'streak',
          name: '坚持成就',
          description: '与连续学习相关的徽章',
          icon: '🔥',
          badgeCount: 2
        },
        {
          id: 'social',
          name: '社交成就',
          description: '与社交分享相关的徽章',
          icon: '👥',
          badgeCount: 0
        }
      ];

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('获取徽章分类失败:', error);
      res.status(500).json({
        success: false,
        message: '获取徽章分类失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取特定徽章详情
   */
  static async getBadgeDetails(req: Request, res: Response) {
    try {
      const { badgeId } = req.params;
      
      // 模拟徽章详情数据
      const badgeDetails = {
        id: badgeId,
        name: '单词收集家',
        description: '收集10个单词',
        icon: '📖',
        category: 'learning',
        target: 10,
        xpReward: 50,
        rarity: 'common',
        requirements: [
          '收集10个不同的单词',
          '单词必须来自学习记录'
        ],
        tips: [
          '多观看不同剧集',
          '记录生词到单词本',
          '定期复习已学单词'
        ]
      };

      res.json({
        success: true,
        data: badgeDetails
      });
    } catch (error) {
      logger.error('获取徽章详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取徽章详情失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
