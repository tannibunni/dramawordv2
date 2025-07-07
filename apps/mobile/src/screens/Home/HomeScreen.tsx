import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface UserStats {
  totalWords: number;
  learnedWords: number;
  reviewWords: number;
  streakDays: number;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface RecommendedWord {
  id: string;
  word: string;
  translation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const HomeScreen: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats>({
    totalWords: 0,
    learnedWords: 0,
    reviewWords: 0,
    streakDays: 0,
  });

  const [recommendedWords, setRecommendedWords] = useState<RecommendedWord[]>([]);

  const quickActions: QuickAction[] = [
    {
      id: 'search',
      title: '查词',
      icon: 'search',
      color: '#4F6DFF',
      onPress: () => console.log('查词'),
    },
    {
      id: 'review',
      title: '复习',
      icon: 'refresh',
      color: '#6BCF7A',
      onPress: () => console.log('复习'),
    },
    {
      id: 'shows',
      title: '剧集',
      icon: 'play-circle',
      color: '#F4B942',
      onPress: () => console.log('剧集'),
    },
    {
      id: 'vocabulary',
      title: '单词本',
      icon: 'book',
      color: '#F76C6C',
      onPress: () => console.log('单词本'),
    },
  ];

  useEffect(() => {
    // 模拟加载用户数据
    loadUserData();
    loadRecommendedWords();
  }, []);

  const loadUserData = () => {
    // 模拟API调用
    setTimeout(() => {
      setUserStats({
        totalWords: 1250,
        learnedWords: 856,
        reviewWords: 23,
        streakDays: 7,
      });
    }, 1000);
  };

  const loadRecommendedWords = () => {
    // 模拟推荐单词
    setTimeout(() => {
      setRecommendedWords([
        { id: '1', word: 'serendipity', translation: '意外发现美好事物的能力', difficulty: 'hard' },
        { id: '2', word: 'resilient', translation: '有韧性的，适应力强的', difficulty: 'medium' },
        { id: '3', word: 'authentic', translation: '真实的，可信的', difficulty: 'medium' },
      ]);
    }, 1500);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#6BCF7A';
      case 'medium': return '#F4B942';
      case 'hard': return '#F76C6C';
      default: return '#888888';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '未知';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 头部欢迎区域 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>早上好！</Text>
            <Text style={styles.username}>继续你的学习之旅</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={40} color="#4F6DFF" />
          </TouchableOpacity>
        </View>

        {/* 学习统计卡片 */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>学习统计</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.totalWords}</Text>
              <Text style={styles.statLabel}>总单词</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.learnedWords}</Text>
              <Text style={styles.statLabel}>已掌握</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.reviewWords}</Text>
              <Text style={styles.statLabel}>待复习</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.streakDays}</Text>
              <Text style={styles.statLabel}>连续天数</Text>
            </View>
          </View>
        </View>

        {/* 快速操作 */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>快速操作</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionButton, { backgroundColor: action.color }]}
                onPress={action.onPress}
              >
                <Ionicons name={action.icon as any} size={24} color="white" />
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 今日推荐 */}
        <View style={styles.recommendedCard}>
          <Text style={styles.sectionTitle}>今日推荐</Text>
          {recommendedWords.map((word) => (
            <TouchableOpacity key={word.id} style={styles.wordItem}>
              <View style={styles.wordInfo}>
                <Text style={styles.wordText}>{word.word}</Text>
                <Text style={styles.translationText}>{word.translation}</Text>
              </View>
              <View style={styles.wordMeta}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(word.difficulty) }]}>
                  <Text style={styles.difficultyText}>{getDifficultyText(word.difficulty)}</Text>
                </View>
                <TouchableOpacity style={styles.addButton}>
                  <Ionicons name="add-circle" size={24} color="#4F6DFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 学习进度 */}
        <View style={styles.progressCard}>
          <Text style={styles.sectionTitle}>学习进度</Text>
          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>本周目标</Text>
              <Text style={styles.progressValue}>75%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '75%' }]} />
            </View>
            <Text style={styles.progressText}>已完成 15/20 个单词</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  username: {
    fontSize: 16,
    color: '#888888',
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F6DFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  quickActionsCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: (width - 80) / 4,
    height: 80,
    borderRadius: 12,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  recommendedCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  wordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  wordInfo: {
    flex: 1,
  },
  wordText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  translationText: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  wordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  addButton: {
    padding: 4,
  },
  progressCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#2D2D2D',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F6DFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F6DFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
});

export default HomeScreen; 