import { Request, Response } from 'express';
import { Feedback, IFeedback } from '../models/Feedback';
import { logger } from '../utils/logger';

// 发送邮件的函数
const sendFeedbackEmail = async (rating: number, feedback: string) => {
  try {
    // 这里使用一个简单的邮件发送服务
    // 在实际部署中，你可能需要使用 SendGrid, AWS SES, 或其他邮件服务
    const emailContent = `
      剧词记用户反馈

      评分: ${rating}/5 星
      反馈内容: ${feedback || '无'}
      提交时间: ${new Date().toLocaleString('zh-CN')}

      这是一条来自剧词记应用的自动反馈邮件。
    `;

    // 这里可以集成实际的邮件发送服务
    // 例如使用 nodemailer 或其他邮件服务
    console.log('📧 反馈邮件内容:', emailContent);
    console.log('📧 发送到: lt14gs@gmail.com');
    
    // 模拟邮件发送成功
    return true;
  } catch (error) {
    logger.error('发送反馈邮件失败:', error);
    return false;
  }
};

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { rating, feedback, timestamp } = req.body;

    // 验证输入
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间',
      });
    }

    // 创建反馈记录
    const newFeedback = new Feedback({
      rating,
      feedback: feedback || '',
      timestamp: timestamp || new Date(),
    });

    await newFeedback.save();

    // 发送邮件
    const emailSent = await sendFeedbackEmail(rating, feedback || '');

    logger.info('用户反馈已提交:', {
      rating,
      feedback: feedback ? feedback.substring(0, 50) + '...' : '无',
      emailSent,
    });

    res.status(200).json({
      success: true,
      message: '反馈提交成功',
      data: {
        id: newFeedback._id,
        rating: newFeedback.rating,
        feedback: newFeedback.feedback,
        timestamp: newFeedback.timestamp,
      },
    });
  } catch (error) {
    logger.error('提交反馈失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试',
    });
  }
};

export const getFeedbackStats = async (req: Request, res: Response) => {
  try {
    const totalFeedback = await Feedback.countDocuments();
    const averageRating = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const ratingDistribution = await Feedback.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalFeedback,
        averageRating: averageRating[0]?.averageRating || 0,
        ratingDistribution,
      },
    });
  } catch (error) {
    logger.error('获取反馈统计失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}; 