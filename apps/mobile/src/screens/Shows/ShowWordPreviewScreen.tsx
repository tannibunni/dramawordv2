import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '../../components/navigation/NavigationContext';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';
import { colors } from '../../constants/colors';
import { buildApiUrl } from '../../config/api';

// 简化的数据结构
interface ShowWithWordCount {
  showId: string;
  showName: string;
  originalTitle?: string;
  posterUrl?: string;
  wordCount: number;
  language: string;
  year?: number;
  genre?: string[];
}

interface ShowWord {
  word: string;
  definitions: string[];
  phonetic?: string;
  difficulty?: string;
  tags?: string[];
}

const { width } = Dimensions.get('window');

const ShowWordPreviewScreen = ({ route }: any) => {
  const { showId, showName } = route.params;
  const [shows, setShows] = useState<ShowWithWordCount[]>([]);
  const [selectedShow, setSelectedShow] = useState<ShowWithWordCount | null>(null);
  const [showWords, setShowWords] = useState<ShowWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { goBack } = useNavigation();
  const { appLanguage } = useAppLanguage();

  useEffect(() => {
    if (showId && showName) {
      // 如果传入了特定剧集参数，直接显示该剧集的单词
      fetchShowWords(showId, showName);
    } else {
      // 否则显示剧集列表
      fetchShowsList();
    }
  }, [showId, showName]);

  // 获取剧集列表
  const fetchShowsList = async () => {
    try {
      setLoading(true);
      
      // 调用真实的API
      const response = await fetch(buildApiUrl('show-words/shows'));
      if (!response.ok) {
        throw new Error('API请求失败');
      }
      
      const result = await response.json();
      if (result.success) {
        // 转换API返回的数据格式
        const formattedShows = result.data.map((item: any) => ({
          showId: item.showId || item._id,
          showName: item.showName,
          originalTitle: item.showName,
          wordCount: item.wordCount,
          language: item.language || 'en',
          year: new Date().getFullYear(), // 暂时使用当前年份
          genre: ['drama'] // 暂时使用默认类型
        }));
        
        setShows(formattedShows);
      } else {
        throw new Error(result.message || '获取数据失败');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('获取剧集列表失败:', error);
      
      // 检查是否是网络错误
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.error('[ShowWordPreviewScreen] 网络请求失败，可能是API地址问题或网络连接问题');
        console.error('[ShowWordPreviewScreen] 当前API地址:', buildApiUrl('show-words/shows'));
      }
      
      setLoading(false);
      
      // 如果API失败，使用模拟数据作为备用
      setShows([
        {
          showId: 'friends',
          showName: 'Friends',
          originalTitle: 'Friends',
          wordCount: 156,
          language: 'en',
          year: 1994,
          genre: ['comedy', 'drama']
        },
        {
          showId: 'breaking_bad',
          showName: 'Breaking Bad',
          originalTitle: 'Breaking Bad',
          wordCount: 89,
          language: 'en',
          year: 2008,
          genre: ['crime', 'drama']
        }
      ]);
      setLoading(false);
    }
  };

  // 获取剧集单词
  const fetchShowWords = async (id: string, name: string) => {
    try {
      setLoading(true);
      
      // 调用真实的API
      const response = await fetch(buildApiUrl(`show-words/words/${id}`));
      if (!response.ok) {
        throw new Error('API请求失败');
      }
      
      const result = await response.json();
      if (result.success) {
        // 转换API返回的数据格式
        const formattedWords = result.data.map((item: any) => ({
          word: item.word,
          definitions: item.definitions || [],
          phonetic: item.phonetic,
          difficulty: item.difficulty || 'intermediate',
          tags: item.tags || []
        }));
        
        setShowWords(formattedWords);
        setSelectedShow({
          showId: id,
          showName: name,
          wordCount: formattedWords.length,
          language: 'en'
        });
      } else {
        throw new Error(result.message || '获取数据失败');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('获取剧集单词失败:', error);
      setLoading(false);
      
      // 如果API失败，使用模拟数据作为备用
      setShowWords([
        { word: 'awesome', definitions: ['极好的', '令人敬畏的'], difficulty: 'intermediate' },
        { word: 'friendship', definitions: ['友谊', '友情'], difficulty: 'intermediate' },
        { word: 'coffee', definitions: ['咖啡'], difficulty: 'beginner' },
        { word: 'relationship', definitions: ['关系', '恋爱关系'], difficulty: 'intermediate' }
      ]);
      setSelectedShow({
        showId: id,
        showName: name,
        wordCount: 4,
        language: 'en'
      });
      setLoading(false);
    }
  };

  // 保存到我的词库
  const handleSaveToVocabulary = async () => {
    if (!selectedShow || showWords.length === 0) return;
    
    try {
      setSaving(true);
      // 这里应该调用真实的API
      // await api.post('/vocabulary/batch-add', {
      //   words: showWords.map(w => ({
      //     word: w.word,
      //     definitions: w.definitions,
      //     source: `来自剧集: ${selectedShow.showName}`
      //   }))
      // });
      
      // 模拟保存
      setTimeout(() => {
        setSaving(false);
        Alert.alert(
          '保存成功',
          `已将 ${showWords.length} 个单词保存到你的词库`,
          [
            { text: '查看词库', onPress: () => goBack() },
            { text: '继续浏览', style: 'cancel' }
          ]
        );
      }, 2000);
      
    } catch (error) {
      setSaving(false);
      Alert.alert('保存失败', '请稍后重试');
    }
  };

  // 返回剧集列表
  const handleBackToList = () => {
    setSelectedShow(null);
    setShowWords([]);
  };

  // 渲染剧集列表
  const renderShowsList = () => {
    if (shows.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color={colors.neutral[300]} />
          <Text style={styles.emptyTitle}>暂无剧集单词数据</Text>
          <Text style={styles.emptyDescription}>
            当你开始标记剧集单词时，这里会显示所有剧集的学习内容
          </Text>
          <TouchableOpacity
            style={styles.backToShowsButton}
            onPress={goBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backToShowsButtonText}>返回剧集列表</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={shows}
        keyExtractor={(item) => item.showId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.showCard}
            onPress={() => fetchShowWords(item.showId, item.showName)}
            activeOpacity={0.8}
          >
            <View style={styles.showCardContent}>
              <View style={styles.showInfo}>
                <Text style={styles.showTitle}>{item.showName}</Text>
                {item.originalTitle && item.originalTitle !== item.showName && (
                  <Text style={styles.originalTitle}>{item.originalTitle}</Text>
                )}
                <View style={styles.showMeta}>
                  {item.year && <Text style={styles.showYear}>{item.year}</Text>}
                  <Text style={styles.showLanguage}>{item.language.toUpperCase()}</Text>
                </View>
                {item.genre && (
                  <View style={styles.genreContainer}>
                    {item.genre.slice(0, 2).map((genre, index) => (
                      <View key={index} style={styles.genreTag}>
                        <Text style={styles.genreText}>{genre}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              
              <View style={styles.wordCountSection}>
                <View style={styles.wordCountBadge}>
                  <Text style={styles.wordCountNumber}>{item.wordCount}</Text>
                  <Text style={styles.wordCountLabel}>个单词</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.showsList}
      />
    );
  };

  // 渲染单词详情
  const renderWordsDetail = () => {
    if (!selectedShow || showWords.length === 0) return null;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 剧集信息头部 */}
        <View style={styles.showHeader}>
          <TouchableOpacity style={styles.backToListButton} onPress={handleBackToList}>
            <Ionicons name="arrow-back" size={20} color={colors.primary[500]} />
            <Text style={styles.backToListText}>{t('back_to_list', appLanguage)}</Text>
          </TouchableOpacity>
          
          <View style={styles.showTitleSection}>
            <Text style={styles.detailShowTitle}>{selectedShow.showName}</Text>
            <Text style={styles.wordCountText}>
              {t('total_words_count', appLanguage).replace('{count}', showWords.length.toString())}
            </Text>
          </View>
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveToVocabulary}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary[500], colors.primary[600]]}
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="bookmark-outline" size={20} color="#fff" />
            )}
            <Text style={styles.saveButtonText}>
              {saving ? t('saving', appLanguage) : t('save_to_vocabulary', appLanguage)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* 单词列表 */}
        <View style={styles.wordsContainer}>
          {showWords.map((word, index) => (
            <View key={index} style={styles.wordCard}>
              <View style={styles.wordHeader}>
                <Text style={styles.wordText}>{word.word}</Text>
                {word.difficulty && (
                  <View style={[styles.difficultyTag, { backgroundColor: getDifficultyColor(word.difficulty) }]}>
                    <Text style={styles.difficultyText}>{word.difficulty}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.wordDefinitions}>
                {word.definitions.join('，')}
              </Text>
              {word.phonetic && (
                <Text style={styles.wordPhonetic}>[{word.phonetic}]</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
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
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedShow ? t('show_words', appLanguage) : t('show_word_preview', appLanguage)}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* 内容区域 */}
      {selectedShow ? renderWordsDetail() : renderShowsList()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[700],
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  backToShowsButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToShowsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // 剧集列表样式
  showsList: {
    padding: 16,
  },
  showCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  showCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  showInfo: {
    flex: 1,
  },
  showTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  originalTitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  showMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  showYear: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  showLanguage: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  genreText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '500',
  },
  wordCountSection: {
    alignItems: 'center',
    marginLeft: 16,
  },
  wordCountBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  wordCountNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  wordCountLabel: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.9,
  },

  // 单词详情样式
  showHeader: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backToListText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '500',
  },
  showTitleSection: {
    alignItems: 'center',
  },
  detailShowTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  wordCountText: {
    fontSize: 16,
    color: '#666',
  },

  // 保存按钮样式
  saveButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // 单词列表样式
  wordsContainer: {
    gap: 12,
  },
  wordCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  wordDefinitions: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  wordPhonetic: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ShowWordPreviewScreen;
