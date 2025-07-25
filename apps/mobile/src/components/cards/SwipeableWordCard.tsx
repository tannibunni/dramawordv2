import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { WordData } from './WordCard';
import WordCardContent from './WordCardContent';
import { Audio } from 'expo-av';
import { useAppLanguage } from '../../context/AppLanguageContext';

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
  
  // 翻译函数
  const t = (key: string): string => {
    const isChinese = appLanguage === 'zh-CN';
    const translations = {
      'show_answer': isChinese ? '显示答案' : 'Show Answer',
      'examples': isChinese ? '例句：' : 'Examples:',
      'learning_record': isChinese ? '学习记录' : 'Learning Record',
      'search_count': isChinese ? '搜索次数:' : 'Search Count:',
      'last_learned': isChinese ? '最后学习:' : 'Last Learned:'
    };
    return translations[key as keyof typeof translations] || key;
  };

  const handleExpand = () => {
    setLocalExpanded((prev) => !prev);
    onExpandToggle?.();
  };

  const expanded = isExpanded || localExpanded;

  // 播放发音
  const handlePlayAudio = async () => {
    const word = wordData.correctedWord || wordData.word;
    console.log('🎵 单词:', word);
    
    try {
      if (onPlayAudio) {
        await onPlayAudio(word);
        console.log('✅ 音频播放成功');
      } else {
        console.warn('⚠️ onPlayAudio 回调未提供');
        // 可以在这里添加本地音频播放逻辑作为备用
      }
    } catch (error) {
      console.error('❌ 音频播放失败:', error);
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
            >
              <WordCardContent 
                wordData={wordData} 
                onPlayAudio={onPlayAudio} 
                showHeader={true}
                scrollable={false}
              />
              {/* 单词来源信息 */}
              {wordData.lastSearched && (
                <View style={styles.originSection}>
                  <Text style={styles.originTitle}>{t('learning_record')}</Text>
                  <Text style={styles.originText}>{t('search_count')} {wordData.searchCount || 0}</Text>
                  <Text style={styles.originText}>{t('last_learned')} {wordData.lastSearched}</Text>
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={styles.collapsedContent}>
              {/* 单词区域 */}
              <View style={styles.wordSection}>
                <Text style={styles.word}>{wordData.correctedWord || wordData.word}</Text>
                <View style={styles.phoneticContainer}>
                  <Text style={styles.phonetic}>{wordData.phonetic}</Text>
                  <TouchableOpacity style={styles.audioButton} onPress={handlePlayAudio}>
                    <Ionicons name="volume-high" size={20} color={colors.primary[500]} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={styles.showAnswerButton}
                onPress={handleExpand}
              >
                <Text style={styles.showAnswerText}>{t('show_answer')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        
      </View>
      {/* 滑动提示区域 */}
      <View style={styles.swipeHintsContainer}>
          <Text style={styles.swipeHintLeft}>←左滑忘记</Text>
          <Text style={styles.swipeHintRight}>右划记住→</Text>
        </View>
    </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  card: {
    width: '100%',
    maxWidth: 350,
    minHeight: 600,
    maxHeight: 700, // 设置最大高度
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 60,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'space-between',
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
    marginBottom: 20,
  },
  collapsedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  expandedContentContainer: {
    paddingBottom: 20, // 底部留出空间给提示文字
  },
  originSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  originTitle: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  originText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  swipeHintsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  swipeHintLeft: {
    fontSize: 13,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  swipeHintRight: {
    fontSize: 13,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default SwipeableWordCard; 