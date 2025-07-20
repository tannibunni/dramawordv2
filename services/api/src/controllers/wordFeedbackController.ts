import { Request, Response } from 'express';
import { WordFeedback } from '../models/WordFeedback';
import { logger } from '../utils/logger';

export class WordFeedbackController {
  // 提交反馈
  static async submitFeedback(req: Request, res: Response) {
    try {
      const { word, feedback } = req.body;
      const userId = (req as any).user?.id || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (!word || !feedback) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: word and feedback'
        });
      }

      if (!['positive', 'negative'].includes(feedback)) {
        return res.status(400).json({
          success: false,
          error: 'Feedback must be either "positive" or "negative"'
        });
      }

      // 使用 upsert 来更新或创建反馈
      const result = await WordFeedback.findOneAndUpdate(
        { userId, word },
        { feedback },
        { upsert: true, new: true }
      );

      logger.info(`User ${userId} submitted ${feedback} feedback for word: ${word}`);

      res.json({
        success: true,
        data: result,
        message: 'Feedback submitted successfully'
      });
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 获取单词反馈统计
  static async getFeedbackStats(req: Request, res: Response) {
    try {
      const { word } = req.params;

      if (!word) {
        return res.status(400).json({
          success: false,
          error: 'Word parameter is required'
        });
      }

      const [positiveCount, negativeCount] = await Promise.all([
        WordFeedback.countDocuments({ word, feedback: 'positive' }),
        WordFeedback.countDocuments({ word, feedback: 'negative' })
      ]);

      res.json({
        success: true,
        data: {
          word,
          positive: positiveCount,
          negative: negativeCount,
          total: positiveCount + negativeCount
        }
      });
    } catch (error) {
      logger.error('Error getting feedback stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // 获取用户对特定单词的反馈
  static async getUserFeedback(req: Request, res: Response) {
    try {
      const { word } = req.params;
      const userId = (req as any).user?.id || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (!word) {
        return res.status(400).json({
          success: false,
          error: 'Word parameter is required'
        });
      }

      const feedback = await WordFeedback.findOne({ userId, word });

      res.json({
        success: true,
        data: feedback ? { feedback: feedback.feedback } : null
      });
    } catch (error) {
      logger.error('Error getting user feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
} 