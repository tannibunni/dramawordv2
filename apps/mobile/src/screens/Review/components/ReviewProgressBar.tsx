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
  const navigation = useNavigation();
  
  // 修复进度文本显示逻辑：
  // 第一张卡出现时显示 0/total
  // 划完第一张卡显示 1/total
  // 划完最后一张卡显示 total/total
  // current 表示已完成的卡片数量
  const progressText = total > 0 ? `${current} / ${total}` : '';
  
  const handleBackPress = () => {
    if (navigation.isReady) {
      navigation.navigate('main', { tab: 'review' });
    }
  };
  
  // 计算进度条宽度，避免在渲染过程中调用interpolate
  const progressBarWidth = `${Math.min(100, Math.max(0, progress))}%` as const;
  
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
          onPress={handleBackPress}
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
            backgroundColor: progress >= 100 ? colors.primary[600] : colors.primary[500], // 100%时使用更深的颜色
            borderRadius: 3,
            width: progressBarWidth, // 使用计算好的宽度，而不是直接调用interpolate
            // 100%时添加一些特殊效果
            shadowColor: progress >= 100 ? colors.primary[500] : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: progress >= 100 ? 0.3 : 0,
            shadowRadius: progress >= 100 ? 4 : 0,
            elevation: progress >= 100 ? 4 : 0,
          }} />
        </View>
        <Text style={{ 
          fontSize: 14, 
          fontWeight: '600', 
          color: progress >= 100 ? colors.primary[600] : colors.text.primary, // 100%时使用主题色
          minWidth: 40,
          textAlign: 'center',
          // 100%时添加一些特殊效果
          transform: progress >= 100 ? [{ scale: 1.1 }] : [{ scale: 1 }],
        }}>
          {progressText}
        </Text>
        
        {/* 调试信息：显示当前进度值 */}
        <Text style={{ 
          fontSize: 10, 
          color: colors.text.secondary,
          marginLeft: 8,
          minWidth: 30,
          textAlign: 'center'
        }}>
          {Math.round(progress)}%
        </Text>
      </View>
    </View>
  );
}; 