import { Request, Response } from 'express';
import Recommendation, { IRecommendation } from '../models/Recommendation';
import { logger } from '../utils/logger';

export class RecommendationController {
  // 获取推荐列表（支持分页、筛选、排序）
  static async getRecommendations(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        language = 'zh-CN',
        difficulty,
        category,
        status = 'active',
        sortBy = 'priority',
        sortOrder = 'desc'
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      
      // 构建查询条件
      const query: any = {
        'metadata.status': status,
        'recommendation.language': language
      };

      if (difficulty) {
        query['recommendation.difficulty'] = difficulty;
      }

      if (category) {
        query['recommendation.category'] = { $in: Array.isArray(category) ? category : [category] };
      }

      // 构建排序条件
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const recommendations = await Recommendation
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean();

      const total = await Recommendation.countDocuments(query);

      res.json({
        success: true,
        data: recommendations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('获取推荐列表失败:', error);
      res.status(500).json({ success: false, message: '获取推荐列表失败' });
    }
  }

  // 智能推荐（基于用户偏好和内容特征）
  static async getSmartRecommendations(req: Request, res: Response) {
    try {
      const {
        language = 'zh-CN',
        limit = 12,
        userPreferences = '{}' // 用户偏好JSON字符串
      } = req.query;

      const preferences = JSON.parse(userPreferences as string);
      
      // 构建智能推荐查询
      const pipeline = [
        {
          $match: {
            'metadata.status': 'active',
            'recommendation.language': language
          }
        },
        {
          $addFields: {
            // 计算推荐分数
            score: {
              $add: [
                { $multiply: ['$metadata.priority', 0.4] }, // 优先级权重40%
                { $multiply: ['$metadata.rating', 0.3] },   // 评分权重30%
                { $multiply: ['$metadata.views', 0.001] },  // 浏览量权重
                { $multiply: ['$metadata.likes', 0.002] }   // 点赞权重
              ]
            }
          }
        },
        {
          $sort: { score: -1 as any }
        },
        {
          $limit: Number(limit)
        }
      ];

      // 如果用户有偏好，添加偏好匹配
      if (preferences.difficulty || preferences.categories) {
        const preferenceMatch: any = {};
        if (preferences.difficulty) {
          preferenceMatch['recommendation.difficulty'] = preferences.difficulty;
        }
        if (preferences.categories) {
          preferenceMatch['recommendation.category'] = { $in: preferences.categories };
        }
        pipeline[0].$match = { ...pipeline[0].$match, ...preferenceMatch };
      }

      const recommendations = await Recommendation.aggregate(pipeline);

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      logger.error('获取智能推荐失败:', error);
      res.status(500).json({ success: false, message: '获取智能推荐失败' });
    }
  }

  // 创建推荐内容
  static async createRecommendation(req: Request, res: Response) {
    try {
      const recommendationData = req.body;
      
      // 验证TMDB ID是否已存在
      const existing = await Recommendation.findOne({ 
        tmdbShowId: recommendationData.tmdbShowId 
      });
      
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: '该剧集已存在推荐内容' 
        });
      }

      const recommendation = new Recommendation({
        ...recommendationData,
        author: {
          id: (req as any).user?.id || 'system',
          name: (req as any).user?.name || 'System'
        }
      });

      await recommendation.save();

      res.status(201).json({
        success: true,
        data: recommendation,
        message: '推荐内容创建成功'
      });
    } catch (error) {
      logger.error('创建推荐内容失败:', error);
      res.status(500).json({ success: false, message: '创建推荐内容失败' });
    }
  }

  // 更新推荐内容
  static async updateRecommendation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const recommendation = await Recommendation.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!recommendation) {
        return res.status(404).json({ 
          success: false, 
          message: '推荐内容不存在' 
        });
      }

      res.json({
        success: true,
        data: recommendation,
        message: '推荐内容更新成功'
      });
    } catch (error) {
      logger.error('更新推荐内容失败:', error);
      res.status(500).json({ success: false, message: '更新推荐内容失败' });
    }
  }

  // 删除推荐内容
  static async deleteRecommendation(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const recommendation = await Recommendation.findByIdAndDelete(id);

      if (!recommendation) {
        return res.status(404).json({ 
          success: false, 
          message: '推荐内容不存在' 
        });
      }

      res.json({
        success: true,
        message: '推荐内容删除成功'
      });
    } catch (error) {
      logger.error('删除推荐内容失败:', error);
      res.status(500).json({ success: false, message: '删除推荐内容失败' });
    }
  }

  // 获取单个推荐内容详情
  static async getRecommendationById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const recommendation = await Recommendation.findById(id);

      if (!recommendation) {
        return res.status(404).json({ 
          success: false, 
          message: '推荐内容不存在' 
        });
      }

      // 增加浏览量
      await Recommendation.findByIdAndUpdate(id, {
        $inc: { 'metadata.views': 1 }
      });

      res.json({
        success: true,
        data: recommendation
      });
    } catch (error) {
      logger.error('获取推荐内容详情失败:', error);
      res.status(500).json({ success: false, message: '获取推荐内容详情失败' });
    }
  }

  // 批量导入推荐内容
  static async batchImportRecommendations(req: Request, res: Response) {
    try {
      const { recommendations } = req.body;

      if (!Array.isArray(recommendations)) {
        return res.status(400).json({ 
          success: false, 
          message: '推荐内容格式错误' 
        });
      }

      const results = [];
      const errors = [];

      for (const rec of recommendations) {
        try {
          // 检查是否已存在
          const existing = await Recommendation.findOne({ 
            tmdbShowId: rec.tmdbShowId 
          });
          
          if (existing) {
            errors.push({ tmdbShowId: rec.tmdbShowId, error: '已存在' });
            continue;
          }

          const recommendation = new Recommendation({
            ...rec,
            author: {
              id: (req as any).user?.id || 'system',
              name: (req as any).user?.name || 'System'
            }
          });

          await recommendation.save();
          results.push(recommendation);
        } catch (error) {
          errors.push({ tmdbShowId: rec.tmdbShowId, error: error.message });
        }
      }

      res.json({
        success: true,
        data: {
          imported: results.length,
          errors: errors.length,
          details: { results, errors }
        },
        message: `批量导入完成：成功${results.length}个，失败${errors.length}个`
      });
    } catch (error) {
      logger.error('批量导入推荐内容失败:', error);
      res.status(500).json({ success: false, message: '批量导入推荐内容失败' });
    }
  }

  // 获取推荐统计信息
  static async getRecommendationStats(req: Request, res: Response) {
    try {
      const stats = await Recommendation.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$metadata.status', 'active'] }, 1, 0] }
            },
            draft: {
              $sum: { $cond: [{ $eq: ['$metadata.status', 'draft'] }, 1, 0] }
            },
            totalViews: { $sum: '$metadata.views' },
            totalLikes: { $sum: '$metadata.likes' },
            avgRating: { $avg: '$metadata.rating' }
          }
        }
      ]);

      const difficultyStats = await Recommendation.aggregate([
        {
          $group: {
            _id: '$recommendation.difficulty',
            count: { $sum: 1 }
          }
        }
      ]);

      const languageStats = await Recommendation.aggregate([
        {
          $group: {
            _id: '$recommendation.language',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          overview: stats[0] || {},
          difficulty: difficultyStats,
          language: languageStats
        }
      });
    } catch (error) {
      logger.error('获取推荐统计失败:', error);
      res.status(500).json({ success: false, message: '获取推荐统计失败' });
    }
  }
} 