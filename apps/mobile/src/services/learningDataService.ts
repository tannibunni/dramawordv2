import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LearningRecord, 
  ReviewSession, 
  LearningStats,
  learningAlgorithm 
} from './learningAlgorithm';

class LearningDataService {
  private readonly STORAGE_KEYS = {
    LEARNING_RECORDS: 'learning_records',
    REVIEW_SESSIONS: 'review_sessions',
    USER_STATS: 'user_stats',
  };

  // 获取学习记录
  async getLearningRecords(): Promise<LearningRecord[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.LEARNING_RECORDS);
      if (data) {
        const records = JSON.parse(data);
        // 将日期字符串转换回 Date 对象
        return records.map((record: any) => ({
          ...record,
          lastReviewed: new Date(record.lastReviewed),
          nextReviewDate: new Date(record.nextReviewDate),
        }));
      }
      return [];
    } catch (error) {
      console.error('获取学习记录失败:', error);
      return [];
    }
  }

  // 保存学习记录
  async saveLearningRecords(records: LearningRecord[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.LEARNING_RECORDS, JSON.stringify(records));
    } catch (error) {
      console.error('保存学习记录失败:', error);
    }
  }

  // 添加或更新学习记录
  async updateLearningRecord(wordId: string, word: string, wasCorrect: boolean): Promise<void> {
    try {
      const records = await this.getLearningRecords();
      let record = records.find(r => r.wordId === wordId);

      if (!record) {
        // 创建新记录
        record = {
          wordId,
          word,
          reviewCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastReviewed: new Date(),
          nextReviewDate: new Date(),
          masteryLevel: 0,
          difficulty: 'medium',
          intervalDays: 1,
          consecutiveCorrect: 0,
          consecutiveIncorrect: 0,
          learningEfficiency: 0,
          timeSpent: 0,
          confidenceLevel: 0,
        };
        records.push(record);
      }

      // 使用学习算法更新记录
      const updatedRecord = learningAlgorithm.updateLearningRecord(record, wasCorrect);
      const index = records.findIndex(r => r.wordId === wordId);
      records[index] = updatedRecord;

      await this.saveLearningRecords(records);
    } catch (error) {
      console.error('更新学习记录失败:', error);
    }
  }

  // 批量更新学习记录
  async batchUpdateLearningRecords(updates: Array<{
    wordId: string;
    word: string;
    wasCorrect: boolean;
  }>): Promise<void> {
    try {
      const records = await this.getLearningRecords();
      
      for (const update of updates) {
        let record = records.find(r => r.wordId === update.wordId);

        if (!record) {
                  record = {
          wordId: update.wordId,
          word: update.word,
          reviewCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastReviewed: new Date(),
          nextReviewDate: new Date(),
          masteryLevel: 0,
          difficulty: 'medium',
          intervalDays: 1,
          consecutiveCorrect: 0,
          consecutiveIncorrect: 0,
          learningEfficiency: 0,
          timeSpent: 0,
          confidenceLevel: 0,
        };
          records.push(record);
        }

        const updatedRecord = learningAlgorithm.updateLearningRecord(record, update.wasCorrect);
        const index = records.findIndex(r => r.wordId === update.wordId);
        records[index] = updatedRecord;
      }

      await this.saveLearningRecords(records);
    } catch (error) {
      console.error('批量更新学习记录失败:', error);
    }
  }

  // 获取需要复习的单词
  async getWordsForReview(maxWords: number = 20): Promise<LearningRecord[]> {
    try {
      const records = await this.getLearningRecords();
      return learningAlgorithm.getWordsForReview(records, maxWords);
    } catch (error) {
      console.error('获取复习单词失败:', error);
      return [];
    }
  }

  // 获取学习统计
  async getLearningStats(): Promise<LearningStats> {
    try {
      const records = await this.getLearningRecords();
      return learningAlgorithm.calculateLearningStats(records);
    } catch (error) {
      console.error('获取学习统计失败:', error);
      return {
        totalWords: 0,
        masteredWords: 0,
        learningWords: 0,
        forgottenWords: 0,
        averageMastery: 0,
        totalReviewTime: 0,
        streakDays: 0,
        lastStudyDate: new Date(),
        learningEfficiency: 0,
        averageConfidence: 0,
        weeklyProgress: 0,
        monthlyProgress: 0,
      };
    }
  }

  // 获取学习建议
  async getLearningSuggestions(): Promise<string[]> {
    try {
      const records = await this.getLearningRecords();
      return learningAlgorithm.getLearningSuggestions(records);
    } catch (error) {
      console.error('获取学习建议失败:', error);
      return ['开始你的学习之旅吧！'];
    }
  }

  // 保存复习会话
  async saveReviewSession(session: ReviewSession): Promise<void> {
    try {
      const sessions = await this.getReviewSessions();
      sessions.push(session);
      await AsyncStorage.setItem(this.STORAGE_KEYS.REVIEW_SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('保存复习会话失败:', error);
    }
  }

  // 获取复习会话
  async getReviewSessions(): Promise<ReviewSession[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.REVIEW_SESSIONS);
      if (data) {
        const sessions = JSON.parse(data);
        return sessions.map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('获取复习会话失败:', error);
      return [];
    }
  }

  // 生成学习计划
  async generateLearningPlan(targetWordsPerDay: number = 20) {
    try {
      const records = await this.getLearningRecords();
      return learningAlgorithm.generateLearningPlan(records, targetWordsPerDay);
    } catch (error) {
      console.error('生成学习计划失败:', error);
      return {
        today: [],
        tomorrow: [],
        thisWeek: [],
      };
    }
  }

  // 预测遗忘曲线
  async predictForgettingCurve(wordId: string, days: number = 30): Promise<number[]> {
    try {
      const records = await this.getLearningRecords();
      const record = records.find(r => r.wordId === wordId);
      
      if (!record) {
        return new Array(days).fill(0);
      }
      
      return learningAlgorithm.predictForgettingCurve(record, days);
    } catch (error) {
      console.error('预测遗忘曲线失败:', error);
      return new Array(days).fill(0);
    }
  }

  // 重置学习记录
  async resetLearningRecords(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.LEARNING_RECORDS);
      await AsyncStorage.removeItem(this.STORAGE_KEYS.REVIEW_SESSIONS);
    } catch (error) {
      console.error('重置学习记录失败:', error);
    }
  }

  // 导出学习数据
  async exportLearningData(): Promise<{
    records: LearningRecord[];
    sessions: ReviewSession[];
    stats: LearningStats;
  }> {
    try {
      const [records, sessions, stats] = await Promise.all([
        this.getLearningRecords(),
        this.getReviewSessions(),
        this.getLearningStats(),
      ]);

      return { records, sessions, stats };
    } catch (error) {
      console.error('导出学习数据失败:', error);
      return {
        records: [],
        sessions: [],
        stats: {
          totalWords: 0,
          masteredWords: 0,
          learningWords: 0,
          forgottenWords: 0,
          averageMastery: 0,
          totalReviewTime: 0,
          streakDays: 0,
          lastStudyDate: new Date(),
          learningEfficiency: 0,
          averageConfidence: 0,
          weeklyProgress: 0,
          monthlyProgress: 0,
        },
      };
    }
  }

  // 导入学习数据
  async importLearningData(data: {
    records: LearningRecord[];
    sessions: ReviewSession[];
  }): Promise<void> {
    try {
      await Promise.all([
        this.saveLearningRecords(data.records),
        AsyncStorage.setItem(this.STORAGE_KEYS.REVIEW_SESSIONS, JSON.stringify(data.sessions)),
      ]);
    } catch (error) {
      console.error('导入学习数据失败:', error);
    }
  }

  // 获取单词掌握度
  async getWordMasteryLevel(wordId: string): Promise<number> {
    try {
      const records = await this.getLearningRecords();
      const record = records.find(r => r.wordId === wordId);
      return record ? record.masteryLevel : 0;
    } catch (error) {
      console.error('获取单词掌握度失败:', error);
      return 0;
    }
  }

  // 获取困难单词
  async getDifficultWords(limit: number = 10): Promise<LearningRecord[]> {
    try {
      const records = await this.getLearningRecords();
      return records
        .filter(r => r.masteryLevel < 50)
        .sort((a, b) => a.masteryLevel - b.masteryLevel)
        .slice(0, limit);
    } catch (error) {
      console.error('获取困难单词失败:', error);
      return [];
    }
  }

  // 获取已掌握单词
  async getMasteredWords(limit: number = 10): Promise<LearningRecord[]> {
    try {
      const records = await this.getLearningRecords();
      return records
        .filter(r => r.masteryLevel >= 90)
        .sort((a, b) => b.masteryLevel - a.masteryLevel)
        .slice(0, limit);
    } catch (error) {
      console.error('获取已掌握单词失败:', error);
      return [];
    }
  }
}

// 创建单例实例
export const learningDataService = new LearningDataService();

export default learningDataService; 