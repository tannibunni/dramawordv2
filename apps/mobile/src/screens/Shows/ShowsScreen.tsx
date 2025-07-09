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
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TMDBService, TMDBShow } from '../../services/tmdbService';
import { colors } from '../../constants/colors';
import { useShowList, Show } from '../../context/ShowListContext';
import { useVocabulary, WordWithSource } from '../../context/VocabularyContext';
import WordCard, { WordData } from '../../components/cards/WordCard';

const { width } = Dimensions.get('window');

const ShowsScreen: React.FC = () => {
  const { shows, addShow, changeShowStatus } = useShowList(); // 使用 ShowListContext
  const { vocabulary } = useVocabulary(); // 使用 VocabularyContext
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBShow[]>([]); // 搜索结果
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'plan_to_watch' | 'watching' | 'completed'>('all');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordWithSource | null>(null);
  const [showWordCardModal, setShowWordCardModal] = useState(false);

  useEffect(() => {
    filterShows();
  }, [shows, filter]);

  const searchShows = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      const response = await TMDBService.searchShows(query);
      setSearchResults(response.results);
    } catch (error) {
      console.error('Failed to search shows:', error);
      Alert.alert('错误', '搜索剧集失败，请稍后重试');
    } finally {
      setSearchLoading(false);
    }
  };

  const addShowToWatching = (show: TMDBShow) => {
    // 避免重复添加
    if (shows.some(s => s.id === show.id)) return;
    const newShow: Show = {
      ...show,
      status: 'watching', // 直接添加到"观看中"
      wordCount: 0,
    };
    addShow(newShow); // 使用 ShowListContext 的 addShow
    setSearchText('');
    setSearchResults([]);
    setFilter('watching'); // 添加后切换到"观看中"
  };

  const filterShows = () => {
    let filtered = shows;
    if (filter !== 'all') {
      filtered = filtered.filter(show => show.status === filter);
    }
    setFilteredShows(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watching': return colors.primary[500];
      case 'completed': return colors.success[500];
      case 'plan_to_watch': return colors.accent[500];
      default: return colors.text.secondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'watching': return '观看中';
      case 'completed': return '已完成';
      case 'plan_to_watch': return '想看';
      default: return '未知';
    }
  };

  const toggleShowStatus = (showId: number) => {
    // 使用 ShowListContext 的 changeShowStatus
    const currentShow = shows.find(s => s.id === showId);
    if (!currentShow) return;
    
    // 循环切换状态：想看 -> 观看中 -> 已完成 -> 想看
    let newStatus: Show['status'];
    switch (currentShow.status) {
      case 'plan_to_watch':
        newStatus = 'watching';
        break;
      case 'watching':
        newStatus = 'completed';
        break;
      case 'completed':
        newStatus = 'plan_to_watch';
        break;
      default:
        newStatus = 'plan_to_watch';
    }
    changeShowStatus(showId, newStatus);
  };

  const openShowDetail = (show: Show) => {
    console.log('打开剧集详情:', show);
    setSelectedShow(show);
    setShowDetailModal(true);
  };

  // 获取该剧集相关的单词
  const getShowWords = (showId: number): WordWithSource[] => {
    console.log('所有词汇:', vocabulary);
    console.log('当前剧集ID:', showId);
    const showWords = vocabulary.filter(word => {
      console.log('检查单词:', word.word, 'sourceShow:', word.sourceShow);
      return word.sourceShow && word.sourceShow.id === showId;
    });
    console.log(`剧集 ${showId} 的单词:`, showWords);
    return showWords;
  };

  // 打开单词卡片
  const openWordCard = (word: WordWithSource) => {
    console.log('点击单词:', word);
    setSelectedWord(word);
    setShowWordCardModal(true);
  };

  const renderShowItem = ({ item }: { item: Show }) => (
    <TouchableOpacity
      style={styles.showItem}
      onPress={() => openShowDetail(item)}
    >
      <Image 
        source={{ 
          uri: item.poster_path 
            ? TMDBService.getImageUrl(item.poster_path, 'w185')
            : 'https://via.placeholder.com/150x225/CCCCCC/FFFFFF?text=No+Image'
        }} 
        style={styles.poster} 
      />
      <View style={styles.showInfo}>
        <View style={styles.showHeader}>
          <Text style={styles.showTitle}>{item.name}</Text>
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
            onPress={(e) => {
              e.stopPropagation(); // 阻止触发父级的 onPress
              toggleShowStatus(item.id);
            }}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.originalTitle}>{item.original_name}</Text>
        <Text style={styles.genreText}>
          {item.genres?.map(genre => genre.name).join(', ') || 
           (item.genre_ids ? TMDBService.getGenreNames(item.genre_ids).join(', ') : '未知类型')}
        </Text>
        <View style={styles.showMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={colors.accent[500]} />
            <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
          </View>
          <Text style={styles.wordCountText}>{item.wordCount} 个单词</Text>
        </View>
        {item.lastWatched && (
          <Text style={styles.lastWatchedText}>最后观看: {item.lastWatched}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType: Show['status'] | 'all', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => null; // 不需要分页

  // 搜索结果渲染
  const renderSearchResultItem = ({ item }: { item: TMDBShow }) => {
    const alreadyAdded = shows.some(s => s.id === item.id);
    return (
      <View style={styles.showItem}>
        <Image
          source={{
            uri: item.poster_path
              ? TMDBService.getImageUrl(item.poster_path, 'w185')
              : 'https://via.placeholder.com/150x225/CCCCCC/FFFFFF?text=No+Image'
          }}
          style={styles.poster}
        />
        <View style={styles.showInfo}>
          <View style={styles.showHeader}>
            <Text style={styles.showTitle}>{item.name}</Text>
            {alreadyAdded ? (
              <View style={[styles.statusBadge, { backgroundColor: colors.accent[500] }]}> 
                <Text style={styles.statusText}>已添加</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.statusBadge, { backgroundColor: colors.primary[500] }]}
                onPress={() => addShowToWatching(item)}
              >
                <Text style={styles.statusText}>添加</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.originalTitle}>{item.original_name}</Text>
          <Text style={styles.genreText}>
            {item.genres?.map(genre => genre.name).join(', ') || 
             (item.genre_ids ? TMDBService.getGenreNames(item.genre_ids).join(', ') : '未知类型')}
          </Text>
          <View style={styles.showMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={colors.accent[500]} />
              <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.neutral[600]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索剧集..."
            value={searchText}
            onChangeText={text => {
              setSearchText(text);
              if (!text) setSearchResults([]);
            }}
            onSubmitEditing={() => searchShows(searchText)}
            returnKeyType="search"
          />
          {searchLoading && (
            <ActivityIndicator size="small" color={colors.primary[500]} style={styles.searchLoading} />
          )}
        </View>
      </View>

      {/* 筛选按钮 */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', '全部')}
        {renderFilterButton('plan_to_watch', '想看')}
        {renderFilterButton('watching', '观看中')}
        {renderFilterButton('completed', '已完成')}
      </View>

      {/* 搜索结果列表 */}
      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResultItem}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !searchLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="tv-outline" size={64} color={colors.neutral[300]} />
                <Text style={styles.emptyText}>没有找到相关剧集</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* 用户剧单列表 */}
      {searchResults.length === 0 && (
        <FlatList
          data={filteredShows}
          renderItem={renderShowItem}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="tv-outline" size={64} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>暂无剧集数据，请搜索添加</Text>
            </View>
          }
        />
      )}

      {/* 剧集详情模态框 */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedShow && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>剧集详情</Text>
            </View>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* 海报和基本信息左右分布 */}
              <View style={styles.modalHeaderSection}>
                                  <Image
                    source={{
                      uri: selectedShow.poster_path
                        ? TMDBService.getImageUrl(selectedShow.poster_path, 'w185')
                        : 'https://via.placeholder.com/200x300/CCCCCC/FFFFFF?text=No+Image'
                    }}
                    style={styles.modalPoster}
                  />
                <View style={styles.modalBasicInfo}>
                  <Text style={styles.modalShowTitle}>{selectedShow.name}</Text>
                  <Text style={styles.modalOriginalTitle}>{selectedShow.original_name}</Text>
                  <View style={styles.modalMeta}>
                    <View style={styles.modalRating}>
                      <Ionicons name="star" size={18} color={colors.accent[500]} />
                      <Text style={styles.modalRatingText}>{selectedShow.vote_average.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.modalYear}>
                      {new Date(selectedShow.first_air_date).getFullYear()}
                    </Text>
                    <Text style={styles.modalSeasons}>
                      {selectedShow.number_of_seasons} 季
                    </Text>
                  </View>
                  <View style={styles.modalGenres}>
                    {selectedShow.genres?.slice(0, 3).map(genre => (
                      <View key={genre.id} style={styles.genreTag}>
                        <Text style={styles.genreTagText}>{genre.name}</Text>
                      </View>
                    )) || 
                    (selectedShow.genre_ids ? 
                      selectedShow.genre_ids.slice(0, 3).map(id => (
                        <View key={id} style={styles.genreTag}>
                          <Text style={styles.genreTagText}>{TMDBService.getGenreNames([id])[0] || '未知类型'}</Text>
                        </View>
                      )) : 
                      <Text style={styles.genreTagText}>未知类型</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* 剧情介绍 */}
              <View style={styles.modalOverviewSection}>
                <Text style={styles.modalOverviewTitle}>剧情简介</Text>
                <Text 
                  style={styles.modalOverview}
                  numberOfLines={isOverviewExpanded ? undefined : 3}
                >
                  {selectedShow.overview || '暂无剧情简介'}
                </Text>
                {selectedShow.overview && selectedShow.overview.length > 100 && (
                  <TouchableOpacity 
                    style={styles.expandButton}
                    onPress={() => setIsOverviewExpanded(!isOverviewExpanded)}
                  >
                    <Text style={styles.expandButtonText}>
                      {isOverviewExpanded ? '收起' : '展开查看更多'}
                    </Text>
                    <Ionicons 
                      name={isOverviewExpanded ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={colors.primary[500]} 
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* 操作按钮 */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    selectedShow.status === 'watching' && styles.actionButtonActive
                  ]}
                  onPress={() => {
                    changeShowStatus(selectedShow.id, 'watching');
                    setShowDetailModal(false);
                  }}
                >
                  <Text style={[
                    styles.actionButtonText,
                    selectedShow.status === 'watching' && styles.actionButtonTextActive
                  ]}>观看中</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    selectedShow.status === 'completed' && styles.actionButtonActive
                  ]}
                  onPress={() => {
                    changeShowStatus(selectedShow.id, 'completed');
                    setShowDetailModal(false);
                  }}
                >
                  <Text style={[
                    styles.actionButtonText,
                    selectedShow.status === 'completed' && styles.actionButtonTextActive
                  ]}>已完成</Text>
                </TouchableOpacity>
              </View>

              {/* 调试信息 */}
              <View style={styles.modalWordsSection}>
                <Text style={styles.modalWordsTitle}>调试信息</Text>
                <Text style={styles.debugText}>剧集ID: {selectedShow.id}</Text>
                <Text style={styles.debugText}>总词汇数: {vocabulary.length}</Text>
                <Text style={styles.debugText}>匹配词汇数: {getShowWords(selectedShow.id).length}</Text>
              </View>

              {/* 该剧集收藏的单词 */}
              {(() => {
                const showWords = getShowWords(selectedShow.id);
                if (showWords.length > 0) {
                  return (
                    <View style={styles.modalWordsSection}>
                      <Text style={styles.modalWordsTitle}>收藏的单词 ({showWords.length})</Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.modalWordsContainer}
                      >
                        {showWords.map((word, index) => (
                          <TouchableOpacity
                            key={`${word.word}-${index}`}
                            style={styles.modalWordTag}
                            onPress={() => openWordCard(word)}
                          >
                            <Text style={styles.modalWordText}>{word.word}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  );
                }
                return (
                  <View style={styles.modalWordsSection}>
                    <Text style={styles.modalWordsTitle}>收藏的单词 (0)</Text>
                    <Text style={styles.debugText}>暂无该剧集的收藏单词</Text>
                  </View>
                );
              })()}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* 单词卡片模态框 */}
      <Modal
        visible={showWordCardModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedWord && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowWordCardModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>单词详情</Text>
            </View>
            <View style={styles.wordCardContainer}>
              <WordCard
                wordData={selectedWord}
                showActions={false}
                style={styles.wordCard}
              />
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
    backgroundColor: colors.background.primary,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: colors.text.primary,
  },
  searchLoading: {
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
  },
  filterButtonActive: {
    backgroundColor: colors.primary[500],
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  filterButtonTextActive: {
    color: colors.text.inverse,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  showItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  showInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  showHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  showTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.text.inverse,
    fontWeight: '500',
  },
  originalTitle: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: 4,
  },
  genreText: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 8,
  },
  showMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingText: {
    fontSize: 14,
    color: colors.neutral[600],
    marginLeft: 4,
  },
  wordCountText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  lastWatchedText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.neutral[500],
    marginTop: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.neutral[500],
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 16,
  },
  modalContent: {
    padding: 16,
  },
  modalHeaderSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalPoster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    marginRight: 16,
  },
  modalBasicInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  modalInfo: {
    flex: 1,
  },
  modalShowTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  modalOriginalTitle: {
    fontSize: 16,
    color: colors.neutral[600],
    marginBottom: 12,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  modalRatingText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 4,
  },
  modalYear: {
    fontSize: 14,
    color: colors.neutral[600],
    marginRight: 16,
  },
  modalSeasons: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  modalOverviewSection: {
    marginBottom: 20,
  },
  modalOverviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  modalOverview: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: 12,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    fontSize: 14,
    color: colors.primary[500],
    marginRight: 4,
    fontWeight: '500',
  },
  modalGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  genreTag: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  genreTagText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonActive: {
    backgroundColor: colors.primary[500],
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  actionButtonTextActive: {
    color: colors.text.inverse,
  },
  modalWordsSection: {
    marginBottom: 20,
  },
  modalWordsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  modalWordsContainer: {
    paddingRight: 16,
  },
  modalWordTag: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  modalWordText: {
    fontSize: 14,
    color: colors.text.inverse,
    fontWeight: '500',
  },
  wordCardContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordCard: {
    width: '100%',
    maxWidth: 400,
  },
  debugText: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 4,
  },
});

export default ShowsScreen; 