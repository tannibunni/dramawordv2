import { User } from '../models/User';
import { logger } from '../utils/logger';

export interface ExperienceGainResult {
  success: boolean;
  xpGained: number;
  newLevel: number;
  leveledUp: boolean;
  message: string;
}

export class ExperienceService {
  /**
   * 收集新单词获得经验值
   */
  static async addExperienceForNewWord(userId: string): Promise<ExperienceGainResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          xpGained: 0,
          newLevel: 0,
          leveledUp: false,
          message: '用户不存在'
        };
      }

      const oldLevel = user.learningStats.level;
      await user.addExperienceForNewWord();
      
      const leveledUp = user.learningStats.level > oldLevel;
      
      logger.info(`用户 ${user.username} 收集新单词获得 5 XP`);
      
      return {
        success: true,
        xpGained: 5,
        newLevel: user.learningStats.level,
        leveledUp,
        message: leveledUp ? '收集新单词 +5 XP，恭喜升级！' : '收集新单词 +5 XP'
      };
    } catch (error) {
      logger.error('收集新单词经验值添加失败:', error);
      return {
        success: false,
        xpGained: 0,
        newLevel: 0,
        leveledUp: false,
        message: '经验值添加失败'
      };
    }
  }

  /**
   * 成功复习单词获得经验值
   */
  static async addExperienceForReview(userId: string): Promise<ExperienceGainResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          xpGained: 0,
          newLevel: 0,
          leveledUp: false,
          message: '用户不存在'
        };
      }

      const oldLevel = user.learningStats.level;
      const oldDailyReviewXP = user.learningStats.dailyReviewXP;
      
      await user.addExperienceForReview();
      
      const xpGained = user.learningStats.dailyReviewXP - oldDailyReviewXP;
      const leveledUp = user.learningStats.level > oldLevel;
      
      if (xpGained > 0) {
        logger.info(`用户 ${user.username} 复习单词获得 ${xpGained} XP`);
      }
      
      return {
        success: true,
        xpGained,
        newLevel: user.learningStats.level,
        leveledUp,
        message: xpGained > 0 
          ? (leveledUp ? `复习单词 +${xpGained} XP，恭喜升级！` : `复习单词 +${xpGained} XP`)
          : '今日复习XP已达上限'
      };
    } catch (error) {
      logger.error('复习单词经验值添加失败:', error);
      return {
        success: false,
        xpGained: 0,
        newLevel: 0,
        leveledUp: false,
        message: '经验值添加失败'
      };
    }
  }

  /**
   * 连续学习打卡获得经验值
   */
  static async addExperienceForDailyCheckin(userId: string): Promise<ExperienceGainResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          xpGained: 0,
          newLevel: 0,
          leveledUp: false,
          message: '用户不存在'
        };
      }

      const oldLevel = user.learningStats.level;
      const oldExperience = user.learningStats.experience;
      
      await user.addExperienceForDailyCheckin();
      
      const xpGained = user.learningStats.experience - oldExperience;
      const leveledUp = user.learningStats.level > oldLevel;
      
      logger.info(`用户 ${user.username} 连续学习打卡获得 ${xpGained} XP`);
      
      return {
        success: true,
        xpGained,
        newLevel: user.learningStats.level,
        leveledUp,
        message: leveledUp 
          ? `连续学习打卡 +${xpGained} XP，恭喜升级！` 
          : `连续学习打卡 +${xpGained} XP`
      };
    } catch (error) {
      logger.error('连续学习打卡经验值添加失败:', error);
      return {
        success: false,
        xpGained: 0,
        newLevel: 0,
        leveledUp: false,
        message: '经验值添加失败'
      };
    }
  }

  /**
   * 完成每日词卡任务获得经验值
   */
  static async addExperienceForDailyCards(userId: string): Promise<ExperienceGainResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          xpGained: 0,
          newLevel: 0,
          leveledUp: false,
          message: '用户不存在'
        };
      }

      const oldLevel = user.learningStats.level;
      const oldExperience = user.learningStats.experience;
      
      await user.addExperienceForDailyCards();
      
      const xpGained = user.learningStats.experience - oldExperience;
      const leveledUp = user.learningStats.level > oldLevel;
      
      if (xpGained > 0) {
        logger.info(`用户 ${user.username} 完成每日词卡任务获得 ${xpGained} XP`);
      }
      
      return {
        success: true,
        xpGained,
        newLevel: user.learningStats.level,
        leveledUp,
        message: xpGained > 0 
          ? (leveledUp ? `完成每日词卡 +${xpGained} XP，恭喜升级！` : `完成每日词卡 +${xpGained} XP`)
          : '今日词卡任务已完成'
      };
    } catch (error) {
      logger.error('每日词卡任务经验值添加失败:', error);
      return {
        success: false,
        xpGained: 0,
        newLevel: 0,
        leveledUp: false,
        message: '经验值添加失败'
      };
    }
  }

  /**
   * 学习时长奖励
   */
  static async addExperienceForStudyTime(userId: string, minutes: number): Promise<ExperienceGainResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          xpGained: 0,
          newLevel: 0,
          leveledUp: false,
          message: '用户不存在'
        };
      }

      const oldLevel = user.learningStats.level;
      const oldExperience = user.learningStats.experience;
      
      await user.addExperienceForStudyTime(minutes);
      
      const xpGained = user.learningStats.experience - oldExperience;
      const leveledUp = user.learningStats.level > oldLevel;
      
      if (xpGained > 0) {
        logger.info(`用户 ${user.username} 学习时长奖励获得 ${xpGained} XP`);
      }
      
      return {
        success: true,
        xpGained,
        newLevel: user.learningStats.level,
        leveledUp,
        message: xpGained > 0 
          ? (leveledUp ? `学习时长奖励 +${xpGained} XP，恭喜升级！` : `学习时长奖励 +${xpGained} XP`)
          : '今日学习时长XP已达上限'
      };
    } catch (error) {
      logger.error('学习时长奖励经验值添加失败:', error);
      return {
        success: false,
        xpGained: 0,
        newLevel: 0,
        leveledUp: false,
        message: '经验值添加失败'
      };
    }
  }

  /**
   * 贡献新词获得经验值
   */
  static async addExperienceForContribution(userId: string): Promise<ExperienceGainResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          xpGained: 0,
          newLevel: 0,
          leveledUp: false,
          message: '用户不存在'
        };
      }

      const oldLevel = user.learningStats.level;
      await user.addExperienceForContribution();
      
      const leveledUp = user.learningStats.level > oldLevel;
      
      logger.info(`用户 ${user.username} 贡献新词获得 8 XP`);
      
      return {
        success: true,
        xpGained: 8,
        newLevel: user.learningStats.level,
        leveledUp,
        message: leveledUp ? '贡献新词 +8 XP，恭喜升级！' : '贡献新词 +8 XP'
      };
    } catch (error) {
      logger.error('贡献新词经验值添加失败:', error);
      return {
        success: false,
        xpGained: 0,
        newLevel: 0,
        leveledUp: false,
        message: '经验值添加失败'
      };
    }
  }

  /**
   * 获取用户经验值信息
   */
  static async getUserExperienceInfo(userId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      const currentLevel = user.learningStats.level;
      const currentExp = user.learningStats.experience;
      const totalExpForCurrentLevel = 50 * Math.pow(currentLevel, 2);
      const totalExpForNextLevel = 50 * Math.pow(currentLevel + 1, 2);
      const expNeededForCurrentLevel = totalExpForNextLevel - totalExpForCurrentLevel;
      const progressPercentage = (currentExp / expNeededForCurrentLevel) * 100;

      return {
        level: currentLevel,
        experience: currentExp,
        experienceToNextLevel: expNeededForCurrentLevel - currentExp,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        totalExperience: totalExpForCurrentLevel + currentExp,
        dailyReviewXP: user.learningStats.dailyReviewXP,
        dailyStudyTimeXP: user.learningStats.dailyStudyTimeXP,
        completedDailyCards: user.learningStats.completedDailyCards,
        currentStreak: user.learningStats.currentStreak
      };
    } catch (error) {
      logger.error('获取用户经验值信息失败:', error);
      return null;
    }
  }
} 