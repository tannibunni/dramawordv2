import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { useNavigation } from '../../../components/navigation/NavigationContext';
import { useAppLanguage } from '../../../context/AppLanguageContext';
import { t, TranslationKey } from '../../../constants/translations';

interface ReviewEmptyStateProps {
  type?: string;
}

export const ReviewEmptyState: React.FC<ReviewEmptyStateProps> = ({ type }) => {
  const { navigate } = useNavigation();
  const { appLanguage } = useAppLanguage();

  // 判断是否为错词挑战模式
  const isWrongWordsChallenge = type === 'wrong_words';

  // 根据模式显示不同的内容
  const getEmptyStateContent = () => {
    if (isWrongWordsChallenge) {
      return {
        icon: 'checkmark-circle-outline',
        title: appLanguage === 'zh-CN' ? '还没有复习单词' : 'No words to review',
        subtitle: appLanguage === 'zh-CN' 
          ? '快去复习一些单词吧！\n巩固记忆，提升掌握度。'
          : 'Go review some words!\nStrengthen memory and improve mastery.',
        buttonText: appLanguage === 'zh-CN' ? '开始复习吧' : 'Start Review',
        onPress: () => navigate('main', { tab: 'review' })
      };
    } else {
      return {
        icon: 'book-outline',
        title: t('no_review_words' as TranslationKey, appLanguage),
        subtitle: appLanguage === 'zh-CN' 
          ? '快去搜索并收藏一些单词吧！\n积累词汇量，提升学习效果。'
          : 'Go search and collect some words!\nBuild your vocabulary and improve learning.',
        buttonText: appLanguage === 'zh-CN' ? '去搜索单词' : 'Search Words',
        onPress: () => navigate('main', { tab: 'home' })
      };
    }
  };

  const content = getEmptyStateContent();

  return (
    <View style={{ alignItems: 'center', padding: 20 }}>
      <Ionicons 
        name={content.icon as any} 
        size={80} 
        color={colors.text.tertiary} 
        style={{ marginBottom: 24 }} 
      />
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text.primary, marginBottom: 12, textAlign: 'center' }}>
        {content.title}
      </Text>
      <Text style={{ fontSize: 16, color: colors.text.secondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
        {content.subtitle}
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
        onPress={content.onPress}
      >
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          {content.buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}; 