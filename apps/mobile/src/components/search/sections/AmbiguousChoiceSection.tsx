import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';

interface AmbiguousChoiceSectionProps {
  ambiguousInput: string;
  ambiguousOptions: any[];
  onAmbiguousChoice: (option: { type: 'dictionary' | 'translation'; data: any }) => void;
  isLoading: boolean;
}

const AmbiguousChoiceSection: React.FC<AmbiguousChoiceSectionProps> = ({
  ambiguousInput,
  ambiguousOptions,
  onAmbiguousChoice,
  isLoading,
}) => {
  return (
    <View style={styles.wordCardWrapper}>
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>"{ambiguousInput}" 的查询结果</Text>
          <Text style={styles.sectionSubtitle}>请选择您想要的翻译：</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>调试: showAmbiguousChoice=true, options={ambiguousOptions?.length}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>其他状态: pinyinCandidates=0, chToEnCandidates=0, enToJaCandidates=0</Text>
        </View>
        <View style={styles.wordsContainer}>
          {Array.isArray(ambiguousOptions) && ambiguousOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentWordItem}
              onPress={() => onAmbiguousChoice(option)}
              disabled={isLoading}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons 
                  name={option.type === 'dictionary' ? 'book-outline' : 'language-outline'} 
                  size={18} 
                  color={colors.primary[500]} 
                  style={{ marginRight: 8 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentWordText} numberOfLines={1} ellipsizeMode="tail">
                    <Text style={{ fontWeight: 'bold', color: colors.text.primary }}>
                      {String(option.title)}
                    </Text>
                  </Text>
                  {/* 显示拼音信息 */}
                  {option.data?.phonetic && (
                    <Text style={{ fontSize: 12, color: colors.text.secondary, fontStyle: 'italic', marginTop: 2 }}>
                      {String(option.data.phonetic)}
                    </Text>
                  )}
                  {option.data?.pinyin && option.data.pinyin !== option.data.phonetic && (
                    <Text style={{ fontSize: 11, color: colors.primary[600], fontStyle: 'italic', marginTop: 1 }}>
                      {String(option.data.pinyin)}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = {
  wordCardWrapper: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 0,
    paddingBottom: 24,
  },
  recentSection: {
    marginBottom: 32,
  },
  recentHeader: {
    flexDirection: 'column' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  wordsContainer: {
    gap: 12,
  },
  recentWordItem: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 2,
  },
  recentWordText: {
    fontSize: 17,
    color: colors.text.primary,
    marginBottom: 0,
    flex: 1,
  },
};

export default AmbiguousChoiceSection;
