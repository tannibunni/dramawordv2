import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

// 获取屏幕高度，用于计算最大高度
const { height: screenHeight } = Dimensions.get('window');

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
          <Text style={styles.pinyinText}> - {typeof item.pinyin === 'string' ? item.pinyin : ''}</Text>
        </View>
        <Text style={styles.englishText}>{item.english}</Text>
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
        showsVerticalScrollIndicator={true}
        style={styles.list}
        // 添加滚动指示器样式
        indicatorStyle="black"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, // 与搜索框无缝连接
    left: 16,
    right: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 16, // 与搜索框相同的圆角
    // 动态计算最大高度：屏幕高度 - 搜索框高度 - 底部导航高度 - 安全区域
    maxHeight: screenHeight * 0.6, // 限制为屏幕高度的60%
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.primary[200],
    shadowOffset: {
      width: 0,
      height: 8, // 增加阴影深度
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1000,
    // 添加顶部圆角，底部直角，模拟Google搜索效果
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
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
    // 移除固定高度限制，让FlatList自适应
    flexGrow: 0,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14, // 与搜索框的paddingVertical一致
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.secondary, // 与搜索框背景色一致
    // 添加点击效果
    minHeight: 48, // 确保最小触摸区域
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
    // 确保中文文本清晰显示
    lineHeight: 20,
  },
  englishText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
    // 限制英文文本长度，避免过长
    flexShrink: 1,
  },
  pinyinText: {
    fontSize: 12,
    color: colors.text.tertiary,
    lineHeight: 16,
    // 确保拼音显示完整
    flexShrink: 0,
  },
});

export default SuggestionList;
