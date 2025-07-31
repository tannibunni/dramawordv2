import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
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

// 推荐内容类型定义
interface RecommendationCard {
  id: string;
  tmdbShowId: number;
  title: string;
  originalTitle: string;
  backdropUrl: string;
  posterUrl: string;
  recommendation: {
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
  };
}

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
  const { appLanguage } = useAppLanguage();
  
  // 翻译函数
  const t = (key: string, params?: Record<string, string | number>): string => {
    const isChinese = appLanguage === 'zh-CN';
    const translations = {
      'search_shows': isChinese ? '搜索剧集...' : 'Search shows...',
      'search_wordbooks': isChinese ? '搜索单词本...' : 'Search wordbooks...',
      'search_recommendations': isChinese ? '搜索推荐...' : 'Search recommendations...',
      'all': isChinese ? '全部' : 'All',
      'plan_to_watch': isChinese ? '想看' : 'Plan to Watch',
      'watching': isChinese ? '观看中' : 'Watching',
      'completed': isChinese ? '已完成' : 'Completed',
      'searching': isChinese ? '搜索中...' : 'Searching...',
      'no_results': isChinese ? '没有找到相关剧集' : 'No shows found',
      'try_other_keywords': isChinese ? '尝试其他关键词' : 'Try other keywords',
      'no_shows': isChinese ? '暂无剧集数据，请搜索添加' : 'No shows yet, search to add',
      'no_recommendations': isChinese ? '暂无推荐内容' : 'No recommendations yet',
      'current_filter': isChinese ? '当前筛选' : 'Current filter',
      'shows_count': isChinese ? '{count} 个剧集' : '{count} shows',
      'watching_status': isChinese ? '观看中' : 'Watching',
      'completed_status': isChinese ? '已完成' : 'Completed',
      'plan_to_watch_status': isChinese ? '想看' : 'Plan to Watch',
      'unknown_status': isChinese ? '未知' : 'Unknown',
      'wordbook': isChinese ? '单词本' : 'Wordbook',
      'unknown_genre': isChinese ? '未知类型' : 'Unknown Genre',
      'words_count': isChinese ? '{count} 个单词' : '{count} words',
      'last_watched': isChinese ? '最后观看' : 'Last watched',
      'edit': isChinese ? '编辑' : 'Edit',
      'mark_completed': isChinese ? '已看完' : 'Mark Completed',
      'delete': isChinese ? '删除' : 'Delete',
      'delete_show': isChinese ? '删除剧集' : 'Delete Show',
      'delete_confirm': isChinese ? '确定要删除"{name}"吗？' : 'Are you sure you want to delete "{name}"?',
      'cancel': isChinese ? '取消' : 'Cancel',
      'search_failed': isChinese ? '搜索剧集失败，请稍后重试' : 'Search failed, please try again later',
      'error': isChinese ? '错误' : 'Error',
      'add': isChinese ? '添加' : 'Add',
      'add_to_showlist': isChinese ? '加入剧单' : 'Add to Showlist',
      'already_added': isChinese ? '已添加' : 'Already Added',
      'ongoing': isChinese ? '连载中' : 'Ongoing',
      'finished': isChinese ? '已完结' : 'Finished',
      'no_overview': isChinese ? '暂无剧情简介' : 'No overview available',
      'collected_words': isChinese ? '收藏的单词' : 'Collected Words',
      'no_collected_words': isChinese ? '暂无收藏单词' : 'No collected words',
      'word_details': isChinese ? '单词详情' : 'Word Details',
      'no_wordbooks': isChinese ? '暂无单词本，请创建' : 'No wordbooks yet, create one',
      'create_wordbook': isChinese ? '创建单词本' : 'Create Wordbook',
      'no_wordbook_results': isChinese ? '没有找到相关单词本' : 'No wordbooks found',
      'try_other_wordbook_keywords': isChinese ? '尝试其他关键词' : 'Try other keywords',
      'recommendations_tab': isChinese ? '推荐' : 'Recommendations',
      'shows_tab': isChinese ? '剧单' : 'Shows',
      'wordbooks_tab': isChinese ? '单词本' : 'Wordbooks',
      'not_completed': isChinese ? '未看' : 'Not Watched',
      'add_to_list': isChinese ? '添加到列表' : 'Add to List',
    };
    
    let text = translations[key as keyof typeof translations] || key;
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }
    return text;
  };
  const { vocabulary, removeWord } = useVocabulary();
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBShow[]>([]);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<'recommendations' | 'shows' | 'wordbooks'>('recommendations');
  const [showStatusFilter, setShowStatusFilter] = useState<'all' | 'not_completed' | 'completed'>('all');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordWithSource | null>(null);
  const [showWordCardModal, setShowWordCardModal] = useState(false);
  
  // 新增：编辑单词本相关状态
  const [showWordbookEditModal, setShowWordbookEditModal] = useState(false);
  const [editingWordbook, setEditingWordbook] = useState<Show | null>(null);
  const [isCreatingWordbook, setIsCreatingWordbook] = useState(false);
  
  // 新增搜索相关状态
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  const [showCheckmark, setShowCheckmark] = useState(false);
  
  // 推荐相关状态
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<RecommendationCard[]>([]);
  
  // 瀑布流相关状态
  const [leftColumn, setLeftColumn] = useState<RecommendationCard[]>([]);
  const [rightColumn, setRightColumn] = useState<RecommendationCard[]>([]);

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

  const openCreateWordbook = () => {
    setIsCreatingWordbook(true);
    setEditingWordbook(null);
    setShowWordbookEditModal(true);
  };

  const closeWordbookEdit = () => {
    setShowWordbookEditModal(false);
    setEditingWordbook(null);
    setIsCreatingWordbook(false);
  };

  const handleWordbookSave = (updatedWordbook: Show) => {
    if (isCreatingWordbook) {
      // 创建新单词本
      const newWordbook: Show = {
        ...updatedWordbook,
        id: Date.now(), // 使用时间戳作为临时ID
        type: 'wordbook',
        status: 'completed',
        wordCount: 0,
        name: updatedWordbook.name,
        original_name: updatedWordbook.name,
        overview: updatedWordbook.description || '',
        poster_path: '',
        backdrop_path: '',
        vote_average: 0,
        vote_count: 0,
        first_air_date: new Date().toISOString().split('T')[0],
        last_air_date: new Date().toISOString().split('T')[0],
        genre_ids: [],
        popularity: 0,
        original_language: 'zh',
        origin_country: ['CN'],
        icon: updatedWordbook.icon || 'book',
        description: updatedWordbook.description || '',
      };
      addShow(newWordbook);
      console.log('📚 创建新单词本:', newWordbook.name);
    } else {
      // 更新现有单词本
      updateShow(updatedWordbook.id, {
        name: updatedWordbook.name,
        original_name: updatedWordbook.name,
        overview: updatedWordbook.description || '',
        icon: updatedWordbook.icon,
        description: updatedWordbook.description,
      });
      console.log('📚 更新单词本:', updatedWordbook.name);
    }
    closeWordbookEdit();
  };

  // 初始化推荐数据
  const initializeRecommendations = () => {
    const mockRecommendations: RecommendationCard[] = [
      {
        id: '1',
        tmdbShowId: 1396,
        title: 'Breaking Bad',
        originalTitle: '绝命毒师',
        backdropUrl: 'https://image.tmdb.org/t/p/w780/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
        posterUrl: 'https://image.tmdb.org/t/p/w92/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
        recommendation: {
          text: '这部剧真的绝了！学英语必备，强烈安利！2024年必看犯罪剧巅峰之作！',
          difficulty: 'hard'
        }
      },
      {
        id: '2',
        tmdbShowId: 1399,
        title: 'Game of Thrones',
        originalTitle: '权力的游戏',
        backdropUrl: 'https://image.tmdb.org/t/p/w780/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
        posterUrl: 'https://image.tmdb.org/t/p/w92/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
        recommendation: {
          text: '看完后我的英语口语突飞猛进，姐妹们冲！史诗级奇幻巨作，每一集都让人欲罢不能！',
          difficulty: 'hard'
        }
      },
      {
        id: '3',
        tmdbShowId: 1668,
        title: 'Friends',
        originalTitle: '老友记',
        backdropUrl: 'https://image.tmdb.org/t/p/w780/f496cm9enuEsZkSPzCwnTESEK5s.jpg',
        posterUrl: 'https://image.tmdb.org/t/p/w92/f496cm9enuEsZkSPzCwnTESEK5s.jpg',
        recommendation: {
          text: '学英语必看！对话简单清晰，新手友好，治愈系经典神剧！',
          difficulty: 'medium'
        }
      },
      {
        id: '4',
        tmdbShowId: 1398,
        title: 'The Office',
        originalTitle: '办公室',
        backdropUrl: 'https://via.placeholder.com/780x439/4A5568/FFFFFF?text=The+Office',
        posterUrl: 'https://via.placeholder.com/92x138/4A5568/FFFFFF?text=Office',
        recommendation: {
          text: '这部剧拯救了我的英语听力，强烈推荐，轻松愉快的下饭剧！',
          difficulty: 'easy'
        }
      },
      {
        id: '5',
        tmdbShowId: 1397,
        title: 'Modern Family',
        originalTitle: '摩登家庭',
        backdropUrl: 'https://via.placeholder.com/780x439/805AD5/FFFFFF?text=Modern+Family',
        posterUrl: 'https://via.placeholder.com/92x138/805AD5/FFFFFF?text=Modern',
        recommendation: {
          text: '被这部剧治愈了，顺便还学了超多实用词汇，家庭喜剧神作！',
          difficulty: 'medium'
        }
      },
      {
        id: '6',
        tmdbShowId: 1395,
        title: 'Suits',
        originalTitle: '金装律师',
        backdropUrl: 'https://via.placeholder.com/780x439/38A169/FFFFFF?text=Suits',
        posterUrl: 'https://via.placeholder.com/92x138/38A169/FFFFFF?text=Suits',
        recommendation: {
          text: '商务英语必备，职场对话太实用了，律政剧经典之作！',
          difficulty: 'hard'
        }
      }
    ];
    
    setRecommendations(mockRecommendations);
    setFilteredRecommendations(mockRecommendations);
    
    // 初始化瀑布流布局
    arrangeWaterfallLayout(mockRecommendations);
  };
  
  // 瀑布流布局函数
  const arrangeWaterfallLayout = (items: RecommendationCard[]) => {
    const left: RecommendationCard[] = [];
    const right: RecommendationCard[] = [];
    
    items.forEach((item, index) => {
      // 交替分配到左右列，创造瀑布流效果
      if (index % 2 === 0) {
        left.push(item);
      } else {
        right.push(item);
      }
    });
    
    setLeftColumn(left);
    setRightColumn(right);
  };

  useEffect(() => {
    initializeRecommendations();
    filterShows();
    // 测试单词匹配逻辑
    testWordMatching();
  }, [shows, filter, showStatusFilter]);

  // 防抖搜索函数
  const debouncedSearch = (query: string) => {
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
        
        if (filter === 'recommendations') {
          // 推荐模式：搜索推荐内容
          const filteredRecommendations = recommendations.filter(rec => 
            rec.title.toLowerCase().includes(query.toLowerCase()) ||
            rec.originalTitle.toLowerCase().includes(query.toLowerCase()) ||
            rec.recommendation.text.toLowerCase().includes(query.toLowerCase())
          );
          
          setFilteredRecommendations(filteredRecommendations);
          // 更新瀑布流布局
          arrangeWaterfallLayout(filteredRecommendations);
          
          // 将推荐转换为TMDBShow格式以保持兼容性
          const searchResults = filteredRecommendations.map(rec => ({
            id: rec.tmdbShowId,
            name: rec.title,
            original_name: rec.originalTitle,
            overview: rec.recommendation.text,
            poster_path: rec.posterUrl.split('/').pop() || '',
            backdrop_path: rec.backdropUrl.split('/').pop() || '',
            vote_average: 0,
            vote_count: 0,
            first_air_date: '',
            last_air_date: '',
            status: 'Returning Series',
            type: 'show',
            genre_ids: [],
            popularity: 0,
            original_language: 'en',
            origin_country: ['US'],
          } as TMDBShow));
          
          setSearchResults(searchResults);
        } else if (filter === 'wordbooks') {
          // 单词本模式：搜索现有的单词本
          const wordbooks = shows.filter(show => show.type === 'wordbook');
          const filteredWordbooks = wordbooks.filter(wordbook => 
            wordbook.name.toLowerCase().includes(query.toLowerCase()) ||
            wordbook.overview?.toLowerCase().includes(query.toLowerCase()) ||
            wordbook.description?.toLowerCase().includes(query.toLowerCase())
          );
          
          // 将单词本转换为TMDBShow格式以保持兼容性
          const searchResults = filteredWordbooks.map(wordbook => ({
            id: wordbook.id,
            name: wordbook.name,
            original_name: wordbook.original_name,
            overview: wordbook.overview,
            poster_path: wordbook.poster_path,
            backdrop_path: wordbook.backdrop_path,
            vote_average: wordbook.vote_average,
            vote_count: wordbook.vote_count,
            first_air_date: wordbook.first_air_date,
            last_air_date: wordbook.last_air_date,
            status: wordbook.status,
            type: wordbook.type,
            genre_ids: wordbook.genre_ids,
            popularity: wordbook.popularity,
            original_language: wordbook.original_language,
            origin_country: wordbook.origin_country,
          } as TMDBShow));
          
          setSearchResults(searchResults);
        } else {
          // 剧单模式：搜索TMDB剧集
          const response = await TMDBService.searchShows(query, 1, appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US');
          setSearchResults(response.results);
        }
      } catch (error) {
        console.error('Failed to search:', error);
        Alert.alert(t('error'), t('search_failed'));
      } finally {
        setSearchLoading(false);
      }
    }, 300); // 300ms 防抖延迟
  };

  // 处理搜索文本变化
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    debouncedSearch(text);
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    if (filter === 'recommendations') {
      setFilteredRecommendations(recommendations);
      arrangeWaterfallLayout(recommendations);
    }
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
    if (filter === 'wordbooks') {
      // 单词本模式：直接打开单词本详情
      const wordbook = shows.find(s => s.id === show.id);
      if (wordbook) {
        openShowDetail(wordbook);
      }
    } else {
      // 剧单模式：添加到观看列表
      addShowToWatching(show);
    }
    searchInputRef.current?.blur();
  };

  // 打开搜索结果详情
  const openSearchResultDetail = (show: TMDBShow) => {
    if (filter === 'wordbooks') {
      // 单词本模式：直接打开单词本详情
      const wordbook = shows.find(s => s.id === show.id);
      if (wordbook) {
        openShowDetail(wordbook);
      }
    } else {
      // 剧单模式：将 TMDBShow 转换为 Show 格式
      const showDetail: Show = {
        ...show,
        status: shows.find(s => s.id === show.id)?.status || 'plan_to_watch',
        wordCount: getShowWords(show.id).length,
      };
      setSelectedShow(showDetail);
      setShowDetailModal(true);
    }
  };

  const searchShows = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      
      if (filter === 'wordbooks') {
        // 单词本模式：搜索现有的单词本
        const wordbooks = shows.filter(show => show.type === 'wordbook');
        const filteredWordbooks = wordbooks.filter(wordbook => 
          wordbook.name.toLowerCase().includes(query.toLowerCase()) ||
          wordbook.overview?.toLowerCase().includes(query.toLowerCase()) ||
          wordbook.description?.toLowerCase().includes(query.toLowerCase())
        );
        
        // 将单词本转换为TMDBShow格式以保持兼容性
        const searchResults = filteredWordbooks.map(wordbook => ({
          id: wordbook.id,
          name: wordbook.name,
          original_name: wordbook.original_name,
          overview: wordbook.overview,
          poster_path: wordbook.poster_path,
          backdrop_path: wordbook.backdrop_path,
          vote_average: wordbook.vote_average,
          vote_count: wordbook.vote_count,
          first_air_date: wordbook.first_air_date,
          last_air_date: wordbook.last_air_date,
          status: wordbook.status,
          type: wordbook.type,
          genre_ids: wordbook.genre_ids,
          popularity: wordbook.popularity,
          original_language: wordbook.original_language,
          origin_country: wordbook.origin_country,
        } as TMDBShow));
        
        setSearchResults(searchResults);
      } else {
        // 剧单模式：搜索TMDB剧集
        const response = await TMDBService.searchShows(query, 1, appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US');
        setSearchResults(response.results);
      }
    } catch (error) {
      console.error('Failed to search:', error);
      Alert.alert(t('error'), t('search_failed'));
    } finally {
      setSearchLoading(false);
    }
  };

  const addShowToWatching = (show: TMDBShow, onAdded?: () => void) => {
    console.log('addShowToWatching 被调用，参数 show:', show);
    if (shows.some(s => Number(s.id) === Number(show.id))) {
      console.log('addShowToWatching: 剧集已存在，id:', show.id);
      return;
    }
    const newShow: Show = {
      ...show,
      id: Number(show.id),
      status: 'plan_to_watch',
      wordCount: 0,
    };
    console.log('addShowToWatching: 调用 addShow, newShow:', newShow);
    addShow(newShow);
    setSearchText('');
    setSearchResults([]);
    setFilter('shows');
    setTimeout(() => {
      console.log('addShowToWatching: 当前 shows:', shows);
    }, 500);
    if (onAdded) onAdded();
  };

  const filterShows = () => {
    let filtered = shows;
    if (filter === 'recommendations') {
      // 推荐模式：不需要筛选剧集，推荐内容由单独的state管理
      console.log('🔍 筛选条件: 推荐模式');
      return;
    } else if (filter === 'shows') {
      // 先筛选出剧集，排除单词本
      filtered = shows.filter(show => show.type !== 'wordbook');
      
      // 再根据状态筛选
      if (showStatusFilter === 'not_completed') {
        filtered = filtered.filter(show => show.status === 'plan_to_watch');
        console.log('🔍 筛选条件: 剧集 - 未看');
      } else if (showStatusFilter === 'completed') {
        filtered = filtered.filter(show => show.status === 'completed');
        console.log('🔍 筛选条件: 剧集 - 已看完');
      } else {
        console.log('🔍 筛选条件: 剧集 - 全部');
      }
      
      console.log('🔍 筛选前剧集数量:', shows.length);
      console.log('🔍 筛选后剧集数量:', filtered.length);
      console.log('🔍 筛选结果:', filtered.map(s => `${s.name}(${s.status})`));
    } else if (filter === 'wordbooks') {
      // 只显示单词本
      filtered = shows.filter(show => show.type === 'wordbook');
      
      console.log('🔍 筛选条件: 单词本');
      console.log('🔍 筛选前剧集数量:', shows.length);
      console.log('🔍 筛选后剧集数量:', filtered.length);
      console.log('🔍 筛选结果:', filtered.map(s => `${s.name}(${s.type})`));
      console.log('🔍 当前筛选模式:', filter);
      console.log('🔍 是否有单词本数据:', filtered.length > 0);
    } else {
      console.log('🔍 显示全部内容，数量:', shows.length);
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
      case 'watching': return t('watching_status');
      case 'completed': return t('completed_status');
      case 'plan_to_watch': return t('plan_to_watch_status');
      default: return t('unknown_status');
    }
  };

  const toggleShowStatus = (showId: number) => {
    // 使用 ShowListContext 的 changeShowStatus
    const currentShow = shows.find(s => s.id === showId);
    if (!currentShow) return;
    
    // 单词本不参与状态切换
    if (currentShow.type === 'wordbook') {
      console.log('📚 单词本不支持状态切换:', currentShow.name);
      return;
    }
    
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
      // 确保类型匹配：将两个ID都转换为数字进行比较
      const sourceShowId = word.sourceShow?.id;
      const isMatch = word.sourceShow && Number(sourceShowId) === Number(showId);
      console.log(`单词 ${word.word} 匹配结果:`, isMatch, 'sourceShow.id:', sourceShowId, 'showId:', showId);
      if (isMatch) {
        console.log(`✅ 单词 ${word.word} 匹配成功，添加到剧集 ${showId}`);
      }
      return isMatch;
    });
    console.log(`剧集 ${showId} 的单词:`, showWords);
    return showWords;
  };

  // 测试函数：验证单词匹配逻辑
  const testWordMatching = () => {
    console.log('🧪 开始测试单词匹配逻辑...');
    
    // 测试当前存在的剧集
    shows.forEach(show => {
      const showWords = getShowWords(show.id);
      console.log(`🧪 剧集 ${show.name}(${show.id}) 的单词数量:`, showWords.length);
    });
    
    console.log('🧪 单词匹配测试完成');
  };

  // 打开单词卡片
  const openWordCard = (word: WordWithSource) => {
    console.log('点击单词:', word);
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
            <Text style={{ color: colors.primary[500], fontWeight: 'bold', marginTop: 4 }}>{t('edit')}</Text>
          </TouchableOpacity>
        )}
        {!isWordbook && (
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
            <Text style={{ color: colors.success[500], fontWeight: 'bold', marginTop: 4 }}>{t('mark_completed')}</Text>
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
          onPress={() => {
            Alert.alert(t('delete_show'), `确定要删除"${item.name}"吗？`, [
              { text: t('cancel'), style: 'cancel' },
              { text: t('delete'), style: 'destructive', onPress: () => removeShow(item.id) },
            ]);
          }}
        >
          <Ionicons name="trash" size={28} color={colors.error[500]} />
          <Text style={{ color: colors.error[500], fontWeight: 'bold', marginTop: 4 }}>{t('delete')}</Text>
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
                {/* 只对已完成的剧集显示"已看完"标签，单词本不显示任何标签 */}
                {!isWordbook && item.status === 'completed' && (
                  <View style={[styles.statusBadge, { backgroundColor: colors.success[500] }]}>
                    <Text style={styles.statusText}>已看完</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.originalTitle}>{item.original_name}</Text>
            <Text style={styles.genreText}>
              {isWordbook ? t('wordbook') : (
                item.genres?.map(genre => genre.name).join(', ') ||
                (item.genre_ids ? TMDBService.getGenreNames(item.genre_ids, appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US').join(', ') : t('unknown_genre'))
              )}
            </Text>
            <View style={styles.showMeta}>
              {!isWordbook && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color={colors.accent[500]} />
                  <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
                </View>
              )}
              <Text style={styles.wordCountText}>{t('words_count', { count: wordCount })}</Text>
            </View>
            {item.lastWatched && (
              <Text style={styles.lastWatchedText}>{t('last_watched')}: {item.lastWatched}</Text>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderFilterButton = (filterType: 'shows' | 'wordbooks', label: string) => {
    const isActive = filter === filterType;

    return (
      <TouchableOpacity
        style={[
          styles.segmentedButton,
          isActive && styles.segmentedButtonActive
        ]}
        onPress={() => {
          setFilter(filterType);
          // 切换到单词本时重置二级筛选
          if (filterType === 'wordbooks') {
            setShowStatusFilter('all');
          }
        }}
        activeOpacity={0.85}
      >
        <Text style={[
          styles.segmentedButtonText,
          isActive && styles.segmentedButtonTextActive
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // 新的iOS风格分段控制器
  const renderSegmentedControl = () => {
    const isRecommendationsActive = filter === 'recommendations';
    const isShowsActive = filter === 'shows';
    const isWordbooksActive = filter === 'wordbooks';

    return (
      <View style={styles.segmentedControlContainer}>
        <View style={styles.segmentedControlBackground}>
          <TouchableOpacity
            style={[
              styles.segmentedControlButton,
              isRecommendationsActive && styles.segmentedControlButtonActive
            ]}
            onPress={() => {
              setFilter('recommendations');
            }}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.segmentedControlText,
              isRecommendationsActive && styles.segmentedControlTextActive
            ]}>
              {t('recommendations_tab')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.segmentedControlButton,
              isShowsActive && styles.segmentedControlButtonActive
            ]}
            onPress={() => {
              setFilter('shows');
            }}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.segmentedControlText,
              isShowsActive && styles.segmentedControlTextActive
            ]}>
              {t('shows_tab')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.segmentedControlButton,
              isWordbooksActive && styles.segmentedControlButtonActive
            ]}
            onPress={() => {
              setFilter('wordbooks');
              setShowStatusFilter('all');
            }}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.segmentedControlText,
              isWordbooksActive && styles.segmentedControlTextActive
            ]}>
              {t('wordbooks_tab')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSecondaryFilterButton = (filterType: 'all' | 'not_completed' | 'completed', label: string) => (
    <TouchableOpacity
      style={[
        styles.secondaryFilterButton,
        showStatusFilter === filterType && styles.secondaryFilterButtonActive
      ]}
      onPress={() => setShowStatusFilter(filterType)}
    >
      {showStatusFilter === filterType && (
        <View style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.primary[500],
          marginRight: 6,
        }} />
      )}
      <Text style={[
        styles.secondaryFilterButtonText,
        showStatusFilter === filterType && styles.secondaryFilterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // 新的iOS风格二级分段控制器
  const renderSecondarySegmentedControl = () => {
    const isAllActive = showStatusFilter === 'all';
    const isNotCompletedActive = showStatusFilter === 'not_completed';
    const isCompletedActive = showStatusFilter === 'completed';

    return (
      <View style={styles.secondarySegmentedControlContainer}>
        <View style={styles.secondarySegmentedControlBackground}>
          <TouchableOpacity
            style={[
              styles.secondarySegmentedControlButton,
              isAllActive && styles.secondarySegmentedControlButtonActive
            ]}
            onPress={() => setShowStatusFilter('all')}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.secondarySegmentedControlText,
              isAllActive && styles.secondarySegmentedControlTextActive
            ]}>
              {t('all')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.secondarySegmentedControlButton,
              isNotCompletedActive && styles.secondarySegmentedControlButtonActive
            ]}
            onPress={() => setShowStatusFilter('not_completed')}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.secondarySegmentedControlText,
              isNotCompletedActive && styles.secondarySegmentedControlTextActive
            ]}>
              {t('not_completed')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondarySegmentedControlButton,
              isCompletedActive && styles.secondarySegmentedControlButtonActive
            ]}
            onPress={() => setShowStatusFilter('completed')}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.secondarySegmentedControlText,
              isCompletedActive && styles.secondarySegmentedControlTextActive
            ]}>
              {t('completed')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFooter = () => null; // 不需要分页

  // 瀑布流布局组件
  const renderWaterfallLayout = () => {
    return (
      <View style={styles.waterfallContainer}>
        {/* 左列 */}
        <View style={styles.waterfallColumn}>
          {leftColumn.map((item, index) => (
            <View key={`left-${item.id}`} style={styles.waterfallItem}>
              {renderRecommendationCard({ item })}
            </View>
          ))}
        </View>
        
        {/* 右列 */}
        <View style={styles.waterfallColumn}>
          {rightColumn.map((item, index) => (
            <View key={`right-${item.id}`} style={styles.waterfallItem}>
              {renderRecommendationCard({ item })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // 渲染推荐卡片
  const renderRecommendationCard = ({ item }: { item: RecommendationCard }) => {
    const isAlreadyAdded = shows.some(s => s.id === item.tmdbShowId);
    
    // 根据难度生成类型标签
    const getTags = (difficulty: string) => {
      const baseTags = ['剧情'];
      switch (difficulty) {
        case 'easy':
          return [...baseTags, '轻松', '入门'];
        case 'medium':
          return [...baseTags, '悬疑', '推理'];
        case 'hard':
          return [...baseTags, '复杂', '烧脑'];
        default:
          return baseTags;
      }
    };
    
    return (
      <View style={styles.recommendationCard}>
        {/* 图片区域 - 3:4 纵向比例 */}
        <View style={styles.recommendationImageContainer}>
          <Image
            source={{ uri: item.backdropUrl }}
            style={styles.recommendationImage}
            resizeMode="cover"
          />
        </View>
        
        {/* 内容区域 */}
        <View style={styles.recommendationContent}>
          {/* 剧集名 */}
          <Text style={styles.recommendationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          
          {/* 简要介绍 */}
          <Text style={styles.recommendationDescription} numberOfLines={2}>
            {item.recommendation.text}
          </Text>
          
          {/* 类型标签 */}
          <View style={styles.recommendationTags}>
            {getTags(item.recommendation.difficulty).map((tag, index) => (
              <View key={index} style={styles.recommendationTag}>
                <Text style={styles.recommendationTagText}>#{tag}</Text>
              </View>
            ))}
          </View>
          
          {/* 添加到剧单按钮 */}
          <TouchableOpacity
            style={[
              styles.addToShowlistButton,
              isAlreadyAdded && styles.addToShowlistButtonAdded
            ]}
            onPress={() => {
              if (!isAlreadyAdded) {
                // 创建TMDBShow对象并添加到剧单
                const tmdbShow: TMDBShow = {
                  id: item.tmdbShowId,
                  name: item.title,
                  original_name: item.originalTitle,
                  overview: '',
                  poster_path: item.posterUrl.split('/').pop() || '',
                  backdrop_path: item.backdropUrl.split('/').pop() || '',
                  vote_average: 0,
                  vote_count: 0,
                  first_air_date: '',
                  last_air_date: '',
                  status: 'Returning Series',
                  type: 'show',
                  genre_ids: [],
                  popularity: 0,
                  original_language: 'en',
                  origin_country: ['US'],
                };
                addShowToWatching(tmdbShow);
                Alert.alert('成功', '已添加到剧单！');
              } else {
                Alert.alert('提示', '该剧集已在剧单中');
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.addToShowlistButtonText,
              isAlreadyAdded && styles.addToShowlistButtonTextAdded
            ]}>
              {isAlreadyAdded ? t('already_added') : t('add_to_showlist')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };



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
                <Text style={styles.statusText}>{t('already_added')}</Text>
        </View>
            ) : (
              <TouchableOpacity
                style={[styles.statusBadge, { backgroundColor: colors.primary[500] }]}
                onPress={(e) => {
                  e.stopPropagation(); // 阻止触发父级的 onPress
                  console.log('点击 Add to List，item:', item);
                  addShowToWatching(item);
                }}
              >
                <Text style={styles.statusText}>{t('add')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.originalTitle}>{item.original_name}</Text>
          <Text style={styles.genreText}>
            {item.genres?.map(genre => genre.name).join(', ') || 
             (item.genre_ids ? TMDBService.getGenreNames(item.genre_ids, appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US').join(', ') : t('unknown_genre'))}
          </Text>
          <View style={styles.showMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={colors.accent[500]} />
              <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
            </View>
            <Text style={styles.wordCountText}>{t('words_count', { count: wordCount })}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* iOS风格分段控制器 */}
      {renderSegmentedControl()}

      {/* 搜索框 */}
      <View style={[
        styles.searchContainer,
        { marginTop: 12 } // 调整顶部边距
      ]}>
        <View style={[
          styles.searchRow,
          isSearchFocused && styles.searchRowFocused
        ]}>
          <View style={styles.searchInputContainer}>
            <Ionicons 
              name="search" 
              size={20} 
              color={isSearchFocused ? colors.text.primary : colors.neutral[600]} 
              style={styles.searchIcon} 
            />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder={
                filter === 'recommendations' ? t('search_recommendations') :
                filter === 'wordbooks' ? t('search_wordbooks') : 
                t('search_shows')
              }
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
      </View>

      {/* 二级筛选按钮 - 只在剧单选中时显示 */}
      {filter === 'shows' && renderSecondarySegmentedControl()}

      {/* 搜索加载状态 */}
      {searchLoading && searchText.length >= 1 && (
        <View style={styles.searchLoadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.searchLoadingText}>{t('searching')}</Text>
        </View>
      )}

      {/* 搜索空状态 */}
      {!searchLoading && searchText.length >= 1 && searchResults.length === 0 && (
        <View style={styles.searchEmptyContainer}>
          <Ionicons name="search-outline" size={64} color={colors.neutral[300]} />
          <Text style={styles.searchEmptyText}>
            {filter === 'recommendations' ? t('no_recommendations') :
             filter === 'wordbooks' ? t('no_wordbook_results') : 
             t('no_results')}
          </Text>
          <TouchableOpacity style={styles.searchEmptyButton}>
            <Text style={styles.searchEmptyButtonText}>
              {filter === 'recommendations' ? t('try_other_keywords') :
               filter === 'wordbooks' ? t('try_other_wordbook_keywords') : 
               t('try_other_keywords')}
            </Text>
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

      {/* 推荐内容瀑布流 */}
      {filter === 'recommendations' && searchResults.length === 0 && searchText.length === 0 && (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredRecommendations.length > 0 ? (
            renderWaterfallLayout()
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={64} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>{t('no_recommendations')}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* 用户剧单列表 */}
      {filter !== 'recommendations' && searchResults.length === 0 && searchText.length === 0 && (
      <FlatList
        data={filteredShows}
        renderItem={renderShowItem}
          keyExtractor={item => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          filter === 'wordbooks' ? (
            <TouchableOpacity
              style={styles.flatAddWordbookButton}
              onPress={openCreateWordbook}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={colors.primary[500]} />
              <Text style={styles.flatAddWordbookButtonText}>{t('create_wordbook')}</Text>
            </TouchableOpacity>
          ) : null
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {filter === 'wordbooks' ? (
                // 单词本空状态
                <>
                  <Ionicons name="book-outline" size={64} color={colors.neutral[300]} />
                  <Text style={styles.emptyText}>{t('no_wordbooks')}</Text>
                </>
              ) : (
                // 剧单空状态
                <>
                  <Ionicons name="tv-outline" size={64} color={colors.neutral[300]} />
                  <Text style={styles.emptyText}>{t('no_shows')}</Text>
                </>
              )}
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
          <SafeAreaView style={[
            styles.modalContainer, 
            { 
              flex: 1, 
              backgroundColor: selectedShow.type === 'wordbook' ? colors.background.primary : '#111' 
            }
          ]}> 
            {/* 右上角关闭按钮 */}
            <TouchableOpacity
              style={{ 
                position: 'absolute', 
                top: 18, 
                right: 18, 
                zIndex: 10, 
                backgroundColor: selectedShow.type === 'wordbook' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.32)', 
                borderRadius: 18, 
                padding: 6 
              }}
              onPress={closeShowDetailModal}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={28} color={selectedShow.type === 'wordbook' ? colors.text.primary : "#fff"} />
            </TouchableOpacity>
            <FlatList
              data={getShowWords(selectedShow.id)}
              keyExtractor={(item, index) => `${item.word}-${item.sourceShow?.id || 'default'}-${item.collectedAt}-${index}`}
              renderItem={({ item }) => (
                <WordList
                  words={[item]}
                  onWordPress={openWordCard}
                  onDeleteWord={(word) => { removeWord(word.word, word.sourceShow?.id); }}
                />
              )}
              ListHeaderComponent={
                <>
                  {selectedShow.type === 'wordbook' ? (
                    // 单词本详情头部
                    <>
                      {/* 单词本图标和标题 */}
                      <View style={{ 
                        backgroundColor: '#fff', 
                        borderRadius: 20, 
                        marginHorizontal: 24, 
                        marginTop: 16, 
                        padding: 24,
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                        elevation: 3,
                        position: 'relative'
                      }}>
                        
                        <View style={{
                          width: 80,
                          height: 80,
                          borderRadius: 16,
                          backgroundColor: colors.primary[100],
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginBottom: 20
                        }}>
                          <Ionicons 
                            name={(selectedShow.icon || 'book') as any} 
                            size={40} 
                            color={colors.primary[500]} 
                          />
                        </View>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 12
                        }}>
                          <Text style={{ 
                            color: colors.text.primary, 
                            fontSize: 26, 
                            fontWeight: 'bold',
                            textAlign: 'center'
                          }}>
                            {selectedShow.name}
                          </Text>
                          {/* 编辑按钮 - 标题后面 */}
                          <TouchableOpacity
                            style={{
                              marginLeft: 12,
                              padding: 8,
                              borderRadius: 20,
                              backgroundColor: 'rgba(0,0,0,0.05)'
                            }}
                            onPress={() => {
                              setShowDetailModal(false);
                              openWordbookEdit(selectedShow);
                            }}
                          >
                            <Ionicons name="create" size={20} color={colors.text.secondary} />
                          </TouchableOpacity>
                        </View>
                        <Text style={{ 
                          color: colors.text.secondary, 
                          fontSize: 16, 
                          lineHeight: 22,
                          textAlign: 'center'
                        }}>
                          {selectedShow.overview || '这是你创造的单词本'}
                        </Text>
                      </View>
                    </>
                  ) : (
                    // 剧集详情头部
                    <>
                      {/* 顶部横向大图（landscape） */}
                      <View style={{ width: '100%', aspectRatio: 16/9, position: 'relative', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' }}>
                        <Image
                          source={{ uri: selectedShow.backdrop_path ? TMDBService.getImageUrl(selectedShow.backdrop_path, 'w780') : (selectedShow.poster_path ? TMDBService.getImageUrl(selectedShow.poster_path, 'w342') : 'https://via.placeholder.com/320x180/CCCCCC/FFFFFF?text=No+Image') }}
                          style={{ width: '100%', height: '100%', position: 'absolute' }}
                          resizeMode="cover"
                        />
                        <LinearGradient
                          colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)']}
                          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }}
                        />
                        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20 }}>
                          <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 }}>{selectedShow.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ color: '#7fffa7', fontWeight: 'bold', marginRight: 12 }}>{selectedShow.status === 'completed' ? t('finished') : t('ongoing')}</Text>
                            <Text style={{ color: '#fff', opacity: 0.8, marginRight: 12 }}>{selectedShow.first_air_date?.slice(0, 4) ?? ''}</Text>
                            {selectedShow.genres?.map(genre => (
                              <View key={genre.id} style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2, marginRight: 8 }}>
                                <Text style={{ color: '#fff', fontSize: 13 }}>{genre.name}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                      {/* 简介 */}
                      <View style={{ backgroundColor: '#181818', borderRadius: 18, marginHorizontal: 16, marginTop: -24, padding: 18, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
                        <Text style={{ color: '#fff', fontSize: 16, lineHeight: 24 }}>{selectedShow.overview || t('no_overview')}</Text>
                      </View>
                      {/* 操作按钮 - 只对剧集显示，单词本不显示 */}
                      {selectedShow.type !== 'wordbook' && (
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, marginBottom: 8 }}>
                          {shows.some(s => Number(s.id) === Number(selectedShow.id)) ? (
                            <TouchableOpacity
                              style={{ flex: 1, marginHorizontal: 16, backgroundColor: colors.success[100], borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: colors.success[500] }}
                              onPress={() => {
                                removeShow(selectedShow.id);
                                setSelectedShow({ ...selectedShow, status: 'plan_to_watch' });
                              }}
                            >
                              <Text style={{ color: colors.success[700], fontWeight: 'bold', fontSize: 16, flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="checkmark" size={18} color={colors.success[700]} style={{marginRight: 6}} />
                                {appLanguage === 'zh-CN' ? '已添加' : 'Added'}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={{ flex: 1, marginHorizontal: 16, backgroundColor: colors.primary[500], borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: colors.primary[700] }}
                              onPress={() => {
                                addShowToWatching(selectedShow, () => setShowDetailModal(false));
                              }}
                            >
                              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, flexDirection: 'row', alignItems: 'center' }}>
                                {t('add_to_list')}
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={{ flex: 1, marginHorizontal: 16, backgroundColor: selectedShow.status === 'completed' ? colors.success[500] : '#222', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
                            onPress={() => { changeShowStatus(selectedShow.id, 'completed'); setShowDetailModal(false); }}
                          >
                            <Text style={{ color: selectedShow.status === 'completed' ? '#fff' : '#aaa', fontWeight: 'bold', fontSize: 16 }}>{t('completed')}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                  {/* 收藏的单词标题 */}
                  <View style={{ 
                    marginTop: selectedShow?.type === 'wordbook' ? 24 : 8, 
                    marginHorizontal: 24,
                    marginBottom: selectedShow?.type === 'wordbook' ? 16 : 10
                  }}>
                    <Text style={{ 
                      color: selectedShow?.type === 'wordbook' ? colors.text.primary : '#fff', 
                      fontSize: selectedShow?.type === 'wordbook' ? 20 : 18, 
                      fontWeight: 'bold'
                    }}>
                      {t('collected_words')} ({getShowWords(selectedShow.id).length})
                    </Text>
                  </View>
                </>
              }
              ListEmptyComponent={
                <Text style={{ 
                  color: selectedShow.type === 'wordbook' ? colors.text.secondary : '#888', 
                  textAlign: 'center', 
                  marginTop: 32 
                }}>
                  {t('no_collected_words')}
                </Text>
              }
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}
            />
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
              <Text style={styles.modalTitle}>{t('word_details')}</Text>
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
        isCreating={isCreatingWordbook}
        onClose={closeWordbookEdit}
        onSave={handleWordbookSave}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // 瀑布流布局样式 - 小红书风格
  waterfallContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  waterfallColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  waterfallItem: {
    marginBottom: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#fafafa', // 浅灰色背景，更符合小红书风格
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchRowFocused: {
    borderColor: colors.primary[500],
    borderWidth: 1,
    backgroundColor: colors.background.primary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'transparent',
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    justifyContent: 'center',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 0, // iOS为灵动岛留空间，Android正常位置
    left: 0,
    right: 0,
    zIndex: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    position: 'relative',
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginHorizontal: 4,
  },
  filterButtonActive: {
    backgroundColor: colors.background.primary,
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  filterButtonContainer: {
    flex: 1,
    position: 'relative',
  },
  filterStatusContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: colors.background.primary,
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
    marginTop: Platform.OS === 'ios' ? 8 : 8, // 减少顶部边距
  },
  listContent: {
    padding: 24,
    paddingTop: 8, // 减少顶部内边距
  },
  showItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
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
    backgroundColor: colors.background.primary,
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
  // 推荐卡片样式 - 小红书风格
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendationImageContainer: {
    width: '100%',
    aspectRatio: 3/4, // 3:4 纵向比例
    position: 'relative',
  },
  recommendationImage: {
    width: '100%',
    height: '100%',
  },
  recommendationContent: {
    padding: 12,
    backgroundColor: '#fff',
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  recommendationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  recommendationTag: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  recommendationTagText: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  addToShowlistButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addToShowlistButtonAdded: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e0',
  },
  addToShowlistButtonText: {
    color: '#4a5568',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  addToShowlistButtonTextAdded: {
    color: '#718096',
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
  modalOverviewSectionCompact: {
    marginTop: 0,
    marginBottom: 8,
    maxHeight: 120,
  },
  secondaryFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    justifyContent: 'space-around',
  },
  secondaryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginHorizontal: 4,
  },
  secondaryFilterButtonActive: {
    backgroundColor: colors.background.primary,
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  secondaryFilterButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  secondaryFilterButtonTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  segmentedButton: {
    flex: 1,
    maxWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    marginHorizontal: 2,
  },
  segmentedButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentedButtonText: {
    fontSize: 15,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  segmentedButtonTextActive: {
    color: '#000000',
    fontWeight: '600',
  },

  flatAddWordbookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 24,
    marginTop: 0,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  flatAddWordbookButtonText: {
    color: colors.primary[500],
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  segmentedControlContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
  },
  segmentedControlBackground: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: 8,
    padding: 2,
  },
  segmentedControlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  segmentedControlButtonActive: {
    backgroundColor: colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentedControlText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  segmentedControlTextActive: {
    color: colors.text.primary,
  },
  secondarySegmentedControlContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
  },
  secondarySegmentedControlBackground: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: 8,
    padding: 2,
  },
  secondarySegmentedControlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  secondarySegmentedControlButtonActive: {
    backgroundColor: colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  secondarySegmentedControlText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  secondarySegmentedControlTextActive: {
    color: colors.text.primary,
  },
});

export default ShowsScreen; 