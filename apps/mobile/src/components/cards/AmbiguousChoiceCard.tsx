// 歧义选择卡片组件
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface AmbiguousChoiceCardProps {
  options: Array<{
    type: 'dictionary' | 'translation';
    title: string;
    description: string;
    data: any;
  }>;
  onSelect: (option: { type: 'dictionary' | 'translation'; data: any }) => void;
  onClose: () => void;
  input: string;
}

export const AmbiguousChoiceCard: React.FC<AmbiguousChoiceCardProps> = ({
  options,
  onSelect,
  onClose,
  input
}) => {
  // 安全检查：确保options是数组
  const safeOptions = Array.isArray(options) ? options : [];
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* 关闭按钮 */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={26} color={colors.text.secondary} />
        </TouchableOpacity>

        {/* 标题 */}
        <Text style={styles.title}>
          "{input}" 的查询结果
        </Text>
        <Text style={styles.subtitle}>
          请选择您想要的查询方式：
        </Text>

        {/* 选项列表 */}
        <View style={styles.optionsContainer}>
          {safeOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={() => onSelect(option)}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <Ionicons
                  name={option.type === 'dictionary' ? 'book' : 'language'}
                  size={20}
                  color={colors.primary[600]}
                />
                <View style={styles.optionTitleContainer}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  {/* 显示拼音信息 */}
                  {option.data?.phonetic && (
                    <Text style={styles.phoneticText}>{option.data.phonetic}</Text>
                  )}
                  {option.data?.pinyin && option.data.pinyin !== option.data.phonetic && (
                    <Text style={styles.pinyinText}>{option.data.pinyin}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.optionDescription}>{option.description}</Text>
              
              {/* 预览数据 */}
              <View style={styles.previewContainer}>
                {option.type === 'dictionary' && option.data && option.data.length > 0 && (
                  <View style={styles.previewItem}>
                    <Text style={styles.previewLabel}>词典结果：</Text>
                    <Text style={styles.previewText}>
                      {option.data.slice(0, 3).map((item: any, idx: number) => (
                        <Text key={idx}>
                          {item.kanji || item.reading}
                          {idx < Math.min(option.data.length, 3) - 1 ? ', ' : ''}
                        </Text>
                      ))}
                    </Text>
                  </View>
                )}
                {option.type === 'translation' && option.data && option.data.length > 0 && (
                  <View style={styles.previewItem}>
                    <Text style={styles.previewLabel}>翻译结果：</Text>
                    <Text style={styles.previewText}>
                      {option.data.slice(0, 3).join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    maxWidth: 380,
    width: '92%',
    maxHeight: '75%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 6,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  optionTitleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  phoneticText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 1,
  },
  pinyinText: {
    fontSize: 11,
    color: colors.primary[600],
    fontStyle: 'italic',
  },
  optionDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  previewContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 6,
    padding: 8,
  },
  previewItem: {
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 3,
  },
  previewText: {
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
  },
});
