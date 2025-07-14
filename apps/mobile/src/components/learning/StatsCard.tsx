import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { colors } from '../../constants/colors';

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: string;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.8;

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
}) => {
  // 确保value有兜底
  const safeValue = (value !== undefined && value !== null) ? value : 0;
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // 数字滚动动画
    Animated.timing(animatedValue, {
      toValue: safeValue,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // 卡片缩放动画
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [safeValue]);

  const animatedText = animatedValue.interpolate({
    inputRange: [0, safeValue],
    outputRange: ['0', safeValue.toString()],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: color,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      
      <View style={styles.content}>
        <Animated.Text style={styles.value}>
          {animatedText}
        </Animated.Text>
        
        <Text style={styles.title}>{title}</Text>
        
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    height: 120,
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
}); 