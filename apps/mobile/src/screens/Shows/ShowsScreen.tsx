import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TMDBService, TMDBShow } from '../../services/tmdbService';
import { colors } from '../../constants/colors';
import { useShowList, Show } from '../../context/ShowListContext';
import { useVocabulary, WordWithSource } from '../../context/VocabularyContext';
import WordCard, { WordData } from '../../components/cards/WordCard';
import WordList from '../../components/vocabulary/WordList';
import WordbookEditModal from '../../components/wordbook/WordbookEditModal';
import { Swipeable } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

// 生成阴影的工具函数
const generateShadow = (elevation: number) => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: elevation / 2 },
  shadowOpacity: 0.1 + (elevation * 0.02),
  shadowRadius: elevation,
  elevation,
});

const ShowsScreen: React.FC = () => {
  const { shows, addShow, changeShowStatus, removeShow, updateShow } = useShowList();
  const { vocabulary, removeWord } = useVocabulary();
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBShow[]>([]);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'plan_to_watch' | 'watching' | 'completed'>('all');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordWithSource | null>(null);
  const [showWordCardModal, setShowWordCardModal] = useState(false);
  
  // 新增：编辑单词本相关状态
  const [showWordbookEditModal, setShowWordbookEditModal] = useState(false);
  const [editingWordbook, setEditingWordbook] = useState<Show | null>(null);
  
  // 新增搜索相关状态
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Robust modal close handlers
  const closeShowDetailModal = () => {
    setShowDetailModal(false);
    setSelectedShow(null);
    setSelectedWord(null);
    setShowWordCardModal(false);
  };
  const closeWordCardModal = () => {
    setShowWordCardModal(false);
    setSelectedWord(null);
  };

  // 编辑单词本
  const openWordbookEdit = (wordbook: Show) => {
    setEditingWordbook(wordbook);
    setShowWordbookEditModal(true);
  };

  const closeWordbookEdit = () => {
    setShowWordbookEditModal(false);
    setEditingWordbook(null);
  };

  const handleWordbookSave = (updatedWordbook: Show) => {
    // 更新单词本信息
    const { id, ...updates } = updatedWordbook;
    updateShow(id, updates);
    closeWordbookEdit();
  };

  useEffect(() => {
    filterShows();
  }, [shows, filter]);

  // 防抖搜索函数
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim() || query.length < 1) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
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
    }, 300); // 300ms 防抖延迟
  }, []);

  // 处理搜索文本变化
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    debouncedSearch(text);
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    searchInputRef.current?.blur();
  };

  // 处理搜索框焦点
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  // 处理搜索框失焦
  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  // 选择搜索结果
  const selectSearchResult = (show: TMDBShow) => {
    addShowToWatching(show);
    searchInputRef.current?.blur();
  };

  // 打开搜索结果详情
  const openSearchResultDetail = (show: TMDBShow) => {
    // 将 TMDBShow 转换为 Show 格式
    const showDetail: Show = {
      ...show,
      status: shows.find(s => s.id === show.id)?.status || 'plan_to_watch',
      wordCount: getShowWords(show.id).length,
    };
    setSelectedShow(showDetail);
    setShowDetailModal(true);
  };

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
      // 根据筛选条件过滤剧集
      if (filter === 'plan_to_watch') {
        filtered = shows.filter(show => show.status === 'plan_to_watch');
      } else if (filter === 'watching') {
        filtered = shows.filter(show => show.status === 'watching');
      } else if (filter === 'completed') {
        filtered = shows.filter(show => show.status === 'completed');
      }
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
    setSelectedShow(show);
    setShowDetailModal(true);
  };

  // 获取该剧集相关的单词
  const getShowWords = (showId: number): WordWithSource[] => {
    const showWords = vocabulary.filter(word => {
      // 确保类型匹配：将两个ID都转换为数字进行比较
      const sourceShowId = word.sourceShow?.id;
      const isMatch = word.sourceShow && Number(sourceShowId) === Number(showId);
      return isMatch;
    });
    return showWords;
  };



  // 打开单词卡片
  const openWordCard = (word: WordWithSource) => {
    setSelectedWord(word);
    setShowWordCardModal(true);
  };

  const renderRightActions = (item: Show) => {
    const isWordbook = item.type === 'wordbook';
    return (
      <View style={{ flexDirection: 'row', height: '100%' }}>
        {isWordbook && (
          <TouchableOpacity
            style={{
              backgroundColor: 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              width: 80,
              height: '100%',
            }}
            onPress={() => openWordbookEdit(item)}
          >
            <Ionicons name="create" size={28} color={colors.primary[500]} />
            <Text style={{ color: colors.primary[500], fontWeight: 'bold', marginTop: 4 }}>编辑</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={{
            backgroundColor: 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            height: '100%',
          }}
          onPress={() => changeShowStatus(item.id, 'completed')}
        >
          <Ionicons name="checkmark-done" size={28} color={colors.success[500]} />
          <Text style={{ color: colors.success[500], fontWeight: 'bold', marginTop: 4 }}>已看完</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            height: '100%',
          }}
          onPress={() => {
            Alert.alert('删除剧集', `确定要删除“${item.name}”吗？`, [
              { text: '取消', style: 'cancel' },
              { text: '删除', style: 'destructive', onPress: () => removeShow(item.id) },
            ]);
          }}
        >
          <Ionicons name="trash" size={28} color={colors.error[500]} />
          <Text style={{ color: colors.error[500], fontWeight: 'bold', marginTop: 4 }}>删除</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 替换 renderShowItem
  const renderShowItem = ({ item }: { item: Show }) => {
    const wordCount = getShowWords(item.id).length;
    const isWordbook = item.type === 'wordbook';
    
    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
      >
        <TouchableOpacity
          style={styles.showItem}
          onPress={() => openShowDetail(item)}
          activeOpacity={0.8}
        >
          {/* 海报或ICON */}
          {isWordbook ? (
            <View style={styles.wordbookIconContainer}>
              <Ionicons 
                name={(item.icon || 'book') as any} 
                size={48} 
                color={colors.primary[500]} 
              />
            </View>
          ) : (
            <Image
              source={{
                uri: item.poster_path
                  ? TMDBService.getImageUrl(item.poster_path, 'w185')
                  : 'https://via.placeholder.com/150x225/CCCCCC/FFFFFF?text=No+Image',
              }}
              style={styles.poster}
            />
          )}
          <View style={styles.showInfo}>
            <View style={styles.showHeader}>
              <Text style={styles.showTitle}>{item.name}</Text>
              <View style={styles.showHeaderButtons}>
                {/* 删除单词本卡片右上角的小编辑ICON入口，只保留右划编辑 */}
                {/* {isWordbook && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      openWordbookEdit(item);
                    }}
                  >
                    <Ionicons name="create" size={16} color={colors.primary[500]} />
                  </TouchableOpacity>
                )} */}
                <TouchableOpacity
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleShowStatus(item.id);
                  }}
                >
                  <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.originalTitle}>{item.original_name}</Text>
            <Text style={styles.genreText}>
              {isWordbook ? '单词本' : (
                item.genres?.map(genre => genre.name).join(', ') ||
                (item.genre_ids ? TMDBService.getGenreNames(item.genre_ids).join(', ') : '未知类型')
              )}
            </Text>
            <View style={styles.showMeta}>
              {!isWordbook && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color={colors.accent[500]} />
                  <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
                </View>
              )}
              <Text style={styles.wordCountText}>{wordCount} 个单词</Text>
            </View>
            {item.lastWatched && (
              <Text style={styles.lastWatchedText}>最后观看: {item.lastWatched}</Text>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

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
    // 实时计算该剧集的单词数量
    const wordCount = getShowWords(item.id).length;
    
      return (
      <TouchableOpacity
        style={styles.showItem}
        onPress={() => openSearchResultDetail(item)}
        activeOpacity={0.7}
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
            {alreadyAdded ? (
              <View style={[styles.statusBadge, { backgroundColor: colors.accent[500] }]}> 
                <Text style={styles.statusText}>已添加</Text>
        </View>
            ) : (
              <TouchableOpacity
                style={[styles.statusBadge, { backgroundColor: colors.primary[500] }]}
                onPress={(e) => {
                  e.stopPropagation(); // 阻止触发父级的 onPress
                  addShowToWatching(item);
                }}
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
            <Text style={styles.wordCountText}>{wordCount} 个单词</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchInputContainer,
          isSearchFocused && styles.searchInputContainerFocused
        ]}>
          <Ionicons 
            name="search" 
            size={20} 
            color={isSearchFocused ? colors.text.primary : colors.neutral[600]} 
            style={styles.searchIcon} 
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="搜索剧集..."
            placeholderTextColor={colors.neutral[500]}
            value={searchText}
            onChangeText={handleSearchTextChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onSubmitEditing={() => searchShows(searchText)}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSearch}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={colors.neutral[500]} />
            </TouchableOpacity>
          )}
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

      {/* 筛选状态显示 */}
      {filter !== 'all' && (
        <View style={styles.filterStatusContainer}>
          <Text style={styles.filterStatusText}>
            当前筛选: {filter === 'plan_to_watch' ? '想看' : filter === 'watching' ? '观看中' : '已完成'} 
            ({filteredShows.length} 个剧集)
          </Text>
        </View>
      )}

      {/* 搜索加载状态 */}
      {searchLoading && searchText.length >= 1 && (
        <View style={styles.searchLoadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.searchLoadingText}>搜索中...</Text>
        </View>
      )}

      {/* 搜索空状态 */}
      {!searchLoading && searchText.length >= 1 && searchResults.length === 0 && (
        <View style={styles.searchEmptyContainer}>
          <Ionicons name="search-outline" size={64} color={colors.neutral[300]} />
          <Text style={styles.searchEmptyText}>没有找到相关剧集</Text>
          <TouchableOpacity style={styles.searchEmptyButton}>
            <Text style={styles.searchEmptyButtonText}>尝试其他关键词</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 搜索结果列表 */}
      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResultItem}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* 用户剧单列表 */}
      {searchResults.length === 0 && searchText.length === 0 && (
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
        onRequestClose={closeShowDetailModal}
      >
        {selectedShow && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={closeShowDetailModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>剧集详情</Text>
            </View>
            <View style={styles.modalHeaderSection}>
              {/* 剧集封面和基础信息 */}
              <Image
                source={{ uri: selectedShow.poster_path ? TMDBService.getImageUrl(selectedShow.poster_path, 'w342') : 'https://via.placeholder.com/150x225/CCCCCC/FFFFFF?text=No+Image' }}
                style={styles.modalPoster}
              />
              <View style={styles.modalBasicInfo}>
                <Text style={styles.modalShowTitle}>{selectedShow.name}</Text>
                <Text style={styles.modalOriginalTitle}>{selectedShow.original_name}</Text>
                <View style={styles.modalMeta}>
                  <View style={styles.modalRating}>
                    <Ionicons name="star" size={16} color={colors.accent[500]} />
                    <Text style={styles.modalRatingText}>{selectedShow.vote_average?.toFixed(1) ?? '--'}</Text>
                  </View>
                  <Text style={styles.modalYear}>{selectedShow.first_air_date?.slice(0, 4) ?? ''}</Text>
                  <Text style={styles.modalSeasons}>{selectedShow.status === 'completed' ? '已完结' : '连载中'}</Text>
                </View>
                <View style={styles.modalGenres}>
                  {selectedShow.genres?.map(genre => (
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

            {/* 剧情简介 */}
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
              {/* 如果是搜索结果（不在用户剧单中），显示添加按钮 */}
              {!shows.some(s => s.id === selectedShow.id) ? (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary[500] }]}
                  onPress={() => {
                    addShowToWatching(selectedShow);
                    setShowDetailModal(false);
                  }}
                >
                  <Text style={[styles.actionButtonText, { color: colors.text.inverse }]}>添加到剧单</Text>
                </TouchableOpacity>
              ) : (
                <>
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
                </>
              )}
            </View>

            {/* 调试信息 */}
            <View style={styles.modalWordsSection}>
              <Text style={styles.modalWordsTitle}>调试信息</Text>
              <Text style={styles.debugText}>剧集ID: {selectedShow.id}</Text>
              <Text style={styles.debugText}>总词汇数: {vocabulary.length}</Text>
              <Text style={styles.debugText}>匹配词汇数: {getShowWords(selectedShow.id).length}</Text>
            </View>

            {/* 该剧集收藏的单词 - 让这个区域 flex: 1 可滚动 */}
            <View style={{ flex: 1, minHeight: 200 }}>
              <Text style={styles.modalWordsTitle}>收藏的单词 ({getShowWords(selectedShow.id).length})</Text>
              <WordList
                words={getShowWords(selectedShow.id)}
                onWordPress={openWordCard}
                onDeleteWord={(word) => {
                  removeWord(word.word);
                }}
                showDeleteButton={true}
              />
            </View>
          </SafeAreaView>
        )}
      </Modal>

      {/* 单词卡片模态框 */}
      <Modal
        visible={showWordCardModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeWordCardModal}
      >
        {selectedWord && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={closeWordCardModal}
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

      {/* 单词本编辑模态框 */}
      <WordbookEditModal
        visible={showWordbookEditModal}
        wordbook={editingWordbook}
        onClose={closeWordbookEdit}
        onSave={handleWordbookSave}
      />
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchInputContainerFocused: {
    borderColor: colors.primary[500],
    borderWidth: 1,
    backgroundColor: colors.background.primary,
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
  clearButton: {
    padding: 8,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  searchLoadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  searchEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    flex: 1,
  },
  searchEmptyText: {
    fontSize: 18,
    color: colors.neutral[500],
    marginTop: 20,
    textAlign: 'center',
  },
  searchEmptyButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    ...generateShadow(2),
  },
  searchEmptyButtonText: {
    fontSize: 16,
    color: colors.text.inverse,
    fontWeight: '500',
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
  filterStatusContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  filterStatusText: {
    fontSize: 14,
    color: colors.neutral[600],
    textAlign: 'center',
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
    ...generateShadow(3),
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
  showHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 4,
    marginRight: 8,
  },
  wordbookIconContainer: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
  },
});

export default ShowsScreen; 