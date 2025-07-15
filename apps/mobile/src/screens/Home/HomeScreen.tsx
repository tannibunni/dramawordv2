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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../packages/ui/src/tokens';
import { wordService, RecentWord } from '../../services/wordService';
import WordCard from '../../components/cards/WordCard';
import { useShowList } from '../../context/ShowListContext';
import { useVocabulary } from '../../context/VocabularyContext';
import { TMDBService, TMDBShow } from '../../services/tmdbService';
import { Audio } from 'expo-av';

const HomeScreen: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [recentWords, setRecentWords] = useState<RecentWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
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

  useEffect(() => {
    loadRecentWords();
  }, []);

  useEffect(() => {
    // 监听 vocabulary 数量变化
    if (vocabulary.length > prevVocabCount.current) {
      const unlocked = badgeTargets.find(target => prevVocabCount.current < target && vocabulary.length >= target);
      if (unlocked) {
        setCelebrateBadge(unlocked);
        setShowBadgeCelebrate(true);
        setTimeout(() => setShowBadgeCelebrate(false), 1800);
      }
    }
    prevVocabCount.current = vocabulary.length;
  }, [vocabulary.length]);

  const loadRecentWords = async () => {
    try {
      setIsLoadingRecent(true);
      const recent = await wordService.getRecentWords();
      
      // 前端去重逻辑，确保没有重复单词
      const uniqueWords = recent.reduce((acc: RecentWord[], current) => {
        const exists = acc.find(item => item.word.toLowerCase() === current.word.toLowerCase());
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setRecentWords(uniqueWords);
    } catch (error) {
      console.error('加载最近查词失败:', error);
      Alert.alert('提示', '加载历史词失败，请检查网络连接');
    } finally {
      setIsLoadingRecent(false);
    }
  };

  // 搜索处理
  const handleSearch = async () => {
    const word = searchText.trim().toLowerCase();
    if (!word) {
      Alert.alert('提示', '请输入要查询的单词');
      return;
    }
    setIsLoading(true);
    setSearchResult(null);
    setSearchSuggestions([]);
    try {
      const result = await wordService.searchWord(word);
      if (result.success && result.data) {
        // 日志：输出 definitions 和例句
        if (result.data.definitions) {
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
        // 保存查词记录
        await wordService.saveSearchHistory(
          (result.data.correctedWord || result.data.word).trim().toLowerCase(),
          result.data.definitions && result.data.definitions[0]?.definition ? result.data.definitions[0].definition : '暂无释义'
        );
        // 更新最近查词列表 - 去重并保持最新
        setRecentWords(prev => {
          // 过滤掉重复的单词，保留最新的
          const filtered = prev.filter(w => (w.word.trim().toLowerCase() !== (result.data!.correctedWord || result.data!.word).trim().toLowerCase()));
          return [
            {
              id: Date.now().toString(),
              word: (result.data!.correctedWord || result.data!.word).trim().toLowerCase(),
              translation: result.data!.definitions && result.data!.definitions[0]?.definition ? result.data!.definitions[0].definition : '暂无释义',
              timestamp: Date.now(),
            },
            ...filtered.slice(0, 4) // 只保留前5个（包括新添加的）
          ];
        });
        setSearchResult(result.data);
        setSearchText('');
      } else if ((result as any).suggestions && (result as any).suggestions.length > 0) {
        setSearchSuggestions((result as any).suggestions);
      } else {
        Alert.alert('查询失败', result.error || '无法找到该单词');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      Alert.alert('搜索失败', '网络连接异常，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 点击历史词
  const handleRecentWordPress = async (word: RecentWord) => {
    const searchWord = word.word.trim().toLowerCase();
    console.log('🔍 点击历史词:', searchWord);
    setIsLoading(true);
    setSearchResult(null);
    try {
      const result = await wordService.searchWord(searchWord);
      console.log('🔍 搜索结果:', result);
      if (result.success && result.data) {
        console.log('🔍 设置 searchResult:', result.data);
        setSearchResult(result.data);
      } else {
        console.error('❌ 查询失败:', result.error);
        Alert.alert('查询失败', '无法获取单词详情');
      }
    } catch (error) {
      console.error('❌ 获取单词详情失败:', error);
      Alert.alert('查询失败', '网络连接异常，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 搜索框内容变化
  const handleInputChange = (text: string) => {
    setSearchText(text);
    if (text.length === 0) {
      setSearchResult(null);
    }
  };

  // 收藏按钮高亮逻辑
  const isCollected = searchResult && vocabulary.some(w => w.word.trim().toLowerCase() === searchResult.word.trim().toLowerCase());

  // 收藏按钮点击
  const handleCollect = () => {
    setShowCollectModal(true);
  };

  // 修改 handleCreateWordbook：只新建单词本并选中，不添加单词
  const handleCreateWordbook = () => {
    if (!newWordbookName.trim()) {
      Alert.alert('请输入单词本名称');
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
        Alert.alert('没有发音', '该单词暂无发音资源');
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
          Alert.alert('播放出错', `错误信息: ${status.error}`);
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
        '播放失败', 
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
      '确认清除',
      '确定要清除所有最近查词记录吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const success = await wordService.clearSearchHistory();
              if (success) {
                setRecentWords([]);
                Alert.alert('清除成功', '最近查词记录已清除');
              } else {
                Alert.alert('清除失败', '清除最近查词记录失败，请稍后重试');
              }
            } catch (error) {
              console.error('清除搜索历史失败:', error);
              Alert.alert('清除失败', '清除最近查词记录时发生错误');
            }
          }
        },
      ]
    );
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
        <View style={styles.celebrateOverlay} pointerEvents="none">
          <View style={styles.celebrateBox}>
            <Text style={styles.celebrateEmoji}>🎉</Text>
            <Text style={styles.celebrateText}>恭喜解锁 {celebrateBadge} 个单词徽章！</Text>
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
            <Ionicons name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
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
                  placeholder="输入英文单词..."
                  placeholderTextColor={colors.text.tertiary}
                  value={searchText}
                  onChangeText={handleInputChange}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
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
          </View>
        </View>
        {/* 内容区：有查词结果时只显示卡片，否则显示最近查词 */}
        {searchResult ? (
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
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginBottom: 16 }}>猜你想搜</Text>
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
                <Text style={styles.sectionTitle}>最近查词</Text>
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
                    <Text style={styles.loadingText}>加载中...</Text>
                  </View>
                ) : recentWords.length > 0 ? (
                  recentWords.map((word) => (
                    <TouchableOpacity
                      key={word.id}
                      style={styles.recentWordItem}
                      onPress={() => handleRecentWordPress(word)}
                      disabled={isLoading}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="time-outline" size={18} color={colors.neutral[400]} style={{ marginRight: 8 }} />
                        <Text style={styles.recentWordText}>{word.word}</Text>
                        <Text style={styles.recentWordTranslation} numberOfLines={1} ellipsizeMode="tail">{word.translation}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
                    <Text style={styles.emptyStateText}>暂无最近查词记录</Text>
                  </View>
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
              <Text style={styles.modalTitle}>标记单词来源</Text>
              <Text style={styles.modalSubtitle}>选择正在看的剧集，或搜索添加新剧</Text>
              {/* 剧集搜索框 */}
              <View style={styles.modalSearchBox}>
                <Ionicons name="search" size={18} color={colors.text.secondary} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="搜索剧集..."
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
              <Text style={styles.modalSectionTitle}>我的剧集</Text>
              {(() => {
                const wordbooks = shows.filter(s => s.type === 'wordbook');
                const allShows = shows.filter(s => s.type !== 'wordbook');
                const data = [
                  { id: 'default', name: '默认词库' }, 
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
                        {'type' in item && item.type === 'wordbook' && <Text style={styles.wordbookTag}>单词本</Text>}
                        {/* 不再显示“想看”标签 */}
                        {selectedShow && selectedShow.id === item.id && (
                          <Ionicons name="checkmark-circle" size={18} color={colors.primary[500]} style={{ marginLeft: 8 }} />
                        )}
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 160, marginBottom: 8 }}
                    ListEmptyComponent={<Text style={styles.modalEmptyText}>暂无剧集，请先添加剧集</Text>}
                  />
                );
              })()}
              {/* 新建单词本按钮或输入框 */}
              {isCreatingWordbook ? (
                <View style={styles.createWordbookContainer}>
                  <View style={styles.createWordbookInputRow}>
                    <TextInput
                      style={styles.createWordbookInput}
                      placeholder="输入单词本名称"
                      value={newWordbookName}
                      onChangeText={setNewWordbookName}
                      autoFocus={true}
                    />
                    <TouchableOpacity
                      style={styles.createWordbookConfirmButton}
                      onPress={handleCreateWordbook}
                    >
                      <Text style={styles.createWordbookConfirmText}>确定</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.createWordbookCancelButton}
                      onPress={cancelCreateWordbook}
                    >
                      <Text style={styles.createWordbookCancelText}>取消</Text>
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
                  <Text style={{ color: colors.primary[700], fontSize: 15, marginTop: 2 }}>新建单词本</Text>
                </TouchableOpacity>
              )}

              {/* 按钮区 */}
              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowCollectModal(false)}>
                  <Text style={styles.modalCancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, !selectedShow && { opacity: 0.5 }]}
                  onPress={handleConfirmCollect}
                  disabled={!selectedShow}
                >
                  <Text style={styles.modalConfirmText}>确定</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* 删除新建单词本弹窗，改为内联输入框 */}
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.neutral[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
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
    padding: 4,
  },
  recentSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  wordsContainer: {
    gap: 12,
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
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    shadowColor: colors.neutral[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    padding: 24,
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
    shadowColor: '#23223A',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  createWordbookConfirmText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '500',
  },
  createWordbookCancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 4,
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
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 0,
    marginRight: 8,
  },
  recentWordTranslation: {
    fontSize: 15,
    color: colors.text.secondary,
    flexShrink: 1,
    maxWidth: '65%',
  },
});

export { HomeScreen }; 