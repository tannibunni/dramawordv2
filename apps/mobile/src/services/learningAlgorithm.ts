// 基于艾宾浩斯遗忘曲线的学习算法
// 实现间隔重复算法和掌握度计算

export interface LearningRecord {
  wordId: string;
  word: string;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: Date;
  nextReviewDate: Date;
  masteryLevel: number; // 0-100, 掌握度
  difficulty: 'easy' | 'medium' | 'hard';
  intervalDays: number; // 下次复习间隔天数
  consecutiveCorrect: number; // 连续正确次数
  consecutiveIncorrect: number; // 连续错误次数
  learningEfficiency: number; // 学习效率 (0-100)
  timeSpent: number; // 学习时间 (秒)
  confidenceLevel: number; // 自信度 (0-100)
}

export interface ReviewSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  totalWords: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  collectedCount: number;
  words: string[];
  averageTimePerWord: number;
  sessionEfficiency: number;
}

export interface LearningStats {
  totalWords: number;
  masteredWords: number;
  learningWords: number;
  forgottenWords: number;
  averageMastery: number;
  totalReviewTime: number;
  streakDays: number;
  lastStudyDate: Date;
  learningEfficiency: number;
  averageConfidence: number;
  weeklyProgress: number;
  monthlyProgress: number;
}

class LearningAlgorithm {
  // 优化的艾宾浩斯遗忘曲线参数
  private readonly FORGETTING_CURVE = {
    // 不同掌握度对应的保留率 (优化后的数据)
    retentionRates: {
      0: 0.05,   // 0% 掌握度，5% 保留率
      10: 0.15,  // 10% 掌握度，15% 保留率
      25: 0.35,  // 25% 掌握度，35% 保留率
      40: 0.50,  // 40% 掌握度，50% 保留率
      60: 0.65,  // 60% 掌握度，65% 保留率
      75: 0.80,  // 75% 掌握度，80% 保留率
      85: 0.88,  // 85% 掌握度，88% 保留率
      95: 0.95,  // 95% 掌握度，95% 保留率
      100: 0.98  // 100% 掌握度，98% 保留率
    },
    // 优化的间隔重复间隔天数
    intervals: [1, 2, 4, 7, 14, 30, 60, 90, 180, 365],
    // 掌握度阈值 (更精细的划分)
    masteryThresholds: {
      beginner: 25,
      elementary: 40,
      intermediate: 60,
      advanced: 80,
      proficient: 90,
      mastered: 95
    },
    // 学习效率权重
    efficiencyWeights: {
      accuracy: 0.4,        // 正确率权重
      consistency: 0.25,    // 一致性权重
      speed: 0.15,          // 速度权重
      confidence: 0.2       // 自信度权重
    }
  };

  // 优化的掌握度计算
  calculateMasteryLevel(record: LearningRecord): number {
    const { correctCount, incorrectCount, consecutiveCorrect, consecutiveIncorrect, learningEfficiency, confidenceLevel } = record;
    const totalReviews = correctCount + incorrectCount;
    
    if (totalReviews === 0) return 0;

    // 1. 基础掌握度：正确率 (40%)
    const baseMastery = (correctCount / totalReviews) * 100;

    // 2. 一致性奖励：连续正确/错误模式 (25%)
    const consistencyBonus = this.calculateConsistencyBonus(consecutiveCorrect, consecutiveIncorrect);

    // 3. 学习效率奖励 (15%)
    const efficiencyBonus = Math.min(learningEfficiency * 0.15, 15);

    // 4. 自信度奖励 (20%)
    const confidenceBonus = Math.min(confidenceLevel * 0.2, 20);

    // 5. 复习频率调整 (适度复习有助于记忆)
    const frequencyAdjustment = this.calculateFrequencyAdjustment(totalReviews);

    let mastery = baseMastery + consistencyBonus + efficiencyBonus + confidenceBonus + frequencyAdjustment;

    // 确保掌握度在 0-100 范围内
    return Math.max(0, Math.min(100, Math.round(mastery)));
  }

  // 计算一致性奖励
  private calculateConsistencyBonus(consecutiveCorrect: number, consecutiveIncorrect: number): number {
    if (consecutiveCorrect >= 5) {
      return 20; // 连续正确5次以上，最大奖励
    } else if (consecutiveCorrect >= 3) {
      return 15; // 连续正确3-4次
    } else if (consecutiveCorrect >= 2) {
      return 10; // 连续正确2次
    } else if (consecutiveCorrect === 1) {
      return 5;  // 连续正确1次
    }

    // 连续错误惩罚
    if (consecutiveIncorrect >= 3) {
      return -15; // 连续错误3次以上，最大惩罚
    } else if (consecutiveIncorrect >= 2) {
      return -10; // 连续错误2次
    } else if (consecutiveIncorrect === 1) {
      return -5;  // 连续错误1次
    }

    return 0;
  }

  // 计算复习频率调整
  private calculateFrequencyAdjustment(totalReviews: number): number {
    if (totalReviews <= 3) {
      return 0; // 前3次复习不调整
    } else if (totalReviews <= 10) {
      return 5; // 4-10次复习，适度奖励
    } else if (totalReviews <= 20) {
      return 3; // 11-20次复习，小幅奖励
    } else {
      return 1; // 20次以上，最小奖励
    }
  }

  // 优化的间隔计算
  calculateNextInterval(record: LearningRecord, wasCorrect: boolean, responseTime?: number): number {
    const { masteryLevel, consecutiveCorrect, consecutiveIncorrect, learningEfficiency } = record;
    
    // 基础间隔
    let baseInterval = this.getBaseInterval(masteryLevel);
    
    // 1. 根据连续正确/错误调整间隔
    const consecutiveAdjustment = this.calculateConsecutiveAdjustment(wasCorrect, consecutiveCorrect, consecutiveIncorrect);
    
    // 2. 根据学习效率调整间隔
    const efficiencyAdjustment = this.calculateEfficiencyAdjustment(learningEfficiency);
    
    // 3. 根据响应时间调整间隔 (如果提供)
    const timeAdjustment = responseTime ? this.calculateTimeAdjustment(responseTime) : 0;
    
    // 4. 根据掌握度稳定性调整
    const stabilityAdjustment = this.calculateStabilityAdjustment(record);
    
    let adjustedInterval = baseInterval * (1 + consecutiveAdjustment + efficiencyAdjustment + timeAdjustment + stabilityAdjustment);

    // 确保间隔在合理范围内
    return Math.max(1, Math.min(365, Math.round(adjustedInterval)));
  }

  // 计算连续正确/错误的间隔调整
  private calculateConsecutiveAdjustment(wasCorrect: boolean, consecutiveCorrect: number, consecutiveIncorrect: number): number {
    if (wasCorrect) {
      if (consecutiveCorrect >= 5) return 0.5;  // 连续正确5次以上，增加50%间隔
      if (consecutiveCorrect >= 3) return 0.3;  // 连续正确3-4次，增加30%间隔
      if (consecutiveCorrect >= 2) return 0.2;  // 连续正确2次，增加20%间隔
      return 0.1; // 连续正确1次，增加10%间隔
    } else {
      if (consecutiveIncorrect >= 3) return -0.5; // 连续错误3次以上，减少50%间隔
      if (consecutiveIncorrect >= 2) return -0.3; // 连续错误2次，减少30%间隔
      return -0.2; // 连续错误1次，减少20%间隔
    }
  }

  // 计算学习效率调整
  private calculateEfficiencyAdjustment(learningEfficiency: number): number {
    if (learningEfficiency >= 80) return 0.2;  // 高效率，增加20%间隔
    if (learningEfficiency >= 60) return 0.1;  // 中高效率，增加10%间隔
    if (learningEfficiency >= 40) return 0;    // 中等效率，不调整
    if (learningEfficiency >= 20) return -0.1; // 中低效率，减少10%间隔
    return -0.2; // 低效率，减少20%间隔
  }

  // 计算响应时间调整
  private calculateTimeAdjustment(responseTime: number): number {
    const avgTime = 5000; // 平均响应时间5秒
    if (responseTime <= avgTime * 0.5) return 0.1;  // 快速回答，增加10%间隔
    if (responseTime <= avgTime) return 0;          // 正常速度，不调整
    if (responseTime <= avgTime * 1.5) return -0.1; // 较慢，减少10%间隔
    return -0.2; // 很慢，减少20%间隔
  }

  // 计算稳定性调整
  private calculateStabilityAdjustment(record: LearningRecord): number {
    const { reviewCount, correctCount, incorrectCount } = record;
    if (reviewCount < 5) return 0; // 复习次数太少，不调整
    
    const recentAccuracy = correctCount / reviewCount;
    const stability = Math.abs(recentAccuracy - 0.5) * 2; // 0-1的稳定性指标
    
    if (stability >= 0.8) return 0.1;  // 高稳定性，增加10%间隔
    if (stability >= 0.6) return 0;    // 中等稳定性，不调整
    return -0.1; // 低稳定性，减少10%间隔
  }

  // 根据掌握度获取基础间隔 (优化版本)
  private getBaseInterval(masteryLevel: number): number {
    if (masteryLevel < 25) return 1;      // 初学者：每天复习
    if (masteryLevel < 40) return 2;      // 初级：2天间隔
    if (masteryLevel < 60) return 4;      // 中级：4天间隔
    if (masteryLevel < 80) return 7;      // 高级：1周间隔
    if (masteryLevel < 90) return 14;     // 熟练：2周间隔
    if (masteryLevel < 95) return 30;     // 精通：1月间隔
    return 60;                            // 掌握：2月间隔
  }

  // 优化的学习记录更新
  updateLearningRecord(
    record: LearningRecord, 
    wasCorrect: boolean, 
    reviewDate: Date = new Date(),
    responseTime?: number,
    confidenceLevel?: number
  ): LearningRecord {
    // 计算新的掌握度
    const newMasteryLevel = this.calculateMasteryLevel({
      ...record,
      correctCount: record.correctCount + (wasCorrect ? 1 : 0),
      incorrectCount: record.incorrectCount + (wasCorrect ? 0 : 1),
      consecutiveCorrect: wasCorrect ? record.consecutiveCorrect + 1 : 0,
      consecutiveIncorrect: wasCorrect ? 0 : record.consecutiveIncorrect + 1,
      confidenceLevel: confidenceLevel || record.confidenceLevel,
    });

    // 计算新的间隔
    const newInterval = this.calculateNextInterval(record, wasCorrect, responseTime);
    const nextReviewDate = new Date(reviewDate);
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    // 计算学习效率
    const newLearningEfficiency = this.calculateLearningEfficiency(record, wasCorrect, responseTime);

    return {
      ...record,
      reviewCount: record.reviewCount + 1,
      correctCount: record.correctCount + (wasCorrect ? 1 : 0),
      incorrectCount: record.incorrectCount + (wasCorrect ? 0 : 1),
      consecutiveCorrect: wasCorrect ? record.consecutiveCorrect + 1 : 0,
      consecutiveIncorrect: wasCorrect ? 0 : record.consecutiveIncorrect + 1,
      lastReviewed: reviewDate,
      nextReviewDate,
      masteryLevel: newMasteryLevel,
      intervalDays: newInterval,
      learningEfficiency: newLearningEfficiency,
      confidenceLevel: confidenceLevel || record.confidenceLevel,
    };
  }

  // 计算学习效率
  private calculateLearningEfficiency(record: LearningRecord, wasCorrect: boolean, responseTime?: number): number {
    const accuracy = (record.correctCount + (wasCorrect ? 1 : 0)) / (record.reviewCount + 1);
    const consistency = Math.min(record.consecutiveCorrect + (wasCorrect ? 1 : 0), 5) / 5;
    
    let speedScore = 0.5; // 默认中等速度
    if (responseTime) {
      const avgTime = 5000;
      if (responseTime <= avgTime * 0.5) speedScore = 1.0;
      else if (responseTime <= avgTime) speedScore = 0.8;
      else if (responseTime <= avgTime * 1.5) speedScore = 0.6;
      else speedScore = 0.4;
    }

    const confidence = record.confidenceLevel / 100;

    return Math.round(
      accuracy * this.FORGETTING_CURVE.efficiencyWeights.accuracy +
      consistency * this.FORGETTING_CURVE.efficiencyWeights.consistency +
      speedScore * this.FORGETTING_CURVE.efficiencyWeights.speed +
      confidence * this.FORGETTING_CURVE.efficiencyWeights.confidence
    ) * 100;
  }

  // 获取需要复习的单词 (优化版本)
  getWordsForReview(records: LearningRecord[], maxWords: number = 20): LearningRecord[] {
    const now = new Date();
    
    // 筛选需要复习的单词
    const dueWords = records.filter(record => 
      record.nextReviewDate <= now || record.masteryLevel < 25
    );

    // 优化的优先级排序
    const sortedWords = dueWords.sort((a, b) => {
      // 1. 首先按紧急程度排序
      const aUrgency = this.calculateUrgency(a, now);
      const bUrgency = this.calculateUrgency(b, now);
      
      if (aUrgency !== bUrgency) {
        return bUrgency - aUrgency; // 紧急程度高的优先
      }
      
      // 2. 然后按掌握度排序（掌握度低的优先）
      if (a.masteryLevel !== b.masteryLevel) {
        return a.masteryLevel - b.masteryLevel;
      }
      
      // 3. 最后按学习效率排序（效率低的优先）
      return a.learningEfficiency - b.learningEfficiency;
    });

    return sortedWords.slice(0, maxWords);
  }

  // 计算复习紧急程度
  private calculateUrgency(record: LearningRecord, now: Date): number {
    const daysOverdue = Math.max(0, (now.getTime() - record.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24));
    const masteryFactor = Math.max(0, (50 - record.masteryLevel) / 50); // 掌握度越低越紧急
    
    return daysOverdue * 10 + masteryFactor * 5;
  }

  // 优化的学习统计计算
  calculateLearningStats(records: LearningRecord[]): LearningStats {
    const totalWords = records.length;
    const masteredWords = records.filter(r => r.masteryLevel >= 95).length;
    const learningWords = records.filter(r => r.masteryLevel >= 25 && r.masteryLevel < 95).length;
    const forgottenWords = records.filter(r => r.masteryLevel < 25).length;
    
    const averageMastery = totalWords > 0 
      ? records.reduce((sum, r) => sum + r.masteryLevel, 0) / totalWords 
      : 0;

    const averageEfficiency = totalWords > 0
      ? records.reduce((sum, r) => sum + r.learningEfficiency, 0) / totalWords
      : 0;

    const averageConfidence = totalWords > 0
      ? records.reduce((sum, r) => sum + r.confidenceLevel, 0) / totalWords
      : 0;

    // 计算连续学习天数
    const streakDays = this.calculateStreakDays(records);

    // 最后学习日期
    const lastStudyDate = records.length > 0 
      ? new Date(Math.max(...records.map(r => r.lastReviewed.getTime())))
      : new Date();

    // 计算周/月进度
    const weeklyProgress = this.calculateProgress(records, 7);
    const monthlyProgress = this.calculateProgress(records, 30);

    return {
      totalWords,
      masteredWords,
      learningWords,
      forgottenWords,
      averageMastery: Math.round(averageMastery),
      totalReviewTime: 0, // 需要从会话记录中计算
      streakDays,
      lastStudyDate,
      learningEfficiency: Math.round(averageEfficiency),
      averageConfidence: Math.round(averageConfidence),
      weeklyProgress,
      monthlyProgress,
    };
  }

  // 计算进度
  private calculateProgress(records: LearningRecord[], days: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentRecords = records.filter(r => r.lastReviewed >= cutoffDate);
    if (recentRecords.length === 0) return 0;
    
    const totalMasteryGain = recentRecords.reduce((sum, r) => {
      // 估算掌握度提升
      return sum + Math.max(0, r.masteryLevel - 25);
    }, 0);
    
    return Math.round(totalMasteryGain / recentRecords.length);
  }

  // 计算连续学习天数 (优化版本)
  private calculateStreakDays(records: LearningRecord[]): number {
    if (records.length === 0) return 0;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 获取所有学习日期
    const studyDates = records
      .map(r => new Date(r.lastReviewed.getFullYear(), r.lastReviewed.getMonth(), r.lastReviewed.getDate()))
      .filter((date, index, arr) => arr.indexOf(date) === index) // 去重
      .sort((a, b) => b.getTime() - a.getTime()); // 降序排列

    if (studyDates.length === 0) return 0;

    let streak = 0;
    let currentDate = today;

    for (const studyDate of studyDates) {
      const diffDays = Math.floor((currentDate.getTime() - studyDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = studyDate;
      } else {
        break;
      }
    }

    return streak;
  }

  // 优化的学习建议
  getLearningSuggestions(records: LearningRecord[]): string[] {
    const suggestions: string[] = [];
    const stats = this.calculateLearningStats(records);

    // 基于掌握度的建议
    if (stats.forgottenWords > 0) {
      suggestions.push(`有 ${stats.forgottenWords} 个单词需要重点复习`);
    }

    if (stats.averageMastery < 50) {
      suggestions.push('整体掌握度较低，建议增加复习频率');
    }

    // 基于学习效率的建议
    if (stats.learningEfficiency < 50) {
      suggestions.push('学习效率较低，建议调整学习方法');
    }

    // 基于自信度的建议
    if (stats.averageConfidence < 60) {
      suggestions.push('自信度较低，建议多练习基础单词');
    }

    // 基于连续学习的建议
    if (stats.streakDays === 0) {
      suggestions.push('今天还没有学习，开始今天的复习吧！');
    } else if (stats.streakDays >= 7) {
      suggestions.push(`已连续学习 ${stats.streakDays} 天，继续保持！`);
    } else if (stats.streakDays >= 3) {
      suggestions.push(`连续学习 ${stats.streakDays} 天，习惯正在养成`);
    }

    // 基于进度的建议
    if (stats.weeklyProgress > 10) {
      suggestions.push('本周进步很大，继续保持！');
    }

    const dueWords = this.getWordsForReview(records);
    if (dueWords.length > 0) {
      suggestions.push(`有 ${dueWords.length} 个单词需要复习`);
    }

    // 个性化建议
    const difficultWords = records.filter(r => r.masteryLevel < 40 && r.reviewCount > 3);
    if (difficultWords.length > 0) {
      suggestions.push(`有 ${difficultWords.length} 个困难单词需要重点突破`);
    }

    return suggestions.slice(0, 5); // 限制建议数量
  }

  // 预测遗忘曲线 (优化版本)
  predictForgettingCurve(record: LearningRecord, days: number = 30): number[] {
    const predictions: number[] = [];
    const { masteryLevel, learningEfficiency } = record;
    
    // 获取当前掌握度对应的保留率
    const retentionRate = this.getRetentionRate(masteryLevel);
    
    // 根据学习效率调整遗忘率
    const efficiencyFactor = learningEfficiency / 100;
    const adjustedRetentionRate = retentionRate * (0.8 + efficiencyFactor * 0.4);
    
    for (let day = 1; day <= days; day++) {
      // 使用优化的艾宾浩斯遗忘曲线公式
      const forgettingRate = this.getForgettingRate(masteryLevel, learningEfficiency);
      const retention = adjustedRetentionRate * Math.exp(-day / forgettingRate);
      predictions.push(Math.max(0, Math.min(100, retention * 100)));
    }
    
    return predictions;
  }

  // 获取保留率 (优化版本)
  private getRetentionRate(masteryLevel: number): number {
    const rates = this.FORGETTING_CURVE.retentionRates;
    const levels = Object.keys(rates).map(Number).sort((a, b) => a - b);
    
    for (let i = levels.length - 1; i >= 0; i--) {
      if (masteryLevel >= levels[i]) {
        return rates[levels[i] as keyof typeof rates];
      }
    }
    
    return rates[0];
  }

  // 获取遗忘率 (优化版本)
  private getForgettingRate(masteryLevel: number, learningEfficiency: number): number {
    // 基础遗忘率
    const baseRate = Math.max(1, 30 - masteryLevel * 0.2);
    
    // 根据学习效率调整
    const efficiencyAdjustment = (learningEfficiency - 50) / 100; // -0.5 到 0.5
    
    return Math.max(1, baseRate * (1 - efficiencyAdjustment * 0.3));
  }

  // 生成学习计划 (优化版本)
  generateLearningPlan(records: LearningRecord[], targetWordsPerDay: number = 20): {
    today: LearningRecord[];
    tomorrow: LearningRecord[];
    thisWeek: LearningRecord[];
    difficultWords: LearningRecord[];
    recommendedWords: LearningRecord[];
  } {
    const today = this.getWordsForReview(records, targetWordsPerDay);
    
    // 明天的复习计划
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowRecords = records.filter(r => 
      r.nextReviewDate.getDate() === tomorrow.getDate() &&
      r.nextReviewDate.getMonth() === tomorrow.getMonth() &&
      r.nextReviewDate.getFullYear() === tomorrow.getFullYear()
    );

    // 本周的复习计划
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() + 7);
    const thisWeekRecords = records.filter(r => r.nextReviewDate <= thisWeek);

    // 困难单词
    const difficultWords = records
      .filter(r => r.masteryLevel < 40 && r.reviewCount > 2)
      .sort((a, b) => a.masteryLevel - b.masteryLevel)
      .slice(0, 10);

    // 推荐学习的新单词
    const recommendedWords = records
      .filter(r => r.reviewCount === 0 || r.masteryLevel < 25)
      .sort((a, b) => b.confidenceLevel - a.confidenceLevel)
      .slice(0, 10);

    return {
      today,
      tomorrow: tomorrowRecords.slice(0, targetWordsPerDay),
      thisWeek: thisWeekRecords.slice(0, targetWordsPerDay * 7),
      difficultWords,
      recommendedWords,
    };
  }
}

// 创建单例实例
export const learningAlgorithm = new LearningAlgorithm();

export default learningAlgorithm; 