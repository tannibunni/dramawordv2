import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../../constants/colors';

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
          {mode === 'smart' ? '🧠 智能复习模式' : '📚 全部复习模式'}
        </Text>
        <Text style={{color: colors.primary[600], fontSize: 13, marginTop: 4, lineHeight: 18}}>
          {mode === 'smart' ? '优先显示需要复习的单词' : '显示所有单词，不受时间限制'}
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
          {mode === 'smart' ? '切换全部' : '切换智能'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}; 