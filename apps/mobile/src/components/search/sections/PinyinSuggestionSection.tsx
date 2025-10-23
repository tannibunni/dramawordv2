import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';

interface PinyinSuggestion {
  id: string;
  chinese: string;
  english: string;
  pinyin: string;
  audioUrl?: string;
}

interface PinyinSuggestionSectionProps {
  suggestions: PinyinSuggestion[];
  onSuggestionSelect: (suggestion: PinyinSuggestion) => void;
  isLoading: boolean;
}

const PinyinSuggestionSection: React.FC<PinyinSuggestionSectionProps> = ({
  suggestions,
  onSuggestionSelect,
  isLoading,
}) => {
  return (
    <ScrollView style={styles.recentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>{suggestions.length} 个候选词</Text>
        </View>
        <View style={styles.wordsContainer}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              style={styles.recentWordItem}
              onPress={() => onSuggestionSelect(suggestion)}
              disabled={isLoading}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="search-outline" size={18} color={colors.neutral[400]} style={{ marginRight: 8 }} />
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.recentWordText} numberOfLines={1} ellipsizeMode="tail">
                    <Text style={{ fontWeight: 'bold', color: colors.text.primary }}>
                      {String(suggestion.chinese)}
                    </Text>
                    {suggestion.pinyin && (
                      <Text style={{ fontWeight: 'normal', color: colors.text.secondary }}>
                        {' - '}{String(suggestion.pinyin)}
                      </Text>
                    )}
                    {suggestion.english && (
                      <Text style={{ fontWeight: 'normal', color: colors.text.tertiary }}>
                        {' - '}{String(suggestion.english)}
                      </Text>
                    )}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} style={{ marginLeft: 8 }} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = {
  recentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  recentSection: {
    marginBottom: 32,
  },
  recentHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: 16,
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

export default PinyinSuggestionSection;
