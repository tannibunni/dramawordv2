import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
  AppState,
} from 'react-native';
// import { useFocusEffect } from '@react-navigation/native'; // 移除React Navigation钩子
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { wordService, RecentWord } from '../../services/wordService';
import { unifiedQueryService } from '../../services/unifiedQueryService';
import { AmbiguousChoiceCard } from '../../components/cards/AmbiguousChoiceCard';
import WordCard from '../../components/cards/WordCard';
import { useShowList } from '../../context/ShowListContext';
import { useVocabulary } from '../../context/VocabularyContext';
import { TMDBService, TMDBShow } from '../../services/tmdbService';
import { Audio } from 'expo-av';
import LanguagePicker from '../../components/common/LanguagePicker';
import { useLanguage } from '../../context/LanguageContext';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode, API_BASE_URL } from '../../constants/config';
import { shouldShowLanguageReminder, generateLanguageReminderMessage } from '../../utils/languageDetector';
import { t } from '../../constants/translations';
// 导入功能权限控制相关组件
import FeatureAccessService, { FeatureType } from '../../services/featureAccessService';
import { UpgradeModal } from '../../components/common/UpgradeModal';
import { useNavigation } from '../../components/navigation/NavigationContext';
// import { LanguageDebugInfo } from '../../components/common/LanguageDebugInfo';

interface HomeScreenProps {
  navigation?: {
    navigate: (screen: any, params?: any) => void;
  };
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { navigate, currentScreen } = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [recentWords, setRecentWords] = useState<RecentWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [recentWordsPage, setRecentWordsPage] = useState(1);
  const [hasMoreRecentWords, setHasMoreRecentWords] = useState(false);
  const [isLoadingMoreRecent, setIsLoadingMoreRecent] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const { shows, addShow } = useShowList();
  const { vocabulary, addWord, isWordInShow } = useVocabulary();
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedShow, setSelectedShow] = useState<any>(null);
  const [searchShowText, setSearchShowText] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBShow[]>([]);
  const [searchingShow, setSearchingShow] = useState(false);
  const [showCheckAnimation, setShowCheckAnimation] = useState(false);
  const checkScale = useRef(new Animated.Value(0)).current;
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showCreateWordbook, setShowCreateWordbook] = useState(false);
  const [newWordbookName, setNewWordbookName] = useState('');
  const [isCreatingWordbook, setIsCreatingWordbook] = useState(false);
  const [showBadgeCelebrate, setShowBadgeCelebrate] = useState(false);
  const [celebrateBadge, setCelebrateBadge] = useState<null | number>(null);
  const badgeTargets = [10, 20, 50, 100, 200, 500, 1000];
  const prevVocabCount = useRef(vocabulary.length);
  const [celebratedBadges, setCelebratedBadges] = useState<Set<number>>(new Set());
  const [chToEnCandidates, setChToEnCandidates] = useState<string[]>([]); // 新增：中文查英文候选词
  const [chToEnQuery, setChToEnQuery] = useState<string>('');
  const [enToChCandidates, setEnToChCandidates] = useState<string[]>([]); // 新增：英文查中文候选词
  const [enToChQuery, setEnToChQuery] = useState<string>('');
  const [chToJaCandidates, setChToJaCandidates] = useState<string[]>([]); // 新增：中文查日语候选词
  const [chToJaQuery, setChToJaQuery] = useState<string>('');
  const [enToJaCandidates, setEnToJaCandidates] = useState<string[]>([]); // 新增：英文查日语候选词
  const [enToJaQuery, setEnToJaQuery] = useState<string>('');
  const [ambiguousOptions, setAmbiguousOptions] = useState<any[]>([]); // 新增：歧义选择选项
  const [showAmbiguousChoice, setShowAmbiguousChoice] = useState(false); // 新增：显示歧义选择
  const [ambiguousInput, setAmbiguousInput] = useState<string>(''); // 新增：歧义输入
  const [pinyinCandidates, setPinyinCandidates] = useState<string[]>([]); // 新增：拼音候选词
  const [pinyinQuery, setPinyinQuery] = useState<string>('');
  const { selectedLanguage, getCurrentLanguageConfig, setSelectedLanguage } = useLanguage();
  const { appLanguage } = useAppLanguage();
  
  // 升级弹窗相关状态
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<FeatureType | null>(null);
  
  // 设置翻译服务语言
  useEffect(() => {
    // 翻译函数会自动使用当前语言，无需手动设置
  }, [appLanguage]);
  
  // 语言提醒缓存，避免频繁弹窗
  const [languageReminderCache, setLanguageReminderCache] = useState<{
    [key: string]: {
      timestamp: number;
      dismissed: boolean;
    }
  }>({});
  
  // 导航到语言设置页面
  const handleNavigateToLanguageSettings = () => {
    if (navigation) {
      // 先切换到profile tab，然后打开语言设置
      navigation.navigate('main', { tab: 'profile', openLanguageSettings: true });
    }
  };

  // 清理过期的语言提醒缓存
  const cleanupExpiredCache = () => {
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
    
    setLanguageReminderCache(prev => {
      const cleaned = Object.entries(prev).reduce((acc, [key, value]) => {
        if (now - value.timestamp < CACHE_DURATION) {
          acc[key] = value;
        }
        return acc;
      }, {} as typeof prev);
      
      if (Object.keys(cleaned).length !== Object.keys(prev).length) {
        console.log('🧹 清理过期语言提醒缓存');
      }
      
      return cleaned;
    });
  };

  // 处理语言切换
  const handleLanguageChange = (languageCode: string) => {
    console.log('🔄 HomeScreen - 语言切换:', languageCode);
    // 语言切换时清理缓存，因为用户可能改变了学习偏好
    setLanguageReminderCache({});
    console.log('🧹 语言切换时清理语言提醒缓存');
  };
  
  // 移除 getBackendLanguageCode 相关函数和调用

  useEffect(() => {
    loadRecentWords();
  }, []);

  // 添加AppState监听，处理app从后台切换回来
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('🔄 AppState变化:', nextAppState);
      if (nextAppState === 'active') {
        // app从后台切换回来时，恢复状态
        console.log('📱 App重新激活，恢复状态');
        restoreUIState();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // 添加屏幕焦点管理 - 使用自定义导航上下文
  useEffect(() => {
    if (currentScreen === 'main') {
      console.log('🎯 HomeScreen获得焦点');
      // 屏幕获得焦点时，确保状态正确
      restoreUIState();
    }
  }, [currentScreen]);

  // 恢复UI状态的函数
  const restoreUIState = () => {
    console.log('🔧 开始恢复UI状态');
    
    // 先验证当前状态
    const isStateValid = validateUIState();
    if (!isStateValid) {
      console.log('🔧 检测到状态异常，开始修复');
    }
    
    // 重置搜索相关状态
    if (searchText && !searchResult) {
      console.log('🔧 重置搜索状态');
      setSearchText('');
      setSearchResult(null);
      setIsLoading(false);
    }
    
    // 确保最近查词已加载
    if (recentWords.length === 0 && !isLoadingRecent) {
      console.log('🔧 重新加载最近查词');
      loadRecentWords();
    }
    
    // 清理过期的语言提醒缓存
    cleanupExpiredCache();
    
    // 重置其他可能异常的状态
    setSearchSuggestions([]);
    setChToEnCandidates([]);
    setChToEnQuery('');
    setEnToChCandidates([]);
    setEnToChQuery('');
    setChToJaCandidates([]);
    setChToJaQuery('');
    setEnToJaCandidates([]);
    setEnToJaQuery('');
    setPinyinCandidates([]);
    setPinyinQuery('');
    
    // 延迟验证修复后的状态
    setTimeout(() => {
      const isFixed = validateUIState();
      console.log('🔧 状态修复结果:', isFixed ? '成功' : '仍有问题');
    }, 100);
    
    console.log('✅ UI状态恢复完成');
  };

  // 处理搜索输入变化，添加防抖和状态管理
  const handleInputChange = (text: string) => {
    setSearchText(text);
    
    // 如果输入为空，清理相关状态
    if (!text.trim()) {
      setSearchResult(null);
      setSearchSuggestions([]);
      setChToEnCandidates([]);
      setChToEnQuery('');
      setEnToChCandidates([]);
      setEnToChQuery('');
      setPinyinCandidates([]);
      setPinyinQuery('');
    }
  };

  // 验证UI状态是否正常
  const validateUIState = () => {
    const issues = [];
    
    // 检查搜索状态一致性
    if (searchText && !searchResult && !isLoading) {
      issues.push('搜索文本存在但无结果且未加载中');
    }
    
    // 检查加载状态
    if (isLoading && !searchText) {
      issues.push('加载中但无搜索文本');
    }
    
    // 检查最近查词状态
    if (recentWords.length === 0 && !isLoadingRecent && !searchResult) {
      issues.push('无最近查词且未加载中且无搜索结果');
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ UI状态异常:', issues);
      return false;
    }
    
    return true;
  };

  // 设置功能权限检查的回调
  useEffect(() => {
    FeatureAccessService.setUpgradeModalCallback((feature) => {
      console.log('[HomeScreen] 功能被锁定，显示升级弹窗:', feature);
      setLockedFeature(feature);
      setUpgradeModalVisible(true);
    });

    return () => {
      FeatureAccessService.setUpgradeModalCallback(undefined);
    };
  }, []);

  // 定期清理过期的语言提醒缓存
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupExpiredCache, 60000); // 每分钟清理一次
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // 加载已庆祝的徽章记录
  useEffect(() => {
    const loadCelebratedBadges = async () => {
      try {
        const stored = await AsyncStorage.getItem('celebratedBadges');
        if (stored) {
          const celebratedArray = JSON.parse(stored);
          setCelebratedBadges(new Set(celebratedArray));
          console.log('📱 从本地存储加载已庆祝徽章:', celebratedArray);
        }
      } catch (error) {
        console.error('❌ 加载已庆祝徽章失败:', error);
      }
    };
    loadCelebratedBadges();
  }, []);

  useEffect(() => {
    // 监听 vocabulary 数量变化
    if (vocabulary.length > prevVocabCount.current) {
      const unlocked = badgeTargets.find(target => 
        prevVocabCount.current < target && 
        vocabulary.length >= target && 
        !celebratedBadges.has(target)
      );
      if (unlocked) {
        setCelebrateBadge(unlocked);
        setShowBadgeCelebrate(true);
        setCelebratedBadges(prev => new Set([...prev, unlocked]));
        // 保存到本地存储
        AsyncStorage.setItem('celebratedBadges', JSON.stringify([...celebratedBadges, unlocked]));
        setTimeout(() => setShowBadgeCelebrate(false), 1800);
      }
    }
    prevVocabCount.current = vocabulary.length;
  }, [vocabulary.length, celebratedBadges]);

  const loadRecentWords = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMoreRecent(true);
      } else {
        setIsLoadingRecent(true);
      }
      
      const response = await wordService.getRecentWords(page, 30);
      
      
      // 前端去重逻辑，确保没有重复单词
      const uniqueWords = response.data.reduce((acc: RecentWord[], current) => {
        const exists = acc.find(item => item.word.toLowerCase() === current.word.toLowerCase());
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      
      if (append) {
        setRecentWords(prev => [...prev, ...uniqueWords]);
      } else {
        setRecentWords(uniqueWords);
      }
      
      setHasMoreRecentWords(response.pagination.hasMore);
      setRecentWordsPage(page);
    } catch (error) {
      console.error('加载最近查词失败:', error);
      Alert.alert(t('tip', appLanguage), t('load_history_failed', appLanguage));
    } finally {
      if (append) {
        setIsLoadingMoreRecent(false);
      } else {
        setIsLoadingRecent(false);
      }
    }
  };

  const loadMoreRecentWords = async () => {
    if (hasMoreRecentWords && !isLoadingMoreRecent) {
      await loadRecentWords(recentWordsPage + 1, true);
    }
  };

  const isChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text);
  const isEnglish = (text: string) => /^[a-zA-Z\s]+$/.test(text);
  const isPinyin = (text: string) => {
    // 只包含小写字母和空格，不包含大写字母
    const result = /^[a-z\s]+$/.test(text) && !/[A-Z]/.test(text);
    return result;
  };

  // 拼音候选词缓存 - 用于缓存API返回的候选词
  const [pinyinCache, setPinyinCache] = useState<Record<string, Array<{chinese: string, english: string}>>>({});

  // handleSearch 只保留中英查词
  const handleSearch = async () => {
    const word = searchText.trim();
    if (!word) {
      Alert.alert(t('tip', appLanguage), t('please_enter_word', appLanguage));
      return;
    }

    // 如果是中文输入，直接进入翻译功能，不触发语言提醒
    // 注意：这里不处理中文输入，让performSearch中的逻辑处理
    // if (isChinese(word)) {
    //   await performSearch(word);
    //   return;
    // }

    // 如果是英文UI且输入英文，直接进入翻译功能，不触发语言提醒
    if (appLanguage === 'en-US' && /^[a-zA-Z\s]+$/.test(word)) {
      await performSearch(word);
      return;
    }

    // 语言检测和提醒（仅对非中文输入且非英文UI下的英文输入）
    const reminderCheck = shouldShowLanguageReminder(word, selectedLanguage);
    if (reminderCheck.shouldShow && reminderCheck.detectedLanguage) {
      // 生成缓存键：单词 + 检测到的语言 + 当前语言
      const cacheKey = `${word}_${reminderCheck.detectedLanguage.code}_${selectedLanguage}`;
      const now = Date.now();
      const cacheEntry = languageReminderCache[cacheKey];
      
      // 检查缓存：如果5分钟内已经显示过相同提醒，则跳过
      const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
      if (cacheEntry && (now - cacheEntry.timestamp) < CACHE_DURATION) {
        console.log('🔍 跳过重复的语言提醒:', cacheKey);
        await performSearch(word);
        return;
      }
      
      const { title, message } = generateLanguageReminderMessage(
        word,
        reminderCheck.detectedLanguage,
        selectedLanguage,
        appLanguage
      );

      Alert.alert(
        title,
        message,
        [
          {
            text: appLanguage === 'zh-CN' ? '保持当前语言' : 'Keep Current',
            style: 'cancel',
            onPress: () => {
              // 记录用户选择"保持当前语言"
              setLanguageReminderCache(prev => ({
                ...prev,
                [cacheKey]: {
                  timestamp: now,
                  dismissed: true
                }
              }));
              performSearch(word);
            }
          },
          {
            text: appLanguage === 'zh-CN' ? '切换语言' : 'Switch Language',
            onPress: () => {
              // 记录用户选择"切换语言"
              setLanguageReminderCache(prev => ({
                ...prev,
                [cacheKey]: {
                  timestamp: now,
                  dismissed: false
                }
              }));
              setSelectedLanguage(reminderCheck.detectedLanguage!.code as SupportedLanguageCode);
              // 延迟执行搜索，确保语言切换完成
              setTimeout(() => performSearch(word), 100);
            }
          }
        ]
      );
      return;
    }

    // 直接执行搜索
    await performSearch(word);
  };

  // 创建候选词选择回调函数
  const createCandidateSelectHandler = (originalWord: string, candidates: any[]) => {
    return async (selectedCandidate: string) => {
      console.log(`用户选择了候选词: ${selectedCandidate}`);
      
      // 如果候选词列表中包含了完整的候选词对象（带audioUrl），直接使用
      const candidateObj = candidates?.find((c: any) => 
        typeof c === 'object' && c.chinese === selectedCandidate
      );
      
      if (candidateObj && candidateObj.audioUrl) {
        // 使用候选词对象中的数据，包括audioUrl
        console.log(`✅ 使用候选词对象数据: ${selectedCandidate}`);
        setSearchResult((prev: any) => prev ? {
          ...prev,
          correctedWord: selectedCandidate,
          translation: selectedCandidate,
          audioUrl: candidateObj.audioUrl,
          phonetic: candidateObj.pinyin || prev.phonetic,
          definitions: [{
            definition: candidateObj.english,
            examples: [],
            partOfSpeech: ''
          }]
        } : null);
      } else {
        // 重新查询被选中的词
        console.log(`🔍 重新查询被选中的词: ${selectedCandidate}`);
        setIsLoading(true);
        try {
          const safeAppLanguage = appLanguage || 'en-US';
          const result = await wordService.getChineseWordDetails(selectedCandidate, safeAppLanguage);
          
          if (result.success && result.data) {
            setSearchResult(result.data);
          } else {
            // 如果查询失败，至少更新显示
            setSearchResult((prev: any) => prev ? {
              ...prev,
              correctedWord: selectedCandidate,
              translation: selectedCandidate
            } : null);
          }
        } catch (error) {
          console.error('查询候选词失败:', error);
          // 查询失败时，至少更新显示
          setSearchResult((prev: any) => prev ? {
            ...prev,
            correctedWord: selectedCandidate,
            translation: selectedCandidate
          } : null);
        } finally {
          setIsLoading(false);
        }
      }
      
      // 更新搜索历史
      wordService.saveSearchHistory(originalWord, selectedCandidate);
      setRecentWords(prev => {
        const filtered = prev.filter(w => w.word !== originalWord);
        return [
          {
            id: Date.now().toString(),
            word: originalWord,
            translation: selectedCandidate,
            timestamp: Date.now(),
          },
          ...filtered
        ];
      });
    };
  };

  // 执行实际的搜索逻辑
  const performSearch = async (word: string) => {
    setIsLoading(true);
    setSearchResult(null);
    setSearchSuggestions([]);
    setChToEnCandidates([]);
    setChToEnQuery('');
    setEnToChCandidates([]);
    setEnToChQuery('');
    setChToJaCandidates([]);
    setChToJaQuery('');
    setEnToJaCandidates([]);
    setEnToJaQuery('');
    setAmbiguousOptions([]);
    setShowAmbiguousChoice(false);
    setAmbiguousInput('');
    
    try {
      // 使用统一查询服务处理所有输入类型
      // 获取目标语言代码
      const targetLanguageCode = SUPPORTED_LANGUAGES[selectedLanguage].code;
      const queryResult = await unifiedQueryService.query(word, appLanguage || 'en-US', targetLanguageCode);
      
      if (queryResult.type === 'translation') {
        // 直接翻译结果
        console.log(`✅ 统一查询返回翻译结果:`, queryResult.data);
        
        // 添加候选词选择回调
        const resultWithCallback = {
          ...queryResult.data,
          onCandidateSelect: createCandidateSelectHandler(word, queryResult.data.candidates)
        };
        
        setSearchResult(resultWithCallback);
        setSearchText('');
        
        // 保存搜索历史
        const translationResult = queryResult.data.correctedWord || queryResult.data.translation || '';
        const pinyin = queryResult.data.pinyin || queryResult.data.phonetic || '';
        const englishDefinition = queryResult.data.definitions?.[0]?.definition || '';
        await wordService.saveSearchHistory(word, translationResult, undefined, pinyin, englishDefinition);
        setRecentWords(prev => {
          const filtered = prev.filter(w => w.word !== word);
          return [
            {
              id: Date.now().toString(),
              word: word,
              translation: translationResult,
              timestamp: Date.now(),
              pinyin: pinyin,
              englishDefinition: englishDefinition,
            },
            ...filtered
          ];
        });
        setIsLoading(false);
        return;
      } else if (queryResult.type === 'ambiguous') {
        // 歧义选择
        console.log(`🔍 统一查询返回歧义选择:`, (queryResult as any).options);
        setAmbiguousOptions((queryResult as any).options);
        setShowAmbiguousChoice(true);
        setAmbiguousInput(word);
        setIsLoading(false);
        return;
      } else if (queryResult.type === 'dictionary') {
        // 词典结果
        console.log(`✅ 统一查询返回词典结果:`, queryResult.data);
        if (queryResult.data && queryResult.data.length > 0) {
          const firstResult = queryResult.data[0];
          const wordData = {
            word: firstResult.kanji || firstResult.reading,
            language: 'ja',
            phonetic: firstResult.reading,
            kana: firstResult.reading,
            definitions: firstResult.senses.map((sense: any) => ({
              partOfSpeech: sense.pos[0] || 'n.',
              definition: sense.glosses[0] || 'No definition available',
              examples: []
            }))
          };
          setSearchResult(wordData);
          setSearchText('');
          
          // 保存搜索历史
          const definition = wordData.definitions[0]?.definition || t('no_definition', appLanguage);
          const phonetic = wordData.phonetic || wordData.kana || '';
          await wordService.saveSearchHistory(word, definition, undefined, phonetic, definition);
          setRecentWords(prev => {
            const filtered = prev.filter(w => w.word !== word);
            return [
              {
                id: Date.now().toString(),
                word: word,
                translation: definition,
                timestamp: Date.now(),
                pinyin: phonetic,
                englishDefinition: definition,
              },
              ...filtered
            ];
          });
        }
        setIsLoading(false);
        return;
      }
      
      // 如果统一查询服务没有处理，回退到原有逻辑
      console.log(`⚠️ 统一查询服务未处理，回退到原有逻辑: ${word}`);
      
      // 原有的搜索逻辑作为回退
      if (isChinese(word)) {
        console.log(`🔍 输入中文词汇: ${word}`);
        console.log(`🔍 appLanguage: ${appLanguage}, selectedLanguage: ${selectedLanguage}`);
        
        if (selectedLanguage === 'JAPANESE') {
          // 目标语言是日语，显示日语翻译弹窗
          const translationResult = await wordService.translateChineseToJapanese(word);
          
          if (translationResult.success && translationResult.candidates.length > 0) {
            setChToJaCandidates(translationResult.candidates);
            setChToJaQuery(word);
            const translation = translationResult.candidates.join(', ');
            console.log(`✅ 中文翻译到日语结果: ${word} -> ${translation}`);
            setIsLoading(false);
            return;
          } else {
            console.log(`❌ 中文翻译到日语失败: ${word}`);
            // 翻译失败时继续正常搜索流程
          }
        } else {
          // 目标语言是中文，直接查询中文词汇详情
          const safeAppLanguage = appLanguage || 'en-US';
          console.log(`🔍 使用安全的appLanguage: ${safeAppLanguage}`);
          
          // 使用统一的中文词汇查询API
          const result = await wordService.getChineseWordDetails(word, safeAppLanguage);
          if (result.success && result.data) {
            console.log(`✅ 获取中文词汇详细信息成功: ${word}`);
            console.log(`🔍 设置searchResult数据:`, result.data);
            setSearchResult(result.data);
            setSearchText('');
            
            // 保存搜索历史
            const definition = result.data.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : t('no_definition', 'zh-CN');
            await wordService.saveSearchHistory(word, definition);
            setRecentWords(prev => {
              const filtered = prev.filter(w => w.word !== word);
              return [
                {
                  id: Date.now().toString(),
                  word: word,
                  translation: definition,
                  timestamp: Date.now(),
                },
                ...filtered
              ];
            });
          } else {
            console.log(`❌ 查询中文词汇详细信息失败: ${word}`);
            Alert.alert('错误', '查询失败，请重试');
          }
          setIsLoading(false);
          return;
        }
      } else if (appLanguage === 'en-US' && selectedLanguage === 'CHINESE') {
        // 英文界面下选择中文目标语言，所有输入都当作拼音处理
        console.log(`🔍 英文界面+中文目标语言，输入当作拼音处理: ${word}`);
        console.log(`🔍 appLanguage: ${appLanguage}, selectedLanguage: ${selectedLanguage}`);
        console.log(`🔍 进入拼音搜索分支`);
        
        // 检查缓存
        if (pinyinCache[word.toLowerCase()]) {
          const candidates = pinyinCache[word.toLowerCase()];
          const chineseWords = candidates.map(item => item.chinese);
          setPinyinCandidates(chineseWords);
          setPinyinQuery(word);
          console.log(`✅ 缓存拼音候选词: ${word} -> ${chineseWords.join(', ')}`);
          setIsLoading(false);
          return;
        }
        
        // 调用拼音候选词API
        try {
          const response = await fetch(`${API_BASE_URL}/pinyin/candidates/${word.toLowerCase()}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.candidates && result.data.candidates.length > 0) {
              // 缓存结果
              setPinyinCache(prev => ({
                ...prev,
                [word.toLowerCase()]: result.data.candidates
              }));
              
              const chineseWords = result.data.candidates.map((item: any) => item.chinese);
              setPinyinCandidates(chineseWords);
              setPinyinQuery(word);
              console.log(`✅ API返回拼音候选词: ${word} -> ${chineseWords.join(', ')}`);
          setIsLoading(false);
          return;
        } else {
              console.log(`❌ API返回空候选词: ${word}`);
              Alert.alert('提示', '未找到该拼音的候选词');
          setIsLoading(false);
          return;
        }
          } else {
            console.log(`❌ 拼音API调用失败: ${response.status}`);
            Alert.alert('错误', '拼音候选词服务暂时不可用');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.log(`❌ 拼音候选词API调用失败: ${error}`);
          Alert.alert('错误', '网络连接失败，请稍后重试');
          setIsLoading(false);
          return;
        }
      } else if (isEnglish(word) && appLanguage === 'en-US') {
        // 英文界面下输入英文单词，根据目标语言显示翻译弹窗
        console.log(`🔍 英文界面输入英文单词: ${word}`);
        console.log(`🔍 selectedLanguage: ${selectedLanguage}`);
        
        if (selectedLanguage === 'JAPANESE') {
          // 目标语言是日语，显示日语翻译弹窗
          const translationResult = await wordService.translateEnglishToJapanese(word);
          
          if (translationResult.success && translationResult.candidates.length > 0) {
            setEnToJaCandidates(translationResult.candidates);
            setEnToJaQuery(word);
            const translation = translationResult.candidates.join(', ');
            console.log(`✅ 英文翻译到日语结果: ${word} -> ${translation}`);
            setIsLoading(false);
            return;
          } else {
            console.log(`❌ 英文翻译到日语失败: ${word}`);
            // 翻译失败时继续正常搜索流程
          }
        } else {
          // 目标语言是中文，显示中文翻译弹窗
          const translationResult = await wordService.translateEnglishToChinese(word);
          
          if (translationResult.success && translationResult.candidates.length > 0) {
            setEnToChCandidates(translationResult.candidates);
            setEnToChQuery(word);
            const translation = translationResult.candidates.join(', ');
            console.log(`✅ 英文翻译结果: ${word} -> ${translation}`);
            setIsLoading(false);
            return;
          } else {
            console.log(`❌ 英文翻译失败: ${word}`);
            // 翻译失败时继续正常搜索流程
          }
        }
      } else if (isPinyin(word) && appLanguage === 'en-US') {
        if (selectedLanguage === 'CHINESE') {
          // 英文界面下输入拼音，目标语言是中文，直接翻译
          console.log(`🔍 英文界面+中文目标语言，输入当作拼音处理: ${word}`);
          console.log(`🔍 appLanguage: ${appLanguage}, selectedLanguage: ${selectedLanguage}`);
          console.log(`🔍 进入拼音翻译分支`);
          
          // 使用统一查询服务处理拼音输入
          const targetLanguageCode = SUPPORTED_LANGUAGES[selectedLanguage].code;
          const queryResult = await unifiedQueryService.query(word, appLanguage || 'en-US', targetLanguageCode);
          
          if (queryResult.type === 'translation') {
            console.log(`✅ 拼音翻译成功:`, queryResult.data);
            setSearchResult(queryResult.data);
            setSearchText('');
            setIsLoading(false);
            return;
          }
        } else {
          // 英文界面下输入拼音，且目标语言不是中文，显示中文候选词弹窗
          console.log(`🔍 英文界面输入拼音，显示中文候选词: ${word}`);
          console.log(`🔍 isPinyin(${word}): ${isPinyin(word)}`);
          console.log(`🔍 appLanguage: ${appLanguage}, selectedLanguage: ${selectedLanguage}`);
          console.log(`🔍 进入拼音搜索分支`);
        
        // 检查缓存
        if (pinyinCache[word.toLowerCase()]) {
          const candidates = pinyinCache[word.toLowerCase()];
          const chineseWords = candidates.map(item => item.chinese);
          setPinyinCandidates(chineseWords);
          setPinyinQuery(word);
          console.log(`✅ 缓存拼音候选词: ${word} -> ${chineseWords.join(', ')}`);
          setIsLoading(false);
          return;
        }
        
        // 调用拼音候选词API
        try {
          const response = await fetch(`${API_BASE_URL}/pinyin/candidates/${word.toLowerCase()}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.candidates && result.data.candidates.length > 0) {
              // 缓存结果
              setPinyinCache(prev => ({
                ...prev,
                [word.toLowerCase()]: result.data.candidates
              }));
              
              const chineseWords = result.data.candidates.map((item: any) => item.chinese);
              setPinyinCandidates(chineseWords);
              setPinyinQuery(word);
              console.log(`✅ API返回拼音候选词: ${word} -> ${chineseWords.join(', ')}`);
              setIsLoading(false);
              return;
            } else {
              console.log(`❌ API返回空候选词: ${word}`);
              Alert.alert('提示', '未找到该拼音的候选词');
              setIsLoading(false);
              return;
            }
          } else {
            console.log(`❌ 拼音API调用失败: ${response.status}`);
            Alert.alert('错误', '拼音候选词服务暂时不可用');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.log(`❌ 拼音候选词API调用失败: ${error}`);
          Alert.alert('错误', '网络连接失败，请稍后重试');
          setIsLoading(false);
          return;
        }
      }
      }
      
      // 使用当前选择的目标语言进行搜索
      const currentLanguageConfig = getCurrentLanguageConfig();
      // 添加安全检查
      if (!currentLanguageConfig) {
        console.error('❌ 无法获取当前语言配置');
        Alert.alert('错误', '无法获取语言配置，请重试');
        setIsLoading(false);
        return;
      }
      
      const targetLanguage = currentLanguageConfig.code;
      console.log('🔍 搜索参数:', { word, targetLanguage, uiLanguage: appLanguage });
      const result = await wordService.searchWord(word.toLowerCase(), targetLanguage, appLanguage);
      if (result.success && result.data) {
        if (result.data?.definitions) {
          result.data.definitions.forEach((def: any, idx: number) => {
            console.log(`释义[${idx}]:`, def.definition);
            if (def.examples) {
              def.examples.forEach((ex: any, exIdx: number) => {
                if (typeof ex === 'object') {
                  console.log(`例句[${idx}-${exIdx}]:`, ex.english, '|', ex.chinese);
                } else {
                  console.log(`例句[${idx}-${exIdx}]:`, ex);
                }
              });
            }
          });
        }
        await wordService.saveSearchHistory(
          (result.data?.correctedWord || result.data?.word)?.trim().toLowerCase(),
          result.data?.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : t('no_definition', appLanguage)
        );
        setRecentWords(prev => {
          const filtered = prev.filter(w => (w.word.trim().toLowerCase() !== ((result.data?.correctedWord || result.data?.word) ? (result.data?.correctedWord || result.data?.word).trim().toLowerCase() : '')));
          return [
            {
              id: Date.now().toString(),
              word: ((result.data?.correctedWord || result.data?.word) ? (result.data?.correctedWord || result.data?.word).trim().toLowerCase() : ''),
              translation: result.data?.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : t('no_definition', appLanguage),
              timestamp: Date.now(),
            },
            ...filtered
          ];
        });
        setSearchResult(result.data);
        setSearchText('');
      } else {
        Alert.alert(t('query_failed', appLanguage), result.error || t('word_not_found', appLanguage));
      }
    } catch (error) {
      console.error('搜索失败:', error);
      Alert.alert(t('search_failed', appLanguage), t('network_error', appLanguage));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理歧义选择
  const handleAmbiguousChoice = async (option: { type: 'dictionary' | 'translation'; data: any }) => {
    setShowAmbiguousChoice(false);
    setIsLoading(true);

    try {
      if (option.type === 'dictionary') {
        // 词典结果：转换为WordData格式
        if (option.data && option.data.length > 0) {
          const firstResult = option.data[0];
          const wordData = {
            word: firstResult.kanji || firstResult.reading,
            language: 'ja',
            phonetic: firstResult.reading,
            kana: firstResult.reading,
            definitions: firstResult.senses.map((sense: any) => ({
              partOfSpeech: sense.pos[0] || 'n.',
              definition: sense.glosses[0] || 'No definition available',
              examples: []
            }))
          };
          setSearchResult(wordData);
          setSearchText('');
        }
      } else if (option.type === 'translation') {
        // 翻译结果：直接查询被选中的词
        console.log(`🔍 处理翻译类型的歧义选择:`, option.data);
        
        // 检查option.data是否已经包含完整的wordData信息
        if (option.data && option.data.correctedWord && option.data.definitions) {
          // option.data已经是完整的wordData，直接使用
          console.log(`✅ 使用完整的词卡数据: ${option.data.correctedWord}`);
          
          // 🔧 移除candidates字段，避免显示候选词按钮（用户已经通过歧义选择选择了词）
          const { candidates, ...wordDataWithoutCandidates } = option.data;
          setSearchResult(wordDataWithoutCandidates);
          setSearchText('');
        } else if (option.data && typeof option.data === 'string') {
          // option.data是一个词，需要查询详细信息
          console.log(`🔍 查询被选中的词: ${option.data}`);
          const safeAppLanguage = appLanguage || 'en-US';
          const result = await wordService.getChineseWordDetails(option.data, safeAppLanguage);
          
          if (result.success && result.data) {
            setSearchResult(result.data);
            setSearchText('');
          } else {
            Alert.alert('查询失败', '无法获取词汇详情，请重试');
          }
        } else {
          // 处理旧格式：option.data是候选词数组
          console.log(`⚠️ 使用旧格式的候选词数组`);
          if (option.data && option.data.length > 0) {
            if (selectedLanguage === 'JAPANESE') {
              setEnToJaCandidates(option.data);
              setEnToJaQuery(ambiguousInput);
            } else {
              setEnToChCandidates(option.data);
              setEnToChQuery(ambiguousInput);
            }
          }
        }
      }
    } catch (error) {
      console.error('处理歧义选择失败:', error);
      Alert.alert('错误', '处理选择失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 点击历史词
  const handleRecentWordPress = async (word: RecentWord) => {
    // 新增：如果有 candidates，弹出候选词卡片
    if (word.candidates && word.candidates.length > 0) {
      setChToEnCandidates(word.candidates);
      setChToEnQuery(word.word);
      setSearchResult(null);
      setSearchText('');
      return;
    }
    
    // 使用当前选择的目标语言进行搜索
    const searchWord = word.word.trim().toLowerCase();
    setIsLoading(true);
    setSearchResult(null);
    
    try {
      const currentLanguageConfig = getCurrentLanguageConfig();
      // 添加安全检查
      if (!currentLanguageConfig) {
        console.error('❌ 无法获取当前语言配置');
        Alert.alert('错误', '无法获取语言配置，请重试');
        setIsLoading(false);
        return;
      }
      
      const targetLanguage = currentLanguageConfig.code;
      console.log('🔍 历史词搜索参数:', { word: searchWord, targetLanguage, uiLanguage: appLanguage });
      
      // 调试：显示缓存键生成过程
      const cacheKey = `${searchWord}_${targetLanguage}_${appLanguage}`;
      console.log('🔍 尝试查找缓存键:', cacheKey);
      
      // 优先尝试从缓存获取数据，传递正确的语言参数
      const cachedResult = await wordService.getWordDetail(searchWord, targetLanguage, appLanguage);
      if (cachedResult) {
        console.log('✅ 从缓存获取到历史词数据:', cachedResult);
        
        // 检查缓存数据是否完整（翻译结果是否完整）
        const isTranslationComplete = cachedResult.correctedWord && 
                                    cachedResult.correctedWord !== cachedResult.word &&
                                    cachedResult.translation;
        
        if (isTranslationComplete) {
          console.log('✅ 缓存数据完整，直接使用');
          
          // 添加候选词选择回调
          const resultWithCallback = {
            ...cachedResult,
            onCandidateSelect: createCandidateSelectHandler(searchWord, cachedResult.candidates)
          };
          
          setSearchResult(resultWithCallback);
          setIsLoading(false);
          return;
        } else {
          console.log('⚠️ 缓存数据不完整，重新翻译');
        }
      }
      
      // 缓存中没有数据或数据不完整，使用统一查询服务重新翻译
      console.log('📡 缓存无数据或数据不完整，使用统一查询服务重新翻译');
      const queryResult = await unifiedQueryService.query(searchWord, appLanguage || 'en-US', targetLanguage);
      
      if (queryResult.type === 'translation') {
        console.log('✅ 统一查询返回翻译结果:', queryResult.data);
        
        // 添加候选词选择回调
        const resultWithCallback = {
          ...queryResult.data,
          onCandidateSelect: createCandidateSelectHandler(searchWord, queryResult.data.candidates)
        };
        
        setSearchResult(resultWithCallback);
        
        // 更新搜索历史
        const translationResult = queryResult.data.correctedWord || queryResult.data.translation || '';
        const pinyin = queryResult.data.pinyin || queryResult.data.phonetic || '';
        const englishDefinition = queryResult.data.definitions?.[0]?.definition || '';
        await wordService.saveSearchHistory(searchWord, translationResult, undefined, pinyin, englishDefinition);
      } else {
        console.error('❌ 统一查询失败，降级到传统搜索');
        const result = await wordService.searchWord(searchWord, targetLanguage, appLanguage);
        if (result.success && result.data) {
          // 为传统搜索结果也添加候选词选择回调
          const resultWithCallback = {
            ...result.data,
            onCandidateSelect: createCandidateSelectHandler(searchWord, result.data.candidates)
          };
          setSearchResult(resultWithCallback);
        } else {
          Alert.alert(t('query_failed', appLanguage), t('get_word_detail_failed', appLanguage));
        }
      }
    } catch (error) {
      console.error('❌ 获取单词详情失败:', error);
      Alert.alert(t('query_failed', appLanguage), t('network_error', appLanguage));
    } finally {
      setIsLoading(false);
    }
  };


  // 收藏按钮高亮逻辑
  const isCollected = searchResult && vocabulary.some(w => w.word.trim().toLowerCase() === searchResult.word.trim().toLowerCase());

  // 收藏按钮点击
  const handleCollect = async () => {
    console.log('[HomeScreen] 用户点击收藏按钮，检查词汇本权限');
    
    // 检查词汇本功能权限
    const canAccess = await FeatureAccessService.checkAndHandleAccess('vocabulary');
    if (!canAccess) {
      console.log('[HomeScreen] 词汇本功能被锁定，已显示升级弹窗');
      return;
    }
    
    console.log('[HomeScreen] 词汇本功能权限通过，显示标记单词来源弹窗');
    setShowCollectModal(true);
  };

  // 修改 handleCreateWordbook：只新建单词本并选中，不添加单词
  const handleCreateWordbook = () => {
    if (!newWordbookName.trim()) {
      Alert.alert(t('please_enter_wordbook_name', appLanguage));
      return;
    }
    const newId = Date.now();
    const newWordbook = {
      id: newId,
      name: newWordbookName,
      original_name: newWordbookName,
      overview: '',
      first_air_date: '',
      last_air_date: '',
      status: 'plan_to_watch' as 'plan_to_watch',
      type: 'wordbook',
      vote_average: 0,
      vote_count: 0,
      popularity: 0,
      poster_path: '',
      backdrop_path: '',
      original_language: '',
      origin_country: [],
      wordCount: 0,
      icon: 'book',
    };
    addShow(newWordbook);
    setSelectedShow(newWordbook);
    setIsCreatingWordbook(false);
    setNewWordbookName('');
  };

  // 修改 handleConfirmCollect：添加单词并显示打勾动画
  const handleConfirmCollect = () => {
    if (searchResult && selectedShow) {
      // 统一处理单词为小写+trim
      const normalizedWord = searchResult.word.trim().toLowerCase();
      const normalizedResult = { ...searchResult, word: normalizedWord };
      addWord(normalizedResult, selectedShow);
      setShowCollectModal(false);
      setShowCheckAnimation(true);
      Animated.sequence([
        Animated.timing(checkScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(700),
      ]).start(() => {
        setShowCheckAnimation(false);
        checkScale.setValue(0);
      });
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
    const newShow = { ...show, status: 'watching' as const, wordCount: 0 };
    addShow(newShow);
    setSelectedShow(newShow);
    setSearchShowText('');
    setSearchResults([]);
  };

  // 显示新建单词本输入框
  const showCreateWordbookInput = () => {
    setIsCreatingWordbook(true);
    setNewWordbookName('');
  };

  // 取消新建单词本
  const cancelCreateWordbook = () => {
    setIsCreatingWordbook(false);
    setNewWordbookName('');
  };

  const handlePlayAudio = async (word: string) => {
    console.log('🎵 开始播放音频 - 单词:', word);
    console.log('🎵 音频URL:', searchResult?.audioUrl);
    
    try {
      if (!searchResult?.audioUrl) {
        console.warn('⚠️ 没有音频URL');
        Alert.alert(t('no_audio_resource', appLanguage), t('no_audio_resource_message', appLanguage));
        return;
      }

      console.log('🎵 准备创建音频实例...');
      const { sound } = await Audio.Sound.createAsync({ 
        uri: searchResult.audioUrl 
      });
      console.log('🎵 音频实例创建成功');

      // 设置播放状态监听
      sound.setOnPlaybackStatusUpdate((status: any) => {
        console.log('🎵 播放状态更新:', {
          isLoaded: status.isLoaded,
          isPlaying: status.isPlaying,
          didJustFinish: status.didJustFinish,
          error: status.error,
          durationMillis: status.durationMillis,
          positionMillis: status.positionMillis
        });

        if (status.isLoaded) {
          if (status.didJustFinish) {
            console.log('🎵 播放完成');
          }
        } else if (status.error) {
          console.error('🎵 播放出错:', status.error);
          Alert.alert(t('play_error', appLanguage), `错误信息: ${status.error}`);
        }
      });

      console.log('🎵 开始播放...');
      await sound.playAsync();
      console.log('🎵 播放命令已发送');

    } catch (error) {
      console.error('🎵 播放异常:', error);
      console.error('🎵 错误详情:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        word: word,
        audioUrl: searchResult?.audioUrl
      });
      
      Alert.alert(
        t('play_failed', appLanguage), 
        `无法播放发音\n\n错误信息: ${error instanceof Error ? error.message : String(error)}\n\n音频URL: ${searchResult?.audioUrl}`
      );
    }
  };

  useEffect(() => {
    if (searchResult) {
      console.log('WordCard audioUrl:', searchResult?.audioUrl);
    }
  }, [searchResult]);

  const handleClearSearchHistory = async () => {
              Alert.alert(
      t('clear_history', appLanguage),
      t('confirm_clear_history', appLanguage),
    [
      { text: t('cancel', appLanguage), style: 'cancel' },
      { 
        text: t('confirm', appLanguage), 
        style: 'destructive', 
        onPress: async () => {
          try {
            const success = await wordService.clearSearchHistory();
            if (success) {
              setRecentWords([]);
              Alert.alert(t('clear_history_success', appLanguage));
            } else {
              Alert.alert(t('clear_history_failed', appLanguage));
            }
          } catch (error) {
            console.error('清除搜索历史失败:', error);
            Alert.alert(t('clear_history_failed', appLanguage));
          }
        }
      },
    ]
  );
  };

  const getSearchPlaceholder = () => {
    const languageConfig = getCurrentLanguageConfig();
    switch (languageConfig.code) {
      case 'en':
        return t('search_english_placeholder', appLanguage);
      case 'ko':
        return t('search_korean_placeholder', appLanguage);
      case 'ja':
        return t('search_japanese_placeholder', appLanguage);
      default:
        return t('search_placeholder', appLanguage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 打勾动画全局渲染，确保在 Modal 之上 */}
      {showCheckAnimation && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          backgroundColor: 'rgba(255,255,255,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Ionicons name="checkmark-circle" size={90} color="#2ecc71" />
          </Animated.View>
        </View>
      )}
      {/* 庆祝弹窗动画 */}
      {showBadgeCelebrate && celebrateBadge && (
        <View style={[styles.celebrateOverlay, { pointerEvents: 'none' }]}>
          <View style={styles.celebrateBox}>
            <Text style={styles.celebrateEmoji}>🎉</Text>
            <Text style={styles.celebrateText}>{t('badge_unlocked', appLanguage, { count: celebrateBadge })}</Text>
          </View>
        </View>
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 搜索栏 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            {/* 语言选择器 */}
            <LanguagePicker onNavigateToLanguageSettings={handleNavigateToLanguageSettings} onLanguageChange={handleLanguageChange} />
            {/* 搜索输入框 */}
            <View style={styles.searchInputContainer}>
              {searchResult ? (
                <>
                  <Text style={styles.searchResultWord}>{searchResult.correctedWord || searchResult.word}</Text>
                  <TouchableOpacity onPress={() => setSearchResult(null)} style={styles.clearButton}>
                    <Ionicons name="close" size={22} color={colors.text.secondary} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput
                    style={styles.searchInput}
                    placeholder={getSearchPlaceholder()}
                    placeholderTextColor={colors.text.tertiary}
                    value={searchText}
                    onChangeText={handleInputChange}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    onFocus={() => console.log('🔍 搜索框获得焦点')}
                    onBlur={() => console.log('🔍 搜索框失去焦点')}
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
              {/* 搜索图标移到最右边 */}
              <TouchableOpacity onPress={handleSearch} style={styles.searchIcon}>
                <Ionicons name="search" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* 内容区：有查词结果时只显示卡片，否则显示最近查词 */}
        {enToChCandidates.length > 0 ? (
          <View style={styles.wordCardWrapper}>
            <View style={[styles.wordCardCustom, styles.fixedCandidateCard] }>
              {/* 关闭按钮 */}
              <TouchableOpacity style={styles.closeButton} onPress={() => { setEnToChCandidates([]); setEnToChQuery(''); }}>
                <Ionicons name="close" size={26} color={colors.text.secondary} />
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginBottom: 16, marginTop: 8 }}>
                "{enToChQuery}"{t('english_to_chinese', appLanguage)}
              </Text>
              {enToChCandidates.map((chinese, idx) => (
                <TouchableOpacity key={chinese} onPress={async () => {
                  setIsLoading(true);
                  setEnToChCandidates([]);
                  setEnToChQuery('');
                  setSearchText(chinese);
                  // 切换到中文搜索界面
                  setSelectedLanguage('CHINESE');
                  console.log(`🔍 点击英文翻译候选词: ${chinese}`);
                  
                  // 安全检查appLanguage
                  const safeAppLanguage = appLanguage || 'en-US';
                  
                  // 使用统一的中文词汇查询API
                  const result = await wordService.getChineseWordDetails(chinese, safeAppLanguage);
                  if (result.success && result.data) {
                    setSearchResult(result.data);
                    setSearchText('');
                    // 将中文查词加入最近查词历史
                    const definition = result.data.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : t('no_definition', 'zh-CN');
                    await wordService.saveSearchHistory(chinese, definition);
                    setRecentWords(prev => {
                      const filtered = prev.filter(w => w.word !== chinese);
                      return [
                        {
                          id: Date.now().toString(),
                          word: chinese,
                          translation: definition,
                          timestamp: Date.now(),
                        },
                        ...filtered
                      ];
                    });
                  } else {
                    console.log(`❌ 查询中文词汇详细信息失败: ${chinese}`);
                    Alert.alert('错误', '查询失败，请重试');
                  }
                  setIsLoading(false);
                }} style={{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 16, backgroundColor: colors.primary[50], marginBottom: 10 }}>
                  <Text style={{ fontSize: 18, color: colors.primary[700], fontWeight: '500' }}>{chinese}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
            ) : chToJaCandidates.length > 0 ? (
              <View style={styles.wordCardWrapper}>
                <View style={[styles.wordCardCustom, styles.fixedCandidateCard] }>
                  {/* 关闭按钮 */}
                  <TouchableOpacity style={styles.closeButton} onPress={() => { setChToJaCandidates([]); setChToJaQuery(''); }}>
                    <Ionicons name="close" size={26} color={colors.text.secondary} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginBottom: 16, marginTop: 8 }}>
                    "{chToJaQuery}" 的日语翻译
                  </Text>
                  {chToJaCandidates.map((japanese, idx) => (
                    <TouchableOpacity key={japanese} onPress={async () => {
                      setIsLoading(true);
                      setChToJaCandidates([]);
                      setChToJaQuery('');
                      setSearchText(japanese);
                      // 切换到日语搜索界面
                      setSelectedLanguage('JAPANESE');
                      console.log(`🔍 点击中文翻译候选词: ${japanese}`);
                      
                      // 使用日语词汇查询API
                      const result = await wordService.searchWord(japanese, 'ja', appLanguage || 'en-US');
                      if (result.success && result.data) {
                        setSearchResult(result.data);
                        setSearchText('');
                        const definition = result.data.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : t('no_definition', 'zh-CN');
                        await wordService.saveSearchHistory(japanese, definition);
                        setRecentWords(prev => {
                          const filtered = prev.filter(w => w.word !== japanese);
                          return [
                            {
                              id: Date.now().toString(),
                              word: japanese,
                              translation: definition,
                              timestamp: Date.now(),
                            },
                            ...filtered
                          ];
                        });
                      } else {
                        console.log(`❌ 查询日语词汇详细信息失败: ${japanese}`);
                        Alert.alert('错误', '查询失败，请重试');
                      }
                      setIsLoading(false);
                    }} style={{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 16, backgroundColor: colors.primary[50], marginBottom: 10 }}>
                      <Text style={{ fontSize: 18, color: colors.primary[700], fontWeight: '500' }}>{japanese}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : enToJaCandidates.length > 0 ? (
              <View style={styles.wordCardWrapper}>
                <View style={[styles.wordCardCustom, styles.fixedCandidateCard] }>
                  {/* 关闭按钮 */}
                  <TouchableOpacity style={styles.closeButton} onPress={() => { setEnToJaCandidates([]); setEnToJaQuery(''); }}>
                    <Ionicons name="close" size={26} color={colors.text.secondary} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginBottom: 16, marginTop: 8 }}>
                    "{enToJaQuery}" 的日语翻译
                  </Text>
                  {enToJaCandidates.map((japanese, idx) => (
                    <TouchableOpacity key={japanese} onPress={async () => {
                      setIsLoading(true);
                      setEnToJaCandidates([]);
                      setEnToJaQuery('');
                      setSearchText(japanese);
                      // 切换到日语搜索界面
                      setSelectedLanguage('JAPANESE');
                      console.log(`🔍 点击英文翻译候选词: ${japanese}`);
                      
                      // 使用日语词汇查询API
                      const result = await wordService.searchWord(japanese, 'ja', appLanguage || 'en-US');
                      if (result.success && result.data) {
                        setSearchResult(result.data);
                        setSearchText('');
                        const definition = result.data.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : t('no_definition', 'zh-CN');
                        await wordService.saveSearchHistory(japanese, definition);
                        setRecentWords(prev => {
                          const filtered = prev.filter(w => w.word !== japanese);
                          return [
                            {
                              id: Date.now().toString(),
                              word: japanese,
                              translation: definition,
                              timestamp: Date.now(),
                            },
                            ...filtered
                          ];
                        });
                      } else {
                        console.log(`❌ 查询日语词汇详细信息失败: ${japanese}`);
                        Alert.alert('错误', '查询失败，请重试');
                      }
                      setIsLoading(false);
                    }} style={{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 16, backgroundColor: colors.primary[50], marginBottom: 10 }}>
                      <Text style={{ fontSize: 18, color: colors.primary[700], fontWeight: '500' }}>{japanese}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : pinyinCandidates.length > 0 ? (
              <View style={styles.wordCardWrapper}>
                <View style={[styles.wordCardCustom, styles.fixedCandidateCard] }>
                  {/* 关闭按钮 */}
                  <TouchableOpacity style={styles.closeButton} onPress={() => { setPinyinCandidates([]); setPinyinQuery(''); }}>
                    <Ionicons name="close" size={26} color={colors.text.secondary} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginBottom: 16, marginTop: 8 }}>
                    "{pinyinQuery}" 的中文候选词
                  </Text>
                  {pinyinCandidates.map((chinese, idx) => {
                    // 获取对应的英文释义
                    const candidates = pinyinCache[pinyinQuery.toLowerCase()];
                    const candidate = candidates ? candidates.find(item => item.chinese === chinese) : null;
                    const englishMeaning = candidate ? candidate.english : '';
                    
                    return (
                      <TouchableOpacity key={chinese} onPress={async () => {
                        setIsLoading(true);
                        setPinyinCandidates([]);
                        setPinyinQuery('');
                        setSearchText(chinese);
                        // 切换到中文搜索界面
                        setSelectedLanguage('CHINESE');
                        console.log(`🔍 点击拼音候选词: ${chinese}`);
                        
                        // 安全检查appLanguage
                        const safeAppLanguage = appLanguage || 'en-US';
                        
                        // 使用新的中文词汇查询API
                        const result = await wordService.getChineseWordDetails(chinese, safeAppLanguage);
                        if (result.success && result.data) {
                          setSearchResult(result.data);
                          setSearchText('');
                          const definition = result.data.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : t('no_definition', 'zh-CN');
                          await wordService.saveSearchHistory(chinese, definition);
                          setRecentWords(prev => {
                            const filtered = prev.filter(w => w.word !== chinese);
                            return [
                              {
                                id: Date.now().toString(),
                                word: chinese,
                                translation: definition,
                                timestamp: Date.now(),
                              },
                              ...filtered
                            ];
                          });
                        } else {
                          console.log(`❌ 查询中文词汇详细信息失败: ${chinese}`);
                          Alert.alert('错误', '查询失败，请重试');
                        }
                        setIsLoading(false);
                      }} style={{ paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16, backgroundColor: colors.primary[50], marginBottom: 10 }}>
                        <Text style={{ fontSize: 18, color: colors.primary[700], fontWeight: '500', marginBottom: 2 }}>{chinese}</Text>
                        {englishMeaning && (
                          <Text style={{ fontSize: 14, color: colors.primary[600], fontStyle: 'italic' }}>{englishMeaning}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
        ) : chToEnCandidates.length > 0 ? (
          <View style={styles.wordCardWrapper}>
            <View style={[styles.wordCardCustom, styles.fixedCandidateCard] }>
              {/* 关闭按钮 */}
              <TouchableOpacity style={styles.closeButton} onPress={() => { setChToEnCandidates([]); setChToEnQuery(''); }}>
                <Ionicons name="close" size={26} color={colors.text.secondary} />
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginBottom: 16, marginTop: 8 }}>
                "{chToEnQuery}"{t('chinese_to_target', appLanguage, { target: getCurrentLanguageConfig()?.name || t('target_language', appLanguage) })}
              </Text>
              {chToEnCandidates.map((en, idx) => (
                <TouchableOpacity key={en} onPress={async () => {
                  setIsLoading(true);
                  setChToEnCandidates([]);
                  setChToEnQuery('');
                  setSearchText(en);
                  // 使用当前选择的目标语言进行搜索
                  const currentLanguageConfig = getCurrentLanguageConfig();
                  // 添加安全检查
                  if (!currentLanguageConfig) {
                    console.error('❌ 无法获取当前语言配置');
                    Alert.alert(t('error', appLanguage), t('language_config_error', appLanguage));
                    setIsLoading(false);
                    return;
                  }
                  
                  const targetLanguage = currentLanguageConfig.code;
                  console.log('🔍 候选词搜索参数:', { word: en, targetLanguage, uiLanguage: appLanguage });
                  const result = await wordService.searchWord(en.toLowerCase(), targetLanguage, appLanguage);
                  if (result.success && result.data) {
                    setSearchResult(result.data);
                    setSearchText('');
                    // 新增：将英文查词也加入最近查词历史
                    const definition = result.data.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : t('no_definition', appLanguage);
                    await wordService.saveSearchHistory(en, definition);
                    setRecentWords(prev => {
                      const filtered = prev.filter(w => w.word !== en);
                      return [
                        {
                          id: Date.now().toString(),
                          word: en,
                          translation: definition,
                          timestamp: Date.now(),
                        },
                        ...filtered
                      ];
                    });
                  } else {
                    Alert.alert('查询失败', result.error || '无法找到该单词');
                  }
                  setIsLoading(false);
                }} style={{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 16, backgroundColor: colors.primary[50], marginBottom: 10 }}>
                  <Text style={{ fontSize: 18, color: colors.primary[700], fontWeight: '500' }}>{en}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : showAmbiguousChoice ? (
          <AmbiguousChoiceCard
            options={Array.isArray(ambiguousOptions) ? ambiguousOptions : []}
            onSelect={handleAmbiguousChoice}
            onClose={() => setShowAmbiguousChoice(false)}
            input={ambiguousInput}
          />
        ) : searchResult ? (
          <View style={styles.wordCardWrapper}>
            <WordCard
              wordData={searchResult}
              onIgnore={() => setSearchResult(null)}
              onCollect={handleCollect}
              onPlayAudio={handlePlayAudio}
            />
          </View>
        ) : searchSuggestions.length > 0 ? (
          <View style={styles.wordCardWrapper}>
            <View style={[styles.wordCardCustom, { alignItems: 'center', justifyContent: 'center', padding: 32, borderRadius: 20, backgroundColor: colors.background.secondary, shadowColor: colors.neutral[900], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8, maxWidth: 350, minHeight: 220 }] }>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginBottom: 16 }}>{t('search_suggestions', appLanguage)}</Text>
              {searchSuggestions.map(sug => (
                <TouchableOpacity key={sug} onPress={() => { setSearchText(sug); setSearchSuggestions([]); setTimeout(() => handleSearch(), 0); }} style={{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 16, backgroundColor: colors.primary[50], marginBottom: 10 }}>
                  <Text style={{ fontSize: 18, color: colors.primary[700], fontWeight: '500' }}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <ScrollView style={styles.recentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>{t('recent_searches', appLanguage)}</Text>
                {recentWords.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearHistoryButton}
                    onPress={handleClearSearchHistory}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.text.secondary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.wordsContainer}>
                {isLoadingRecent ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary[500]} />
                    <Text style={styles.loadingText}>{t('loading', appLanguage)}</Text>
                  </View>
                ) : recentWords.length > 0 ? (
                  recentWords.map((word) => {
                    return (
                      <TouchableOpacity
                        key={word.id}
                        style={styles.recentWordItem}
                        onPress={() => handleRecentWordPress(word)}
                        disabled={isLoading}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Ionicons name="time-outline" size={18} color={colors.neutral[400]} style={{ marginRight: 8 }} />
                          <Text style={styles.recentWordText} numberOfLines={1} ellipsizeMode="tail">
                            <Text style={{ fontWeight: 'bold', color: colors.text.primary }}>
                              {word.word}
                            </Text>
                            {word.pinyin && (
                              <Text style={{ fontWeight: 'normal', color: colors.text.secondary }}>
                                {' - '}{word.pinyin}
                              </Text>
                            )}
                            {word.englishDefinition && (
                              <Text style={{ fontWeight: 'normal', color: colors.text.tertiary }}>
                                {' - '}{word.englishDefinition}
                              </Text>
                            )}
                            {!word.pinyin && !word.englishDefinition && (
                              <Text style={{ fontWeight: 'normal', color: colors.text.secondary }}>
                                {' - '}{word.translation}
                              </Text>
                            )}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
                    <Text style={styles.emptyStateText}>{t('no_recent_searches', appLanguage)}</Text>
                  </View>
                )}
                
                {/* Load More 按钮 */}
                {recentWords.length > 0 && hasMoreRecentWords && (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={loadMoreRecentWords}
                    disabled={isLoadingMoreRecent}
                  >
                    {isLoadingMoreRecent ? (
                      <ActivityIndicator size="small" color={colors.primary[500]} />
                    ) : (
                      <Text style={styles.loadMoreText}>
                        {appLanguage === 'zh-CN' ? '加载更多' : 'Load More'}
                      </Text>
                    )}
                  </TouchableOpacity>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={5}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.collectModal}>
              {/* 打勾动画 */}
              {/* 打勾动画 */}
              <Text style={styles.modalTitle}>{t('mark_word_source', appLanguage)}</Text>
              <Text style={styles.modalSubtitle}>{t('select_show_or_search', appLanguage)}</Text>
              {/* 剧集搜索框 */}
              <View style={styles.modalSearchBox}>
                <Ionicons name="search" size={18} color={colors.text.secondary} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder={t('search_shows_placeholder', appLanguage)}
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
              <Text style={styles.modalSectionTitle}>{t('my_shows', appLanguage)}</Text>
              {(() => {
                const wordbooks = shows.filter(s => s.type === 'wordbook');
                const allShows = shows.filter(s => s.type !== 'wordbook');
                const data = [
                  { id: 'default', name: t('default_vocabulary', appLanguage) }, 
                  ...wordbooks,
                  ...allShows
                ];
                console.log('🔍 调试信息 - 所有 shows:', shows);
                console.log('🔍 调试信息 - 单词本列表:', wordbooks);
                console.log('🔍 调试信息 - 所有剧集列表:', allShows);
                console.log('🔍 调试信息 - 最终数据源:', data);
                return (
                  <FlatList
                    data={data}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.modalShowItem,
                          selectedShow && selectedShow.id === item.id && styles.modalShowItemSelected,
                          // 移除 item.id === 'default' 和 wordbook 的边框，仅保留背景色高亮
                        ]}
                        onPress={() => setSelectedShow(item)}
                      >
                        <Text style={styles.modalShowName}>{item.name}</Text>
                        {/* 只保留单词本标签 */}
                        {'type' in item && item.type === 'wordbook' && <Text style={styles.wordbookTag}>{t('wordbook_tag', appLanguage)}</Text>}
                        {/* 不再显示“想看”标签 */}
                        {selectedShow && selectedShow.id === item.id && (
                          <Ionicons name="checkmark-circle" size={18} color={colors.primary[500]} style={{ marginLeft: 8 }} />
                        )}
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 160, marginBottom: 8 }}
                    ListEmptyComponent={<Text style={styles.modalEmptyText}>{t('no_shows_add_first', appLanguage)}</Text>}
                  />
                );
              })()}
              {/* 新建单词本按钮或输入框 */}
              {isCreatingWordbook ? (
                <View style={styles.createWordbookContainer}>
                  <View style={styles.createWordbookInputRow}>
                    <TextInput
                      style={styles.createWordbookInput}
                      placeholder={t('enter_wordbook_name', appLanguage)}
                      value={newWordbookName}
                      onChangeText={setNewWordbookName}
                      autoFocus={true}
                    />
                    <TouchableOpacity
                      style={styles.createWordbookConfirmButton}
                      onPress={handleCreateWordbook}
                    >
                      <Ionicons name="checkmark" size={20} color={colors.text.inverse} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.createWordbookCancelButton}
                      onPress={cancelCreateWordbook}
                    >
                      <Ionicons name="close" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary[50],
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                  onPress={showCreateWordbookInput}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary[500]} />
                  <Text style={{ color: colors.primary[700], fontSize: 15, marginTop: 2 }}>{t('create_wordbook', appLanguage)}</Text>
                </TouchableOpacity>
              )}

              {/* 按钮区 */}
              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowCollectModal(false)}>
                  <Text style={styles.modalCancelText}>{t('cancel', appLanguage)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, !selectedShow && { opacity: 0.5 }]}
                  onPress={handleConfirmCollect}
                  disabled={!selectedShow}
                >
                  <Text style={styles.modalConfirmText}>{t('confirm', appLanguage)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* 升级弹窗 */}
      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        feature={lockedFeature as any}
        onUpgrade={() => {
          console.log('[HomeScreen] 开始处理升级操作');
          setUpgradeModalVisible(false);
          console.log('[HomeScreen] 升级弹窗已关闭，准备导航到Subscription页面');
          try {
            navigate('Subscription');
            console.log('[HomeScreen] 导航到Subscription页面成功');
          } catch (error) {
            console.error('[HomeScreen] 导航到Subscription页面失败:', error);
          }
        }}
      />
      
      {/* 删除新建单词本弹窗，改为内联输入框 */}
      {/* <LanguageDebugInfo /> */}
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
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
      },
      default: {
        shadowColor: colors.primary[200],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  searchIcon: {
    marginLeft: 12,
    color: colors.primary[500],
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
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearHistoryButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
  },
  recentSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  wordsContainer: {
    gap: 12,
  },
  wordCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.1)',
      },
      default: {
        shadowColor: colors.primary[200],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
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
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(124, 58, 237, 0.15)',
      },
      default: {
        shadowColor: colors.primary[200],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
    padding: 28,
    marginVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  collectModal: {
    width: Math.round(Dimensions.get('window').width * 0.96),
    minHeight: 360,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
    alignItems: 'stretch',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 10px rgba(35, 34, 58, 0.1)',
      },
      default: {
        shadowColor: '#23223A',
        shadowOpacity: 0.10,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
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
    borderWidth: 1,
    borderColor: colors.border.light,
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
  createWordbookContainer: {
    marginBottom: 8,
  },
  createWordbookInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  createWordbookInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  createWordbookConfirmButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  createWordbookConfirmText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '500',
  },
  createWordbookCancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  createWordbookCancelText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  wordbookTag: {
    backgroundColor: colors.success[100],
    color: colors.success[800],
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusTag: {
    backgroundColor: colors.accent[100],
    color: colors.accent[700],
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  celebrateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  celebrateBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  celebrateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  celebrateText: {
    fontSize: 20,
    color: colors.primary[500],
    fontWeight: 'bold',
  },
  recentWordItem: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 2,
  },
  recentWordText: {
    fontSize: 17,
    color: colors.text.primary,
    marginBottom: 0,
    flex: 1,
  },
  loadMoreButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  loadMoreText: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '500',
  },
  fixedCandidateCard: {
    width: 340,
    minHeight: 260,
    maxWidth: 360,
    alignSelf: 'center',
    paddingTop: 18,
    paddingBottom: 32,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 4,
  },
});

export { HomeScreen }; 