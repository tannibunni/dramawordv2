import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { WordWithSource } from '../../context/VocabularyContext';
import { Swipeable } from 'react-native-gesture-handler';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';

interface WordListProps {
  words: WordWithSource[];
  onWordPress?: (word: WordWithSource) => void;
  onDeleteWord?: (word: WordWithSource) => void;
  style?: any;
}

const WordList: React.FC<WordListProps> = ({
  words,
  onWordPress,
  onDeleteWord,
  style,
}) => {
  const { appLanguage } = useAppLanguage();
  const handleDeleteWord = (word: WordWithSource) => {
            onDeleteWord?.(word);
  };

  // 渲染右划操作按钮
  const renderRightActions = (item: WordWithSource) => {
    return (
      <View style={{ flexDirection: 'row', height: '100%' }}>
        <TouchableOpacity
          style={{
            backgroundColor: 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            height: '100%',
          }}
          onPress={() => handleDeleteWord(item)}
        >
          <Ionicons name="trash" size={28} color={colors.error[500]} />
          <Text style={{ color: colors.error[500], fontWeight: 'bold', marginTop: 4 }}>删除</Text>
        </TouchableOpacity>
      </View>
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
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
      >
    <View style={styles.wordCardBox}>
      <TouchableOpacity
        style={styles.wordCard}
        activeOpacity={0.8}
        onPress={() => onWordPress?.(item)}
      >
        <View style={styles.wordCardHeader}>
          <Text style={styles.wordText}>{item.word}</Text>
          {item.phonetic && <Text style={styles.phoneticText}>{item.phonetic}</Text>}
        </View>
        <Text style={styles.wordTranslation}>
          {item.definitions?.[0]?.definition || '暂无释义'}
        </Text>
            {allShows.length > 0 && (
              <View style={styles.showTagsContainer}>
                {allShows.map((show, showIndex) => (
                  <View
                    key={`${show?.id}-${showIndex}`}
                    style={[
                      styles.showTag,
                      show?.type === 'wordbook' && styles.wordbookTag
                    ]}
                  >
                    <Text style={styles.showTagText}>{show?.name}</Text>
                  </View>
                ))}
          </View>
        )}
      </TouchableOpacity>
    </View>
      </Swipeable>
  );
  };

  if (words.length === 0) {
    return (
      <View style={[styles.emptyState, style]}>
        <Ionicons name="book-outline" size={48} color={colors.text.secondary} />
        <Text style={styles.emptyStateText}>{t('no_saved_words', appLanguage)}</Text>
        <Text style={styles.emptyStateSubtext}>{t('go_search_and_save_words', appLanguage)}</Text>
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
    // paddingHorizontal: 0, // 移除这行，让父组件的style属性生效
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
  wordbookTag: {
    backgroundColor: colors.success[400], // 绿色
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