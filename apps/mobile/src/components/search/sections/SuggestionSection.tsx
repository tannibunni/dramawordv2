import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../../constants/colors';
import { t } from '../../../constants/translations';

interface SuggestionSectionProps {
  suggestions: string[];
  onSuggestionSelect: (suggestion: string) => void;
  appLanguage: string;
}

const SuggestionSection: React.FC<SuggestionSectionProps> = ({
  suggestions,
  onSuggestionSelect,
  appLanguage,
}) => {
  return (
    <View style={styles.wordCardWrapper}>
      <View style={[styles.wordCardCustom, styles.suggestionCard]}>
        <Text style={styles.title}>{t('search_suggestions', appLanguage)}</Text>
        {suggestions.map(suggestion => (
          <TouchableOpacity 
            key={suggestion} 
            onPress={() => onSuggestionSelect(suggestion)} 
            style={styles.suggestionItem}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
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
  wordCardCustom: {
    width: '92%',
    minHeight: 220,
    maxWidth: 500,
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    padding: 28,
    marginVertical: 12,
  },
  suggestionCard: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 32,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    maxWidth: 350,
    minHeight: 220,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: colors.text.primary,
    marginBottom: 16,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    marginBottom: 10,
  },
  suggestionText: {
    fontSize: 18,
    color: colors.primary[700],
    fontWeight: '500' as const,
  },
};

export default SuggestionSection;
