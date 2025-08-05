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
      const oldExperience = user.learningStats.experience;
      
      // 使用 findOneAndUpdate 避免并行保存冲突
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        [
          {
            $set: {
              'learningStats.experience': { $add: ['$learningStats.experience', 5] },
              'learningStats.level': {
                $cond: {
                  if: {
                    $gte: [
                      { $add: ['$learningStats.experience', 5] },
                      { $multiply: [50, { $pow: [{ $add: ['$learningStats.level', 1] }, 2] }] }
                    ]
                  },
                  then: { $add: ['$learningStats.level', 1] },
                  else: '$learningStats.level'
                }
              }
            }
          }
        ],
        { new: true }
      );
      
      if (!updatedUser) {
        throw new Error('用户更新失败');
      }
      
      const leveledUp = updatedUser.learningStats.level > oldLevel;
      // 直接使用 5 作为 xpGained，因为收集新单词固定获得 5 XP
      const xpGained = 5;
      
      logger.info(`用户 ${updatedUser.username} 收集新单词获得 ${xpGained} XP`);
      
      return {
        success: true,
        xpGained,
        newLevel: updatedUser.learningStats.level,
        leveledUp,
        message: leveledUp ? `收集新单词 +${xpGained} XP，恭喜升级！` : `收集新单词 +${xpGained} XP`
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
   * 复习单词获得经验值（记得+2，不记得+1）
   */
  static async addExperienceForReview(userId: string, isCorrect: boolean = true): Promise<ExperienceGainResult> {
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
      
      // 使用用户的实例方法，这样可以正确处理每日限制
      await user.addExperienceForReview(isCorrect);
      
      // 重新获取用户数据以获取最新状态
      const updatedUser = await User.findById(userId);
      if (!updatedUser) {
        throw new Error('用户更新失败');
      }
      
      const leveledUp = updatedUser.learningStats.level > oldLevel;
      const xpGained = updatedUser.learningStats.experience - oldExperience;
      
      const action = isCorrect ? '成功复习' : '复习';
      logger.info(`用户 ${updatedUser.username} ${action}单词获得 ${xpGained} XP`);
      
      return {
        success: true,
        xpGained,
        newLevel: updatedUser.learningStats.level,
        leveledUp,
        message: leveledUp ? `复习单词 +${xpGained} XP，恭喜升级！` : `复习单词 +${xpGained} XP`
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
   * 智能挑战获得经验值
   */
  static async addExperienceForSmartChallenge(userId: string): Promise<ExperienceGainResult> {
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
      
      // 智能挑战奖励15 XP
      await user.addExperience(15, '智能挑战');
      
      const xpGained = user.learningStats.experience - oldExperience;
      const leveledUp = user.learningStats.level > oldLevel;
      
      logger.info(`用户 ${user.username} 完成智能挑战获得 15 XP`);
      
      return {
        success: true,
        xpGained: 15,
        newLevel: user.learningStats.level,
        leveledUp,
        message: leveledUp ? '智能挑战 +15 XP，恭喜升级！' : '智能挑战 +15 XP'
      };
    } catch (error) {
      logger.error('智能挑战经验值添加失败:', error);
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
   * 错词挑战获得经验值
   */
  static async addExperienceForWrongWordChallenge(userId: string): Promise<ExperienceGainResult> {
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
      
      // 错词挑战奖励20 XP
      await user.addExperience(20, '错词挑战');
      
      const xpGained = user.learningStats.experience - oldExperience;
      const leveledUp = user.learningStats.level > oldLevel;
      
      logger.info(`用户 ${user.username} 完成错词挑战获得 20 XP`);
      
      return {
        success: true,
        xpGained: 20,
        newLevel: user.learningStats.level,
        leveledUp,
        message: leveledUp ? '错词挑战 +20 XP，恭喜升级！' : '错词挑战 +20 XP'
      };
    } catch (error) {
      logger.error('错词挑战经验值添加失败:', error);
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
        currentStreak: user.learningStats.currentStreak,
        contributedWords: user.contributedWords || 0
      };
    } catch (error) {
      logger.error('获取用户经验值信息失败:', error);
      return null;
    }
  }

  /**
   * 获取经验值获取方式说明
   */
  static getExperienceWays() {
    return {
      review: {
        name: '复习单词',
        description: '记得+2 XP，不记得+1 XP',
        dailyLimit: '每日上限90点',
        xpPerAction: '1-2 XP'
      },
      smartChallenge: {
        name: '智能挑战',
        description: '完成智能挑战获得经验值',
        dailyLimit: '无限制',
        xpPerAction: '15 XP'
      },
      wrongWordChallenge: {
        name: '错词挑战',
        description: '完成错词挑战获得经验值',
        dailyLimit: '无限制',
        xpPerAction: '20 XP'
      },
      newWord: {
        name: '收集新单词',
        description: '收集新单词到词汇表',
        dailyLimit: '无限制',
        xpPerAction: '5 XP'
      },
      contribution: {
        name: '贡献新词',
        description: '向社区贡献新单词',
        dailyLimit: '无限制',
        xpPerAction: '8 XP'
      },
      dailyCheckin: {
        name: '连续学习打卡',
        description: '基础5 XP + 连续天数奖励',
        dailyLimit: '每日一次',
        xpPerAction: '5-12 XP'
      },
      dailyCards: {
        name: '完成每日词卡任务',
        description: '完成每日词卡学习任务',
        dailyLimit: '每日一次',
        xpPerAction: '5 XP'
      },
      studyTime: {
        name: '学习时长奖励',
        description: '每10分钟获得3点XP',
        dailyLimit: '每日上限30分钟',
        xpPerAction: '3 XP/10分钟'
      }
    };
  }
} 