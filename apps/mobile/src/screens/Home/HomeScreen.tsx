import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../packages/ui/src/tokens';
import { wordService, RecentWord } from '../../services/wordService';
import WordCard from '../../components/cards/WordCard';
import { useShowList } from '../../context/ShowListContext';
import { useVocabulary } from '../../context/VocabularyContext';
import { TMDBService, TMDBShow } from '../../services/tmdbService';

const HomeScreen: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [recentWords, setRecentWords] = useState<RecentWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [searchResult, setSearchResult] = useState<any>(null);
  const { shows, addShow } = useShowList();
  const { vocabulary, addWord } = useVocabulary();
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedShow, setSelectedShow] = useState<any>(null);
  const [searchShowText, setSearchShowText] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBShow[]>([]);
  const [searchingShow, setSearchingShow] = useState(false);

  useEffect(() => {
    loadRecentWords();
  }, []);

  const loadRecentWords = async () => {
    try {
      setIsLoadingRecent(true);
      const recent = await wordService.getRecentWords();
      
      // 前端去重逻辑，确保没有重复单词
      const uniqueWords = recent.reduce((acc: RecentWord[], current) => {
        const exists = acc.find(item => item.word.toLowerCase() === current.word.toLowerCase());
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setRecentWords(uniqueWords);
    } catch (error) {
      console.error('加载最近查词失败:', error);
      Alert.alert('提示', '加载历史词失败，请检查网络连接');
    } finally {
      setIsLoadingRecent(false);
    }
  };

  // 搜索处理
  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert('提示', '请输入要查询的单词');
      return;
    }
    setIsLoading(true);
    setSearchResult(null);
    try {
      const result = await wordService.searchWord(searchText.trim());
      if (result.success && result.data) {
        // 保存查词记录
        await wordService.saveSearchHistory(
          result.data.word,
          result.data.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : '暂无释义'
        );
        // 更新最近查词列表 - 去重并保持最新
        setRecentWords(prev => {
          // 过滤掉重复的单词，保留最新的
          const filtered = prev.filter(w => w.word.toLowerCase() !== result.data.word.toLowerCase());
          return [
            {
              id: Date.now().toString(),
              word: result.data.word,
              translation: result.data.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : '暂无释义',
              timestamp: Date.now(),
            },
            ...filtered.slice(0, 4) // 只保留前5个（包括新添加的）
          ];
        });
        setSearchResult(result.data);
        setSearchText('');
      } else {
        Alert.alert('查询失败', result.error || '无法找到该单词');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      Alert.alert('搜索失败', '网络连接异常，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 点击历史词
  const handleRecentWordPress = async (word: RecentWord) => {
    setIsLoading(true);
    setSearchResult(null);
    try {
      const result = await wordService.searchWord(word.word);
      if (result.success && result.data) {
        setSearchResult(result.data);
      } else {
        Alert.alert('查询失败', '无法获取单词详情');
      }
    } catch (error) {
      console.error('获取单词详情失败:', error);
      Alert.alert('查询失败', '网络连接异常，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 搜索框内容变化
  const handleInputChange = (text: string) => {
    setSearchText(text);
    if (text.length === 0) {
      setSearchResult(null);
    }
  };

  // 收藏按钮高亮逻辑
  const isCollected = searchResult && vocabulary.some(w => w.word === searchResult.word);

  // 收藏按钮点击
  const handleCollect = () => {
    setShowCollectModal(true);
  };

  // 确认收藏
  const handleConfirmCollect = () => {
    if (searchResult) {
      addWord(searchResult, selectedShow || undefined);
      setShowCollectModal(false);
    }
  };

  // 剧集搜索
  const handleShowSearch = async (text: string) => {
    setSearchShowText(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchingShow(true);
    try {
      const res = await TMDBService.searchShows(text);
      setSearchResults(res.results || []);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearchingShow(false);
    }
  };

  // 添加新剧到"正在看"
  const handleAddShow = (show: TMDBShow) => {
    const newShow = { ...show, status: 'watching', wordCount: 0 };
    addShow(newShow);
    setSelectedShow(newShow);
    setSearchShowText('');
    setSearchResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 搜索栏 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
            {searchResult ? (
              <>
                <Text style={styles.searchResultWord}>{searchResult.word}</Text>
                <TouchableOpacity onPress={() => setSearchResult(null)} style={styles.clearButton}>
                  <Ionicons name="close" size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.searchInput}
                  placeholder="输入英文单词..."
                  placeholderTextColor={colors.text.tertiary}
                  value={searchText}
                  onChangeText={handleInputChange}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => handleInputChange('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                )}
              </>
            )}
            {isLoading && (
              <ActivityIndicator size="small" color={colors.primary[500]} style={styles.loadingIndicator} />
            )}
          </View>
        </View>
        {/* 内容区：有查词结果时只显示卡片，否则显示最近查词 */}
        {searchResult ? (
          <View style={styles.wordCardWrapper}>
            <WordCard
              wordData={searchResult}
              style={styles.wordCardCustom}
              onIgnore={() => setSearchResult(null)}
              onCollect={handleCollect}
              isCollected={isCollected}
            />
          </View>
        ) : (
          <ScrollView style={styles.recentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>最近查词</Text>
              <View style={styles.wordsContainer}>
                {isLoadingRecent ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary[500]} />
                    <Text style={styles.loadingText}>加载中...</Text>
                  </View>
                ) : recentWords.length > 0 ? (
                  recentWords.map((word) => (
                    <TouchableOpacity
                      key={word.id}
                      style={styles.wordCard}
                      onPress={() => handleRecentWordPress(word)}
                      disabled={isLoading}
                    >
                      <Text style={styles.wordText}>{word.word}</Text>
                      <Text style={styles.wordTranslation}>{word.translation}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
                    <Text style={styles.emptyStateText}>暂无最近查词记录</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
      {/* 收藏弹窗 */}
      <Modal
        visible={showCollectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCollectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.collectModal}>
            <Text style={styles.modalTitle}>标记单词来源</Text>
            <Text style={styles.modalSubtitle}>选择正在看的剧集，或搜索添加新剧</Text>
            {/* 剧集搜索框 */}
            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={18} color={colors.text.secondary} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="搜索剧集..."
                value={searchShowText}
                onChangeText={handleShowSearch}
              />
              {searchingShow && <ActivityIndicator size="small" color={colors.primary[500]} style={{ marginLeft: 8 }} />}
            </View>
            {/* 搜索结果 */}
            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalShowItem} onPress={() => handleAddShow(item)}>
                    <Text style={styles.modalShowName}>{item.name}</Text>
                    <Text style={styles.modalShowYear}>{item.first_air_date?.slice(0, 4)}</Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 120, marginBottom: 8 }}
              />
            )}
            {/* 正在看剧集列表 */}
            <Text style={styles.modalSectionTitle}>正在看</Text>
            <FlatList
              data={shows.filter(s => s.status === 'watching')}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalShowItem, selectedShow && selectedShow.id === item.id && styles.modalShowItemSelected]}
                  onPress={() => setSelectedShow(item)}
                >
                  <Text style={styles.modalShowName}>{item.name}</Text>
                  <Text style={styles.modalShowYear}>{item.first_air_date?.slice(0, 4)}</Text>
                  {selectedShow && selectedShow.id === item.id && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary[500]} style={{ marginLeft: 8 }} />
                  )}
                </TouchableOpacity>
              )}
              style={{ maxHeight: 160, marginBottom: 8 }}
              ListEmptyComponent={<Text style={styles.modalEmptyText}>暂无正在看的剧集</Text>}
            />
            {/* 按钮区 */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowCollectModal(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, !selectedShow && { opacity: 0.5 }]}
                onPress={handleConfirmCollect}
                disabled={!selectedShow}
              >
                <Text style={styles.modalConfirmText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: colors.background.primary,
    zIndex: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.neutral[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
    marginRight: 8,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  recentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  recentSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  wordsContainer: {
    gap: 12,
  },
  wordCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.neutral[200],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  wordText: {
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  wordTranslation: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.tertiary,
    marginTop: 16,
  },
  searchResultWord: {
    flex: 1,
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '600',
    paddingVertical: 8,
    paddingLeft: 0,
  },
  wordCardWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingBottom: 24,
  },
  wordCardCustom: {
    width: '92%',
    minHeight: 220,
    maxWidth: 500,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    shadowColor: colors.neutral[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    padding: 24,
    marginVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectModal: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: 4,
  },
  modalSectionTitle: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 4,
    marginTop: 8,
  },
  modalShowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    marginBottom: 4,
  },
  modalShowItemSelected: {
    backgroundColor: colors.primary[50],
  },
  modalShowName: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  modalShowYear: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginLeft: 8,
  },
  modalEmptyText: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginVertical: 12,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    marginRight: 12,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  modalConfirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export { HomeScreen }; 