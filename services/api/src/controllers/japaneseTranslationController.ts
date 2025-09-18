// 日文翻译控制器
import { Request, Response } from 'express';
import { JapaneseTranslationService } from '../services/japaneseTranslationService';
import { logger } from '../utils/logger';

export const translateToJapanese = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({
        success: false,
        error: '文本参数无效'
      });
      return;
    }

    logger.info(`🔍 日文翻译请求: ${text}`);

    const japaneseService = JapaneseTranslationService.getInstance();
    const result = await japaneseService.translateToJapanese(text);

    if (result.success) {
      logger.info(`✅ 日文翻译成功: ${text} -> ${result.data?.japaneseText}`);
      res.json(result);
    } else {
      logger.error(`❌ 日文翻译失败: ${text} - ${result.error}`);
      res.status(500).json(result);
    }

  } catch (error) {
    logger.error(`❌ 日文翻译控制器错误:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器错误'
    });
  }
};

export const clearJapaneseTranslationCache = async (req: Request, res: Response): Promise<void> => {
  try {
    const japaneseService = JapaneseTranslationService.getInstance();
    japaneseService.clearCache();
    
    logger.info('✅ 日文翻译缓存已清理');
    res.json({
      success: true,
      message: '缓存已清理'
    });
  } catch (error) {
    logger.error(`❌ 清理缓存失败:`, error);
    res.status(500).json({
      success: false,
      error: '清理缓存失败'
    });
  }
};

export const getJapaneseTranslationStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const japaneseService = JapaneseTranslationService.getInstance();
    const cacheSize = japaneseService.getCacheSize();
    
    res.json({
      success: true,
      data: {
        cacheSize,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`❌ 获取统计信息失败:`, error);
    res.status(500).json({
      success: false,
      error: '获取统计信息失败'
    });
  }
};
