import { Request, Response } from 'express';
import { smartSyncStrategyService, UserSyncContext } from '../services/smartSyncStrategyService';
import { userActivityAnalysisService, UserActivityData } from '../services/userActivityAnalysisService';
import { logger } from '../utils/logger';

export class SmartSyncController {
  // 获取用户智能同步策略
  static async getUserSyncStrategy(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID缺失'
        });
      }

      // 获取用户活跃度数据
      const activityData = await SmartSyncController.getUserActivityData(userId, req);
      
      // 获取用户上下文
      const context = SmartSyncController.buildUserContext(userId, req);
      
      // 获取智能同步策略
      const strategy = await smartSyncStrategyService.getUserSyncStrategy(
        userId, 
        activityData, 
        context
      );

      logger.info(`🧠 返回用户同步策略: ${userId}`);

      res.json({
        success: true,
        data: {
          userId,
          strategy,
          context: {
            activityLevel: context.activityLevel,
            networkType: context.networkType,
            batteryLevel: context.batteryLevel,
            timeOfDay: context.timeOfDay,
            deviceType: context.deviceType
          },
          recommendations: context.activityLevel.recommendations,
          factors: context.activityLevel.factors
        }
      });
    } catch (error) {
      logger.error('❌ 获取用户同步策略失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户同步策略失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 更新用户同步上下文
  static async updateUserContext(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.query.userId as string;
      const { networkType, batteryLevel, deviceType } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID缺失'
        });
      }

      // 更新用户上下文
      smartSyncStrategyService.updateUserContext(userId, {
        networkType,
        batteryLevel,
        deviceType
      });

      logger.info(`🔄 更新用户同步上下文: ${userId}`);

      res.json({
        success: true,
        message: '用户同步上下文更新成功'
      });
    } catch (error) {
      logger.error('❌ 更新用户同步上下文失败:', error);
      res.status(500).json({
        success: false,
        message: '更新用户同步上下文失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 获取用户活跃度分析
  static async getUserActivityAnalysis(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID缺失'
        });
      }

      // 获取用户活跃度数据
      const activityData = await SmartSyncController.getUserActivityData(userId, req);
      
      // 分析用户活跃度
      const activityLevel = await userActivityAnalysisService.analyzeUserActivity(userId, activityData);

      logger.info(`📊 返回用户活跃度分析: ${userId}`);

      res.json({
        success: true,
        data: {
          userId,
          activityLevel,
          activityData: {
            loginCount: activityData.loginCount,
            totalSessionTime: activityData.totalSessionTime,
            averageSessionTime: activityData.averageSessionTime,
            actionsPerDay: activityData.actionsPerDay,
            dataSyncFrequency: activityData.dataSyncFrequency,
            deviceCount: activityData.deviceCount
          }
        }
      });
    } catch (error) {
      logger.error('❌ 获取用户活跃度分析失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户活跃度分析失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 获取智能同步统计
  static async getSmartSyncStats(req: Request, res: Response) {
    try {
      const activityStats = userActivityAnalysisService.getActivityStats();
      const strategyStats = smartSyncStrategyService.getStrategyStats();

      logger.info('📊 返回智能同步统计');

      res.json({
        success: true,
        data: {
          activityStats,
          strategyStats,
          summary: {
            totalActiveUsers: activityStats.totalUsers,
            highActivityPercentage: activityStats.totalUsers > 0 
              ? ((activityStats.highActivity / activityStats.totalUsers) * 100).toFixed(2) + '%'
              : '0%',
            averageActivityScore: activityStats.averageScore,
            averageSyncInterval: Math.round(strategyStats.averageSyncInterval / 1000) + 's',
            averageBatchSize: strategyStats.averageBatchSize
          }
        }
      });
    } catch (error) {
      logger.error('❌ 获取智能同步统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取智能同步统计失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 重置用户同步策略
  static async resetUserSyncStrategy(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID缺失'
        });
      }

      // 清空用户相关缓存
      smartSyncStrategyService.clearCache();
      userActivityAnalysisService.clearCache();

      logger.info(`🔄 重置用户同步策略: ${userId}`);

      res.json({
        success: true,
        message: '用户同步策略重置成功'
      });
    } catch (error) {
      logger.error('❌ 重置用户同步策略失败:', error);
      res.status(500).json({
        success: false,
        message: '重置用户同步策略失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 获取用户活跃度数据
  private static async getUserActivityData(userId: string, req: Request): Promise<UserActivityData> {
    // 这里应该从数据库获取真实的用户活跃度数据
    // 目前使用模拟数据
    const now = new Date();
    const lastLoginAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // 过去7天内
    const lastSyncAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000); // 过去24小时内

    return {
      userId,
      lastLoginAt,
      loginCount: Math.floor(Math.random() * 50) + 1,
      totalSessionTime: Math.random() * 10000000 + 1000000, // 1-11小时
      averageSessionTime: Math.random() * 1800000 + 300000, // 5-35分钟
      actionsPerDay: Math.floor(Math.random() * 200) + 10,
      dataSyncFrequency: Math.floor(Math.random() * 100) + 1,
      lastSyncAt,
      deviceCount: Math.floor(Math.random() * 3) + 1,
      timezone: req.headers['x-timezone'] as string || 'UTC',
      language: req.headers['accept-language']?.split(',')[0] || 'en-US'
    };
  }

  // 构建用户上下文
  private static buildUserContext(userId: string, req: Request): Partial<UserSyncContext> {
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /iPad|Tablet/.test(userAgent);
    
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (isTablet) deviceType = 'tablet';
    else if (isMobile) deviceType = 'mobile';

    return {
      userId,
      networkType: req.headers['x-network-type'] as 'wifi' | 'cellular' | 'offline' || 'wifi',
      batteryLevel: parseInt(req.headers['x-battery-level'] as string) || 100,
      timeOfDay: new Date().getHours(),
      timezone: req.headers['x-timezone'] as string || 'UTC',
      deviceType
    };
  }
}
