import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LearningStats } from '../../services/learningAlgorithm';

interface LearningSuggestionsProps {
  suggestions: string[];
  stats: LearningStats;
  onSuggestionPress?: (suggestion: string) => void;
}

export const LearningSuggestions: React.FC<LearningSuggestionsProps> = ({
  suggestions,
  stats,
  onSuggestionPress,
}) => {
  const getSuggestionIcon = (suggestion: string): keyof typeof Ionicons.glyphMap => {
    if (suggestion.includes('复习')) return 'refresh';
    if (suggestion.includes('掌握')) return 'checkmark-circle';
    if (suggestion.includes('连续')) return 'flame';
    if (suggestion.includes('开始')) return 'play';
    if (suggestion.includes('困难')) return 'alert-circle';
    return 'bulb';
  };

  const getSuggestionColor = (suggestion: string): string => {
    if (suggestion.includes('复习')) return '#3b82f6';
    if (suggestion.includes('掌握')) return '#10b981';
    if (suggestion.includes('连续')) return '#f59e0b';
    if (suggestion.includes('开始')) return '#8b5cf6';
    if (suggestion.includes('困难')) return '#ef4444';
    return '#6b7280';
  };

  const getMotivationalMessage = (): string => {
    if (stats.streakDays >= 7) {
      return `太棒了！你已经连续学习 ${stats.streakDays} 天，继续保持这个势头！`;
    } else if (stats.streakDays >= 3) {
      return `很好！连续学习 ${stats.streakDays} 天，习惯正在养成中。`;
    } else if (stats.averageMastery >= 75) {
      return '你的掌握度很高，继续保持！';
    } else if (stats.masteredWords > 0) {
      return `恭喜！你已经掌握了 ${stats.masteredWords} 个单词。`;
    } else {
      return '开始你的学习之旅吧！每一步都是进步。';
    }
  };

  const getProgressMessage = (): string => {
    const totalWords = stats.totalWords;
    if (totalWords === 0) return '还没有学习记录';
    
    const masteredPercentage = Math.round((stats.masteredWords / totalWords) * 100);
    const learningPercentage = Math.round((stats.learningWords / totalWords) * 100);
    
    return `已掌握 ${masteredPercentage}%，学习中 ${learningPercentage}%`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bulb" size={24} color="#3b82f6" />
        <Text style={styles.title}>学习建议</Text>
      </View>

      {/* 激励信息 */}
      <View style={styles.motivationalCard}>
        <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
      </View>

      {/* 进度概览 */}
      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <View style={styles.progressItem}>
            <Text style={styles.progressNumber}>{stats.totalWords}</Text>
            <Text style={styles.progressLabel}>总单词</Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressNumber}>{stats.masteredWords}</Text>
            <Text style={styles.progressLabel}>已掌握</Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressNumber}>{stats.streakDays}</Text>
            <Text style={styles.progressLabel}>连续天数</Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressNumber}>{stats.averageMastery}%</Text>
            <Text style={styles.progressLabel}>平均掌握</Text>
          </View>
        </View>
        <Text style={styles.progressMessage}>{getProgressMessage()}</Text>
      </View>

      {/* 建议列表 */}
      <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
        {suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => onSuggestionPress?.(suggestion)}
              activeOpacity={0.7}
            >
              <View style={styles.suggestionIcon}>
                <Ionicons 
                  name={getSuggestionIcon(suggestion)} 
                  size={20} 
                  color={getSuggestionColor(suggestion)} 
                />
              </View>
              <Text style={styles.suggestionText}>{suggestion}</Text>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>暂无建议</Text>
            <Text style={styles.emptySubtext}>继续学习获取个性化建议</Text>
          </View>
        )}
      </ScrollView>

      {/* 学习提示 */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 学习小贴士</Text>
        <Text style={styles.tipsText}>
          • 每天坚持复习，效果最佳{'\n'}
          • 遇到困难单词要重点标记{'\n'}
          • 利用间隔重复提高记忆效率{'\n'}
          • 多听发音，加深印象
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  motivationalCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  motivationalText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  suggestionsContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
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
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
  },
  tipsCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default LearningSuggestions; 