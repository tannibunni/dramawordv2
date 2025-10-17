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
    position: 'absolute',
    top: 4, // 与搜索框底部有4px间距
    left: 16,
    right: 16,
    backgroundColor: colors.background.secondary, // 与搜索框相同的背景色
    borderRadius: 16, // 与搜索框相同的圆角
    maxHeight: 300,
    borderWidth: 1,
    borderColor: colors.border.light, // 与搜索框相同的边框色
    shadowColor: colors.primary[200], // 与搜索框相同的阴影色
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.secondary, // 与容器背景色一致
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
    paddingVertical: 14, // 与搜索框的paddingVertical一致
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.secondary, // 与搜索框背景色一致
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
