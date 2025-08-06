import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { useNavigation } from '../../../components/navigation/NavigationContext';

interface ReviewProgressBarProps {
  progress: number;
  total: number;
  current: number;
  progressAnimation: Animated.Value;
}

export const ReviewProgressBar: React.FC<ReviewProgressBarProps> = ({
  progress,
  total,
  current,
  progressAnimation
}) => {
  const { navigate } = useNavigation();
  
  // 修复进度文本显示逻辑：
  // 开始显示 0/3，滑完第一张卡显示 1/3，滑完第二张卡显示 2/3，滑完最后一张卡显示 3/3
  // 显示当前正在查看的卡片索引（从0开始）
  const progressText = total > 0 ? `${Math.min(current, total)} / ${total}` : '';
  
  return (
    <View style={{ 
      width: '100%', 
      paddingHorizontal: 16, 
      paddingVertical: 4,
      backgroundColor: colors.background.primary
    }}>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        width: '100%'
      }}>
        <TouchableOpacity 
          style={{ 
            padding: 8, 
            marginRight: 16,
            borderRadius: 8,
            backgroundColor: colors.background.secondary
          }}
          onPress={() => navigate('main', { tab: 'review' })}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={{ 
          flex: 1, 
          height: 6, 
          backgroundColor: colors.background.tertiary, 
          borderRadius: 3, 
          marginRight: 12 
        }}>
          <Animated.View style={{
            height: 6,
            backgroundColor: colors.primary[500],
            borderRadius: 3,
            width: progressAnimation.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }} />
        </View>
        <Text style={{ 
          fontSize: 14, 
          fontWeight: '600', 
          color: colors.text.primary,
          minWidth: 40,
          textAlign: 'center'
        }}>
          {progressText}
        </Text>
      </View>
    </View>
  );
}; 