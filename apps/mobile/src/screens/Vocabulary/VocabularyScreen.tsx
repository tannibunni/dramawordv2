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
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { audioService } from '../../services/audioService';
import { colors } from '../../constants/colors';
import { useVocabulary } from '../../context/VocabularyContext';
import WordCard from '../../components/cards/WordCard';
import WordCardContent from '../../components/cards/WordCardContent';
import WordList from '../../components/vocabulary/WordList';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from '../../constants/config';
import { TranslationKey } from '../../constants/translations';
import { wordService } from '../../services/wordService';
import { unifiedSyncService } from '../../services/unifiedSyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FeatureAccessService from '../../services/featureAccessService';
import { UpgradeModal } from '../../components/common/UpgradeModal';

const { width } = Dimensions.get('window');

interface Badge {
  id: number;
  count: number;
  unlocked: boolean;
}

const VocabularyScreen: React.FC = () => {
  const { vocabulary, removeWord, updateWord } = useVocabulary();
  const { appLanguage } = useAppLanguage();
  const { selectedLanguage } = useLanguage();
  const [searchText, setSearchText] = useState('');
  const [filteredWords, setFilteredWords] = useState<any[]>([]);
  const [selectedWord, setSelectedWord] = useState<any | null>(null);
  const [selectedWordDetail, setSelectedWordDetail] = useState<any | null>(null);
  const [isLoadingWordDetail, setIsLoadingWordDetail] = useState(false);
  const [showWordCard, setShowWordCard] = useState(false);
  // 新增：下拉预览逻辑
  const [previewList, setPreviewList] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  // 新增：庆祝弹窗
  const [showBadgeCelebrate, setShowBadgeCelebrate] = useState(false);
  const [celebrateBadge, setCelebrateBadge] = useState<null | number>(null);
  // 新增：搜索框展开状态
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  // 新增：语言筛选状态
  const [selectedFilterLanguage, setSelectedFilterLanguage] = useState<string>('');
  
  // 功能权限检查状态
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);



  // 徽章配置 - 使用 state 来保持状态
  const [badges, setBadges] = useState<Badge[]>([
    { id: 1, count: 10, unlocked: false },
    { id: 2, count: 20, unlocked: false },
    { id: 3, count: 50, unlocked: false },
    { id: 4, count: 100, unlocked: false },
    { id: 5, count: 200, unlocked: false },
    { id: 6, count: 500, unlocked: false },
    { id: 7, count: 1000, unlocked: false },
  ]);

  // 检查单词储存限制
  const checkWordStorageLimit = async () => {
    const canAccess = await FeatureAccessService.checkAndHandleAccess('vocabulary');
    if (!canAccess) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    filterWords();
    updateBadges();
  }, [vocabulary, searchText, selectedFilterLanguage]);

  // 设置功能权限检查的回调
  useEffect(() => {
    FeatureAccessService.setUpgradeModalCallback((feature) => {
      setLockedFeature(feature);
      setUpgradeModalVisible(true);
    });

    return () => {
      FeatureAccessService.setUpgradeModalCallback(undefined);
    };
  }, []);

  // 数据一致性验证
  useEffect(() => {
    if (selectedWord && selectedWordDetail) {
      // 验证数据一致性
      const isConsistent = selectedWord.word === selectedWordDetail.word;
      if (!isConsistent) {
        console.warn('⚠️ 数据不一致警告:', {
          selectedWord: selectedWord.word,
          selectedWordDetail: selectedWordDetail.word
        });
      } else {
        console.log('✅ 数据一致性验证通过:', selectedWord.word);
      }
      
      // 添加更详细的调试信息
      console.log('🔍 数据一致性详情:', {
        selectedWord: {
          word: selectedWord.word,
          definitions: selectedWord.definitions?.length || 0,
          sourceShow: selectedWord.sourceShow
        },
        selectedWordDetail: {
          word: selectedWordDetail.word,
          definitions: selectedWordDetail.definitions?.length || 0,
          sourceShow: selectedWordDetail.sourceShow
        }
      });
    }
  }, [selectedWord, selectedWordDetail]);

  // 新增：加载徽章数据
  useEffect(() => {
    loadBadgesFromStorage();
  }, []);

  // 从本地存储加载徽章数据
  const loadBadgesFromStorage = async () => {
    try {
      const storedBadges = await AsyncStorage.getItem('userBadges');
      if (storedBadges) {
        const parsedBadges = JSON.parse(storedBadges);
        setBadges(parsedBadges);
        console.log('📱 从本地存储加载徽章数据:', parsedBadges);
      }
    } catch (error) {
      console.error('❌ 加载徽章数据失败:', error);
    }
  };

  // 保存徽章数据到本地存储
  const saveBadgesToStorage = async (badgeData: Badge[]) => {
    try {
      await AsyncStorage.setItem('userBadges', JSON.stringify(badgeData));
      console.log('💾 徽章数据已保存到本地存储');
    } catch (error) {
      console.error('❌ 保存徽章数据失败:', error);
    }
  };

  // 同步徽章数据到服务器
  const syncBadgesToServer = async (badgeData: Badge[]) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        console.warn('用户未登录，无法同步徽章数据');
        return;
      }

      // 通过多邻国数据同步方案同步徽章数据
      await unifiedSyncService.addToSyncQueue({
        type: 'badges',
        data: {
          badges: badgeData,
          lastUpdated: Date.now()
        },
        userId,
        operation: 'update',
        priority: 'medium'
      });

      console.log(`🏅 徽章数据已加入同步队列: ${badgeData.filter(b => b.unlocked).length} 个已解锁徽章`);
    } catch (error) {
      console.error('❌ 同步徽章数据失败:', error);
    }
  };

  useEffect(() => {
    if (isEditing && searchText.trim()) {
      const searchKey = (searchText || '').trim().toLowerCase();
      // 使用去重后的词汇列表进行预览搜索
      const uniqueWords = vocabulary.reduce((acc: any[], current) => {
        const normalizedCurrentWord = (current.word || '').trim().toLowerCase();
        const exists = acc.find(item => (item.word || '').trim().toLowerCase() === normalizedCurrentWord);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      const preview = uniqueWords.filter(w => 
        (w.word || '').trim().toLowerCase().includes(searchKey) ||
        (w.correctedWord || '').trim().toLowerCase().includes(searchKey)
      );
      setPreviewList(preview.slice(0, 5));
    } else {
      setPreviewList([]);
    }
  }, [searchText, vocabulary, isEditing]);

  // 搜索和过滤时也统一小写和trim
  const filterWords = () => {
    // 改进的去重逻辑：只对完全相同的单词进行去重，避免错误合并包含关系的单词
    const uniqueWords = vocabulary.reduce((acc: any[], current) => {
      const normalizedCurrentWord = (current.word || '').trim().toLowerCase();
      
      // 检查是否已存在完全相同的单词（精确匹配）
      const existingIndex = acc.findIndex(item => {
        const existingWord = (item.word || '').trim().toLowerCase();
        return existingWord === normalizedCurrentWord;
      });
      
      if (existingIndex === -1) {
        // 新单词，直接添加
        acc.push(current);
      } else {
        // 已存在完全相同的单词，比较信息完整性，保留更完整的
        const existing = acc[existingIndex];
        const currentScore = getWordCompletenessScore(current);
        const existingScore = getWordCompletenessScore(existing);
        
        if (currentScore > existingScore) {
          // 当前单词信息更完整，替换
          acc[existingIndex] = current;
          console.log(`🔄 替换单词 "${existing.word}" 为 "${current.word}" (信息更完整)`);
        }
      }
      return acc;
    }, []);

    let filtered = uniqueWords;
    
    // 语言筛选：根据用户选择的筛选语言
    if (selectedFilterLanguage) {
      const languageCode = selectedFilterLanguage.toLowerCase();
      
      // 检查语言权限 - 暂时允许所有语言，后续可以添加语言权限检查
      // if (!canAccessLanguage(languageCode)) {
      //   return; // 不进行筛选，显示所有单词
      // }
      
      filtered = filtered.filter(word => {
        // 优先检查单词的语言属性（来自cloudwords或用户词汇表）
        if (word.language) {
          console.log(`[VocabularyScreen:filterWords] 单词 ${word.word} 的语言属性: ${word.language}, 筛选语言: ${languageCode}`);
          return word.language.toLowerCase() === languageCode;
        }
        
        // 如果没有明确的语言属性，则根据单词特征判断语言
        const wordText = word.word || '';
        let detectedLanguage = 'en'; // 默认英语
        
        // 检测单词语言特征
        if (/[\u4e00-\u9fa5]/.test(wordText)) {
          detectedLanguage = 'zh'; // 中文字符
        } else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(wordText)) {
          detectedLanguage = 'ja'; // 日语假名
        } else if (/[\uAC00-\uD7AF]/.test(wordText)) {
          detectedLanguage = 'ko'; // 韩文字母
        } else if (/^[a-zA-Z\s\-']+$/.test(wordText)) {
          detectedLanguage = 'en'; // 英语
        }
        
        console.log(`[VocabularyScreen:filterWords] 单词 ${word.word} 检测到的语言: ${detectedLanguage}, 筛选语言: ${languageCode}`);
        return detectedLanguage === languageCode;
      });
    }

    // 文本搜索筛选
    if (searchText) {
      const searchKey = (searchText || '').trim().toLowerCase();
      filtered = filtered.filter(word =>
        (word.word || '').trim().toLowerCase().includes(searchKey) ||
        (word.correctedWord || '').trim().toLowerCase().includes(searchKey) ||
        (word.definitions?.[0]?.definition || '').toLowerCase().includes(searchKey)
      );
    }

    console.log(`🔍 去重后单词数量: ${uniqueWords.length}`);
    console.log(`🔍 去重后的单词列表:`, uniqueWords.map(w => w.word));
    
    setFilteredWords(filtered);
  };

  const updateBadges = async () => {
    const wordCount = vocabulary.length;
    console.log('🔄 更新徽章状态，当前单词数量:', wordCount);
    
    setBadges(prevBadges => {
      let unlockedBadge: number | null = null;
      const newBadges = prevBadges.map(badge => {
        const wasUnlocked = badge.unlocked;
        const newUnlocked = wordCount >= badge.count;
        
        if (!wasUnlocked && newUnlocked) {
          unlockedBadge = badge.count;
          console.log(`🎉 解锁徽章: ${badge.count}个单词`);
        }
        
        return {
          ...badge,
          unlocked: newUnlocked
        };
      });
      
      console.log('📊 徽章状态:', newBadges.map(b => `${b.count}(${b.unlocked ? '已解锁' : '未解锁'})`));
      
      // 保存到本地存储
      saveBadgesToStorage(newBadges);
      
      // 如果有新解锁的徽章，同步到服务器
      if (unlockedBadge) {
        setCelebrateBadge(unlockedBadge);
        setShowBadgeCelebrate(true);
        setTimeout(() => setShowBadgeCelebrate(false), 1800);
        
        // 异步同步徽章数据到服务器
        syncBadgesToServer(newBadges);
      }
      
      return newBadges;
    });
  };

  // 获取单词的所有相关剧集
  const getWordShows = (wordText: string) => {
    return vocabulary
      .filter(w => w.word === wordText)
      .map(w => w.sourceShow)
      .filter(Boolean);
  };

  // 计算单词信息完整性的辅助函数
  const getWordCompletenessScore = (word: any): number => {
    let score = 0;
    
    // 基础信息
    if (word.word) score += 10;
    if (word.definitions && Array.isArray(word.definitions)) score += word.definitions.length * 5;
    if (word.phonetic) score += 3;
    if (word.language) score += 2;
    if (word.sourceShow) score += 3;
    if (word.mastery !== undefined) score += 2;
    if (word.reviewCount !== undefined) score += 2;
    if (word.notes) score += 1;
    if (word.tags && Array.isArray(word.tags)) score += word.tags.length;
    
    return score;
  };

  // 获取用户ID
  const getUserId = async (): Promise<string | null> => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.id || null;
      }
      return null;
    } catch (error) {
      console.error('获取用户ID失败:', error);
      return null;
    }
  };

  // 1. 点击单词卡后，优先显示本地内容，若无释义则查云词库
  const handleWordPress = async (word: any) => {
    // 确保使用列表中的完整单词对象
    const selectedWordFromList = word;
    setSelectedWord(selectedWordFromList);
    
    console.log('🔍 点击单词:', selectedWordFromList.word);
    console.log('🔍 单词完整对象:', selectedWordFromList);
    console.log('🔍 单词数据结构:', {
      hasDefinitions: !!selectedWordFromList.definitions,
      isArray: Array.isArray(selectedWordFromList.definitions),
      length: selectedWordFromList.definitions?.length,
      definitions: selectedWordFromList.definitions
    });
    
    if (selectedWordFromList.definitions && 
        Array.isArray(selectedWordFromList.definitions) && 
        selectedWordFromList.definitions.length > 0) {
      console.log('✅ 使用本地释义数据');
      // 直接使用列表中的单词对象，确保数据一致
      setSelectedWordDetail(selectedWordFromList);
      setIsLoadingWordDetail(false);
    } else {
      console.log('🔄 本地无释义数据，查询云词库');
      setIsLoadingWordDetail(true);
      
      try {
        const result = await wordService.searchWord(selectedWordFromList.word, 'en', appLanguage);
        console.log('🌐 云词库查询结果:', result);
        
        if (result.success && result.data) {
          // 将云词库数据与本地单词对象合并，而不是完全替换
          const mergedWordData = {
            ...selectedWordFromList, // 保留本地所有信息
            ...result.data, // 云词库数据覆盖本地数据
            // 确保关键字段不被覆盖
            sourceShow: selectedWordFromList.sourceShow,
            language: selectedWordFromList.language || result.data.language,
            mastery: selectedWordFromList.mastery,
            reviewCount: selectedWordFromList.reviewCount,
            notes: selectedWordFromList.notes,
            // tags: selectedWordFromList.tags || result.data.tags // 暂时移除，WordData接口中没有tags属性
          };
          
          console.log('🔗 合并后的单词数据:', mergedWordData);
          setSelectedWordDetail(mergedWordData);
        } else {
          // 云词库查询失败，仍然使用本地数据
          setSelectedWordDetail(selectedWordFromList);
        }
      } catch (e) {
        console.error('❌ 云词库查询失败:', e);
        // 查询失败时使用本地数据
        setSelectedWordDetail(selectedWordFromList);
      } finally {
        setIsLoadingWordDetail(false);
      }
    }
  };

  // 2. 搜索框支持回车/提交时查找单词
  const handleSearchSubmit = () => {
    setIsEditing(false);
    const searchKey = (searchText || '').trim().toLowerCase();
    // 使用 filteredWords 而不是 vocabulary，确保与列表显示一致
    const found = filteredWords.find(w => 
      (w.word || '').trim().toLowerCase() === searchKey ||
      (w.correctedWord || '').trim().toLowerCase() === searchKey
    );
    if (found) {
      // 直接调用 handleWordPress 确保数据一致性
      handleWordPress(found);
      // 设置搜索文本为 correctedWord，确保显示一致性
      setSearchText(found.correctedWord || found.word);
    } else {
      Alert.alert(t('word_not_found', appLanguage), t('check_spelling_or_search', appLanguage));
    }
  };

  // 删除单词 - 通过多邻国数据同步方案
  const handleDeleteWord = async (word: any) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        console.warn('用户未登录，无法删除单词');
        return;
      }

      // 先更新本地状态
      removeWord((word.word || '').trim().toLowerCase(), word.sourceShow?.id);

      // 通过多邻国数据同步方案同步删除操作
      await unifiedSyncService.addToSyncQueue({
        type: 'vocabulary',
        data: {
          word: word.word,
          sourceShow: word.sourceShow,
          language: word.language || 'en',
          operation: 'delete',
          timestamp: Date.now()
        },
        userId,
        operation: 'delete',
        priority: 'high'
      });

      console.log(`🗑️ 单词删除已加入同步队列: ${word.word}`);
    } catch (error) {
      console.error('删除单词失败:', error);
      Alert.alert('删除失败', '网络连接异常，请稍后重试');
    }
  };

  // 更新单词学习进度 - 通过多邻国数据同步方案
  const handleUpdateWordProgress = async (word: any, progressData: {
    mastery?: number;
    reviewCount?: number;
    correctCount?: number;
    incorrectCount?: number;
    consecutiveCorrect?: number;
    consecutiveIncorrect?: number;
    lastReviewDate?: string;
    nextReviewDate?: string;
    interval?: number;
    easeFactor?: number;
    totalStudyTime?: number;
    averageResponseTime?: number;
    confidence?: number;
    notes?: string;
    tags?: string[];
  }) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        console.warn('用户未登录，无法更新学习进度');
        return;
      }

      // 先更新本地状态
      updateWord(word.word, progressData);

      // 通过多邻国数据同步方案同步学习进度
      await unifiedSyncService.addToSyncQueue({
        type: 'learningRecords',
        data: {
          word: word.word,
          sourceShow: word.sourceShow,
          language: word.language || 'en',
          ...progressData,
          timestamp: Date.now()
        },
        userId,
        operation: 'update',
        priority: 'medium'
      });

      console.log(`📊 学习进度更新已加入同步队列: ${word.word}`);
    } catch (error) {
      console.error('更新学习进度失败:', error);
    }
  };

  // 徽章icon渲染
  const renderBadge = (badge: Badge) => {
    const unlocked = badge.unlocked;
    return (
      <View
        key={badge.id}
        style={[styles.badge, unlocked ? styles.badgeUnlocked : styles.badgeLocked]}
      >
        <Text style={styles.badgeNumber}>{badge.count}</Text>
        <View style={styles.badgeIconWrap}>
          {unlocked ? (
            <Ionicons name="star" size={18} color={colors.text.inverse} />
          ) : (
            <Ionicons name="lock-closed" size={16} color={colors.text.inverse} />
          )}
        </View>
      </View>
    );
  };

  // 获取当前进度和目标
  const getCurrentProgress = () => {
    const wordCount = vocabulary.length;
    
    // 找到下一个未解锁的徽章作为目标
    const nextBadge = badges.find(badge => !badge.unlocked);
    
    if (!nextBadge) {
      // 所有徽章都已解锁，显示最高级别
      return {
        current: wordCount,
        target: badges[badges.length - 1].count,
        progress: 100,
        isFull: true
      };
    }
    
    // 计算当前进度 - 从0开始到下一个徽章
    const progress = Math.min((wordCount / nextBadge.count) * 100, 100);
    
    return {
      current: wordCount,
      target: nextBadge.count,
      progress,
      isFull: wordCount >= nextBadge.count
    };
  };

  const progressInfo = getCurrentProgress();

  const LANGUAGE_KEY_MAP: Record<string, string> = {
    en: 'english_language',
    ja: 'japanese_language',
    ko: 'korean_language',
  };

  // 语言筛选选项：显示用户选择的所有学习语言
  const [filterLanguageOptions, setFilterLanguageOptions] = useState<{ code: string, flag: string, name: string, nativeName: string }[]>([]);
  
  // 加载用户选择的学习语言
  useEffect(() => {
    const loadLearningLanguages = async () => {
      try {
        const saved = await AsyncStorage.getItem('learningLanguages');
        if (saved) {
          const languages = JSON.parse(saved);
          const options = languages.map((langCode: string) => {
            const languageEntry = Object.entries(SUPPORTED_LANGUAGES).find(([key, lang]) => lang.code === langCode);
            if (languageEntry) {
              const [key, lang] = languageEntry;
              return {
                code: lang.code,
                flag: lang.flag,
                name: lang.name,
                nativeName: lang.nativeName
              };
            }
            return null;
          }).filter(Boolean);
          
          setFilterLanguageOptions(options);
          console.log('[VocabularyScreen] 加载的学习语言选项:', options);
          
          // 自动选择第一个语言作为默认筛选语言
          if (options.length > 0 && !selectedFilterLanguage) {
            setSelectedFilterLanguage(options[0].code);
          }
        }
      } catch (error) {
        console.error('[VocabularyScreen] 加载学习语言失败:', error);
      }
    };
    
    loadLearningLanguages();
  }, [selectedFilterLanguage]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 庆祝弹窗动画 */}
      {showBadgeCelebrate && celebrateBadge && (
        <View style={[styles.celebrateOverlay, { pointerEvents: 'none' }]}>
          <View style={styles.celebrateBox}>
            <Text style={styles.celebrateEmoji}>🎉</Text>
            <Text style={styles.celebrateText}>{t('congratulations_unlock', appLanguage, { count: celebrateBadge })}</Text>
          </View>
        </View>
      )}
      <View style={styles.headerWrap}>
        <View style={styles.progressCard}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressCircleText}>{progressInfo.current}</Text>
            <Text style={styles.progressCircleSub}>/{progressInfo.target}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFg, { width: `${progressInfo.progress}%` }]} />
            </View>
          </View>
          <View style={styles.progressRight}>
            {progressInfo.isFull ? (
              <View style={styles.progressCheck}><Ionicons name="checkmark" size={20} color={colors.text.inverse} /></View>
            ) : (
              <Text style={styles.progressLeftText}>{t('still_need', appLanguage, { count: progressInfo.target - progressInfo.current })}</Text>
            )}
          </View>
        </View>
      </View>
      <View style={styles.badgesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesContainer}>
          {badges.map(renderBadge)}
        </ScrollView>
      </View>
      {/* 主内容切换：单词详情 or 单词表列表 */}
      {selectedWord ? (
        <View style={styles.detailMain}>
          {/* 顶部可编辑搜索框 */}
          <View style={styles.detailSearchBar}>
            <Ionicons name="search" size={20} color={colors.neutral[400]} style={{marginRight: 8}} />
            <TextInput
              style={styles.detailSearchInput}
              value={searchText}
              onChangeText={txt => { setSearchText(txt); setIsEditing(true); }}
              placeholder={t('search_words', appLanguage)}
              placeholderTextColor={colors.neutral[400]}
              onSubmitEditing={handleSearchSubmit}
            />
            <TouchableOpacity onPress={() => { setSelectedWord(null); setSearchText(''); setIsEditing(false); }} style={styles.detailCloseBtn}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          {/* 下拉预览 */}
          {isEditing && previewList.length > 0 && (
            <View style={styles.previewDropdown}>
              {previewList.map((item, idx) => (
                <TouchableOpacity
                  key={item.word}
                  style={styles.previewItem}
                              onPress={() => { 
              // 直接调用 handleWordPress 确保数据一致性
              handleWordPress(item); 
              setSearchText(item.correctedWord || item.word); 
              setIsEditing(false); 
            }}
                >
                  <Text style={styles.previewWord}>{item.correctedWord || item.word}</Text>
                  <Text style={styles.previewTranslation}>{item.definitions?.[0]?.definition || t('no_definition', appLanguage)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* 单词卡 */}
          <ScrollView contentContainerStyle={styles.detailCardScroll}>
            <View style={styles.detailCardBox}>
              {isLoadingWordDetail ? (
                <Text style={{textAlign:'center',padding:32}}>加载中...</Text>
              ) : selectedWordDetail ? (
                <WordCardContent 
                  wordData={selectedWordDetail} 
                  onProgressUpdate={(progressData) => {
                    // 确保使用正确的单词对象进行进度更新
                    const wordToUpdate = selectedWord || selectedWordDetail;
                    if (wordToUpdate) {
                      handleUpdateWordProgress(wordToUpdate, progressData);
                    }
                  }}
                />
              ) : (
                <View style={{padding:32}}>
                  <Text style={{textAlign:'center',marginBottom:8}}>未找到释义</Text>
                  <Text style={{textAlign:'center',fontSize:12,color:'#666'}}>
                    可能原因：网络连接问题或该单词暂未收录
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={styles.listSection}>
          <View style={[
            styles.searchContainer,
            !isSearchExpanded && styles.searchContainerInactive
          ]}>
            {isSearchExpanded ? (
              <>
                <Ionicons name="search" size={18} color={colors.neutral[400]} style={{marginRight:8}} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('search_words', appLanguage)}
                  placeholderTextColor={colors.neutral[400]}
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={handleSearchSubmit}
                  autoFocus
                />
                <TouchableOpacity 
                  onPress={() => {
                    setIsSearchExpanded(false);
                    setSearchText('');
                    // 重置为第一个语言选项
                    if (filterLanguageOptions.length > 0) {
                      setSelectedFilterLanguage(filterLanguageOptions[0].code);
                    }
                  }}
                  style={styles.searchCloseBtn}
                >
                  <Ionicons name="close" size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.searchExpandBtnWrapper}>
                <TouchableOpacity 
                  onPress={() => setIsSearchExpanded(true)}
                  style={styles.searchExpandBtn}
                >
                  <Ionicons name="search" size={16} color={colors.primary[500]} style={{marginRight: 8}} />
                  <Text style={styles.searchExpandText}>
                    {appLanguage === 'zh-CN' ? '查找收藏词' : 'Find Saved Words'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* 语言筛选器 - 只在搜索展开后显示 */}
          {isSearchExpanded && (
            <View style={styles.languageFilterSliderWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.languageFilterScrollContent}
              >
                {filterLanguageOptions.map((lang, index) => (
                  <TouchableOpacity
                    key={`${lang.code}-${index}`}
                    style={[
                      styles.languageFilterSliderButton,
                      selectedFilterLanguage === lang.code && styles.languageFilterSliderButtonActive
                    ]}
                    onPress={() => setSelectedFilterLanguage(lang.code)}
                  >
                    <Text style={styles.languageFilterSliderFlag}>{lang.flag}</Text>
                    <Text style={[
                      styles.languageFilterSliderText,
                      selectedFilterLanguage === lang.code && styles.languageFilterSliderTextActive
                    ]}>
                      {appLanguage === 'zh-CN' ? lang.name : lang.nativeName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          <WordList
            words={filteredWords}
            onWordPress={(word) => { 
              handleWordPress(word); 
              setSearchText(word.word); 
              setIsEditing(false); 
            }}
            onDeleteWord={handleDeleteWord}
          />
        </View>
      )}
      


      {/* 功能权限升级弹窗 */}
      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        feature={lockedFeature as any}
        onUpgrade={() => {
          setUpgradeModalVisible(false);
          // 这里可以添加导航到订阅页面的逻辑
          // navigate('Subscription');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 0,
    paddingHorizontal: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statsCount: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  progressNumber: {
    fontSize: 22,
    color: colors.primary[500],
    fontWeight: 'bold',
    marginRight: 14,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFg: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  badgesSection: {
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  badgeSyncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeSyncText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 48,
    height: 56,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  badgeUnlocked: {
    backgroundColor: colors.accent[500],
  },
  badgeLocked: {
    backgroundColor: colors.neutral[200],
  },
  badgeNumber: {
    color: colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
  },
  badgeIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSection: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
    marginTop: 0,
    minHeight: 48,
    justifyContent: 'center', // 在收起状态下居中显示"+"按钮
  },
  searchContainerInactive: {
    backgroundColor: 'transparent', // 未激活时透明
    borderWidth: 0,
    shadowColor: 'transparent',
    elevation: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  listContainer: {
    paddingTop: 0,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  wordCardBox: {
    marginBottom: 12,
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
    position: 'relative',
  },
  wordCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  wordText: {
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  phoneticText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: 8,
  },
  wordTranslation: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: 'transparent',
    padding: 4,
  },
  showTag: {
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  showTagText: {
    color: colors.text.inverse,
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  wordCardCustom: {
    // Add any custom styles for the WordCard component here
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexDirection: 'row',
  },
  progressCircleText: {
    color: colors.text.inverse,
    fontSize: 22,
    fontWeight: 'bold',
  },
  progressCircleSub: {
    color: colors.text.inverse,
    fontSize: 16,
    marginLeft: 2,
    fontWeight: '500',
  },
  progressBarContainer: {
    flex: 1,
    marginRight: 12,
  },
  progressRight: {
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLeftText: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  progressCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailMain: {
    flex: 1,
  },
  detailSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  detailSearchInput: {
    flex: 1,
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '500',
  },
  detailCloseBtn: {
    padding: 4,
  },
  detailCardScroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  detailCardBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  detailAudioBtn: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 20,
    padding: 8,
  },
  detailPhoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailPhonetic: {
    fontSize: 18,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginRight: 8,
  },
  detailShowTag: {
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  detailShowTagText: {
    color: colors.text.inverse,
    fontSize: 13,
  },
  detailShowTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 6,
  },
  detailDefBlock: {
    marginBottom: 18,
  },
  detailPartOfSpeech: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  detailDefinition: {
    fontSize: 17,
    color: colors.text.primary,
    marginBottom: 4,
  },
  detailExampleBlock: {
    marginLeft: 8,
    marginBottom: 2,
  },
  detailExampleEn: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  detailExampleZh: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  detailDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  detailDeleteText: {
    color: colors.error[500],
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  detailCollectBtnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  detailCollectTextSolid: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  previewDropdown: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 72,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
    paddingVertical: 4,
  },
  previewItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  previewWord: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  previewTranslation: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
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
  partOfSpeechTagRow: { flexDirection: 'row', marginBottom: 4 },
  partOfSpeechTag: { backgroundColor: colors.primary[50], color: colors.primary[700], fontSize: 13, fontWeight: '700', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  tvShowTag: { backgroundColor: colors.primary[50] },
  tvShowTagText: { color: colors.primary[700] },
  wordbookShowTag: { backgroundColor: colors.success[100] },
  wordbookShowTagText: { color: colors.success[800] },
  searchExpandBtnWrapper: {
    // 让父容器撑满整行，确保按钮宽度和激活搜索框一致
    width: '100%',
    // marginTop: 8,
    // 调整查找收藏词按钮和下面单词列表之间的距离，修改 marginBottom 即可
    marginBottom: 5, // 增大此值可增大间距，减小则减小间距
  },
  searchExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary[500],
    width: '100%', // 宽度和搜索框一致
    justifyContent: 'center', // 内容居中
  },
  searchExpandText: {
    color: colors.primary[500],
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchCloseBtn: {
    padding: 8,
    marginLeft: 8,
  },
  languageFilterSliderWrapper: {
    marginBottom: 12,
  },
  languageFilterSlider: {
    paddingVertical: 8,
    borderRadius: 16,
  },
  languageFilterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingRight: 20,
  },
  languageFilterSliderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 4,
    marginLeft: 12,
  },
  languageFilterSliderButtonFirst: {
    marginLeft: 0,
  },
  languageFilterSliderButtonActive: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[300],
    borderWidth: 1,
  },
  languageFilterSliderFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  languageFilterSliderText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  languageFilterSliderTextActive: {
    color: colors.primary[500],
    fontWeight: '500',
  },
  languageFilterCurrentLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  languageFilterCurrentLanguageFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  languageFilterCurrentLanguageText: {
    fontSize: 14,
    color: colors.primary[700],
    fontWeight: '500',
  },
});

export default VocabularyScreen; 