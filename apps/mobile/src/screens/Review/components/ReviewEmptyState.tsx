import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { useNavigation } from '../../../components/navigation/NavigationContext';
import { useAppLanguage } from '../../../context/AppLanguageContext';
import { t } from '../../../constants/translations';

interface ReviewEmptyStateProps {
  type?: string;
}

export const ReviewEmptyState: React.FC<ReviewEmptyStateProps> = ({ type }) => {
  const { navigate } = useNavigation();
  const { appLanguage } = useAppLanguage();

  // 设置翻译服务语言
  React.useEffect(() => {
    // 翻译函数会自动使用当前语言，无需手动设置
  }, [appLanguage]);

  // 判断是否为错词挑战模式
  const isWrongWordsChallenge = type === 'wrong_words';

  // 根据模式显示不同的内容
  const getEmptyStateContent = () => {
    if (isWrongWordsChallenge) {
      return {
        icon: 'checkmark-circle-outline',
        title: t('wrong_words_empty_title', appLanguage),
        subtitle: t('wrong_words_empty_subtitle', appLanguage),
        buttonText: t('start_review', appLanguage),
        onPress: () => navigate('main', { tab: 'review' })
      };
    } else {
      return {
        icon: 'book-outline',
        title: t('no_review_words', appLanguage),
        subtitle: t('general_empty_subtitle', appLanguage),
        buttonText: t('search_words', appLanguage),
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