import { Request, Response } from 'express';
import { CloudWord } from '../models/CloudWord';

// 清理所有中文Cloud Words数据
export const clearChineseCloudWords = async (req: Request, res: Response) => {
  try {
    console.log('🗑️ 开始清理中文Cloud Words数据...');

    // 删除所有中文相关的cloud words
    const result = await CloudWord.deleteMany({
      $or: [
        { language: 'zh' },
        { uiLanguage: 'zh-CN' },
        { uiLanguage: 'zh' }
      ]
    });

    console.log(`✅ 删除完成: ${result.deletedCount} 条记录`);

    // 获取剩余记录统计
    const remainingStats = await CloudWord.aggregate([
      {
        $group: {
          _id: { language: '$language', uiLanguage: '$uiLanguage' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.language': 1, '_id.uiLanguage': 1 } }
    ]);

    res.json({
      success: true,
      message: '中文Cloud Words数据清理完成',
      deletedCount: result.deletedCount,
      remainingStats: remainingStats
    });

  } catch (error) {
    console.error('❌ 清理中文Cloud Words数据失败:', error);
    res.status(500).json({
      success: false,
      error: '清理数据失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 获取Cloud Words统计信息
export const getCloudWordsStats = async (req: Request, res: Response) => {
  try {
    const stats = await CloudWord.aggregate([
      {
        $group: {
          _id: { language: '$language', uiLanguage: '$uiLanguage' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.language': 1, '_id.uiLanguage': 1 } }
    ]);

    const totalCount = await CloudWord.countDocuments();

    res.json({
      success: true,
      totalCount,
      stats
    });

  } catch (error) {
    console.error('❌ 获取Cloud Words统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计信息失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
};
