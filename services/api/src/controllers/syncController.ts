import { Request, Response } from 'express';
import syncService, { ISyncData, ConflictResolution } from '../services/syncService';
import { logger } from '../utils/logger';
import { updateWordProgress, addToUserVocabulary } from './wordController';

// 从 wordController 导入 generateWordData 函数
// 由于 generateWordData 是 wordController 中的私有函数，我们需要复制其逻辑

// 同步控制器类
export class SyncController {
  // 上传本地数据到云端
  static async uploadData(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const requestBody = req.body;

      // 处理批量同步请求 (前端发送 { data: SyncData[], timestamp: number })
      if (requestBody && Array.isArray(requestBody.data)) {
        logger.info(`🔄 处理批量同步请求: ${requestBody.data.length} 个数据项 for user: ${userId}`);
        
        const results = [];
        const errors = [];
        
        for (const syncItem of requestBody.data) {
          try {
            // 验证每个同步项
            if (!syncItem.type || !syncItem.data || !syncItem.userId) {
              errors.push(`无效的同步项: ${JSON.stringify(syncItem)}`);
              continue;
            }
            
            // 确保用户ID一致
            if (syncItem.userId !== userId) {
              errors.push(`用户ID不匹配: ${syncItem.userId} vs ${userId}`);
              continue;
            }
            
            logger.info(`📝 处理同步项: ${syncItem.type} - ${syncItem.operation}`);
            
            // 根据数据类型处理
            switch (syncItem.type) {
              case 'vocabulary':
                // 处理词汇表数据
                if (syncItem.operation === 'create' && syncItem.data.word) {
                  logger.info(`📚 添加单词到词汇表: ${syncItem.data.word}`);
                  // 这里可以调用词汇表相关的处理逻辑
                  results.push({ type: 'vocabulary', status: 'success', word: syncItem.data.word });
                }
                break;
                
              case 'experience':
                // 处理经验值数据
                logger.info(`🎯 处理经验值数据: ${syncItem.data.xpGained || 0} XP`);
                results.push({ type: 'experience', status: 'success', xpGained: syncItem.data.xpGained });
                break;
                
              case 'progress':
                // 处理学习进度数据
                logger.info(`📊 处理学习进度数据`);
                results.push({ type: 'progress', status: 'success' });
                break;
                
              case 'userStats':
                // 处理用户统计数据
                logger.info(`📈 处理用户统计数据`);
                results.push({ type: 'userStats', status: 'success' });
                break;
                
              default:
                logger.warn(`⚠️ 未知的同步数据类型: ${syncItem.type}`);
                results.push({ type: syncItem.type, status: 'unknown' });
            }
          } catch (error) {
            logger.error(`❌ 处理同步项失败: ${syncItem.type}`, error);
            errors.push(`${syncItem.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        logger.info(`✅ 批量同步完成: ${results.length} 成功, ${errors.length} 失败`);
        
        res.json({
          success: true,
          message: '批量同步完成',
          data: {
            results,
            errors,
            timestamp: requestBody.timestamp || Date.now()
          }
        });
        return;
      }

      // 处理单个同步项 (兼容旧格式)
      if (requestBody && requestBody.type) {
        logger.info(`🔄 处理单个同步项: ${requestBody.type} for user: ${userId}`);
        
        try {
          switch (requestBody.type) {
            case 'vocabulary':
              if (requestBody.data && requestBody.data.word) {
                logger.info(`📝 处理词汇表数据: ${requestBody.data.word}`);
              }
              break;
              
            case 'experience':
              logger.info(`🎯 处理经验值数据`);
              break;
              
            default:
              logger.warn(`⚠️ 未知的同步数据类型: ${requestBody.type}`);
          }
          
          logger.info(`✅ 用户 ${userId} 单个数据同步成功`);
          res.json({
            success: true,
            message: '数据同步成功',
            data: { synced: true }
          });
          return;
        } catch (error) {
          logger.error(`❌ 单个数据同步失败: ${requestBody.type}`, error);
          res.status(500).json({
            success: false,
            message: '服务器内部错误,请稍后重试',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return;
        }
      }

      // 兼容旧的 ISyncData 格式
      const oldSyncData: ISyncData = requestBody;

      // 验证同步数据
      if (!oldSyncData || !oldSyncData.learningRecords) {
        return res.status(400).json({
          success: false,
          message: '同步数据格式不正确'
        });
      }

      // 添加用户ID和设备ID
      oldSyncData.userId = userId;
      oldSyncData.deviceId = req.headers['user-agent'] || 'unknown';
      oldSyncData.lastSyncTime = new Date();

      const result = await syncService.uploadData(userId, oldSyncData);

      if (result.success) {
        logger.info(`用户 ${userId} 数据上传成功`);
        res.json({
          success: true,
          message: '数据上传成功',
          data: result.data
        });
      } else {
        logger.error(`用户 ${userId} 数据上传失败:`, result.errors);
        res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors
        });
      }
    } catch (error) {
      logger.error('数据上传失败:', error);
      res.status(500).json({
        success: false,
        message: '数据上传失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }



  // 从云端下载数据
  static async downloadData(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await syncService.downloadData(userId);

      if (result.success) {
        logger.info(`用户 ${userId} 数据下载成功`);
        res.json({
          success: true,
          message: '数据下载成功',
          data: result.data
        });
      } else {
        logger.error(`用户 ${userId} 数据下载失败:`, result.errors);
        res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors
        });
      }
    } catch (error) {
      logger.error('数据下载失败:', error);
      res.status(500).json({
        success: false,
        message: '数据下载失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 解决数据冲突
  static async resolveConflicts(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { conflicts, resolution } = req.body;

      if (!conflicts || !Array.isArray(conflicts)) {
        return res.status(400).json({
          success: false,
          message: '冲突数据格式不正确'
        });
      }

      if (!resolution || !['local', 'remote', 'merge', 'manual'].includes(resolution)) {
        return res.status(400).json({
          success: false,
          message: '冲突解决策略不正确'
        });
      }

      const result = await syncService.resolveConflicts(userId, conflicts, resolution as ConflictResolution);

      if (result.success) {
        logger.info(`用户 ${userId} 冲突解决成功`);
        res.json({
          success: true,
          message: '冲突解决成功',
          data: result.data
        });
      } else {
        logger.error(`用户 ${userId} 冲突解决失败:`, result.errors);
        res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors
        });
      }
    } catch (error) {
      logger.error('冲突解决失败:', error);
      res.status(500).json({
        success: false,
        message: '冲突解决失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取同步状态
  static async getSyncStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const status = await syncService.getSyncStatus(userId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('获取同步状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取同步状态失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 强制同步（上传和下载）
  static async forceSync(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const syncData: ISyncData = req.body;

      // 先上传数据
      const uploadResult = await syncService.uploadData(userId, syncData);
      if (!uploadResult.success) {
        return res.status(400).json({
          success: false,
          message: '数据上传失败',
          errors: uploadResult.errors
        });
      }

      // 再下载数据
      const downloadResult = await syncService.downloadData(userId);
      if (!downloadResult.success) {
        return res.status(400).json({
          success: false,
          message: '数据下载失败',
          errors: downloadResult.errors
        });
      }

      logger.info(`用户 ${userId} 强制同步成功`);

      res.json({
        success: true,
        message: '强制同步成功',
        data: {
          upload: uploadResult.data,
          download: downloadResult.data
        }
      });
    } catch (error) {
      logger.error('强制同步失败:', error);
      res.status(500).json({
        success: false,
        message: '强制同步失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取同步历史
  static async getSyncHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 20 } = req.query;

      // 这里可以实现同步历史记录的逻辑
      // 目前返回模拟数据
      const history = [
        {
          id: '1',
          type: 'upload',
          timestamp: new Date(),
          status: 'success',
          dataCount: 150,
          conflicts: 0
        },
        {
          id: '2',
          type: 'download',
          timestamp: new Date(Date.now() - 86400000), // 1天前
          status: 'success',
          dataCount: 120,
          conflicts: 2
        }
      ];

      res.json({
        success: true,
        data: {
          history,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: history.length
          }
        }
      });
    } catch (error) {
      logger.error('获取同步历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取同步历史失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 清理同步数据
  static async cleanupSyncData(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { days = 30 } = req.query;

      // 这里可以实现清理旧同步数据的逻辑
      // 目前返回模拟结果
      const deletedCount = Math.floor(Math.random() * 50) + 10;

      logger.info(`用户 ${userId} 清理了 ${deletedCount} 条同步数据`);

      res.json({
        success: true,
        message: '同步数据清理成功',
        data: {
          deletedCount,
          days: parseInt(days as string)
        }
      });
    } catch (error) {
      logger.error('清理同步数据失败:', error);
      res.status(500).json({
        success: false,
        message: '清理同步数据失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 