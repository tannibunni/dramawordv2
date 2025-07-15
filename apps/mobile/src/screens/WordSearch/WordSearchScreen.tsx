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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../packages/ui/src/tokens';
import { wordService, RecentWord } from '../../services/wordService';
import WordCard from '../../components/cards/WordCard';

const WordSearchScreen: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [recentWords, setRecentWords] = useState<RecentWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [searchResult, setSearchResult] = useState<any>(null);

  useEffect(() => {
    loadRecentWords();
  }, []);

  const loadRecentWords = async () => {
    try {
      setIsLoadingRecent(true);
      const recent = await wordService.getRecentWords();
      setRecentWords(recent);
    } catch (error) {
      console.error('加载最近查词失败:', error);
      Alert.alert('提示', '加载历史词失败，请检查网络连接');
    } finally {
      setIsLoadingRecent(false);
    }
  };

  // 搜索处理
  const handleSearch = async () => {
    const word = searchText.trim().toLowerCase();
    if (!word) {
      Alert.alert('提示', '请输入要查询的单词');
      return;
    }
    setIsLoading(true);
    setSearchResult(null);
    try {
      const result = await wordService.searchWord(word);
      if (result.success && result.data) {
        // 保存查词记录
        await wordService.saveSearchHistory(
          (result.data.word || '').trim().toLowerCase(),
          result.data.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : '暂无释义'
        );
        // 更新最近查词列表
        setRecentWords(prev => [
          {
            id: Date.now().toString(),
            word: (result.data?.word || '').trim().toLowerCase(),
            translation: result.data?.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : '暂无释义',
            timestamp: Date.now(),
          },
          ...prev.filter(w => w.word.trim().toLowerCase() !== (result.data?.word || '').trim().toLowerCase()).slice(0, 4)
        ]);
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
    const searchWord = word.word.trim().toLowerCase();
    setIsLoading(true);
    setSearchResult(null);
    try {
      const result = await wordService.searchWord(searchWord);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="输入英文单词..."
              placeholderTextColor={colors.text.tertiary}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
            {isLoading && (
              <ActivityIndicator size="small" color={colors.primary[500]} style={styles.loadingIndicator} />
            )}
          </View>
        </View>

        {/* 最近查词 */}
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

        {/* 查出来的单词卡 */}
        {searchResult && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>查词结果</Text>
            <WordCard wordData={searchResult} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  searchContainer: {
    marginTop: 24,
    marginBottom: 32,
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
  resultSection: {
    marginBottom: 32,
  },
});

export { WordSearchScreen }; 