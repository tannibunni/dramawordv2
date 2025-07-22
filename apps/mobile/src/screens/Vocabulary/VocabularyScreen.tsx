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
import WordList from '../../components/vocabulary/WordList';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';

const { width } = Dimensions.get('window');

interface Badge {
  id: number;
  count: number;
  unlocked: boolean;
}

const VocabularyScreen: React.FC = () => {
  const { vocabulary, removeWord } = useVocabulary();
  const { appLanguage } = useAppLanguage();
  const [searchText, setSearchText] = useState('');
  const [filteredWords, setFilteredWords] = useState<any[]>([]);
  const [selectedWord, setSelectedWord] = useState<any | null>(null);
  const [showWordCard, setShowWordCard] = useState(false);
  // 新增：下拉预览逻辑
  const [previewList, setPreviewList] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  // 新增：庆祝弹窗
  const [showBadgeCelebrate, setShowBadgeCelebrate] = useState(false);
  const [celebrateBadge, setCelebrateBadge] = useState<null | number>(null);
  // 新增：搜索框展开状态
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
  }, [vocabulary, searchText]);

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

  // 1. 点击单词卡后，搜索框自动填入该单词
  const handleWordPress = (word: any) => {
    setSearchText((word.word || '').trim().toLowerCase());
    setSelectedWord(word);
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
              autoFocus
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
              <View style={styles.detailCardHeader}>
                <Text style={styles.detailWord}>{selectedWord.word}</Text>
                <TouchableOpacity style={styles.detailAudioBtn} onPress={() => audioService.playWordPronunciation(selectedWord.word)}>
                  <Ionicons name="volume-high" size={20} color={colors.primary[500]} />
                </TouchableOpacity>
              </View>
              {/* detailPhoneticRow 只显示音标 */}
              <View style={styles.detailPhoneticRow}>
                <Text style={styles.detailPhonetic}>{selectedWord.phonetic}</Text>
              </View>
              {/* 剧集标签单独一行 */}
              {(() => {
                const allShows = getWordShows(selectedWord.word);
                return allShows.length > 0 && (
                  <View style={styles.detailShowTagsContainer}>
                    {allShows.map((show, index) => {
                      const isWordbook = show?.type === 'wordbook';
                      return (
                        <View
                          key={`${show?.id}-${index}`}
                          style={[styles.detailShowTag, { backgroundColor: isWordbook ? colors.success[100] : colors.primary[50] }]}
                        >
                          <Text style={[styles.detailShowTagText, { color: isWordbook ? colors.success[800] : colors.primary[700] }]}>{show?.name}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}
              {/* 释义和例句 */}
              {selectedWord.definitions && selectedWord.definitions.map((def: any, idx: number) => (
                <View key={idx} style={styles.detailDefBlock}>
                  {/* 释义和例句部分，把词性样式改成蓝色标签 */}
                  <View style={styles.partOfSpeechTagRow}>
                    <Text style={styles.partOfSpeechTag}>{def.partOfSpeech}</Text>
                  </View>
                  <Text style={styles.detailDefinition}>{def.definition}</Text>
                  {def.examples && def.examples.length > 0 && def.examples.map((ex: any, exIdx: number) => (
                    <View key={exIdx} style={styles.detailExampleBlock}>
                      <Text style={styles.detailExampleEn}>{ex.english}</Text>
                      <Text style={styles.detailExampleZh}>{ex.chinese}</Text>
                    </View>
                  ))}
                </View>
              ))}
              {/* 删除操作按钮区域 */}
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={styles.listSection}>
          <View style={styles.searchContainer}>
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
                  }}
                  style={styles.searchCloseBtn}
                >
                  <Ionicons name="close" size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                onPress={() => setIsSearchExpanded(true)}
                style={styles.searchExpandBtn}
              >
                <Ionicons name="search" size={16} color={colors.primary[500]} style={{marginRight: 6}} />
                <Text style={styles.searchExpandText}>SEARCH & FILTER</Text>
              </TouchableOpacity>
            )}
          </View>
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
  searchExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  searchExpandText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  searchCloseBtn: {
    padding: 8,
    marginLeft: 8,
  },
});

export default VocabularyScreen; 