import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../../../packages/ui/src/tokens';
import { LearningProgressChart } from '../../components/learning/LearningProgressChart';
import { LearningSuggestions } from '../../components/learning/LearningSuggestions';
import { 
  LoadingSpinner, 
  LoadingCard, 
  EmptyState, 
  ErrorState 
} from '../../components/common/LoadingStates';
import { learningDataService } from '../../services/learningDataService';
import { LearningRecord, LearningStats } from '../../services/learningAlgorithm';
import { useUserExperience, useDebounce } from '../../hooks/useUserExperience';

const LearningAnalyticsScreen: React.FC = () => {
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStats>({
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
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedChartType, setSelectedChartType] = useState<'mastery' | 'forgetting' | 'progress'>('progress');

  // 用户体验Hook
  const { state, actions, refresh, animations } = useUserExperience({
    onRetry: loadLearningData,
    onRefresh: loadLearningData,
    onError: (error) => {
      console.error('Learning analytics error:', error);
    },
  });

  // 防抖搜索
  const debouncedChartType = useDebounce(selectedChartType, 300);

  useEffect(() => {
    loadLearningData();
  }, []);

  async function loadLearningData() {
    try {
      actions.setLoading(true);
      actions.setProgress(0);

      const [records, stats, learningSuggestions] = await Promise.all([
        learningDataService.getLearningRecords(),
        learningDataService.getLearningStats(),
        learningDataService.getLearningSuggestions(),
      ]);

      actions.setProgress(50);

      setLearningRecords(records);
      setLearningStats(stats);
      setSuggestions(learningSuggestions);

      actions.setProgress(100);
      actions.setLoading(false);
      actions.setError(null);
    } catch (error) {
      console.error('加载学习数据失败:', error);
      actions.setError('无法加载学习数据，请稍后重试');
      actions.setLoading(false);
    }
  }

  const onRefresh = async () => {
    actions.setRefreshing(true);
    await loadLearningData();
    actions.setRefreshing(false);
  };

  const handleSuggestionPress = (suggestion: string) => {
    // 根据建议类型执行相应操作
    if (suggestion.includes('复习')) {
      // 导航到复习页面
      Alert.alert('开始复习', '即将跳转到复习页面');
    } else if (suggestion.includes('困难')) {
      // 显示困难单词
      Alert.alert('困难单词', '显示需要重点复习的单词');
    } else {
      Alert.alert('建议', suggestion);
    }
  };

  const handleChartTypeChange = (type: 'mastery' | 'forgetting' | 'progress') => {
    setSelectedChartType(type);
  };

  const getChartTitle = () => {
    switch (selectedChartType) {
      case 'mastery': return '掌握度分布';
      case 'forgetting': return '遗忘曲线预测';
      case 'progress': return '学习进度';
      default: return '学习进度';
    }
  };

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="book" size={24} color={colors.primary[500]} />
          <Text style={styles.statNumber}>{learningStats.totalWords}</Text>
          <Text style={styles.statLabel}>总单词</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} />
          <Text style={styles.statNumber}>{learningStats.masteredWords}</Text>
          <Text style={styles.statLabel}>已掌握</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color={colors.accent[500]} />
          <Text style={styles.statNumber}>{learningStats.streakDays}</Text>
          <Text style={styles.statLabel}>连续天数</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color={colors.primary[500]} />
          <Text style={styles.statNumber}>{learningStats.averageMastery}%</Text>
          <Text style={styles.statLabel}>平均掌握</Text>
        </View>
      </View>
    </View>
  );

  const renderChartSelector = () => (
    <View style={styles.chartSelector}>
      <Text style={styles.sectionTitle}>学习图表</Text>
      <View style={styles.chartButtons}>
        <TouchableOpacity
          style={[
            styles.chartButton,
            selectedChartType === 'progress' && styles.chartButtonActive,
          ]}
          onPress={() => handleChartTypeChange('progress')}
        >
          <Text style={[
            styles.chartButtonText,
            selectedChartType === 'progress' && styles.chartButtonTextActive,
          ]}>
            进度
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.chartButton,
            selectedChartType === 'mastery' && styles.chartButtonActive,
          ]}
          onPress={() => handleChartTypeChange('mastery')}
        >
          <Text style={[
            styles.chartButtonText,
            selectedChartType === 'mastery' && styles.chartButtonTextActive,
          ]}>
            掌握度
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.chartButton,
            selectedChartType === 'forgetting' && styles.chartButtonActive,
          ]}
          onPress={() => handleChartTypeChange('forgetting')}
        >
          <Text style={[
            styles.chartButtonText,
            selectedChartType === 'forgetting' && styles.chartButtonTextActive,
          ]}>
            遗忘曲线
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLearningPlan = () => {
    const todayWords = learningRecords.filter(record => 
      record.nextReviewDate <= new Date()
    ).slice(0, 5);

    return (
      <View style={styles.planContainer}>
        <Text style={styles.sectionTitle}>今日复习计划</Text>
        {todayWords.length > 0 ? (
          todayWords.map((record, index) => (
            <View key={record.wordId} style={styles.planItem}>
              <View style={styles.planItemLeft}>
                <Text style={styles.planWord}>{record.word}</Text>
                <Text style={styles.planMastery}>掌握度: {record.masteryLevel}%</Text>
              </View>
              <View style={styles.planItemRight}>
                <View style={[
                  styles.masteryIndicator,
                  { backgroundColor: record.masteryLevel >= 90 ? colors.success[500] : 
                    record.masteryLevel >= 50 ? colors.accent[500] : colors.error[500] }
                ]} />
                <Text style={styles.planReviewCount}>复习 {record.reviewCount} 次</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyPlan}>
            <Ionicons name="checkmark-circle" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyPlanText}>今日复习完成！</Text>
            <Text style={styles.emptyPlanSubtext}>继续保持，明天继续学习</Text>
          </View>
        )}
      </View>
    );
  };

  // 渲染加载状态
  if (state.loading && learningRecords.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingCard 
          title="加载学习数据"
          subtitle="正在分析你的学习进度..."
          showProgress={true}
          progress={state.progress}
        />
      </SafeAreaView>
    );
  }

  // 渲染错误状态
  if (state.error && learningRecords.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="加载失败"
          message={state.error}
          retryText="重新加载"
          onRetry={actions.retry}
        />
      </SafeAreaView>
    );
  }

  // 渲染空状态
  if (!state.loading && learningRecords.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="school"
          title="还没有学习记录"
          subtitle="开始学习后这里会显示你的进度分析"
          actionText="开始学习"
          onAction={() => Alert.alert('开始学习', '跳转到学习页面')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>学习分析</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={state.refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 统计卡片 */}
        {renderStatsCards()}

        {/* 图表选择器 */}
        {renderChartSelector()}

        {/* 学习图表 */}
        <LearningProgressChart
          records={learningRecords}
          title={getChartTitle()}
          type={debouncedChartType}
        />

        {/* 今日复习计划 */}
        {renderLearningPlan()}

        {/* 学习建议 */}
        <View style={styles.suggestionsContainer}>
          <LearningSuggestions
            suggestions={suggestions}
            stats={learningStats}
            onSuggestionPress={handleSuggestionPress}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  chartSelector: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  chartButtons: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 4,
  },
  chartButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  chartButtonActive: {
    backgroundColor: colors.primary[500],
  },
  chartButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  chartButtonTextActive: {
    color: colors.text.inverse,
  },
  planContainer: {
    padding: 16,
  },
  planItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  planItemLeft: {
    flex: 1,
  },
  planWord: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  planMastery: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  planItemRight: {
    alignItems: 'flex-end',
  },
  masteryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  planReviewCount: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  emptyPlan: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPlanText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyPlanSubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
});

export default LearningAnalyticsScreen; 