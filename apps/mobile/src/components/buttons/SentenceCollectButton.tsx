import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useSavedSentences } from '../../context/SavedSentencesContext';
import { WordData } from '../cards/WordCard';

interface SentenceCollectButtonProps {
  wordData: WordData;
  style?: any;
  size?: number;
  showText?: boolean;
}

const SentenceCollectButton: React.FC<SentenceCollectButtonProps> = ({
  wordData,
  style,
  size = 24,
  showText = false
}) => {
  const { saveSentence, removeSentence, isSentenceSaved } = useSavedSentences();
  const [isCollected, setIsCollected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 检查句子是否已收藏
  useEffect(() => {
    const checkCollectionStatus = async () => {
      try {
        setIsChecking(true);
        const saved = await isSentenceSaved(wordData.word);
        setIsCollected(saved);
      } catch (error) {
        console.error('❌ 检查收藏状态失败:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkCollectionStatus();
  }, [wordData.word, isSentenceSaved]);

  // 处理收藏/取消收藏
  const handleToggleCollection = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      if (isCollected) {
        // 取消收藏
        const success = await removeSentence(wordData.word);
        if (success) {
          setIsCollected(false);
          Alert.alert('成功', '句子已从收藏中移除');
        } else {
          Alert.alert('错误', '移除收藏失败，请重试');
        }
      } else {
        // 收藏句子
        const sentenceData = {
          originalText: wordData.word,
          translation: wordData.correctedWord || wordData.translation || wordData.word,
          phonetic: wordData.phonetic,
          audioUrl: wordData.audioUrl,
          wordData: wordData,
          difficulty: 'easy' as const,
          tags: ['翻译句子'],
          notes: ''
        };

        const success = await saveSentence(sentenceData);
        if (success) {
          setIsCollected(true);
          Alert.alert('成功', '句子已添加到收藏');
        } else {
          Alert.alert('提示', '句子已在收藏中');
        }
      }
    } catch (error) {
      console.error('❌ 收藏操作失败:', error);
      Alert.alert('错误', '操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <TouchableOpacity style={[styles.button, style]} disabled>
        <ActivityIndicator size="small" color={colors.text.secondary} />
        {showText && <Text style={styles.buttonText}>检查中...</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isCollected && styles.collectedButton,
        style
      ]}
      onPress={handleToggleCollection}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.text.secondary} />
      ) : (
        <Ionicons
          name={isCollected ? "bookmark" : "bookmark-outline"}
          size={size}
          color={isCollected ? colors.primary[500] : colors.text.secondary}
        />
      )}
      {showText && (
        <Text style={[
          styles.buttonText,
          isCollected && styles.collectedText
        ]}>
          {isCollected ? '已收藏' : '收藏句子'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = {
  button: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  collectedButton: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  buttonText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500' as const,
  },
  collectedText: {
    color: colors.primary[500],
  },
};

export default SentenceCollectButton;
