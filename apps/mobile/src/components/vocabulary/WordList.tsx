import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { WordWithSource } from '../../context/VocabularyContext';

interface WordListProps {
  words: WordWithSource[];
  onWordPress?: (word: WordWithSource) => void;
  onDeleteWord?: (word: WordWithSource) => void;
  showDeleteButton?: boolean;
  style?: any;
}

const WordList: React.FC<WordListProps> = ({
  words,
  onWordPress,
  onDeleteWord,
  showDeleteButton = true,
  style,
}) => {
  const handleDeleteWord = (word: WordWithSource) => {
    Alert.alert(
      '删除单词',
      `确定要从单词表中删除 "${word.word}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            onDeleteWord?.(word);
          },
        },
      ]
    );
  };

  // 获取单词的所有相关剧集
  const getWordShows = (wordText: string) => {
    return words
      .filter(w => w.word === wordText)
      .map(w => w.sourceShow)
      .filter(Boolean);
  };

  // 为每个单词生成唯一的key
  const getWordKey = (item: WordWithSource, index: number) => {
    return `${item.word}-${item.sourceShow?.id || 'default'}-${item.collectedAt}-${index}`;
  };

  const renderWordItem = ({ item, index }: { item: WordWithSource; index: number }) => {
    const allShows = getWordShows(item.word);
    
    return (
      <View style={styles.wordCardBox}>
        <TouchableOpacity
          style={styles.wordCard}
          activeOpacity={0.8}
          onPress={() => onWordPress?.(item)}
        >
          <View style={styles.wordCardHeader}>
            <Text style={styles.wordText}>{item.word}</Text>
            {item.phonetic && <Text style={styles.phoneticText}>{item.phonetic}</Text>}
            {showDeleteButton && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteWord(item)}
                hitSlop={{top:10,right:10,bottom:10,left:10}}
              >
                <Ionicons name="trash" size={20} color={colors.error[500]} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.wordTranslation}>
            {item.definitions?.[0]?.definition || '暂无释义'}
          </Text>
          {allShows.length > 0 && (
            <View style={styles.showTagsContainer}>
              {allShows.map((show, showIndex) => (
                <View key={`${show?.id}-${showIndex}`} style={styles.showTag}>
                  <Text style={styles.showTagText}>{show?.name}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (words.length === 0) {
    return (
      <View style={[styles.emptyState, style]}>
        <Ionicons name="book-outline" size={48} color={colors.text.secondary} />
        <Text style={styles.emptyStateText}>暂无收藏的单词</Text>
        <Text style={styles.emptyStateSubtext}>去首页搜索并收藏单词吧</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={words}
      renderItem={renderWordItem}
      keyExtractor={getWordKey}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.listContainer, style]}
      style={{ flex: 1 }}
    />
  );
};

const styles = StyleSheet.create({
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
  showTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  showTag: {
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
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
    paddingVertical: 40,
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
});

export default WordList; 