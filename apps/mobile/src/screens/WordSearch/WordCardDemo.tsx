import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../packages/ui/src/tokens';
import { useNavigation } from '../../components/navigation/NavigationContext';
import {
  WordCard,
  SwipeableWordCard,
  FlipWordCard,
  WordData,
} from '../../components/cards';
import { audioService } from '../../services/audioService';

// 模拟单词数据
const mockWordData: WordData = {
  word: 'beautiful',
  phonetic: '/ˈbjuːtɪfʊl/',
  definitions: [
    {
      partOfSpeech: 'adjective',
      definition: '美丽的，漂亮的',
      examples: [
        {
          english: 'She is a beautiful woman.',
          chinese: '她是一个美丽的女人。',
        },
        {
          english: 'What a beautiful day!',
          chinese: '多么美好的一天！',
        },
      ],
    },
    {
      partOfSpeech: 'adjective',
      definition: '美好的，优秀的',
      examples: [
        {
          english: 'He has a beautiful mind.',
          chinese: '他有一个美好的心灵。',
        },
      ],
    },
  ],
  searchCount: 15,
  lastSearched: new Date().toISOString(),
  isCollected: false,
};

const WordCardDemo: React.FC = () => {
  const { goBack } = useNavigation();
  const [currentCard, setCurrentCard] = useState<'basic' | 'swipe' | 'flip'>('basic');
  const [showAnswer, setShowAnswer] = useState(false);

  // 处理收藏
  const handleCollect = (word: string) => {
    Alert.alert('收藏成功', `已收藏单词 "${word}"`);
  };

  // 处理忽略
  const handleIgnore = (word: string) => {
    Alert.alert('忽略成功', `已忽略单词 "${word}"`);
  };

  // 处理音频播放
  const handlePlayAudio = async (word: string) => {
    try {
      await audioService.playWordPronunciation(word);
      Alert.alert('播放成功', `正在播放 "${word}" 的发音`);
    } catch (error) {
      Alert.alert('播放失败', '音频播放功能开发中...');
    }
  };

  // 处理滑动
  const handleSwipeLeft = (word: string) => {
    Alert.alert('忘记', `标记 "${word}" 为忘记`);
  };

  const handleSwipeRight = (word: string) => {
    Alert.alert('记住', `标记 "${word}" 为记住`);
  };

  const handleSwipeUp = (word: string) => {
    Alert.alert('收藏', `收藏单词 "${word}"`);
  };

  const handleSwipeDown = (word: string) => {
    Alert.alert('跳过', `跳过单词 "${word}"`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>单词卡片演示</Text>
        <View style={styles.placeholderButton} />
      </View>

      {/* 卡片类型选择 */}
      <View style={styles.cardTypeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            currentCard === 'basic' && styles.activeTypeButton,
          ]}
          onPress={() => setCurrentCard('basic')}
        >
          <Text
            style={[
              styles.typeButtonText,
              currentCard === 'basic' && styles.activeTypeButtonText,
            ]}
          >
            基础卡片
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            currentCard === 'swipe' && styles.activeTypeButton,
          ]}
          onPress={() => setCurrentCard('swipe')}
        >
          <Text
            style={[
              styles.typeButtonText,
              currentCard === 'swipe' && styles.activeTypeButtonText,
            ]}
          >
            滑动卡片
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            currentCard === 'flip' && styles.activeTypeButton,
          ]}
          onPress={() => setCurrentCard('flip')}
        >
          <Text
            style={[
              styles.typeButtonText,
              currentCard === 'flip' && styles.activeTypeButtonText,
            ]}
          >
            翻转卡片
          </Text>
        </TouchableOpacity>
      </View>

      {/* 卡片展示区域 */}
      <View style={styles.cardContainer}>
        {currentCard === 'basic' && (
          <ScrollView style={styles.scrollContainer}>
            <WordCard
              wordData={mockWordData}
              onCollect={handleCollect}
              onIgnore={handleIgnore}
              onPlayAudio={handlePlayAudio}
            />
          </ScrollView>
        )}

        {currentCard === 'swipe' && (
          <View style={styles.swipeContainer}>
            <SwipeableWordCard
              wordData={mockWordData}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onSwipeUp={handleSwipeUp}
              onSwipeDown={handleSwipeDown}
              showAnswer={showAnswer}
              onToggleAnswer={() => setShowAnswer(!showAnswer)}
            />
            
            {/* 操作提示 */}
            <View style={styles.swipeHint}>
              <Text style={styles.hintTitle}>滑动操作说明：</Text>
              <Text style={styles.hintText}>• 左滑：忘记</Text>
              <Text style={styles.hintText}>• 右滑：记住</Text>
              <Text style={styles.hintText}>• 上滑：收藏</Text>
              <Text style={styles.hintText}>• 下滑：跳过</Text>
            </View>
          </View>
        )}

        {currentCard === 'flip' && (
          <View style={styles.flipContainer}>
            <FlipWordCard
              wordData={mockWordData}
              onCollect={handleCollect}
              onIgnore={handleIgnore}
              onPlayAudio={handlePlayAudio}
            />
            
            {/* 操作提示 */}
            <View style={styles.flipHint}>
              <Text style={styles.hintTitle}>翻转操作说明：</Text>
              <Text style={styles.hintText}>• 点击右上角眼睛图标翻转卡片</Text>
              <Text style={styles.hintText}>• 正面显示单词，背面显示释义</Text>
            </View>
          </View>
        )}
      </View>

      {/* 功能说明 */}
      <View style={styles.featureInfo}>
        <Text style={styles.featureTitle}>功能特性：</Text>
        <Text style={styles.featureText}>• 支持展开/收起动画</Text>
        <Text style={styles.featureText}>• 支持手势滑动操作</Text>
        <Text style={styles.featureText}>• 支持3D翻转效果</Text>
        <Text style={styles.featureText}>• 支持音频播放（开发中）</Text>
        <Text style={styles.featureText}>• 支持收藏/忽略操作</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholderButton: {
    width: 40,
  },
  cardTypeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
  },
  activeTypeButton: {
    backgroundColor: colors.primary[500],
  },
  typeButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeTypeButtonText: {
    color: colors.text.inverse,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  swipeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeHint: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    width: '100%',
  },
  flipHint: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    width: '100%',
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  featureInfo: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
});

export default WordCardDemo; 