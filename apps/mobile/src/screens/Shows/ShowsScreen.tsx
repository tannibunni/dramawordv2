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
  Animated,
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
import { LinearGradient } from 'expo-linear-gradient';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';

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
  const { appLanguage } = useAppLanguage();
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
    // 测试单词匹配逻辑
    testWordMatching();
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
        const response = await TMDBService.searchShows(query, 1, appLanguage === 'en-US' ? 'en-US' : 'zh-CN');
        setSearchResults(response.results);
    } catch (error) {
        console.error('Failed to search shows:', error);
        Alert.alert(t('error', appLanguage), t('search_shows_failed', appLanguage));
    } finally {
        setSearchLoading(false);
    }
    }, 300); // 300ms 防抖延迟
  }, [appLanguage]);

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
      const response = await TMDBService.searchShows(query, 1, appLanguage === 'en-US' ? 'en-US' : 'zh-CN');
      setSearchResults(response.results);
    } catch (error) {
      console.error('Failed to search shows:', error);
      Alert.alert(t('error', appLanguage), t('search_shows_failed', appLanguage));
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
    console.log('🔍 显示全部剧集，数量:', shows.length);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watching': return colors.primary[500];
      case 'completed': return colors.success[500];
      case 'plan_to_watch': return colors.accent[500];
      default: return colors.neutral[500];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'watching': return t('watching', appLanguage);
      case 'completed': return t('completed', appLanguage);
      case 'plan_to_watch': return t('plan_to_watch', appLanguage);
      default: return status;
    }
  };

  const toggleShowStatus = (showId: number) => {
    const show = shows.find(s => s.id === showId);
    if (!show) return;

    // 循环切换状态：想看 -> 观看中 -> 已完成 -> 想看
    let newStatus: Show['status'];
    switch (show.status) {
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

  const getShowWords = (showId: number): WordWithSource[] => {
    return vocabulary.filter(word => 
      word.sourceShow && word.sourceShow.id === showId
    );
  };

  const testWordMatching = () => {
    // 测试单词匹配逻辑
    shows.forEach(show => {
      const showWords = getShowWords(show.id);
      console.log(`剧集 ${show.name} 的单词数量:`, showWords.length);
    });
  };

  const openWordCard = (word: WordWithSource) => {
    setSelectedWord(word);
    setShowWordCardModal(true);
  };

  const renderRightActions = (item: Show) => {
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.editAction]}
          onPress={() => openWordbookEdit(item)}
        >
          <Ionicons name="pencil" size={20} color={colors.background.secondary} />
          <Text style={styles.swipeActionText}>{t('edit', appLanguage)}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => {
            Alert.alert(
              t('confirm', appLanguage),
              t('confirm_delete_show', appLanguage),
              [
                { text: t('cancel', appLanguage), style: 'cancel' },
                {
                  text: t('delete', appLanguage),
                  style: 'destructive',
                  onPress: () => removeShow(item.id),
                },
              ]
            );
          }}
        >
          <Ionicons name="trash" size={20} color={colors.background.secondary} />
          <Text style={styles.swipeActionText}>{t('delete', appLanguage)}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderShowItem = ({ item }: { item: Show }) => {
    const showWords = getShowWords(item.id);
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        rightThreshold={40}
      >
        <TouchableOpacity
          style={styles.showItem}
          onPress={() => openShowDetail(item)}
          activeOpacity={0.7}
        >
          <View style={styles.showItemContent}>
            <Image
              source={{
                uri: item.poster_path
                  ? TMDBService.getImageUrl(item.poster_path, 'w185')
                  : 'https://via.placeholder.com/120x120/CCCCCC/FFFFFF?text=No+Image',
              }}
              style={styles.showPoster}
              resizeMode="cover"
            />
            
            <View style={styles.showInfo}>
              <Text style={styles.showName} numberOfLines={2}>
                {item.name}
              </Text>
              
              <View style={styles.showMeta}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>{statusText}</Text>
                </View>
                
                <Text style={styles.wordCount}>
                  {showWords.length} {t('words_count', appLanguage, { count: showWords.length })}
                </Text>
              </View>
              
              {item.overview && (
                <Text style={styles.showOverview} numberOfLines={2}>
                  {item.overview}
                </Text>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.statusToggle}
              onPress={() => toggleShowStatus(item.id)}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderFilterButton = (filterType: Show['status'] | 'all', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterType && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => null; // 不需要分页

  const renderSearchResultItem = ({ item }: { item: TMDBShow }) => {
    return (
      <TouchableOpacity
        style={styles.searchResultItem}
        onPress={() => selectSearchResult(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: item.poster_path
              ? TMDBService.getImageUrl(item.poster_path, 'w92')
              : 'https://via.placeholder.com/92x138/CCCCCC/FFFFFF?text=No+Image',
          }}
          style={styles.searchResultPoster}
          resizeMode="cover"
        />
        <View style={styles.searchResultInfo}>
          <Text style={styles.searchResultName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.first_air_date && (
            <Text style={styles.searchResultDate}>
              {new Date(item.first_air_date).getFullYear()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={t('search_shows', appLanguage)}
            placeholderTextColor={colors.text.tertiary}
            value={searchText}
            onChangeText={handleSearchTextChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
          {searchLoading && (
            <ActivityIndicator size="small" color={colors.primary[500]} style={styles.loadingIndicator} />
          )}
        </View>
      </View>

      {/* 筛选标签 */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', t('all', appLanguage))}
        {renderFilterButton('plan_to_watch', t('plan_to_watch', appLanguage))}
        {renderFilterButton('watching', t('watching', appLanguage))}
        {renderFilterButton('completed', t('completed', appLanguage))}
      </View>

      {/* 当前筛选状态 */}
      {filter !== 'all' && (
        <View style={styles.filterStatus}>
          <Text style={styles.filterStatusText}>
            {t('current_filter', appLanguage)}: {getStatusText(filter)}
          </Text>
        </View>
      )}

      {/* 搜索结果 */}
      {isSearchFocused && searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResultItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.searchResultsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* 剧集列表 */}
      {!isSearchFocused && (
        <FlatList
          data={filteredShows}
          renderItem={renderShowItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.showList}
          contentContainerStyle={styles.showListContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="tv-outline" size={64} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>{t('no_shows_data', appLanguage)}</Text>
            </View>
          }
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 剧集详情模态框 */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeShowDetailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedShow && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={closeShowDetailModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.showDetailHeader}>
                    <Image
                      source={{
                        uri: selectedShow.poster_path
                          ? TMDBService.getImageUrl(selectedShow.poster_path, 'w500')
                          : 'https://via.placeholder.com/300x450/CCCCCC/FFFFFF?text=No+Image',
                      }}
                      style={styles.showDetailPoster}
                      resizeMode="cover"
                    />
                    
                    <View style={styles.showDetailInfo}>
                      <Text style={styles.showDetailName}>{selectedShow.name}</Text>
                      
                      <View style={styles.statusButtons}>
                        <TouchableOpacity
                                                     style={[
                             styles.statusButton,
                             selectedShow.status === 'plan_to_watch' && styles.statusButtonActive,
                             { backgroundColor: selectedShow.status === 'plan_to_watch' ? colors.accent[500] : colors.neutral[200] }
                           ]}
                          onPress={() => changeShowStatus(selectedShow.id, 'plan_to_watch')}
                        >
                          <Text style={{ color: selectedShow.status === 'plan_to_watch' ? '#fff' : '#666', fontWeight: 'bold', fontSize: 16 }}>
                            {t('plan_to_watch', appLanguage)}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.statusButton,
                            selectedShow.status === 'watching' && styles.statusButtonActive,
                            { backgroundColor: selectedShow.status === 'watching' ? colors.primary[500] : colors.neutral[200] }
                          ]}
                          onPress={() => changeShowStatus(selectedShow.id, 'watching')}
                        >
                          <Text style={{ color: selectedShow.status === 'watching' ? '#fff' : '#666', fontWeight: 'bold', fontSize: 16 }}>
                            {t('watching', appLanguage)}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.statusButton,
                            selectedShow.status === 'completed' && styles.statusButtonActive,
                            { backgroundColor: selectedShow.status === 'completed' ? colors.success[500] : colors.neutral[200] }
                          ]}
                          onPress={() => changeShowStatus(selectedShow.id, 'completed')}
                        >
                          <Text style={{ color: selectedShow.status === 'completed' ? '#fff' : '#666', fontWeight: 'bold', fontSize: 16 }}>
                            {t('completed', appLanguage)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  
                  {selectedShow.overview && (
                    <View style={styles.overviewSection}>
                      <Text style={styles.overviewTitle}>{t('overview', appLanguage)}</Text>
                      <Text style={styles.overviewText} numberOfLines={isOverviewExpanded ? undefined : 3}>
                        {selectedShow.overview}
                      </Text>
                      {selectedShow.overview.length > 100 && (
                        <TouchableOpacity onPress={() => setIsOverviewExpanded(!isOverviewExpanded)}>
                          <Text style={styles.expandText}>
                            {isOverviewExpanded ? t('collapse', appLanguage) : t('expand', appLanguage)}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  
                                     <WordList
                     words={getShowWords(selectedShow.id)}
                     onWordPress={openWordCard}
                   />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 单词卡片模态框 */}
      {selectedWord && (
        <Modal
          visible={showWordCardModal}
          animationType="slide"
          transparent={true}
          onRequestClose={closeWordCardModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeWordCardModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
                              <WordCard
                  wordData={selectedWord as WordData}
                  showActions={false}
                />
            </View>
          </View>
        </Modal>
      )}

      {/* 单词本编辑模态框 */}
      {editingWordbook && (
        <WordbookEditModal
          visible={showWordbookEditModal}
          wordbook={editingWordbook}
          onClose={closeWordbookEdit}
          onSave={handleWordbookSave}
        />
      )}
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
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
  clearButton: {
    padding: 8,
  },
  loadingIndicator: {
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
  filterStatus: {
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
  searchResultsContainer: {
    flex: 1,
    padding: 16,
  },
  searchResultsList: {
    // No specific styles needed, FlatList handles its own
  },
  searchResultItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    ...generateShadow(3),
  },
  searchResultPoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  searchResultDate: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  showList: {
    flex: 1,
  },
  showListContent: {
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
  showItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  showPoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  showInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  showName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  showMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  wordCount: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  showOverview: {
    fontSize: 14,
    color: colors.neutral[600],
    marginTop: 4,
  },
  statusToggle: {
    padding: 8,
  },
  swipeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120, // Adjust as needed for swipeable width
  },
  swipeAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60, // Half of swipeActions width
    height: '100%',
  },
  editAction: {
    backgroundColor: colors.primary[500],
  },
  deleteAction: {
    backgroundColor: colors.error[500],
  },
  swipeActionText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    ...generateShadow(8),
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
  modalBody: {
    padding: 16,
  },
  showDetailHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  showDetailPoster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    marginRight: 16,
  },
  showDetailInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  showDetailName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statusButtonActive: {
    backgroundColor: colors.primary[500],
  },
  overviewSection: {
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  overviewText: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: 12,
  },
  expandText: {
    fontSize: 14,
    color: colors.primary[500],
    textDecorationLine: 'underline',
  },
});

export default ShowsScreen; 