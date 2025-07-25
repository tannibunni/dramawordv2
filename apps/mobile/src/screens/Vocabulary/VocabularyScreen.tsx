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

const { width } = Dimensions.get('window');

interface Badge {
  id: number;
  count: number;
  unlocked: boolean;
}

const VocabularyScreen: React.FC = () => {
  const { vocabulary, removeWord } = useVocabulary();
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
  // 统一用 string 类型，避免 code 类型不一致导致的比较问题
  const [selectedFilterLanguage, setSelectedFilterLanguage] = useState<string>('ALL');

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

  useEffect(() => {
    filterWords();
    updateBadges();
  }, [vocabulary, searchText, selectedFilterLanguage]);

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
      
      const preview = uniqueWords.filter(w => (w.word || '').trim().toLowerCase().includes(searchKey));
      setPreviewList(preview.slice(0, 5));
    } else {
      setPreviewList([]);
    }
  }, [searchText, vocabulary, isEditing]);

  // 搜索和过滤时也统一小写和trim
  const filterWords = () => {
    // 去重处理：按单词文本去重，保留第一个出现的实例
    const uniqueWords = vocabulary.reduce((acc: any[], current) => {
      const normalizedCurrentWord = (current.word || '').trim().toLowerCase();
      const exists = acc.find(item => (item.word || '').trim().toLowerCase() === normalizedCurrentWord);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    let filtered = uniqueWords;
    
    // 语言筛选
    if (selectedFilterLanguage !== 'ALL') {
      const languageCode = selectedFilterLanguage.toLowerCase();
      filtered = filtered.filter(word => {
        // CHINESE 特殊处理
        if (selectedFilterLanguage === 'CHINESE') {
          // 包含中文字符
          return /[\u4e00-\u9fa5]/.test(word.word || '');
        }
        // 检查单词的语言属性，如果没有明确的语言属性，则根据单词特征判断
        if (word.language) {
          return word.language.toLowerCase() === languageCode;
        }
        
        // 根据单词特征判断语言
        const wordText = word.word || '';
        switch (languageCode) {
          case 'en':
            // 英语：只包含英文字母、空格、连字符
            return /^[a-zA-Z\s\-']+$/.test(wordText);
          case 'ja':
            // 日语：包含平假名、片假名、汉字
            return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(wordText);
          case 'ko':
            // 韩语：包含韩文字母
            return /[\uAC00-\uD7AF]/.test(wordText);
          default:
            return true;
        }
      });
    }

    // 文本搜索筛选
    if (searchText) {
      const searchKey = (searchText || '').trim().toLowerCase();
      filtered = filtered.filter(word =>
        (word.word || '').trim().toLowerCase().includes(searchKey) ||
        (word.definitions?.[0]?.definition || '').toLowerCase().includes(searchKey)
      );
    }

    setFilteredWords(filtered);
  };

  const updateBadges = () => {
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
      // 只弹出一次庆祝动画
      if (unlockedBadge) {
        setCelebrateBadge(unlockedBadge);
        setShowBadgeCelebrate(true);
        setTimeout(() => setShowBadgeCelebrate(false), 1800);
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

  // 1. 点击单词卡后，优先显示本地内容，若无释义则查云词库
  const handleWordPress = async (word: any) => {
    setSelectedWord(word);
    console.log('🔍 点击单词:', word.word);
    console.log('🔍 单词数据结构:', {
      hasDefinitions: !!word.definitions,
      isArray: Array.isArray(word.definitions),
      length: word.definitions?.length,
      definitions: word.definitions
    });
    
    if (word.definitions && Array.isArray(word.definitions) && word.definitions.length > 0) {
      console.log('✅ 使用本地释义数据');
      setSelectedWordDetail(word);
      setIsLoadingWordDetail(false);
    } else {
      console.log('🔄 本地无释义数据，查询云词库');
      setIsLoadingWordDetail(true);
      try {
        const result = await wordService.searchWord(word.word, 'en');
        console.log('🌐 云词库查询结果:', result);
        setSelectedWordDetail(result.success ? result.data : null);
      } catch (e) {
        console.error('❌ 云词库查询失败:', e);
        setSelectedWordDetail(null);
      }
      setIsLoadingWordDetail(false);
    }
  };

  // 2. 搜索框支持回车/提交时查找单词
  const handleSearchSubmit = () => {
    setIsEditing(false);
    const searchKey = (searchText || '').trim().toLowerCase();
    const found = vocabulary.find(w => (w.word || '').trim().toLowerCase() === searchKey);
    if (found) {
      setSelectedWord(found);
    } else {
      Alert.alert(t('word_not_found', appLanguage), t('check_spelling_or_search', appLanguage));
    }
  };

  const handleDeleteWord = (word: any) => {
    removeWord((word.word || '').trim().toLowerCase(), word.sourceShow?.id);
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

  // 语言筛选选项：EN界面下将英文选项替换为Chinese
  let filterLanguageOptions: { code: string, flag: string, name: string, nativeName: string }[] = [];
  if (appLanguage === 'en-US') {
    filterLanguageOptions = [
      { code: 'CHINESE', flag: '🇨🇳', name: '中文', nativeName: 'Chinese' },
      ...Object.entries(SUPPORTED_LANGUAGES)
        .filter(([key]) => key !== 'ENGLISH')
        .map(([key, lang]) => ({ code: lang.code, flag: lang.flag, name: lang.name, nativeName: lang.nativeName }))
    ];
  } else {
    filterLanguageOptions = Object.entries(SUPPORTED_LANGUAGES).map(([key, lang]) => ({ code: lang.code, flag: lang.flag, name: lang.name, nativeName: lang.nativeName }));
  }

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
                  onPress={() => { setSelectedWord(item); setSearchText(item.word); setIsEditing(false); }}
                >
                  <Text style={styles.previewWord}>{item.word}</Text>
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
                <WordCardContent wordData={selectedWordDetail} />
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
                    setSelectedFilterLanguage('ALL'); // 重置为全部
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
          {/* 语言筛选器 - 滑块形式 */}
          {/* 已彻底移除语言筛选器相关JSX块 */}
          <WordList
            words={filteredWords}
            onWordPress={(word) => { setSelectedWord(word); setSearchText(word.word); setIsEditing(false); }}
            onDeleteWord={handleDeleteWord}
          />
        </View>
      )}
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
});

export default VocabularyScreen; 