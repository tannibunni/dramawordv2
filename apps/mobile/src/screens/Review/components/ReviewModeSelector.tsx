import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../../constants/colors';
import { t } from '../../../constants/translations';
import { useAppLanguage } from '../../../context/AppLanguageContext';

interface ReviewModeSelectorProps {
  mode: 'smart' | 'all';
  onModeChange: (mode: 'smart' | 'all') => void;
  type?: string;
  isEbbinghaus: boolean;
}

export const ReviewModeSelector: React.FC<ReviewModeSelectorProps> = ({
  mode,
  onModeChange,
  type,
  isEbbinghaus
}) => {
  const { appLanguage } = useAppLanguage();

  // 设置翻译服务语言
  React.useEffect(() => {
    // 翻译函数会自动使用当前语言，无需手动设置
  }, [appLanguage]);

  // 只在智能挑战词卡模式下显示
  if (type && type !== 'shuffle' && type !== 'random') {
    return null;
  }

  return (
    <View style={{
      padding: 16, 
      backgroundColor: colors.primary[50], 
      borderRadius: 12, 
      marginHorizontal: 16, 
      marginTop: 8,
      marginBottom: 8,
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      shadowColor: colors.primary[200],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2
    }}>
      <View style={{flex: 1}}>
        <Text style={{color: colors.primary[700], fontWeight: '600', fontSize: 15}}>
          {mode === 'smart' ? t('smart_review_mode', appLanguage) : t('all_review_mode', appLanguage)}
        </Text>
        <Text style={{color: colors.primary[600], fontSize: 13, marginTop: 4, lineHeight: 18}}>
          {mode === 'smart' ? t('smart_review_description', appLanguage) : t('all_review_description', appLanguage)}
        </Text>
      </View>
      <TouchableOpacity 
        style={{
          backgroundColor: colors.primary[500],
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          shadowColor: colors.primary[300],
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 2
        }}
        onPress={() => onModeChange(mode === 'smart' ? 'all' : 'smart')}
      >
        <Text style={{color: 'white', fontSize: 13, fontWeight: '600'}}>
          {mode === 'smart' ? t('switch_to_all', appLanguage) : t('switch_to_smart', appLanguage)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}; 