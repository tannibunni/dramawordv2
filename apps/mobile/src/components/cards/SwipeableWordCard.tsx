import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { WordData } from './WordCard';
import WordCardContent from './WordCardContent';
import { Audio } from 'expo-av';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';

interface SwipeableWordCardProps {
  wordData: WordData;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onPlayAudio?: (word: string) => void;
}

const SwipeableWordCard: React.FC<SwipeableWordCardProps> = ({
  wordData,
  isExpanded = false,
  onExpandToggle,
  onPlayAudio,
}) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const { appLanguage } = useAppLanguage();
  


  const handleExpand = () => {
    setLocalExpanded((prev) => !prev);
    onExpandToggle?.();
  };

  const expanded = isExpanded || localExpanded;

  // 播放发音
  const handlePlayAudio = async () => {
    const word = wordData.correctedWord || wordData.word;
    console.log('🎵 SwipeableWordCard - 开始播放音频:', word);
    console.log('🎵 SwipeableWordCard - wordData.audioUrl:', wordData.audioUrl);
    
    try {
      // 优先使用wordData中的audioUrl
      if (wordData.audioUrl) {
        console.log('🎵 SwipeableWordCard - 使用wordData.audioUrl:', wordData.audioUrl);
        const { Audio } = await import('expo-av');
        const { sound } = await Audio.Sound.createAsync({ uri: wordData.audioUrl });
        await sound.playAsync();
        console.log('✅ SwipeableWordCard - 音频播放成功');
        return;
      }
      
      // 如果没有audioUrl，使用onPlayAudio回调
      if (onPlayAudio) {
        console.log('🎵 SwipeableWordCard - 使用onPlayAudio回调');
        await onPlayAudio(word);
        console.log('✅ SwipeableWordCard - 音频播放成功');
      } else {
        console.warn('⚠️ SwipeableWordCard - onPlayAudio 回调未提供，且没有audioUrl');
      }
    } catch (error) {
      console.error('❌ SwipeableWordCard - 音频播放失败:', error);
      // 可以在这里添加用户提示
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* 内容区域 */}
        <View style={styles.contentSection}>
          {expanded ? (
            <ScrollView 
              style={styles.expandedContent} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.expandedContentContainer}
              bounces={false}
              alwaysBounceVertical={false}
            >
              <WordCardContent 
                wordData={wordData} 
                onPlayAudio={onPlayAudio} 
                showHeader={true}
                scrollable={false}
              />
            </ScrollView>
          ) : (
            <View style={styles.collapsedContent}>
              {/* 单词区域 */}
              <View style={styles.wordSection}>
                <Text style={styles.word}>
                  {wordData.translation || wordData.correctedWord || wordData.word}
                </Text>
                <View style={styles.phoneticContainer}>
                  <Text style={styles.phonetic}>
                    {wordData.pinyin || wordData.phonetic}
                  </Text>
                  <TouchableOpacity style={styles.audioButton} onPress={handlePlayAudio}>
                    <Ionicons name="volume-high" size={20} color={colors.primary[500]} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={styles.showAnswerButton}
                onPress={handleExpand}
              >
                <Text style={styles.showAnswerText}>{t('show_answer', appLanguage)}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* 滑动提示区域 - 移到卡片内部底部 */}
        <View style={styles.swipeHintsContainer}>
          <Text style={styles.swipeHintLeft}>
            {appLanguage === 'zh-CN' ? '← 忘记' : '← Forget'}
          </Text>
          <Text style={styles.swipeHintRight}>
            {appLanguage === 'zh-CN' ? '记住 →' : 'Remember →'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start', // 从 center 改为 flex-start，减少底部空白
    paddingVertical: 16,
  },
  card: {
    width: '100%',
    maxWidth: 350,
    minHeight: 550, 
    maxHeight: 700, // 添加最大高度限制，防止卡片无限扩展
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 32, // 减少padding从60到32
    paddingBottom: 60, // 增加底部padding为提示留出空间
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative', // 确保绝对定位的提示相对于卡片定位
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  phonetic: {
    fontSize: 18,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  phoneticContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  audioButton: {
    marginLeft: 8,
    padding: 5,
  },
  contentSection: {
    flex: 1,
    marginBottom: 12, // 从 20 减少到 12，减少底部空白
    minHeight: 400, // 添加最小高度，让内容区域有足够空间
  },
  collapsedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400, // 添加最小高度，确保折叠状态下也有足够空间
  },
  questionText: {
    fontSize: 18,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  showAnswerButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  showAnswerText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  expandedContent: {
    flex: 1,
    minHeight: 400, // 添加最小高度，确保内容区域有足够空间
    maxHeight: 500, // 从 400 增加到 500，让内容区域有更多空间，但不超过卡片总高度
  },
  expandedContentContainer: {
    paddingBottom: 20, // 减少底部padding，因为移除了originSection
  },
  swipeHintsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  swipeHintLeft: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'bold',
   
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  swipeHintRight: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'bold',
    
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
});

export default SwipeableWordCard; 