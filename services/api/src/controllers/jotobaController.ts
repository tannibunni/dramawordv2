// Jotoba API 控制器
import { Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

export class JotobaController {
  private static readonly JOTOBA_API_URL = 'https://jotoba.de/api/search';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时
  private static cache = new Map<string, { data: any; timestamp: number }>();

  /**
   * 搜索日语词汇
   */
  static async searchWord(req: Request, res: Response): Promise<void> {
    try {
      const { query, language = 'english' } = req.body;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: '查询参数无效'
        });
        return;
      }

      const trimmedQuery = query.trim();
      if (trimmedQuery.length === 0) {
        res.status(400).json({
          success: false,
          error: '查询不能为空'
        });
        return;
      }

      // 检查缓存
      const cacheKey = `${trimmedQuery}_${language}`;
      const cached = JotobaController.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < JotobaController.CACHE_DURATION) {
        logger.info(`✅ 从缓存返回Jotoba结果: ${trimmedQuery}`);
        res.json({
          success: true,
          data: cached.data,
          cached: true
        });
        return;
      }

      // 调用Jotoba API
      logger.info(`🔍 调用Jotoba API: ${trimmedQuery}`);
      
      const response = await axios.post(JotobaController.JOTOBA_API_URL, {
        query: trimmedQuery,
        language: language,
        no_english: false,
        page_size: 20
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DramaWord/1.0'
        }
      });

      if (response.status !== 200) {
        throw new Error(`Jotoba API returned status ${response.status}`);
      }

      const data = response.data;
      
      // 处理返回数据
      const processedData = JotobaController.processJotobaResponse(data);

      // 缓存结果
      JotobaController.cache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });

      logger.info(`✅ Jotoba API成功: ${trimmedQuery} -> ${processedData.length} 个结果`);

      res.json({
        success: true,
        data: processedData,
        cached: false
      });

    } catch (error) {
      logger.error(`❌ Jotoba API错误:`, error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败'
      });
    }
  }

  /**
   * 处理Jotoba API响应
   */
  private static processJotobaResponse(data: any): any[] {
    try {
      if (!data || !Array.isArray(data)) {
        return [];
      }

      return data.map((item: any) => ({
        id: item.id || Math.random(),
        reading: item.reading || '',
        kanji: item.kanji || item.reading || '',
        senses: (item.senses || []).map((sense: any) => ({
          glosses: sense.glosses || [],
          pos: sense.pos || [],
          language: sense.language || 'english'
        })),
        frequency: item.frequency || 0
      }));

    } catch (error) {
      logger.error(`❌ 处理Jotoba响应失败:`, error);
      return [];
    }
  }

  /**
   * 清理缓存
   */
  static async clearCache(req: Request, res: Response): Promise<void> {
    try {
      JotobaController.cache.clear();
      logger.info('✅ Jotoba缓存已清理');
      
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
  }

  /**
   * 获取缓存统计
   */
  static async getCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = {
        size: JotobaController.cache.size,
        entries: Array.from(JotobaController.cache.keys())
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`❌ 获取缓存统计失败:`, error);
      res.status(500).json({
        success: false,
        error: '获取统计失败'
      });
    }
  }
}
