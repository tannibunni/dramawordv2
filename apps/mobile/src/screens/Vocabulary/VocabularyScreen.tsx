import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { audioService } from '../../services/audioService';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface VocabularyWord {
  id: string;
  word: string;
  translation: string;
  phonetic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mastered: boolean;
  lastReviewed: string;
  reviewCount: number;
  show?: string;
}

const VocabularyScreen: React.FC = () => {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [filteredWords, setFilteredWords] = useState<VocabularyWord[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mastered' | 'learning'>('all');

  useEffect(() => {
    loadVocabularyWords();
  }, []);

  useEffect(() => {
    filterWords();
  }, [words, searchText, filter]);

  const loadVocabularyWords = () => {
    // 模拟API调用
    setTimeout(() => {
      const mockWords: VocabularyWord[] = [
        {
          id: '1',
          word: 'serendipity',
          translation: '意外发现美好事物的能力',
          phonetic: '/ˌserənˈdɪpəti/',
          difficulty: 'hard',
          mastered: false,
          lastReviewed: '2024-01-15',
          reviewCount: 3,
          show: 'Friends',
        },
        {
          id: '2',
          word: 'resilient',
          translation: '有韧性的，适应力强的',
          phonetic: '/rɪˈzɪliənt/',
          difficulty: 'medium',
          mastered: true,
          lastReviewed: '2024-01-14',
          reviewCount: 8,
          show: 'Breaking Bad',
        },
        {
          id: '3',
          word: 'authentic',
          translation: '真实的，可信的',
          phonetic: '/ɔːˈθentɪk/',
          difficulty: 'medium',
          mastered: false,
          lastReviewed: '2024-01-13',
          reviewCount: 5,
          show: 'The Office',
        },
        {
          id: '4',
          word: 'perseverance',
          translation: '毅力，坚持不懈',
          phonetic: '/ˌpɜːsɪˈvɪərəns/',
          difficulty: 'hard',
          mastered: false,
          lastReviewed: '2024-01-12',
          reviewCount: 2,
          show: 'Game of Thrones',
        },
        {
          id: '5',
          word: 'eloquent',
          translation: '雄辩的，有说服力的',
          phonetic: '/ˈeləkwənt/',
          difficulty: 'medium',
          mastered: true,
          lastReviewed: '2024-01-11',
          reviewCount: 10,
          show: 'House of Cards',
        },
      ];
      setWords(mockWords);
    }, 1000);
  };

  const filterWords = () => {
    let filtered = words;

    // 按掌握状态过滤
    if (filter === 'mastered') {
      filtered = filtered.filter(word => word.mastered);
    } else if (filter === 'learning') {
      filtered = filtered.filter(word => !word.mastered);
    }

    // 按搜索文本过滤
    if (searchText) {
      filtered = filtered.filter(word =>
        word.word.toLowerCase().includes(searchText.toLowerCase()) ||
        word.translation.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredWords(filtered);
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

  const toggleMastered = (wordId: string) => {
    setWords(prevWords =>
      prevWords.map(word =>
        word.id === wordId ? { ...word, mastered: !word.mastered } : word
      )
    );
  };

  const openWordDetail = (word: VocabularyWord) => {
    setSelectedWord(word);
    setShowDetailModal(true);
  };

  // 播放单词发音
  const playPronunciation = async (word: string) => {
    try {
      await audioService.playWordPronunciation(word);
    } catch (error) {
      console.error('发音播放失败:', error);
      Alert.alert('播放失败', '音频播放失败，请稍后重试');
    }
  };

  const renderWordItem = ({ item }: { item: VocabularyWord }) => (
    <TouchableOpacity
      style={styles.wordItem}
      onPress={() => openWordDetail(item)}
    >
      <View style={styles.wordHeader}>
        <View style={styles.wordInfo}>
          <Text style={styles.wordText}>{item.word}</Text>
          <View style={styles.phoneticRow}>
            <Text style={styles.phoneticText}>{item.phonetic}</Text>
            <TouchableOpacity
              style={styles.pronunciationButton}
              onPress={() => playPronunciation(item.word)}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-medium" size={16} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.masteredButton, { backgroundColor: item.mastered ? '#6BCF7A' : '#F0F0F0' }]}
          onPress={() => toggleMastered(item.id)}
        >
          <Ionicons
            name={item.mastered ? 'checkmark' : 'ellipse-outline'}
            size={20}
            color={item.mastered ? 'white' : '#888888'}
          />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.translationText}>{item.translation}</Text>
      
      <View style={styles.wordMeta}>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
          <Text style={styles.difficultyText}>{getDifficultyText(item.difficulty)}</Text>
        </View>
        {item.show && (
          <Text style={styles.showText}>{item.show}</Text>
        )}
        <Text style={styles.reviewText}>复习 {item.reviewCount} 次</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType: 'all' | 'mastered' | 'learning', label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[styles.filterButtonText, filter === filterType && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#888888" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索单词或释义..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* 过滤器 */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', '全部')}
        {renderFilterButton('learning', '学习中')}
        {renderFilterButton('mastered', '已掌握')}
      </View>

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          共 {filteredWords.length} 个单词
          {filter === 'all' && ` (已掌握 ${words.filter(w => w.mastered).length} 个)`}
        </Text>
      </View>

      {/* 单词列表 */}
      <FlatList
        data={filteredWords}
        renderItem={renderWordItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* 单词详情模态框 */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedWord && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Ionicons name="close" size={24} color="#2D2D2D" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>单词详情</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalWordText}>{selectedWord.word}</Text>
              <Text style={styles.modalPhoneticText}>{selectedWord.phonetic}</Text>
              <Text style={styles.modalTranslationText}>{selectedWord.translation}</Text>

              <View style={styles.modalMeta}>
                <View style={[styles.modalDifficultyBadge, { backgroundColor: getDifficultyColor(selectedWord.difficulty) }]}>
                  <Text style={styles.modalDifficultyText}>{getDifficultyText(selectedWord.difficulty)}</Text>
                </View>
                {selectedWord.show && (
                  <Text style={styles.modalShowText}>来自: {selectedWord.show}</Text>
                )}
              </View>

              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatLabel}>掌握状态</Text>
                  <Text style={styles.modalStatValue}>
                    {selectedWord.mastered ? '已掌握' : '学习中'}
                  </Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatLabel}>复习次数</Text>
                  <Text style={styles.modalStatValue}>{selectedWord.reviewCount}</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatLabel}>最后复习</Text>
                  <Text style={styles.modalStatValue}>{selectedWord.lastReviewed}</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#4F6DFF' }]}
                  onPress={() => {
                    console.log('开始复习');
                    setShowDetailModal(false);
                  }}
                >
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text style={styles.modalActionText}>开始复习</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#F76C6C' }]}
                  onPress={() => {
                    console.log('删除单词');
                    setShowDetailModal(false);
                  }}
                >
                  <Ionicons name="trash" size={20} color="white" />
                  <Text style={styles.modalActionText}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#2D2D2D',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#4F6DFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#888888',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  wordItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  wordInfo: {
    flex: 1,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  phoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneticText: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  masteredButton: {
    padding: 4,
    borderRadius: 20,
  },
  translationText: {
    fontSize: 16,
    color: '#2D2D2D',
    marginBottom: 12,
  },
  wordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
  showText: {
    fontSize: 12,
    color: '#4F6DFF',
    marginRight: 8,
  },
  reviewText: {
    fontSize: 12,
    color: '#888888',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'white',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalWordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalPhoneticText: {
    fontSize: 18,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalTranslationText: {
    fontSize: 20,
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
  },
  modalMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalDifficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  modalDifficultyText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  modalShowText: {
    fontSize: 14,
    color: '#4F6DFF',
  },
  modalStats: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  modalStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalStatLabel: {
    fontSize: 14,
    color: '#888888',
  },
  modalStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  modalActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pronunciationButton: {
    padding: 4,
    borderRadius: 20,
  },
});

export default VocabularyScreen; 