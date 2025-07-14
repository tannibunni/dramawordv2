import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { WordData } from './WordCard';
import { Audio } from 'expo-av';

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

  const handleExpand = () => {
    setLocalExpanded((prev) => !prev);
    onExpandToggle?.();
  };

  const expanded = isExpanded || localExpanded;

  // 播放发音
  const handlePlayAudio = () => {
    console.log('🎵 单词:', wordData.correctedWord || wordData.word);
    if (onPlayAudio) {
      onPlayAudio(wordData.correctedWord || wordData.word);
    }
  };

  return (
    <View style={styles.container}>
        <View style={styles.card}>
        
        {/* 内容区域 */}
        <View style={styles.contentSection}>
          {expanded ? (
            <ScrollView style={styles.expandedContent} showsVerticalScrollIndicator={false}>
          <View style={styles.wordSection}>
            <Text style={styles.word}>{wordData.correctedWord || wordData.word}</Text>
            <Text style={styles.phonetic}>{wordData.phonetic}</Text>
                <TouchableOpacity style={styles.audioButton} onPress={handlePlayAudio}>
                  <Ionicons name="volume-high" size={24} color={colors.primary[500]} />
                </TouchableOpacity>
          </View>
              {wordData.definitions.map((def, index) => (
                <View key={index} style={styles.definitionItem}>
                  <Text style={styles.partOfSpeech}>{def.partOfSpeech}</Text>
                  <Text style={styles.definition}>{def.definition}</Text>
                  {def.examples && def.examples.length > 0 && (
                    <View style={styles.examplesContainer}>
                      <Text style={styles.examplesTitle}>例句：</Text>
                      {def.examples.map((ex, exIdx) => (
                        <View key={exIdx} style={styles.exampleItem}>
                          <Text style={styles.exampleEnglish}>{ex.english}</Text>
                          <Text style={styles.exampleChinese}>{ex.chinese}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
              {/* 单词来源信息 */}
              {wordData.lastSearched && (
                <View style={styles.originSection}>
                  <Text style={styles.originTitle}>学习记录</Text>
                  <Text style={styles.originText}>搜索次数: {wordData.searchCount || 0}</Text>
                  <Text style={styles.originText}>最后学习: {wordData.lastSearched}</Text>
            </View>
              )}
            </ScrollView>
          ) : (
            <View style={styles.collapsedContent}>
              {/* 单词区域 */}
        <View style={styles.wordSection}>
          <Text style={styles.word}>{wordData.correctedWord || wordData.word}</Text>
          <Text style={styles.phonetic}>{wordData.phonetic}</Text>
        </View>
              <TouchableOpacity
                style={styles.showAnswerButton}
                onPress={handleExpand}
              >
                <Text style={styles.showAnswerText}>显示答案</Text>
              </TouchableOpacity>
            </View>
          )}
            </View>
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
  definitionItem: {
    marginBottom: 20,
  },
  partOfSpeech: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  definition: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: 8,
  },
  examplesContainer: {
    marginTop: 8,
    paddingLeft: 12,
  },
  examplesTitle: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  exampleItem: {
    marginBottom: 8,
    paddingLeft: 8,
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
  audioButton: {
    marginTop: 10,
    padding: 5,
  },
});

export default SwipeableWordCard; 