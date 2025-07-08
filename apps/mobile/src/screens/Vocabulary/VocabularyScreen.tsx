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

const { width } = Dimensions.get('window');

interface Badge {
  id: number;
  count: number;
  unlocked: boolean;
}

const VocabularyScreen: React.FC = () => {
  const { vocabulary, removeWord } = useVocabulary();
  const [searchText, setSearchText] = useState('');
  const [filteredWords, setFilteredWords] = useState<any[]>([]);
  const [selectedWord, setSelectedWord] = useState<any | null>(null);
  const [showWordCard, setShowWordCard] = useState(false);
  // 新增：下拉预览逻辑
  const [previewList, setPreviewList] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // 徽章配置
  const badges: Badge[] = [
    { id: 1, count: 10, unlocked: false },
    { id: 2, count: 20, unlocked: false },
    { id: 3, count: 50, unlocked: false },
    { id: 4, count: 100, unlocked: false },
    { id: 5, count: 200, unlocked: false },
    { id: 6, count: 500, unlocked: false },
    { id: 7, count: 1000, unlocked: false },
  ];

  useEffect(() => {
    filterWords();
    updateBadges();
  }, [vocabulary, searchText]);

  useEffect(() => {
    if (isEditing && searchText.trim()) {
      const preview = vocabulary.filter(w => w.word.toLowerCase().includes(searchText.trim().toLowerCase()));
      setPreviewList(preview.slice(0, 5));
    } else {
      setPreviewList([]);
    }
  }, [searchText, vocabulary, isEditing]);

  const filterWords = () => {
    let filtered = vocabulary;

    // 按搜索文本过滤
    if (searchText) {
      filtered = filtered.filter(word =>
        word.word.toLowerCase().includes(searchText.toLowerCase()) ||
        word.definitions?.[0]?.definition.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredWords(filtered);
  };

  const updateBadges = () => {
    const wordCount = vocabulary.length;
    badges.forEach(badge => {
      badge.unlocked = wordCount >= badge.count;
    });
  };

  // 1. 点击单词卡后，搜索框自动填入该单词
  const handleWordPress = (word: any) => {
    setSearchText(word.word);
    setSelectedWord(word);
  };

  // 2. 搜索框支持回车/提交时查找单词
  const handleSearchSubmit = () => {
    setIsEditing(false);
    const found = vocabulary.find(w => w.word.toLowerCase() === searchText.trim().toLowerCase());
    if (found) {
      setSelectedWord(found);
    } else {
      Alert.alert('未找到该单词', '请检查拼写或在首页查词');
    }
  };

  const handleDeleteWord = (word: any) => {
    Alert.alert(
      '删除单词',
      `确定要从单词表中删除 "${word.word}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            removeWord(word.word);
          },
        },
      ]
    );
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
            <Ionicons name="star" size={18} color="#fff" />
          ) : (
            <Ionicons name="lock-closed" size={16} color="#fff" />
          )}
        </View>
      </View>
    );
  };

  const renderWordItem = ({ item }: { item: any }) => (
    <View style={styles.wordCardBox}>
      <TouchableOpacity
        style={styles.wordCard}
        activeOpacity={0.8}
        onPress={() => { setSelectedWord(item); setSearchText(item.word); setIsEditing(false); }}
      >
        <View style={styles.wordCardHeader}>
          <Text style={styles.wordText}>{item.word}</Text>
          {item.phonetic && <Text style={styles.phoneticText}>{item.phonetic}</Text>}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteWord(item)}
            hitSlop={{top:10,right:10,bottom:10,left:10}}
          >
            <Ionicons name="trash" size={20} color="#F53F3F" />
          </TouchableOpacity>
        </View>
        <Text style={styles.wordTranslation}>{item.definitions?.[0]?.definition || '暂无释义'}</Text>
        {item.sourceShow && (
          <View style={styles.showTag}><Text style={styles.showTagText}>{item.sourceShow.name}</Text></View>
        )}
      </TouchableOpacity>
    </View>
  );

  const maxProgress = 10;
  const progress = Math.min(vocabulary.length, maxProgress);
  const isFull = vocabulary.length >= maxProgress;
  const leftCount = Math.max(0, maxProgress - vocabulary.length);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrap}>
        <View style={styles.progressCard}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressCircleText}>{progress}</Text>
            <Text style={styles.progressCircleSub}>/10</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFg, { width: `${(progress / maxProgress) * 100}%` }]} />
            </View>
          </View>
          <View style={styles.progressRight}>
            {isFull ? (
              <View style={styles.progressCheck}><Ionicons name="checkmark" size={20} color="#fff" /></View>
            ) : (
              <Text style={styles.progressLeftText}>还差{leftCount}个</Text>
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
            <Ionicons name="search" size={20} color="#C9CDD4" style={{marginRight: 8}} />
            <TextInput
              style={styles.detailSearchInput}
              value={searchText}
              onChangeText={txt => { setSearchText(txt); setIsEditing(true); }}
              placeholder="搜索单词..."
              placeholderTextColor="#C9CDD4"
              autoFocus
              onSubmitEditing={handleSearchSubmit}
            />
            <TouchableOpacity onPress={() => { setSelectedWord(null); setSearchText(''); setIsEditing(false); }} style={styles.detailCloseBtn}>
              <Ionicons name="close" size={24} color="#888" />
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
                  <Text style={styles.previewTranslation}>{item.definitions?.[0]?.definition || '暂无释义'}</Text>
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
                  <Ionicons name="volume-high" size={20} color="#246BFD" />
                </TouchableOpacity>
              </View>
              <View style={styles.detailPhoneticRow}>
                <Text style={styles.detailPhonetic}>{selectedWord.phonetic}</Text>
                {selectedWord.sourceShow && (
                  <View style={styles.detailShowTag}><Text style={styles.detailShowTagText}>来源于{selectedWord.sourceShow.name}</Text></View>
                )}
              </View>
              {/* 释义和例句 */}
              {selectedWord.definitions && selectedWord.definitions.map((def: any, idx: number) => (
                <View key={idx} style={styles.detailDefBlock}>
                  <Text style={styles.detailPartOfSpeech}>{def.partOfSpeech}</Text>
                  <Text style={styles.detailDefinition}>{def.definition}</Text>
                  {def.examples && def.examples.length > 0 && def.examples.map((ex: any, exIdx: number) => (
                    <View key={exIdx} style={styles.detailExampleBlock}>
                      <Text style={styles.detailExampleEn}>{ex.english}</Text>
                      <Text style={styles.detailExampleZh}>{ex.chinese}</Text>
                    </View>
                  ))}
                </View>
              ))}
              {/* 操作按钮 */}
              <View style={styles.detailActionRow}>
                <TouchableOpacity style={styles.detailDeleteBtn} onPress={() => { setSelectedWord(null); removeWord(selectedWord.word); }}>
                  <Ionicons name="trash" size={18} color="#F53F3F" />
                  <Text style={styles.detailDeleteText}>删除</Text>
                </TouchableOpacity>
                <View style={styles.detailCollectBtnSolid}>
                  <Ionicons name="heart" size={18} color="#fff" />
                  <Text style={styles.detailCollectTextSolid}>已收藏</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={styles.listSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#C9CDD4" style={{marginRight:8}} />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索单词..."
              placeholderTextColor="#C9CDD4"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearchSubmit}
            />
          </View>
          {filteredWords.length > 0 ? (
            <FlatList
              data={filteredWords}
              renderItem={renderWordItem}
              keyExtractor={(item) => item.word}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color="#888888" />
              <Text style={styles.emptyStateText}>
                {searchText ? '没有找到匹配的单词' : '还没有收藏任何单词'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchText ? '尝试搜索其他单词' : '去首页搜索并收藏单词吧'}
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
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
    color: '#2D2D2D',
  },
  statsCount: {
    fontSize: 14,
    color: '#888888',
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
    color: '#246BFD',
    fontWeight: 'bold',
    marginRight: 14,
  },
  progressBarBg: {
    width: 100,
    height: 12,
    backgroundColor: '#E5E6EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFg: {
    height: 12,
    backgroundColor: '#246BFD',
    borderRadius: 6,
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
    backgroundColor: '#FFC940',
  },
  badgeLocked: {
    backgroundColor: '#E5E6EB',
  },
  badgeNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
  },
  badgeIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSection: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
    marginTop: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 0,
  },
  listContainer: {
    paddingTop: 0,
    paddingBottom: 20,
    paddingHorizontal: 0,
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
    backgroundColor: '#246BFD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  showTagText: {
    color: '#fff',
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
    color: '#2D2D2D',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#246BFD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexDirection: 'row',
  },
  progressCircleText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  progressCircleSub: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 2,
    fontWeight: '500',
  },
  progressBarContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 16,
    backgroundColor: '#E5E6EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFg: {
    height: 16,
    backgroundColor: '#246BFD',
    borderRadius: 8,
  },
  progressRight: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLeftText: {
    color: '#888',
    fontSize: 15,
  },
  progressCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6BCF7A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailMain: {
    flex: 1,
  },
  detailSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  detailSearchInput: {
    flex: 1,
    fontSize: 18,
    color: '#222',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    shadowColor: '#000',
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
    color: '#222',
  },
  detailAudioBtn: {
    backgroundColor: '#F4F6FB',
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
    color: '#888',
    fontStyle: 'italic',
    marginRight: 8,
  },
  detailShowTag: {
    backgroundColor: '#246BFD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  detailShowTagText: {
    color: '#fff',
    fontSize: 13,
  },
  detailDefBlock: {
    marginBottom: 18,
  },
  detailPartOfSpeech: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  detailDefinition: {
    fontSize: 17,
    color: '#222',
    marginBottom: 4,
  },
  detailExampleBlock: {
    marginLeft: 8,
    marginBottom: 2,
  },
  detailExampleEn: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  detailExampleZh: {
    fontSize: 14,
    color: '#888',
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
    backgroundColor: '#FEECEC',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  detailDeleteText: {
    color: '#F53F3F',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  detailCollectBtnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#246BFD',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  detailCollectTextSolid: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  previewDropdown: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 72,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
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
    borderBottomColor: '#F0F0F0',
  },
  previewWord: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
  },
  previewTranslation: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});

export default VocabularyScreen; 