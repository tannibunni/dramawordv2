import { ExperienceCalculationService, ExperienceConfig } from '../experienceCalculationService';

describe('ExperienceCalculationService', () => {
  let service: ExperienceCalculationService;

  beforeEach(() => {
    // 重置单例实例
    (ExperienceCalculationService as any).instance = undefined;
    service = ExperienceCalculationService.getInstance();
  });

  describe('基础配置', () => {
    test('应该正确初始化默认配置', () => {
      const config = service.getConfig();
      
      expect(config.baseXP).toBe(50);
      expect(config.levelMultiplier).toBe(2);
      expect(config.dailyLimits.review).toBe(100);
      expect(config.xpRewards.review.correct).toBe(2);
      expect(config.xpRewards.review.incorrect).toBe(1);
    });

    test('应该能够更新配置', () => {
      const newConfig: Partial<ExperienceConfig> = {
        baseXP: 100,
        xpRewards: {
          ...service.getConfig().xpRewards,
          review: { correct: 5, incorrect: 2 }
        }
      };

      service.updateConfig(newConfig);
      const updatedConfig = service.getConfig();

      expect(updatedConfig.baseXP).toBe(100);
      expect(updatedConfig.xpRewards.review.correct).toBe(5);
      expect(updatedConfig.xpRewards.review.incorrect).toBe(2);
    });
  });

  describe('等级计算', () => {
    test('应该正确计算等级所需经验值', () => {
      expect(service.calculateLevelRequiredExp(1)).toBe(200); // 50 * (1+1)^2 = 200
      expect(service.calculateLevelRequiredExp(2)).toBe(450); // 50 * (2+1)^2 = 450
      expect(service.calculateLevelRequiredExp(3)).toBe(800); // 50 * (3+1)^2 = 800
    });

    test('应该正确计算当前等级', () => {
      expect(service.calculateLevel(0)).toBe(1);
      expect(service.calculateLevel(100)).toBe(1);
      expect(service.calculateLevel(200)).toBe(2);
      expect(service.calculateLevel(450)).toBe(3);
      expect(service.calculateLevel(800)).toBe(4);
    });

    test('应该正确计算升级所需经验值', () => {
      expect(service.calculateExpToNextLevel(0)).toBe(200);
      expect(service.calculateExpToNextLevel(100)).toBe(100);
      expect(service.calculateExpToNextLevel(200)).toBe(250);
      expect(service.calculateExpToNextLevel(450)).toBe(350);
    });

    test('应该正确计算进度百分比', () => {
      expect(service.calculateProgressPercentage(0)).toBe(0);
      expect(service.calculateProgressPercentage(100)).toBe(50); // 100/200 = 50%
      expect(service.calculateProgressPercentage(200)).toBe(0); // 刚好升级，进度重置为0
      expect(service.calculateProgressPercentage(325)).toBe(50); // (325-200)/(450-200) = 50%
    });
  });

  describe('等级信息计算', () => {
    test('应该正确计算完整等级信息', () => {
      const levelInfo = service.calculateLevelInfo(325);

      expect(levelInfo.level).toBe(3);
      expect(levelInfo.experience).toBe(325);
      expect(levelInfo.experienceToNextLevel).toBe(125);
      expect(levelInfo.progressPercentage).toBe(50);
      expect(levelInfo.totalExperience).toBe(325);
      expect(levelInfo.levelName).toBe('探索者');
      expect(levelInfo.levelColor).toBe('#10B981');
    });

    test('应该正确处理边界情况', () => {
      const levelInfo = service.calculateLevelInfo(0);

      expect(levelInfo.level).toBe(1);
      expect(levelInfo.experience).toBe(0);
      expect(levelInfo.experienceToNextLevel).toBe(200);
      expect(levelInfo.progressPercentage).toBe(0);
    });
  });

  describe('升级检查', () => {
    test('应该正确检测升级', () => {
      const result = service.checkLevelUp(100, 250);

      expect(result.leveledUp).toBe(true);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(2);
      expect(result.levelsGained).toBe(1);
    });

    test('应该正确处理未升级的情况', () => {
      const result = service.checkLevelUp(100, 150);

      expect(result.leveledUp).toBe(false);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(1);
      expect(result.levelsGained).toBe(0);
    });

    test('应该正确处理多级升级', () => {
      const result = service.checkLevelUp(100, 500);

      expect(result.leveledUp).toBe(true);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(3);
      expect(result.levelsGained).toBe(2);
    });
  });

  describe('经验值增益计算', () => {
    test('应该正确计算经验值增益', () => {
      const result = service.calculateExperienceGain(100, 50, '复习单词');

      expect(result.success).toBe(true);
      expect(result.xpGained).toBe(50);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(1);
      expect(result.leveledUp).toBe(false);
      expect(result.oldExperience).toBe(100);
      expect(result.newExperience).toBe(150);
      expect(result.message).toBe('复习单词 +50经验值');
      expect(result.progressChange).toBe(25); // 从50%到75%
    });

    test('应该正确处理升级情况', () => {
      const result = service.calculateExperienceGain(100, 150, '大量学习');

      expect(result.success).toBe(true);
      expect(result.xpGained).toBe(150);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(2);
      expect(result.leveledUp).toBe(true);
      expect(result.oldExperience).toBe(100);
      expect(result.newExperience).toBe(250);
    });
  });

  describe('特定经验值计算', () => {
    test('应该正确计算复习经验值', () => {
      expect(service.calculateReviewExperience(true)).toBe(2);
      expect(service.calculateReviewExperience(false)).toBe(1);
    });

    test('应该正确计算学习时间经验值', () => {
      expect(service.calculateStudyTimeExperience(30)).toBe(30);
      expect(service.calculateStudyTimeExperience(60)).toBe(60);
      expect(service.calculateStudyTimeExperience(45.7)).toBe(45); // 向下取整
    });
  });

  describe('每日限制检查', () => {
    test('应该正确检查每日限制', () => {
      const result = service.checkDailyLimit(50, 'review');

      expect(result.canGain).toBe(true);
      expect(result.remaining).toBe(50);
      expect(result.limit).toBe(100);
      expect(result.used).toBe(50);
    });

    test('应该正确处理达到限制的情况', () => {
      const result = service.checkDailyLimit(100, 'review');

      expect(result.canGain).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(100);
      expect(result.used).toBe(100);
    });

    test('应该正确处理超过限制的情况', () => {
      const result = service.checkDailyLimit(120, 'review');

      expect(result.canGain).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(100);
      expect(result.used).toBe(120);
    });
  });

  describe('等级名称和颜色', () => {
    test('应该返回正确的等级名称', () => {
      expect(service.getLevelName(1)).toBe('初学者');
      expect(service.getLevelName(5)).toBe('熟练者');
      expect(service.getLevelName(10)).toBe('传说');
      expect(service.getLevelName(15)).toBe('等级 15');
    });

    test('应该返回正确的等级颜色', () => {
      expect(service.getLevelColor(1)).toBe('#6B7280');
      expect(service.getLevelColor(5)).toBe('#EF4444');
      expect(service.getLevelColor(10)).toBe('#84CC16');
      expect(service.getLevelColor(15)).toMatch(/^hsl\(\d+,\s*70%,\s*50%\)$/);
    });
  });

  describe('经验值格式化', () => {
    test('应该正确格式化经验值', () => {
      expect(service.formatExperience(0)).toBe('0');
      expect(service.formatExperience(999)).toBe('999');
      expect(service.formatExperience(1000)).toBe('1.0K');
      expect(service.formatExperience(1500)).toBe('1.5K');
      expect(service.formatExperience(1000000)).toBe('1.0M');
      expect(service.formatExperience(1500000)).toBe('1.5M');
    });
  });

  describe('数据验证', () => {
    test('应该验证有效的经验值数据', () => {
      const result = service.validateExperienceData({
        experience: 100,
        level: 1
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该检测无效的经验值', () => {
      const result = service.validateExperienceData({
        experience: -10,
        level: 1
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('经验值必须是大于等于0的数字');
    });

    test('应该检测无效的等级', () => {
      const result = service.validateExperienceData({
        experience: 100,
        level: 0
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('等级必须是大于等于1的数字');
    });

    test('应该检测等级和经验值不一致', () => {
      const result = service.validateExperienceData({
        experience: 100,
        level: 3
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('等级不一致：计算得出1，实际3');
    });
  });

  describe('经验值统计', () => {
    test('应该正确计算空事件的统计', () => {
      const stats = service.calculateExperienceStats([]);

      expect(stats.totalXP).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.byDay).toEqual({});
      expect(stats.averageXPPerEvent).toBe(0);
      expect(stats.mostProductiveDay).toBe('');
      expect(stats.mostProductiveType).toBe('');
    });

    test('应该正确计算经验值统计', () => {
      const events = [
        { xpGained: 10, type: 'review', timestamp: Date.now() },
        { xpGained: 20, type: 'review', timestamp: Date.now() },
        { xpGained: 15, type: 'newWord', timestamp: Date.now() }
      ];

      const stats = service.calculateExperienceStats(events);

      expect(stats.totalXP).toBe(45);
      expect(stats.byType.review).toBe(30);
      expect(stats.byType.newWord).toBe(15);
      expect(stats.averageXPPerEvent).toBe(15);
      expect(stats.mostProductiveType).toBe('review');
    });
  });

  describe('边界情况处理', () => {
    test('应该正确处理负数经验值', () => {
      expect(service.calculateLevel(-10)).toBe(1);
      expect(service.calculateProgressPercentage(-10)).toBe(0);
    });

    test('应该正确处理极大经验值', () => {
      const largeExp = 1000000;
      const level = service.calculateLevel(largeExp);
      
      expect(level).toBeGreaterThan(1);
      expect(service.calculateProgressPercentage(largeExp)).toBeGreaterThanOrEqual(0);
      expect(service.calculateProgressPercentage(largeExp)).toBeLessThanOrEqual(100);
    });

    test('应该正确处理浮点数经验值', () => {
      expect(service.calculateLevel(100.5)).toBe(1);
      expect(service.calculateProgressPercentage(100.5)).toBe(50.25);
    });
  });

  describe('单例模式', () => {
    test('应该返回相同的实例', () => {
      const instance1 = ExperienceCalculationService.getInstance();
      const instance2 = ExperienceCalculationService.getInstance();

      expect(instance1).toBe(instance2);
    });

    test('配置应该在实例间共享', () => {
      const instance1 = ExperienceCalculationService.getInstance();
      instance1.updateConfig({ baseXP: 100 });

      const instance2 = ExperienceCalculationService.getInstance();
      expect(instance2.getConfig().baseXP).toBe(100);
    });
  });
}); 