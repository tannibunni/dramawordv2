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
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={() => onSelect(option)}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <Ionicons
                  name={option.type === 'dictionary' ? 'book' : 'language'}
                  size={24}
                  color={colors.primary[600]}
                />
                <Text style={styles.optionTitle}>{option.title}</Text>
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
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 12,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  previewContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: 12,
  },
  previewItem: {
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
});
