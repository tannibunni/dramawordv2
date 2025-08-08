import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { wordService } from '../../services/wordService';
import type { WordData } from '../../types/word';
import { audioService } from '../../services/audioService';
import { useShowList } from '../../context/ShowListContext';
import { useVocabulary } from '../../context/VocabularyContext';
import { useNavigation } from '../../components/navigation/NavigationContext';
import { useAppLanguage } from '../../context/AppLanguageContext';

const { width: screenWidth } = Dimensions.get('window');

// 类型定义
interface WordDefinition {
  partOfSpeech: string;
  definition: string;
  examples: Array<{
    english: string;
    chinese: string;
  }>;
}

interface WordCardScreenProps {
  navigation?: any;
  route?: {
    params: {
      word?: string;
      wordData?: WordData;
    };
  };
}

const WordCardScreen: React.FC<WordCardScreenProps> = ({ navigation = {}, route }) => {
  const { goBack } = useNavigation();
  const word = route?.params?.word || 'hello';
  const initialWordData = route?.params?.wordData;
  
  const [wordData, setWordData] = useState<WordData | null>(initialWordData || null);
  const [isLoading, setIsLoading] = useState(!initialWordData);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedShow, setSelectedShow] = useState<any>(null);
  
  const cardHeight = useRef(new Animated.Value(400)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  
  const { shows } = useShowList();
  const { addWord } = useVocabulary();
  const { appLanguage } = useAppLanguage();
  
  // 加载单词数据
  useEffect(() => {
    if (!initialWordData) {
      loadWordData();
    }
  }, [word]);

  const loadWordData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await wordService.searchWord(word, 'en', appLanguage);
      
      if (result.success && result.data) {
        setWordData(result.data);
      } else {
        setError(result.error || '无法找到该单词');
      }
    } catch (error) {
      console.error('加载单词数据失败:', error);
      setError('网络连接异常，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 展开卡片
  const expandCard = () => {
    setIsExpanded(true);
    Animated.spring(cardHeight, { toValue: 600, useNativeDriver: false }).start();
  };

  // 收起卡片
  const collapseCard = () => {
    setIsExpanded(false);
    Animated.spring(cardHeight, { toValue: 400, useNativeDriver: false }).start();
  };

  // 收藏单词
  const handleCollect = () => {
    if (!wordData) return;
    
    // 构建动态的剧集选项
    const showOptions = [
      { text: '取消', style: 'cancel' as const },
      { text: '默认词库', onPress: () => confirmCollect(undefined) },
    ];
    
    // 添加用户添加的剧集
    shows.forEach(show => {
      showOptions.push({
        text: show.name,
        onPress: () => confirmCollect(show)
      });
    });
    
    // 显示选择剧集Modal
    Alert.alert(
      '选择收藏到哪个剧集？',
      '请选择要收藏到的剧集',
      showOptions
    );
  };

  // 确认收藏
  const confirmCollect = (sourceShow?: any) => {
    if (wordData) {
      addWord(wordData, sourceShow);
      setWordData((prev: WordData | null) => prev ? { ...prev, isCollected: true } : null);
      const showName = sourceShow ? sourceShow.name : '默认词库';
      Alert.alert('收藏成功', `已收藏到 ${showName}`);
    }
  };

  // 忽略单词
  const handleIgnore = () => {
    Alert.alert(
      '忽略单词',
      '确定要忽略这个单词吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          style: 'destructive',
          onPress: () => {
            Animated.timing(cardOpacity, { 
              toValue: 0, 
              duration: 300, 
              useNativeDriver: true 
            }).start(() => {
              goBack();
            });
          }
        },
      ]
    );
  };

  // 播放发音
  const playPronunciation = async () => {
    if (wordData) {
      try {
        await audioService.playWordPronunciation(wordData.word);
      } catch (error) {
        console.error('发音播放失败:', error);
        Alert.alert('播放失败', '音频播放失败，请稍后重试');
      }
    }
  };

  // 切换收藏状态
  const toggleCollect = () => {
    if (wordData?.isCollected) {
      setWordData((prev: WordData | null) => prev ? { ...prev, isCollected: false } : null);
      Alert.alert('已取消收藏');
    } else {
      handleCollect();
    }
  };

  // 重新加载
  const handleRetry = () => {
    loadWordData();
  };

  // 加载状态
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>单词详情</Text>
          <View style={styles.placeholderButton} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>加载单词数据中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 错误状态
  if (error || !wordData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>单词详情</Text>
          <View style={styles.placeholderButton} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error[500]} />
          <Text style={styles.errorTitle}>加载失败</Text>
          <Text style={styles.errorText}>{error || '无法获取单词数据'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color={colors.primary[500]} />
            <Text style={styles.retryButtonText}>重新加载</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>单词详情</Text>
        <TouchableOpacity onPress={toggleCollect} style={styles.collectButton}>
          <Ionicons 
            name={wordData.isCollected ? "heart" : "heart-outline"} 
            size={24} 
            color={wordData.isCollected ? colors.error[500] : colors.text.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* 单词卡片 */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.card,
            {
              height: cardHeight,
              opacity: cardOpacity,
            },
          ]}
        >
          {/* 正面 */}
          <View style={styles.cardFront}>
            <View style={styles.wordSection}>
              <Text style={styles.wordText}>{wordData.correctedWord || wordData.word}</Text>
              <View style={styles.phoneticSection}>
                <Text style={styles.phoneticText}>{wordData.phonetic}</Text>
                <TouchableOpacity onPress={playPronunciation} style={styles.pronunciationButton}>
                  <Ionicons name="volume-high" size={20} color={colors.primary[500]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.definitionSection}>
              <Text style={styles.definitionText}>
                {wordData.definitions[0]?.definition || '暂无释义'}
              </Text>
            </View>

            {!isExpanded && wordData.definitions.length > 1 && (
              <TouchableOpacity onPress={expandCard} style={styles.expandHint}>
                <Ionicons name="arrow-up" size={16} color={colors.text.tertiary} />
                <Text style={styles.expandHintText}>点击展开查看更多</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 展开内容 */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.definitionsList}>
                {wordData.definitions.map((definition: any, index: number) => (
                  <View key={index} style={styles.definitionItem}>
                    <View style={styles.definitionHeader}>
                      <Text style={styles.partOfSpeech}>{definition.partOfSpeech}</Text>
                      <Text style={styles.definitionText}>{definition.definition}</Text>
                    </View>
                    
                    {definition.examples.length > 0 && (
                      <View style={styles.examplesList}>
                        {definition.examples.map((example: any, exampleIndex: number) => (
                          <View key={exampleIndex} style={styles.exampleItem}>
                            <Text style={styles.exampleEnglish}>{example.english}</Text>
                            <Text style={styles.exampleChinese}>{example.chinese}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>

              <TouchableOpacity onPress={collapseCard} style={styles.collapseHint}>
                <Ionicons name="arrow-down" size={16} color={colors.text.tertiary} />
                <Text style={styles.collapseHintText}>收起</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleIgnore}>
            <Ionicons name="close-circle-outline" size={24} color={colors.error[500]} />
            <Text style={styles.actionButtonText}>忽略</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={toggleCollect}>
            <Ionicons 
              name={wordData.isCollected ? "heart" : "heart-outline"} 
              size={24} 
              color={wordData.isCollected ? colors.error[500] : colors.text.primary} 
            />
            <Text style={styles.actionButtonText}>
              {wordData.isCollected ? '已收藏' : '收藏'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  collectButton: {
    padding: 4,
  },
  placeholderButton: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.neutral[200],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardFront: {
    flex: 1,
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  wordText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  phoneticSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneticText: {
    fontSize: 18,
    color: colors.text.secondary,
    marginRight: 12,
  },
  pronunciationButton: {
    padding: 4,
  },
  definitionSection: {
    marginBottom: 24,
  },
  definitionText: {
    fontSize: 18,
    color: colors.text.primary,
    lineHeight: 26,
    textAlign: 'center',
  },
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  expandHintText: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginLeft: 4,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 24,
  },
  definitionsList: {
    marginBottom: 16,
  },
  definitionItem: {
    marginBottom: 20,
  },
  definitionHeader: {
    marginBottom: 12,
  },
  partOfSpeech: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[500],
    marginBottom: 4,
  },
  examplesList: {
    marginLeft: 16,
  },
  exampleItem: {
    marginBottom: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.border.light,
  },
  exampleEnglish: {
    fontSize: 14,
    color: colors.text.primary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  exampleChinese: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  collapseHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  collapseHintText: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
});

export { WordCardScreen }; 