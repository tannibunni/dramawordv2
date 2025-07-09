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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TMDBService, TMDBShow } from '../../services/tmdbService';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface Show extends TMDBShow {
  status: 'watching' | 'completed' | 'plan_to_watch';
  wordCount: number;
  lastWatched?: string;
}

const ShowsScreen: React.FC = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'watching' | 'completed' | 'plan_to_watch'>('all');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);

  useEffect(() => {
    loadPopularShows();
  }, []);

  useEffect(() => {
    filterShows();
  }, [shows, searchText, filter]);

  const loadPopularShows = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await TMDBService.getPopularShows(page);
      
      const showsWithStatus: Show[] = response.results.map(show => ({
        ...show,
        status: 'plan_to_watch' as const,
        wordCount: 0,
      }));

      if (page === 1) {
        setShows(showsWithStatus);
      } else {
        setShows(prev => [...prev, ...showsWithStatus]);
      }
      
      setCurrentPage(page);
      setHasMoreData(page < response.total_pages);
    } catch (error) {
      console.error('Failed to load popular shows:', error);
      Alert.alert('错误', '加载热门剧集失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const searchShows = async (query: string) => {
    if (!query.trim()) {
      loadPopularShows();
      return;
    }

    try {
      setSearchLoading(true);
      const response = await TMDBService.searchShows(query);
      
      const showsWithStatus: Show[] = response.results.map(show => ({
        ...show,
        status: 'plan_to_watch' as const,
        wordCount: 0,
      }));

      setShows(showsWithStatus);
      setCurrentPage(1);
      setHasMoreData(response.page < response.total_pages);
    } catch (error) {
      console.error('Failed to search shows:', error);
      Alert.alert('错误', '搜索剧集失败，请稍后重试');
    } finally {
      setSearchLoading(false);
    }
  };

  const loadMoreShows = () => {
    if (!hasMoreData || loading) return;
    
    if (searchText) {
      // 搜索模式下加载更多搜索结果
      searchShows(searchText);
    } else {
      // 热门剧集模式下加载更多
      loadPopularShows(currentPage + 1);
    }
  };

  const filterShows = () => {
    let filtered = shows;

    // 按状态过滤
    if (filter !== 'all') {
      filtered = filtered.filter(show => show.status === filter);
    }

    // 按搜索文本过滤（本地过滤，用于状态筛选）
    if (searchText) {
      filtered = filtered.filter(show => {
        const genreNames = show.genres?.map(genre => genre.name) || 
                          (show.genre_ids ? TMDBService.getGenreNames(show.genre_ids) : []);
        
        return show.name.toLowerCase().includes(searchText.toLowerCase()) ||
               show.original_name.toLowerCase().includes(searchText.toLowerCase()) ||
               genreNames.some(name => name.toLowerCase().includes(searchText.toLowerCase()));
      });
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
      case 'plan_to_watch': return '计划观看';
      default: return '未知';
    }
  };

  const changeShowStatus = (showId: number, newStatus: Show['status']) => {
    setShows(prevShows =>
      prevShows.map(show =>
        show.id === showId ? { ...show, status: newStatus } : show
      )
    );
  };

  const openShowDetail = (show: Show) => {
    setSelectedShow(show);
    setShowDetailModal(true);
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
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
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

  const renderFooter = () => {
    if (!hasMoreData) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>没有更多数据了</Text>
        </View>
      );
    }
    
    if (loading) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <Text style={styles.footerText}>加载中...</Text>
        </View>
      );
    }
    
    return null;
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
            onChangeText={setSearchText}
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
        {renderFilterButton('watching', '观看中')}
        {renderFilterButton('completed', '已完成')}
        {renderFilterButton('plan_to_watch', '计划观看')}
      </View>

      {/* 剧集列表 */}
      <FlatList
        data={filteredShows}
        renderItem={renderShowItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMoreShows}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="tv-outline" size={64} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>
                {searchText ? '没有找到相关剧集' : '暂无剧集数据'}
              </Text>
            </View>
          ) : null
        }
      />

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

            <View style={styles.modalContent}>
              <Image
                source={{
                  uri: selectedShow.poster_path
                    ? TMDBService.getImageUrl(selectedShow.poster_path, 'w500')
                    : 'https://via.placeholder.com/300x450/CCCCCC/FFFFFF?text=No+Image'
                }}
                style={styles.modalPoster}
              />

              <View style={styles.modalInfo}>
                <Text style={styles.modalShowTitle}>{selectedShow.name}</Text>
                <Text style={styles.modalOriginalTitle}>{selectedShow.original_name}</Text>
                
                <View style={styles.modalMeta}>
                  <View style={styles.modalRating}>
                    <Ionicons name="star" size={20} color={colors.accent[500]} />
                    <Text style={styles.modalRatingText}>{selectedShow.vote_average.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.modalYear}>
                    {new Date(selectedShow.first_air_date).getFullYear()}
                  </Text>
                  <Text style={styles.modalSeasons}>
                    {selectedShow.number_of_seasons} 季
                  </Text>
                </View>

                <Text style={styles.modalOverview}>{selectedShow.overview}</Text>

                <View style={styles.modalGenres}>
                  {selectedShow.genres?.map(genre => (
                    <View key={genre.id} style={styles.genreTag}>
                      <Text style={styles.genreTagText}>{genre.name}</Text>
                    </View>
                  )) || 
                  (selectedShow.genre_ids ? 
                    selectedShow.genre_ids.map(id => (
                      <View key={id} style={styles.genreTag}>
                        <Text style={styles.genreTagText}>{TMDBService.genreMap[id] || '未知类型'}</Text>
                      </View>
                    )) : 
                    <Text style={styles.genreTagText}>未知类型</Text>
                  )}
                </View>

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
                    <Text style={styles.actionButtonText}>开始观看</Text>
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
                    <Text style={styles.actionButtonText}>标记完成</Text>
                  </TouchableOpacity>
                </View>
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
    flex: 1,
    padding: 16,
  },
  modalPoster: {
    width: width - 32,
    height: (width - 32) * 1.5,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
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
  modalOverview: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: 16,
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
});

export default ShowsScreen; 