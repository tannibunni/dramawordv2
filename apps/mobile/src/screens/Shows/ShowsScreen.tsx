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
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TMDBService, TMDBShow } from '../../services/tmdbService';
import { colors } from '../../constants/colors';
import { useShowList, Show } from '../../context/ShowListContext';
import { useVocabulary, WordWithSource } from '../../context/VocabularyContext';
import WordCard from '../../components/cards/WordCard';
import type { WordData } from '../../types/word';
import WordList from '../../components/vocabulary/WordList';
import WordbookEditModal from '../../components/wordbook/WordbookEditModal';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';


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
  const { shows, addShow, changeShowStatus, removeShow, updateShow, ensureShowLanguage } = useShowList();
  const { appLanguage } = useAppLanguage();
  const targetLang = appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US';
  
  // 使用统一的翻译函数
  const { vocabulary, removeWord } = useVocabulary();
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBShow[]>([]);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<'recommendations' | 'shows' | 'wordbooks'>('shows');
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
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // 推荐内容加载状态
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  
  // 推荐详情页面状态
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationCard | null>(null);
  const [showRecommendationDetail, setShowRecommendationDetail] = useState(false);
  const [recommendationOverview, setRecommendationOverview] = useState<string>('');
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  // 初始化推荐数据
  useEffect(() => {
    if (filter === 'recommendations' && recommendations.length === 0) {
      initializeRecommendations();
    }
  }, [filter]);

  // 打开推荐详情页面
  const openRecommendationDetail = async (recommendation: RecommendationCard) => {
    setSelectedRecommendation(recommendation);
    setShowRecommendationDetail(true);
    setRecommendationLoading(true);
    setRecommendationOverview('');
    
    try {
      // 获取TMDB剧集详情，包括剧情简介
      const showDetails = await TMDBService.getShowDetails(recommendation.tmdbShowId, appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US');
      setRecommendationOverview(showDetails.overview || '');
    } catch (error) {
      console.error('Failed to get show overview:', error);
      setRecommendationOverview('');
    } finally {
      setRecommendationLoading(false);
    }
  };

  // 关闭推荐详情页面
  const closeRecommendationDetail = () => {
    setShowRecommendationDetail(false);
    setSelectedRecommendation(null);
    setRecommendationOverview('');
    setRecommendationLoading(false);
  };

  const initializeRecommendations = async () => {
    setRecommendationsLoading(true);
    try {
      // 优先从数据库获取推荐内容（限制数量，避免数据量过大）
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://dramawordv2.onrender.com'}/api/recommendations/smart?language=${appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US'}&limit=12`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          // 转换数据库格式为前端格式
          const recommendations: RecommendationCard[] = data.data.map((item: any) => ({
            id: item._id,
            tmdbShowId: item.tmdbShowId,
            title: item.title,
            originalTitle: item.originalTitle,
            backdropUrl: item.backdropUrl,
            posterUrl: item.posterUrl,
            recommendation: {
              text: item.recommendation.text,
              difficulty: item.recommendation.difficulty
            }
          }));
          
          setRecommendations(recommendations);
          setFilteredRecommendations(recommendations);
          arrangeWaterfallLayout(recommendations);
          
          // 缓存推荐数据到本地存储
          try {
            await AsyncStorage.setItem('cachedRecommendations', JSON.stringify({
              data: recommendations,
              timestamp: Date.now(),
              language: appLanguage
            }));
          } catch (cacheError) {
            console.log('缓存推荐数据失败:', cacheError);
          }
          
          return;
        }
      }
      
      // 如果数据库没有数据，尝试从本地缓存获取
      try {
        const cachedData = await AsyncStorage.getItem('cachedRecommendations');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          // 检查缓存是否过期（24小时）
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000 && parsed.language === appLanguage) {
            console.log('使用缓存的推荐数据');
            setRecommendations(parsed.data);
            setFilteredRecommendations(parsed.data);
            arrangeWaterfallLayout(parsed.data);
            return;
          }
        }
      } catch (cacheError) {
        console.log('读取缓存失败:', cacheError);
      }
      
      // 如果数据库没有数据且缓存过期，从TMDB获取热门剧集作为备用
      console.log('数据库中没有推荐内容，使用TMDB备用数据');
      const popularShowsResponse = await TMDBService.getPopularShows(1, appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US');
      const popularShows = popularShowsResponse.results.slice(0, 12); // 限制数量
      
      const recommendations: RecommendationCard[] = popularShows.map((show, index) => {
        // 智能生成推荐文案
        const generateRecommendationText = (show: TMDBShow, language: string): string => {
          const isChinese = language === 'zh-CN';
          
          // 根据评分和类型生成个性化推荐
          const rating = show.vote_average;
          const genres = show.genre_ids || [];
          const year = new Date(show.first_air_date).getFullYear();
          
          // 评分等级
          let ratingLevel = '';
          if (rating >= 9.0) {
            ratingLevel = isChinese ? '神级' : 'Masterpiece';
          } else if (rating >= 8.5) {
            ratingLevel = isChinese ? '高分' : 'Highly Rated';
          } else if (rating >= 8.0) {
            ratingLevel = isChinese ? '优秀' : 'Excellent';
          } else {
            ratingLevel = isChinese ? '值得一看' : 'Worth Watching';
          }
          
          // 根据类型生成推荐文案
          let genreRecommendation = '';
          if (genres.includes(35)) { // 喜剧
            genreRecommendation = isChinese 
              ? '轻松幽默的喜剧，学英语必备！对话简单清晰，新手友好'
              : 'Light-hearted comedy perfect for English learning! Simple dialogues, beginner-friendly';
          } else if (genres.includes(80)) { // 犯罪
            genreRecommendation = isChinese 
              ? '犯罪剧巅峰之作，紧张刺激的剧情！学英语的同时体验精彩故事'
              : 'Crime drama masterpiece with thrilling plots! Learn English while enjoying amazing stories';
          } else if (genres.includes(18)) { // 剧情
            genreRecommendation = isChinese 
              ? '深度剧情剧，探讨人性！英语表达丰富，适合进阶学习'
              : 'Deep drama exploring human nature! Rich English expressions, perfect for advanced learners';
          } else if (genres.includes(9648)) { // 悬疑
            genreRecommendation = isChinese 
              ? '悬疑推理神作，烧脑剧情！英语词汇专业，挑战你的理解能力'
              : 'Mystery thriller masterpiece with mind-bending plots! Professional vocabulary, challenges your comprehension';
          } else if (genres.includes(10751)) { // 家庭
            genreRecommendation = isChinese 
              ? '温暖家庭剧，治愈系必看！日常英语对话，实用性强'
              : 'Heartwarming family drama, must-watch! Daily English conversations, highly practical';
          } else {
            genreRecommendation = isChinese 
              ? '不容错过的经典剧集！学英语的同时享受精彩内容'
              : 'Classic series not to be missed! Enjoy great content while learning English';
          }
          
          // 年份标签
          const yearLabel = isChinese ? `${year}年` : `${year}`;
          
          // 组合推荐文案
          const templates = [
            isChinese 
              ? `${ratingLevel}${yearLabel}必看！${genreRecommendation}`
              : `${ratingLevel} ${yearLabel} Must-Watch! ${genreRecommendation}`,
            isChinese 
              ? `${genreRecommendation}，${ratingLevel}评分${rating.toFixed(1)}分！`
              : `${genreRecommendation}, ${ratingLevel} rating ${rating.toFixed(1)}!`,
            isChinese 
              ? `学英语必备神剧！${genreRecommendation}，强烈安利`
              : `Essential for English learning! ${genreRecommendation}, highly recommended`,
            isChinese 
              ? `${yearLabel}年度神作！${genreRecommendation}，看完英语突飞猛进`
              : `${yearLabel} Masterpiece! ${genreRecommendation}, boost your English skills`
          ];
          
          return templates[index % templates.length];
        };
        
        const getDifficulty = (show: TMDBShow): 'easy' | 'medium' | 'hard' => {
          if (show.genre_ids?.includes(35)) return 'easy';
          if (show.vote_average > 8.5) return 'hard';
          if (show.vote_average > 7.5) return 'medium';
          return 'easy';
        };
        
        return {
          id: show.id.toString(),
          tmdbShowId: show.id,
          title: show.name,
          originalTitle: show.original_name,
          backdropUrl: TMDBService.getImageUrl(show.backdrop_path, 'w780'),
          posterUrl: TMDBService.getImageUrl(show.poster_path, 'w92'),
          recommendation: {
            text: generateRecommendationText(show, appLanguage),
            difficulty: getDifficulty(show)
          }
        };
      });
      
      setRecommendations(recommendations);
      setFilteredRecommendations(recommendations);
      arrangeWaterfallLayout(recommendations);
      
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      // 使用硬编码备用数据（最小化数据量）
      const fallbackRecommendations: RecommendationCard[] = [
        {
          id: '1',
          tmdbShowId: 1396,
          title: 'Breaking Bad',
          originalTitle: 'Breaking Bad',
          backdropUrl: 'https://image.tmdb.org/t/p/w780/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
          posterUrl: 'https://image.tmdb.org/t/p/w92/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
          recommendation: {
            text: appLanguage === 'zh-CN' 
              ? '神级2008年必看！犯罪剧巅峰之作，紧张刺激的剧情！学英语的同时体验精彩故事'
              : 'Masterpiece 2008 Must-Watch! Crime drama masterpiece with thrilling plots! Learn English while enjoying amazing stories',
            difficulty: 'hard'
          }
        },
        {
          id: '2',
          tmdbShowId: 1668,
          title: 'Friends',
          originalTitle: 'Friends',
          backdropUrl: 'https://image.tmdb.org/t/p/w780/f496cm9enuEsZkSPzCwnTESEK5s.jpg',
          posterUrl: 'https://image.tmdb.org/t/p/w92/f496cm9enuEsZkSPzCwnTESEK5s.jpg',
          recommendation: {
            text: appLanguage === 'zh-CN'
              ? '学英语必备神剧！轻松幽默的喜剧，学英语必备！对话简单清晰，新手友好，强烈安利'
              : 'Essential for English learning! Light-hearted comedy perfect for English learning! Simple dialogues, beginner-friendly, highly recommended',
            difficulty: 'easy'
          }
        }
      ];
      
      setRecommendations(fallbackRecommendations);
      setFilteredRecommendations(fallbackRecommendations);
      arrangeWaterfallLayout(fallbackRecommendations);
    } finally {
      setRecommendationsLoading(false);
    }
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
          // 剧单模式和推荐模式：都搜索TMDB剧集
          const response = await TMDBService.searchShows(query, 1, appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US');
          setSearchResults(response.results);
        }
      } catch (error) {
        console.error('Failed to search:', error);
        Alert.alert(t('error', appLanguage), t('search_failed', appLanguage));
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
      // 恢复显示所有推荐内容
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
        // 剧单模式和推荐模式：都搜索TMDB剧集
        const response = await TMDBService.searchShows(query, 1, appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US');
        setSearchResults(response.results);
      }
    } catch (error) {
      console.error('Failed to search:', error);
      Alert.alert(t('error', appLanguage), t('search_failed', appLanguage));
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
      case 'watching': return t('watching_status', appLanguage);
      case 'completed': return t('completed_status', appLanguage);
      case 'plan_to_watch': return t('plan_to_watch_status', appLanguage);
      default: return t('unknown_status', appLanguage);
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
    // 点击时也触发一次懒加载，确保该剧切换到当前语言
    if (show.type !== 'wordbook') {
      ensureShowLanguage(show.id, targetLang);
    }
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
            <Text style={{ color: colors.primary[500], fontWeight: 'bold', marginTop: 4 }}>{t('edit', appLanguage)}</Text>
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
            <Text style={{ color: colors.success[500], fontWeight: 'bold', marginTop: 4 }}>{t('mark_completed', appLanguage)}</Text>
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
            Alert.alert(t('delete_show', appLanguage), `确定要删除"${item.name}"吗？`, [
              { text: t('cancel', appLanguage), style: 'cancel' },
              { text: t('delete', appLanguage), style: 'destructive', onPress: () => removeShow(item.id) },
            ]);
          }}
        >
          <Ionicons name="trash" size={28} color={colors.error[500]} />
          <Text style={{ color: colors.error[500], fontWeight: 'bold', marginTop: 4 }}>{t('delete', appLanguage)}</Text>
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
              {isWordbook ? t('wordbook', appLanguage) : (
                item.genres?.map(genre => genre.name).join(', ') ||
                (item.genre_ids ? TMDBService.getGenreNames(item.genre_ids, appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US').join(', ') : t('unknown_genre', appLanguage))
              )}
            </Text>
            <View style={styles.showMeta}>
              {!isWordbook && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color={colors.accent[500]} />
                  <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
                </View>
              )}
              <Text style={styles.wordCountText}>{t('words_count', appLanguage, { count: wordCount })}</Text>
            </View>
            {item.lastWatched && (
              <Text style={styles.lastWatchedText}>{t('last_watched', appLanguage)}: {item.lastWatched}</Text>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // 使用 FlatList 可见项回调来触发语言懒加载，避免在 renderItem 内使用 Hook
  const onViewableItemsChanged = React.useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
    viewableItems.forEach((vi) => {
      const data = vi.item as Show;
      if (data && data.type !== 'wordbook') {
        ensureShowLanguage(data.id, targetLang);
      }
    });
  }).current;

  const viewabilityConfig = React.useRef({ itemVisiblePercentThreshold: 25 }).current;

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
    const isShowsActive = filter === 'shows';
    const isWordbooksActive = filter === 'wordbooks';
    const isRecommendationsActive = filter === 'recommendations';

    return (
      <View style={styles.segmentedControlContainer}>
        <View style={styles.segmentedControlBackground}>
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
              {t('shows_tab', appLanguage)}
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
              {t('wordbooks_tab', appLanguage)}
            </Text>
          </TouchableOpacity>
          
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
              {t('recommendations_tab', appLanguage)}
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
              {t('all', appLanguage)}
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
              {t('not_completed', appLanguage)}
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
              {t('completed', appLanguage)}
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
      <TouchableOpacity 
        style={styles.recommendationCard}
        onPress={() => openRecommendationDetail(item)}
        activeOpacity={0.9}
      >
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
          {/* 推荐文案作为标题 */}
          <Text style={styles.recommendationTitle} numberOfLines={2}>
            {item.recommendation.text}
          </Text>
          
          {/* 剧集名作为副标题 */}
          <Text style={styles.recommendationSubtitle} numberOfLines={1}>
            {item.title}
          </Text>
          
          {/* 类型标签 */}
          <View style={styles.recommendationTags}>
            {getTags(item.recommendation.difficulty).map((tag, index) => (
              <View key={index} style={styles.recommendationTag}>
                <Text style={styles.recommendationTagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
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
                <Text style={styles.statusText}>{t('already_added', appLanguage)}</Text>
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
                <Text style={styles.statusText}>{t('add', appLanguage)}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.originalTitle}>{item.original_name}</Text>
          <Text style={styles.genreText}>
            {item.genres?.map(genre => genre.name).join(', ') || 
             (item.genre_ids ? TMDBService.getGenreNames(item.genre_ids, appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US').join(', ') : t('unknown_genre', appLanguage))}
          </Text>
          {/* 显示数据来源 */}
          {item.source && (
            <View style={[styles.sourceBadge, { 
              backgroundColor: item.source === 'tmdb' ? '#01b4e4' : '#f3ce13' 
            }]}>
              <Text style={styles.sourceText}>
                {item.source === 'tmdb' ? 'TMDB' : 'OMDb'}
              </Text>
            </View>
          )}
          <View style={styles.showMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={colors.accent[500]} />
              <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
            </View>
            <Text style={styles.wordCountText}>{t('words_count', appLanguage, { count: wordCount })}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部区域 */}
      <View style={styles.headerContainer}>
        {/* iOS风格分段控制器 */}
        {renderSegmentedControl()}
      </View>
      


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
                filter === 'wordbooks' ? t('search_wordbooks', appLanguage) : 
                t('search_shows', appLanguage)
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
          <Text style={styles.searchLoadingText}>{t('searching', appLanguage)}</Text>
        </View>
      )}

      {/* 搜索空状态 */}
      {!searchLoading && searchText.length >= 1 && searchResults.length === 0 && (
        <View style={styles.searchEmptyContainer}>
          <Ionicons name="search-outline" size={64} color={colors.neutral[300]} />
          <Text style={styles.searchEmptyText}>
            {filter === 'wordbooks' ? t('no_wordbook_results', appLanguage) : 
             t('no_results', appLanguage)}
          </Text>
          <TouchableOpacity 
            style={styles.searchEmptyButton}
            onPress={() => {
              // 切换到单词本标签页
              setFilter('wordbooks');
              // 清空搜索
              setSearchText('');
              setSearchResults([]);
              // 聚焦到搜索框
              searchInputRef.current?.focus();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.searchEmptyButtonText}>
              {filter === 'wordbooks' ? t('try_other_wordbook_keywords', appLanguage) : 
               t('add_manually', appLanguage)}
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
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.manualAddContainer}
              onPress={() => {
                // 切换到单词本标签页
                setFilter('wordbooks');
                // 清空搜索
                setSearchText('');
                setSearchResults([]);
                // 聚焦到搜索框
                searchInputRef.current?.focus();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.manualAddContent}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary[500]} />
                <Text style={styles.manualAddText}>{t('cant_find_show_manual_add', appLanguage)}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary[500]} />
              </View>
            </TouchableOpacity>
          }
        />
      )}

      {/* 推荐内容瀑布流 */}
      {filter === 'recommendations' && searchResults.length === 0 && searchText.length === 0 && (
        <ScrollView 
          style={styles.list} 
          contentContainerStyle={[styles.listContent, { paddingHorizontal: 0 }]} // 移除水平内边距
          showsVerticalScrollIndicator={false} // 隐藏垂直滚动条
        >
          {recommendationsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>正在加载推荐内容...</Text>
            </View>
          ) : filteredRecommendations.length > 0 ? (
            renderWaterfallLayout()
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={64} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>{t('no_recommendations', appLanguage)}</Text>
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
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListHeaderComponent={
          filter === 'wordbooks' ? (
            <TouchableOpacity
              style={styles.flatAddWordbookButton}
              onPress={openCreateWordbook}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={colors.primary[500]} />
              <Text style={styles.flatAddWordbookButtonText}>{t('create_wordbook', appLanguage)}</Text>
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
                  <Text style={styles.emptyText}>{t('no_wordbooks', appLanguage)}</Text>
                </>
              ) : (
                // 剧单空状态
                <>
                  <Ionicons name="tv-outline" size={64} color={colors.neutral[300]} />
                  <Text style={styles.emptyText}>{t('no_shows', appLanguage)}</Text>
                </>
              )}
            </View>
        }
      />
      )}

      {/* 推荐详情模态框 */}
      <Modal
        visible={showRecommendationDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeRecommendationDetail}
      >
        {selectedRecommendation && (
          <SafeAreaView style={styles.recommendationDetailContainer}>
            {/* 关闭按钮 */}
            <TouchableOpacity
              style={styles.recommendationDetailCloseButton}
              onPress={closeRecommendationDetail}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            {/* 图片区域 */}
            <View style={styles.recommendationDetailImageContainer}>
              <Image
                source={{ uri: selectedRecommendation.backdropUrl }}
                style={styles.recommendationDetailImage}
                resizeMode="cover"
              />
            </View>
            
            {/* 内容区域 */}
            <ScrollView style={styles.recommendationDetailContent}>
              {/* 剧集标题 */}
              <Text style={styles.recommendationDetailTitle}>
                {selectedRecommendation.title}
              </Text>
              
              {/* 推荐文案 */}
              <Text style={styles.recommendationDetailDescription}>
                {selectedRecommendation.recommendation.text}
              </Text>
              
              {/* 剧情简介 */}
              <View style={styles.recommendationOverviewSection}>
                <Text style={styles.recommendationOverviewTitle}>
                  {t('overview', appLanguage)}
                </Text>
                {recommendationLoading ? (
                  <View style={styles.recommendationOverviewLoading}>
                    <ActivityIndicator size="small" color="#7C3AED" />
                    <Text style={styles.recommendationOverviewLoadingText}>
                      {t('loading_overview', appLanguage)}
                    </Text>
                  </View>
                ) : recommendationOverview ? (
                  <Text style={styles.recommendationOverviewText}>
                    {recommendationOverview}
                  </Text>
                ) : (
                  <Text style={styles.recommendationOverviewEmpty}>
                    {t('no_overview', appLanguage)}
                  </Text>
                )}
              </View>
              
              {/* 类型标签 */}
              <View style={styles.recommendationDetailTags}>
                {(() => {
                  const baseTags = ['剧情'];
                  let tags = baseTags;
                  switch (selectedRecommendation.recommendation.difficulty) {
                    case 'easy':
                      tags = [...baseTags, '轻松', '入门'];
                      break;
                    case 'medium':
                      tags = [...baseTags, '悬疑', '推理'];
                      break;
                    case 'hard':
                      tags = [...baseTags, '复杂', '烧脑'];
                      break;
                  }
                  return tags.map((tag, index) => (
                    <View key={index} style={styles.recommendationDetailTag}>
                      <Text style={styles.recommendationDetailTagText}>#{tag}</Text>
                    </View>
                  ));
                })()}
              </View>
              
              {/* 添加按钮 */}
              <TouchableOpacity
                style={[
                  styles.recommendationDetailAddButton,
                  shows.some(s => s.id === selectedRecommendation.tmdbShowId) && styles.recommendationDetailAddButtonAdded
                ]}
                onPress={async () => {
                  const isAlreadyAdded = shows.some(s => s.id === selectedRecommendation.tmdbShowId);
                  if (!isAlreadyAdded) {
                    try {
                      // 从TMDB获取完整的剧集信息
                      const showDetails = await TMDBService.getShowDetails(selectedRecommendation.tmdbShowId, appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US');
                      
                      // 使用完整的TMDB数据添加到剧单
                      addShowToWatching(showDetails, () => {
                        Alert.alert('成功', '已添加到剧单！');
                      });
                    } catch (error) {
                      console.error('Failed to get show details:', error);
                      // 如果获取详情失败，使用推荐卡片的基本信息
                      const basicShow: TMDBShow = {
                        id: selectedRecommendation.tmdbShowId,
                        name: selectedRecommendation.title,
                        original_name: selectedRecommendation.originalTitle,
                        overview: selectedRecommendation.recommendation.text,
                        poster_path: selectedRecommendation.posterUrl.split('/').pop() || '',
                        backdrop_path: selectedRecommendation.backdropUrl.split('/').pop() || '',
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
                      addShowToWatching(basicShow, () => {
                        Alert.alert('成功', '已添加到剧单！');
                      });
                    }
                  } else {
                    Alert.alert('提示', '该剧集已在剧单中');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.recommendationDetailAddButtonText,
                  shows.some(s => s.id === selectedRecommendation.tmdbShowId) && styles.recommendationDetailAddButtonTextAdded
                ]}>
                  {shows.some(s => s.id === selectedRecommendation.tmdbShowId) ? t('already_added', appLanguage) : t('add_to_showlist', appLanguage)}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

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
                            <Text style={{ color: '#7fffa7', fontWeight: 'bold', marginRight: 12 }}>{selectedShow.status === 'completed' ? t('finished', appLanguage) : t('ongoing', appLanguage)}</Text>
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
                        <Text style={{ color: '#fff', fontSize: 16, lineHeight: 24 }}>{selectedShow.overview || t('no_overview', appLanguage)}</Text>
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
                                {t('add_to_list', appLanguage)}
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={{ flex: 1, marginHorizontal: 16, backgroundColor: selectedShow.status === 'completed' ? colors.success[500] : '#222', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
                            onPress={() => { changeShowStatus(selectedShow.id, 'completed'); setShowDetailModal(false); }}
                          >
                            <Text style={{ color: selectedShow.status === 'completed' ? '#fff' : '#aaa', fontWeight: 'bold', fontSize: 16 }}>{t('completed', appLanguage)}</Text>
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
                      {t('collected_words', appLanguage)} ({getShowWords(selectedShow.id).length})
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
                  {t('no_collected_words', appLanguage)}
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
              <Text style={styles.modalTitle}>{t('word_details', appLanguage)}</Text>
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
  // 瀑布流布局样式 - 小红书紧凑风格
  waterfallContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8, // 减小左右边距
  },
  waterfallColumn: {
    flex: 1,
    marginHorizontal: 4, // 减小列间距
  },
  waterfallItem: {
    marginBottom: 8, // 减小卡片间距
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
    marginTop: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  searchEmptyButtonText: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '400',
    textAlign: 'center',
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
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  sourceText: {
    fontSize: 10,
    color: colors.text.inverse,
    fontWeight: '600',
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
  // 推荐卡片样式 - 小红书紧凑风格
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12, // 减小圆角
    overflow: 'hidden',
    marginBottom: 8, // 减小底部间距
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // 减小阴影
    shadowOpacity: 0.04, // 减小阴影透明度
    shadowRadius: 4, // 减小阴影半径
    elevation: 2, // 减小Android阴影
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
    padding: 8, // 减小内边距
    backgroundColor: '#fff',
  },
  recommendationTitle: {
    fontSize: 16, // 减小字体大小
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4, // 减小间距
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif',
  },
  recommendationSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  recommendationDescription: {
    fontSize: 13, // 减小字体大小
    color: '#666666',
    lineHeight: 18, // 减小行高
    marginBottom: 6, // 减小间距
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  recommendationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8, // 减小间距
  },
  recommendationTag: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 6, // 减小内边距
    paddingVertical: 3, // 减小内边距
    borderRadius: 10, // 减小圆角
    marginRight: 4, // 减小间距
    marginBottom: 3, // 减小间距
  },
  recommendationTagText: {
    fontSize: 11, // 减小字体大小
    color: '#4a5568',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  addToShowlistButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 16, // 减小圆角
    paddingVertical: 8, // 减小内边距
    paddingHorizontal: 12, // 减小内边距
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
    fontSize: 13, // 减小字体大小
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  addToShowlistButtonTextAdded: {
    color: '#718096',
  },
  // 加载状态样式
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.neutral[600],
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  // 推荐详情页面样式
  recommendationDetailContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  recommendationDetailCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  recommendationDetailImageContainer: {
    width: '100%',
    height: 300,
  },
  recommendationDetailImage: {
    width: '100%',
    height: '100%',
  },
  recommendationDetailContent: {
    flex: 1,
    padding: 20,
  },
  recommendationDetailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif',
  },
  recommendationDetailDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  recommendationDetailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  recommendationDetailTag: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  recommendationDetailTagText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  recommendationDetailAddButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  recommendationDetailAddButtonAdded: {
    backgroundColor: '#e2e8f0',
    shadowColor: '#cbd5e0',
  },
  recommendationDetailAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  recommendationDetailAddButtonTextAdded: {
    color: '#64748B',
  },
  // 推荐详情剧情简介样式
  recommendationOverviewSection: {
    marginBottom: 20,
  },
  recommendationOverviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif',
  },
  recommendationOverviewLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  recommendationOverviewLoadingText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  recommendationOverviewText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  recommendationOverviewEmpty: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
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
    minHeight: 60, // 确保有足够的高度
  },
  segmentedControlBackground: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[200], // 增加对比度
    borderRadius: 8,
    padding: 2,
    minHeight: 40, // 确保按钮有足够的高度
  },
  segmentedControlButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    minHeight: 36, // 确保按钮有足够的高度
  },
  segmentedControlButtonActive: {
    backgroundColor: colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentedControlText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  segmentedControlTextActive: {
    color: colors.text.primary,
    fontWeight: '700',
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
  headerContainer: {
    backgroundColor: colors.background.primary,
  },

  manualAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 1,
    paddingHorizontal: 16,
    marginHorizontal: 24,
    marginTop: 0,
    marginBottom: 8,
  },
  manualAddContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualAddText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '400',
    marginHorizontal: 4,
  },

});

export default ShowsScreen; 