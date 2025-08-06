import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { useNavigation } from '../../../components/navigation/NavigationContext';
import { useAppLanguage } from '../../../context/AppLanguageContext';
import { t, TranslationKey } from '../../../constants/translations';

export const ReviewEmptyState: React.FC = () => {
  const { navigate } = useNavigation();
  const { appLanguage } = useAppLanguage();

  return (
    <View style={{ alignItems: 'center', padding: 20 }}>
      <Ionicons name="book-outline" size={80} color={colors.text.tertiary} style={{ marginBottom: 24 }} />
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text.primary, marginBottom: 12, textAlign: 'center' }}>
        {t('no_review_words' as TranslationKey, appLanguage)}
      </Text>
      <Text style={{ fontSize: 16, color: colors.text.secondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
        {appLanguage === 'zh-CN' 
          ? '快去搜索并收藏一些单词吧！\n积累词汇量，提升学习效果。'
          : 'Go search and collect some words!\nBuild your vocabulary and improve learning.'
        }
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: colors.primary[500],
          paddingHorizontal: 48,
          paddingVertical: 16,
          borderRadius: 25,
          shadowColor: colors.primary[200],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        onPress={() => navigate('main', { tab: 'home' })}
      >
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          {appLanguage === 'zh-CN' ? '去搜索单词' : 'Search Words'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}; 