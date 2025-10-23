import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useSavedSentences } from '../../context/SavedSentencesContext';
import { SavedSentence, ReviewMode } from '../../services/savedSentencesService';
import WordCard from '../../components/cards/WordCard';

const SavedSentencesScreen: React.FC = () => {
  const {
    savedSentences,
    isLoading,
    removeSentence,
    updateReview,
    getStatistics,
    refreshSentences
  } = useSavedSentences();

  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [reviewMode, setReviewMode] = useState<ReviewMode>(ReviewMode.RANDOM);
  const [statistics, setStatistics] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 加载统计信息
  useEffect(() => {
    loadStatistics();
  }, [savedSentences]);

  const loadStatistics = async () => {
    try {
      const stats = await getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('❌ 加载统计信息失败:', error);
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSentences();
    } catch (error) {
      console.error('❌ 刷新数据失败:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 删除句子
  const handleRemoveSentence = async (sentence: SavedSentence) => {
    Alert.alert(
      '确认删除',
      `确定要删除句子"${sentence.originalText}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const success = await removeSentence(sentence.id);
            if (success) {
              Alert.alert('成功', '句子已删除');
            } else {
              Alert.alert('错误', '删除失败，请重试');
            }
          }
        }
      ]
    );
  };

  // 开始复习
  const handleStartReview = (sentence: SavedSentence) => {
    // 更新复习记录
    updateReview(sentence.id);
    
    // 这里可以导航到复习界面
    // navigation.navigate('SentenceReview', { sentence });
    console.log('开始复习句子:', sentence.originalText);
  };

  // 过滤句子
  const filteredSentences = savedSentences.filter(sentence => {
    if (filter === 'all') return true;
    return sentence.difficulty === filter;
  });

  // 渲染句子卡片
  const renderSentenceCard = ({ item }: { item: SavedSentence }) => (
    <View style={styles.sentenceCard}>
      <View style={styles.sentenceHeader}>
        <View style={styles.sentenceInfo}>
          <Text style={styles.originalText}>{item.originalText}</Text>
          <Text style={styles.translation}>{item.translation}</Text>
          {item.phonetic && (
            <Text style={styles.phonetic}>{item.phonetic}</Text>
          )}
        </View>
        <View style={styles.sentenceActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleStartReview(item)}
          >
            <Ionicons name="play" size={20} color={colors.primary[500]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemoveSentence(item)}
          >
            <Ionicons name="trash" size={20} color={colors.error[500]} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.sentenceMeta}>
        <Text style={styles.metaText}>
          收藏时间: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.metaText}>
          复习次数: {item.reviewCount}
        </Text>
        {item.difficulty && (
          <Text style={[styles.metaText, styles.difficultyTag]}>
            难度: {item.difficulty}
          </Text>
        )}
      </View>
    </View>
  );

  // 渲染统计信息
  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <View style={styles.statisticsContainer}>
        <Text style={styles.statisticsTitle}>收藏统计</Text>
        <View style={styles.statisticsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.total}</Text>
            <Text style={styles.statLabel}>总句子</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.byDifficulty.easy}</Text>
            <Text style={styles.statLabel}>简单</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.byDifficulty.medium}</Text>
            <Text style={styles.statLabel}>中等</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.byDifficulty.hard}</Text>
            <Text style={styles.statLabel}>困难</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的收藏句子</Text>
        <Text style={styles.subtitle}>共 {savedSentences.length} 个句子</Text>
      </View>

      {renderStatistics()}

      {/* 筛选器 */}
      <View style={styles.filterContainer}>
        {['all', 'easy', 'medium', 'hard'].map(level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.filterButton,
              filter === level && styles.activeFilter
            ]}
            onPress={() => setFilter(level as any)}
          >
            <Text style={[
              styles.filterText,
              filter === level && styles.activeFilterText
            ]}>
              {level === 'all' ? '全部' : level === 'easy' ? '简单' : level === 'medium' ? '中等' : '困难'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 句子列表 */}
      {filteredSentences.length > 0 ? (
        <FlatList
          data={filteredSentences}
          renderItem={renderSentenceCard}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary[500]]}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyText}>还没有收藏的句子</Text>
          <Text style={styles.emptySubtext}>去翻译一些句子并收藏它们吧</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  statisticsContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  statisticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  statisticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  activeFilter: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  activeFilterText: {
    color: colors.white,
  },
  listContainer: {
    padding: 20,
  },
  sentenceCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  sentenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sentenceInfo: {
    flex: 1,
    marginRight: 12,
  },
  originalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  translation: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  phonetic: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  sentenceActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: colors.background.primary,
  },
  sentenceMeta: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginRight: 16,
    marginBottom: 4,
  },
  difficultyTag: {
    backgroundColor: colors.primary[100],
    color: colors.primary[600],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default SavedSentencesScreen;
