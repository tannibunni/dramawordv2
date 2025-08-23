import { Request, Response } from 'express';
import ShowWordService from '../services/showWordService';

export class ShowWordController {
  
  /**
   * 获取剧集单词预览
   */
  static async getShowPreview(req: Request, res: Response) {
    try {
      const { showId } = req.params;
      
      if (!showId) {
        return res.status(400).json({
          success: false,
          message: '剧集ID不能为空'
        });
      }
      
      // 先尝试获取现有预览
      let preview = await ShowWordService.searchShowPreviews('', undefined, 1);
      preview = preview.filter(p => p.showId === showId);
      
      if (preview.length === 0) {
        // 如果不存在，创建新的预览
        preview = [await ShowWordService.createOrUpdatePreview(showId)];
      }
      
      res.json({
        success: true,
        data: preview[0]
      });
      
    } catch (error) {
      console.error('[ShowWordController] 获取剧集预览失败:', error);
      res.status(500).json({
        success: false,
        message: '获取剧集预览失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
  
  /**
   * 生成剧集单词包
   */
  static async generateWordPackage(req: Request, res: Response) {
    try {
      const { showId, packageType = 'essential' } = req.body;
      const userId = req.user?.id || req.body.userId; // 从认证中间件或请求体获取
      
      if (!showId) {
        return res.status(400).json({
          success: false,
          message: '剧集ID不能为空'
        });
      }
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      // 验证包类型
      const validTypes = ['essential', 'complete', 'beginner'];
      if (!validTypes.includes(packageType)) {
        return res.status(400).json({
          success: false,
          message: '无效的包类型'
        });
      }
      
      const wordPackage = await ShowWordService.generateWordPackage(showId, userId, packageType);
      
      res.json({
        success: true,
        data: wordPackage
      });
      
    } catch (error) {
      console.error('[ShowWordController] 生成单词包失败:', error);
      res.status(500).json({
        success: false,
        message: '生成单词包失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
  
  /**
   * 获取用户的单词包列表
   */
  static async getUserWordPackages(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.params.userId;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const packages = await ShowWordService.getUserWordPackages(userId);
      
      res.json({
        success: true,
        data: packages
      });
      
    } catch (error) {
      console.error('[ShowWordController] 获取用户单词包失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户单词包失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
  
  /**
   * 更新单词包学习进度
   */
  static async updatePackageProgress(req: Request, res: Response) {
    try {
      const { packageId, completedWords } = req.body;
      const userId = req.user?.id || req.body.userId;
      
      if (!packageId || completedWords === undefined) {
        return res.status(400).json({
          success: false,
          message: '包ID和完成单词数不能为空'
        });
      }
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const updatedPackage = await ShowWordService.updatePackageProgress(
        packageId, 
        userId, 
        completedWords
      );
      
      res.json({
        success: true,
        data: updatedPackage
      });
      
    } catch (error) {
      console.error('[ShowWordController] 更新单词包进度失败:', error);
      res.status(500).json({
        success: false,
        message: '更新单词包进度失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
  
  /**
   * 搜索剧集单词预览
   */
  static async searchShowPreviews(req: Request, res: Response) {
    try {
      const { query = '', language, limit = 20 } = req.query;
      
      const previews = await ShowWordService.searchShowPreviews(
        query as string,
        language as string,
        Number(limit)
      );
      
      res.json({
        success: true,
        data: previews,
        total: previews.length
      });
      
    } catch (error) {
      console.error('[ShowWordController] 搜索剧集预览失败:', error);
      res.status(500).json({
        success: false,
        message: '搜索剧集预览失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
  
  /**
   * 获取热门剧集（按单词数量排序）
   */
  static async getPopularShows(req: Request, res: Response) {
    try {
      const { limit = 20, language } = req.query;
      
      let searchQuery: any = { isActive: true };
      if (language) {
        searchQuery.language = language;
      }
      
      const ShowWordPreview = require('../models/ShowWordPreview').ShowWordPreview;
      const popularShows = await ShowWordPreview.find(searchQuery)
        .sort({ 'wordStats.totalUniqueWords': -1, 'wordStats.userCount': -1 })
        .limit(Number(limit))
        .select('showId showName language genre year wordStats showInfo');
      
      res.json({
        success: true,
        data: popularShows,
        total: popularShows.length
      });
      
    } catch (error) {
      console.error('[ShowWordController] 获取热门剧集失败:', error);
      res.status(500).json({
        success: false,
        message: '获取热门剧集失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
  
  /**
   * 获取剧集单词统计列表
   */
  static async getShowsWithWordCount(req: Request, res: Response) {
    try {
      console.log('[ShowWordController] 开始获取剧集单词统计');
      
      const shows = await ShowWordService.getShowsWithWordCount();
      console.log('[ShowWordController] 查询结果:', shows);
      
      res.json({
        success: true,
        data: shows,
        debug: {
          timestamp: new Date().toISOString(),
          resultCount: shows.length
        }
      });
    } catch (error) {
      console.error('[ShowWordController] 获取剧集单词统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取剧集单词统计失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 获取指定剧集的单词列表
   */
  static async getShowWords(req: Request, res: Response) {
    try {
      const { showId } = req.params;
      const words = await ShowWordService.getShowWords(showId);
      
      res.json({
        success: true,
        data: words
      });
    } catch (error) {
      console.error('[ShowWordController] 获取剧集单词失败:', error);
      res.status(500).json({
        success: false,
        message: '获取剧集单词失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 创建或更新剧集单词预览（管理员功能）
   */
  static async createOrUpdatePreview(req: Request, res: Response) {
    try {
      const { showId } = req.params;
      
      if (!showId) {
        return res.status(400).json({
          success: false,
          message: '剧集ID不能为空'
        });
      }
      
      const preview = await ShowWordService.createOrUpdatePreview(showId);
      
      res.json({
        success: true,
        data: preview,
        message: '剧集单词预览创建/更新成功'
      });
      
    } catch (error) {
      console.error('[ShowWordController] 创建剧集预览失败:', error);
      res.status(500).json({
        success: false,
        message: '创建剧集预览失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
}

export default ShowWordController;
