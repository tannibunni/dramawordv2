export interface DataConflict {
  localData: any;
  serverData: any;
  localTimestamp: number;
  serverTimestamp: number;
  dataType: string;
  operation?: 'create' | 'update' | 'delete';
  userId?: string;
}

export interface ConflictResolution {
  resolvedData: any;
  source: 'local' | 'server' | 'merged' | 'user-choice';
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  requiresUserInput?: boolean;
  userChoiceOptions?: {
    local: string;
    server: string;
    merged: string;
  };
}

export interface MergeStrategy {
  strategy: 'latest-wins' | 'highest-value' | 'merge-union' | 'merge-intersection' | 'custom';
  priority: 'local' | 'server' | 'balanced';
  timeThreshold: number; // 时间阈值（毫秒）
}

export class DataConflictResolver {
  
  // 多邻国风格的冲突解决策略配置
  private static readonly mergeStrategies: Record<string, MergeStrategy> = {
    experience: {
      strategy: 'highest-value',
      priority: 'balanced',
      timeThreshold: 5 * 60 * 1000 // 5分钟
    },
    vocabulary: {
      strategy: 'merge-union',
      priority: 'balanced',
      timeThreshold: 10 * 60 * 1000 // 10分钟
    },
    progress: {
      strategy: 'highest-value',
      priority: 'balanced',
      timeThreshold: 5 * 60 * 1000
    },
    achievements: {
      strategy: 'merge-union',
      priority: 'balanced',
      timeThreshold: 15 * 60 * 1000 // 15分钟
    },
    userStats: {
      strategy: 'highest-value',
      priority: 'balanced',
      timeThreshold: 5 * 60 * 1000
    },
    learningRecords: {
      strategy: 'merge-union',
      priority: 'balanced',
      timeThreshold: 10 * 60 * 1000
    }
  };

  // 解决数据冲突 - 多邻国风格
  public static resolveConflict(conflict: DataConflict): ConflictResolution {
    const { localData, serverData, localTimestamp, serverTimestamp, dataType } = conflict;
    
    // 获取该数据类型的合并策略
    const strategy = this.mergeStrategies[dataType] || this.mergeStrategies.userStats;
    
    // 检查时间差异
    const timeDiff = Math.abs(localTimestamp - serverTimestamp);
    const isRecentConflict = timeDiff < strategy.timeThreshold;
    
    // 根据数据类型选择不同的解决策略
    switch (dataType) {
      case 'experience':
        return this.resolveExperienceConflict(conflict, strategy, isRecentConflict);
      case 'vocabulary':
        return this.resolveVocabularyConflict(conflict, strategy, isRecentConflict);
      case 'progress':
        return this.resolveProgressConflict(conflict, strategy, isRecentConflict);
      case 'achievements':
        return this.resolveAchievementsConflict(conflict, strategy, isRecentConflict);
      case 'userStats':
        return this.resolveUserStatsConflict(conflict, strategy, isRecentConflict);
      case 'learningRecords':
        return this.resolveLearningRecordsConflict(conflict, strategy, isRecentConflict);
      default:
        return this.resolveGenericConflict(conflict, strategy, isRecentConflict);
    }
  }

  // 解决经验值冲突 - 多邻国风格
  private static resolveExperienceConflict(conflict: DataConflict, strategy: MergeStrategy, isRecentConflict: boolean): ConflictResolution {
    const { localData, serverData, localTimestamp, serverTimestamp } = conflict;
    
    // 多邻国策略：优先保留更高的经验值，但考虑时间因素
    const localExp = localData.experience || 0;
    const serverExp = serverData.experience || 0;
    
    // 如果本地经验值明显更高且时间较近，使用本地数据
    if (localExp > serverExp && isRecentConflict && localTimestamp > serverTimestamp) {
      return {
        resolvedData: localData,
        source: 'local',
        reason: '本地经验值更高且时间较近',
        confidence: 'high'
      };
    }
    
    // 如果服务器经验值更高，使用服务器数据
    if (serverExp > localExp) {
      return {
        resolvedData: serverData,
        source: 'server',
        reason: '服务器经验值更高',
        confidence: 'high'
      };
    }
    
    // 经验值相同，使用时间戳最新的
    if (localExp === serverExp) {
      const useLocal = localTimestamp > serverTimestamp;
      return {
        resolvedData: useLocal ? localData : serverData,
        source: useLocal ? 'local' : 'server',
        reason: '经验值相同，使用时间戳最新的',
        confidence: 'medium'
      };
    }
    
    // 默认使用本地数据（用户刚完成学习）
    return {
      resolvedData: localData,
      source: 'local',
      reason: '默认使用本地数据',
      confidence: 'medium'
    };
  }

  // 解决词汇表冲突 - 多邻国风格
  private static resolveVocabularyConflict(conflict: DataConflict, strategy: MergeStrategy, isRecentConflict: boolean): ConflictResolution {
    const { localData, serverData, localTimestamp, serverTimestamp } = conflict;
    
    // 多邻国策略：智能合并词汇表，保留所有学习进度
    const mergedVocabulary = this.mergeVocabularyIntelligently(
      localData.vocabulary || [], 
      serverData.vocabulary || [],
      localTimestamp,
      serverTimestamp
    );
    
    // 合并其他统计数据
    const mergedStats = this.mergeVocabularyStats(localData, serverData);
    
    return {
      resolvedData: {
        ...localData,
        ...serverData,
        vocabulary: mergedVocabulary,
        ...mergedStats,
        lastUpdated: Math.max(localTimestamp, serverTimestamp)
      },
      source: 'merged',
      reason: '智能合并词汇表，保留所有学习进度',
      confidence: 'high'
    };
  }

  // 智能合并词汇表
  private static mergeVocabularyIntelligently(localVocab: any[], serverVocab: any[], localTimestamp: number, serverTimestamp: number): any[] {
    const merged = new Map();
    
    // 添加本地词汇
    localVocab.forEach(word => {
      merged.set(word.word, {
        ...word,
        source: 'local',
        mergeTimestamp: localTimestamp
      });
    });
    
    // 智能合并服务器词汇
    serverVocab.forEach(word => {
      const existing = merged.get(word.word);
      
      if (!existing) {
        // 新词汇，直接添加
        merged.set(word.word, {
          ...word,
          source: 'server',
          mergeTimestamp: serverTimestamp
        });
      } else {
        // 词汇已存在，智能合并学习记录
        const mergedWord = this.mergeWordLearningRecords(existing, word, localTimestamp, serverTimestamp);
        merged.set(word.word, mergedWord);
      }
    });
    
    return Array.from(merged.values()).map(word => {
      // 移除内部标记
      const { source, mergeTimestamp, ...cleanWord } = word;
      return cleanWord;
    });
  }

  // 合并单词学习记录
  private static mergeWordLearningRecords(localWord: any, serverWord: any, localTimestamp: number, serverTimestamp: number): any {
    // 保留最高的学习进度
    const mergedWord = {
      ...localWord,
      correctCount: Math.max(localWord.correctCount || 0, serverWord.correctCount || 0),
      incorrectCount: Math.max(localWord.incorrectCount || 0, serverWord.incorrectCount || 0),
      consecutiveCorrect: Math.max(localWord.consecutiveCorrect || 0, serverWord.consecutiveCorrect || 0),
      consecutiveIncorrect: Math.max(localWord.consecutiveIncorrect || 0, serverWord.consecutiveIncorrect || 0),
      lastReviewed: Math.max(localWord.lastReviewed || 0, serverWord.lastReviewed || 0),
      masteryLevel: Math.max(localWord.masteryLevel || 0, serverWord.masteryLevel || 0)
    };
    
    // 合并学习历史
    const localHistory = localWord.learningHistory || [];
    const serverHistory = serverWord.learningHistory || [];
    mergedWord.learningHistory = this.mergeLearningHistory(localHistory, serverHistory);
    
    return mergedWord;
  }

  // 合并学习历史
  private static mergeLearningHistory(localHistory: any[], serverHistory: any[]): any[] {
    const allHistory = [...localHistory, ...serverHistory];
    
    // 按时间排序，去重
    const uniqueHistory = allHistory.filter((record, index, self) => 
      index === self.findIndex(r => r.timestamp === record.timestamp && r.action === record.action)
    );
    
    return uniqueHistory.sort((a, b) => a.timestamp - b.timestamp);
  }

  // 合并词汇表统计数据
  private static mergeVocabularyStats(localData: any, serverData: any): any {
    return {
      totalWords: Math.max(localData.totalWords || 0, serverData.totalWords || 0),
      masteredWords: Math.max(localData.masteredWords || 0, serverData.masteredWords || 0),
      learningWords: Math.max(localData.learningWords || 0, serverData.learningWords || 0),
      averageAccuracy: this.calculateWeightedAverage(
        localData.averageAccuracy || 0,
        serverData.averageAccuracy || 0,
        localData.totalReviews || 0,
        serverData.totalReviews || 0
      )
    };
  }

  // 解决进度冲突 - 多邻国风格
  private static resolveProgressConflict(conflict: DataConflict, strategy: MergeStrategy, isRecentConflict: boolean): ConflictResolution {
    const { localData, serverData, localTimestamp, serverTimestamp } = conflict;
    
    // 多邻国策略：保留最高进度，合并统计数据
    const resolvedProgress = {
      totalReviews: Math.max(localData.totalReviews || 0, serverData.totalReviews || 0),
      currentStreak: Math.max(localData.currentStreak || 0, serverData.currentStreak || 0),
      longestStreak: Math.max(localData.longestStreak || 0, serverData.longestStreak || 0),
      totalStudyTime: Math.max(localData.totalStudyTime || 0, serverData.totalStudyTime || 0),
      averageAccuracy: this.calculateWeightedAverage(
        localData.averageAccuracy || 0,
        serverData.averageAccuracy || 0,
        localData.totalReviews || 0,
        serverData.totalReviews || 0
      ),
      lastStudyDate: Math.max(localData.lastStudyDate || 0, serverData.lastStudyDate || 0),
      studyDays: Math.max(localData.studyDays || 0, serverData.studyDays || 0)
    };
    
    return {
      resolvedData: resolvedProgress,
      source: 'merged',
      reason: '保留最高进度，合并统计数据',
      confidence: 'high'
    };
  }

  // 解决成就冲突 - 多邻国风格
  private static resolveAchievementsConflict(conflict: DataConflict, strategy: MergeStrategy, isRecentConflict: boolean): ConflictResolution {
    const { localData, serverData } = conflict;
    
    // 多邻国策略：合并所有成就，保留最早的解锁时间和最新的进度
    const mergedAchievements = this.mergeAchievementsIntelligently(
      localData.achievements || [],
      serverData.achievements || []
    );
    
    return {
      resolvedData: {
        ...localData,
        ...serverData,
        achievements: mergedAchievements,
        totalAchievements: mergedAchievements.length
      },
      source: 'merged',
      reason: '合并所有成就，保留解锁时间和进度',
      confidence: 'high'
    };
  }

  // 智能合并成就
  private static mergeAchievementsIntelligently(localAchievements: any[], serverAchievements: any[]): any[] {
    const merged = new Map();
    
    // 添加本地成就
    localAchievements.forEach(achievement => {
      merged.set(achievement.id, achievement);
    });
    
    // 智能合并服务器成就
    serverAchievements.forEach(achievement => {
      const existing = merged.get(achievement.id);
      
      if (!existing) {
        // 新成就，直接添加
        merged.set(achievement.id, achievement);
      } else {
        // 成就已存在，智能合并
        merged.set(achievement.id, {
          ...existing,
          unlockedAt: Math.min(existing.unlockedAt || Date.now(), achievement.unlockedAt || Date.now()),
          progress: Math.max(existing.progress || 0, achievement.progress || 0),
          completedAt: existing.completedAt || achievement.completedAt,
          lastUpdated: Math.max(existing.lastUpdated || 0, achievement.lastUpdated || 0)
        });
      }
    });
    
    return Array.from(merged.values());
  }

  // 解决用户统计冲突 - 多邻国风格
  private static resolveUserStatsConflict(conflict: DataConflict, strategy: MergeStrategy, isRecentConflict: boolean): ConflictResolution {
    const { localData, serverData, localTimestamp, serverTimestamp } = conflict;
    
    // 多邻国策略：智能合并用户统计
    const mergedStats = {
      experience: Math.max(localData.experience || 0, serverData.experience || 0),
      level: Math.max(localData.level || 1, serverData.level || 1),
      totalStudyTime: Math.max(localData.totalStudyTime || 0, serverData.totalStudyTime || 0),
      totalWordsLearned: Math.max(localData.totalWordsLearned || 0, serverData.totalWordsLearned || 0),
      currentStreak: Math.max(localData.currentStreak || 0, serverData.currentStreak || 0),
      longestStreak: Math.max(localData.longestStreak || 0, serverData.longestStreak || 0),
      averageAccuracy: this.calculateWeightedAverage(
        localData.averageAccuracy || 0,
        serverData.averageAccuracy || 0,
        localData.totalReviews || 0,
        serverData.totalReviews || 0
      ),
      lastActive: Math.max(localData.lastActive || 0, serverData.lastActive || 0),
      joinDate: Math.min(localData.joinDate || Date.now(), serverData.joinDate || Date.now())
    };
    
    return {
      resolvedData: mergedStats,
      source: 'merged',
      reason: '智能合并用户统计，保留最高值',
      confidence: 'high'
    };
  }

  // 解决学习记录冲突 - 多邻国风格
  private static resolveLearningRecordsConflict(conflict: DataConflict, strategy: MergeStrategy, isRecentConflict: boolean): ConflictResolution {
    const { localData, serverData } = conflict;
    
    // 多邻国策略：合并学习记录，去重
    const localRecords = localData.records || [];
    const serverRecords = serverData.records || [];
    
    const mergedRecords = this.mergeLearningRecords(localRecords, serverRecords);
    
    return {
      resolvedData: {
        ...localData,
        ...serverData,
        records: mergedRecords,
        totalRecords: mergedRecords.length
      },
      source: 'merged',
      reason: '合并学习记录，去重',
      confidence: 'high'
    };
  }

  // 合并学习记录
  private static mergeLearningRecords(localRecords: any[], serverRecords: any[]): any[] {
    const allRecords = [...localRecords, ...serverRecords];
    
    // 按时间排序，去重
    const uniqueRecords = allRecords.filter((record, index, self) => 
      index === self.findIndex(r => 
        r.timestamp === record.timestamp && 
        r.wordId === record.wordId && 
        r.action === record.action
      )
    );
    
    return uniqueRecords.sort((a, b) => a.timestamp - b.timestamp);
  }

  // 通用冲突解决
  private static resolveGenericConflict(conflict: DataConflict, strategy: MergeStrategy, isRecentConflict: boolean): ConflictResolution {
    const { localData, serverData, localTimestamp, serverTimestamp } = conflict;
    
    // 根据策略选择解决方式
    switch (strategy.strategy) {
      case 'latest-wins':
        const useLocal = localTimestamp > serverTimestamp;
        return {
          resolvedData: useLocal ? localData : serverData,
          source: useLocal ? 'local' : 'server',
          reason: '使用时间戳最新的数据',
          confidence: 'medium'
        };
      
      case 'highest-value':
        // 尝试比较数值，如果无法比较则使用时间戳
        if (typeof localData === 'number' && typeof serverData === 'number') {
          const useLocal = localData > serverData;
          return {
            resolvedData: useLocal ? localData : serverData,
            source: useLocal ? 'local' : 'server',
            reason: '使用数值更高的数据',
            confidence: 'medium'
          };
        }
        // 降级到时间戳比较
        const useLocalTime = localTimestamp > serverTimestamp;
        return {
          resolvedData: useLocalTime ? localData : serverData,
          source: useLocalTime ? 'local' : 'server',
          reason: '使用时间戳最新的数据',
          confidence: 'low'
        };
      
      default:
        // 默认使用时间戳最新的
        const useLocalDefault = localTimestamp > serverTimestamp;
        return {
          resolvedData: useLocalDefault ? localData : serverData,
          source: useLocalDefault ? 'local' : 'server',
          reason: '默认使用时间戳最新的数据',
          confidence: 'low'
        };
    }
  }

  // 计算加权平均值
  private static calculateWeightedAverage(localValue: number, serverValue: number, localWeight: number, serverWeight: number): number {
    if (localWeight + serverWeight === 0) return 0;
    return (localValue * localWeight + serverValue * serverWeight) / (localWeight + serverWeight);
  }

  // 检查数据是否冲突
  public static hasConflict(localData: any, serverData: any, dataType: string): boolean {
    if (!localData || !serverData) return false;
    
    switch (dataType) {
      case 'experience':
        return localData.experience !== serverData.experience;
      case 'vocabulary':
        return JSON.stringify(localData.vocabulary) !== JSON.stringify(serverData.vocabulary);
      case 'progress':
        return localData.totalReviews !== serverData.totalReviews ||
               localData.currentStreak !== serverData.currentStreak;
      case 'achievements':
        return JSON.stringify(localData.achievements) !== JSON.stringify(serverData.achievements);
      case 'userStats':
        return localData.experience !== serverData.experience ||
               localData.level !== serverData.level;
      case 'learningRecords':
        return JSON.stringify(localData.records) !== JSON.stringify(serverData.records);
      default:
        return JSON.stringify(localData) !== JSON.stringify(serverData);
    }
  }

  // 获取冲突摘要 - 多邻国风格
  public static getConflictSummary(conflict: DataConflict): string {
    const { localData, serverData, dataType } = conflict;
    
    switch (dataType) {
      case 'experience':
        return `经验值冲突: 本地 ${localData.experience} vs 服务器 ${serverData.experience}`;
      case 'vocabulary':
        return `词汇表冲突: 本地 ${localData.vocabulary?.length || 0} 个词 vs 服务器 ${serverData.vocabulary?.length || 0} 个词`;
      case 'progress':
        return `进度冲突: 本地 ${localData.totalReviews} 次复习 vs 服务器 ${serverData.totalReviews} 次复习`;
      case 'achievements':
        return `成就冲突: 本地 ${localData.achievements?.length || 0} 个成就 vs 服务器 ${serverData.achievements?.length || 0} 个成就`;
      case 'userStats':
        return `用户统计冲突: 本地 Lv.${localData.level} vs 服务器 Lv.${serverData.level}`;
      case 'learningRecords':
        return `学习记录冲突: 本地 ${localData.records?.length || 0} 条记录 vs 服务器 ${serverData.records?.length || 0} 条记录`;
      default:
        return '数据冲突';
    }
  }

  // 获取冲突严重程度
  public static getConflictSeverity(conflict: DataConflict): 'low' | 'medium' | 'high' {
    const { localData, serverData, dataType } = conflict;
    
    switch (dataType) {
      case 'experience':
        const expDiff = Math.abs((localData.experience || 0) - (serverData.experience || 0));
        return expDiff > 100 ? 'high' : expDiff > 50 ? 'medium' : 'low';
      
      case 'vocabulary':
        const vocabDiff = Math.abs((localData.vocabulary?.length || 0) - (serverData.vocabulary?.length || 0));
        return vocabDiff > 20 ? 'high' : vocabDiff > 10 ? 'medium' : 'low';
      
      case 'progress':
        const progressDiff = Math.abs((localData.totalReviews || 0) - (serverData.totalReviews || 0));
        return progressDiff > 50 ? 'high' : progressDiff > 20 ? 'medium' : 'low';
      
      default:
        return 'medium';
    }
  }
} 