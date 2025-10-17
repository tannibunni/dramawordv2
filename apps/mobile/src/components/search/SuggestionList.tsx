import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface SuggestionItem {
  id: string;
  chinese: string;
  english: string;
  pinyin: string;
  audioUrl?: string;
}

interface SuggestionListProps {
  suggestions: SuggestionItem[];
  onSelect: (suggestion: SuggestionItem) => void;
  visible: boolean;
}

const SuggestionList: React.FC<SuggestionListProps> = ({
  suggestions,
  onSelect,
  visible,
}) => {
  if (!visible || suggestions.length === 0) {
    return null;
  }

  const renderSuggestion = ({ item }: { item: SuggestionItem }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionContent}>
        <View style={styles.suggestionText}>
          <Text style={styles.chineseText}>{item.chinese}</Text>
          <Text style={styles.englishText}> - {item.english}</Text>
        </View>
        <Text style={styles.pinyinText}>拼音: {item.pinyin}</Text>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={16} 
        color={colors.text.tertiary} 
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {suggestions.length} 个候选词
        </Text>
      </View>
      <FlatList
        data={suggestions}
        renderItem={renderSuggestion}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    marginTop: 8,
    marginHorizontal: 16,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  list: {
    maxHeight: 240,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  chineseText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  englishText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  pinyinText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
});

export default SuggestionList;
