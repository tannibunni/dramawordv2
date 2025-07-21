import { Router } from 'express';
import { ExperienceService } from '../services/experienceService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// 获取用户经验值信息
router.get('/info', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const experienceInfo = await ExperienceService.getUserExperienceInfo(userId);
    
    if (!experienceInfo) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: experienceInfo
    });
  } catch (error) {
    logger.error('获取经验值信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取经验值信息失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 连续学习打卡
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const result = await ExperienceService.addExperienceForDailyCheckin(userId);
    
    res.json({
      success: result.success,
      message: result.message,
      data: {
        xpGained: result.xpGained,
        newLevel: result.newLevel,
        leveledUp: result.leveledUp
      }
    });
  } catch (error) {
    logger.error('连续学习打卡失败:', error);
    res.status(500).json({
      success: false,
      message: '连续学习打卡失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 完成每日词卡任务
router.post('/daily-cards', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const result = await ExperienceService.addExperienceForDailyCards(userId);
    
    res.json({
      success: result.success,
      message: result.message,
      data: {
        xpGained: result.xpGained,
        newLevel: result.newLevel,
        leveledUp: result.leveledUp
      }
    });
  } catch (error) {
    logger.error('完成每日词卡任务失败:', error);
    res.status(500).json({
      success: false,
      message: '完成每日词卡任务失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 学习时长奖励
router.post('/study-time', authenticateToken, async (req, res) => {
  try {
    const { minutes } = req.body;
    const userId = (req as any).user.id;
    
    if (!minutes || minutes <= 0) {
      return res.status(400).json({
        success: false,
        message: '学习时长必须大于0'
      });
    }
    
    const result = await ExperienceService.addExperienceForStudyTime(userId, minutes);
    
    res.json({
      success: result.success,
      message: result.message,
      data: {
        xpGained: result.xpGained,
        newLevel: result.newLevel,
        leveledUp: result.leveledUp
      }
    });
  } catch (error) {
    logger.error('学习时长奖励失败:', error);
    res.status(500).json({
      success: false,
      message: '学习时长奖励失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 