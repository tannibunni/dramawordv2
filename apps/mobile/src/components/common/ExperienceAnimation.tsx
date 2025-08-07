import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';

interface ExperienceAnimationProps {
  visible: boolean;
  experienceGained: number;
  userLevel: number;
  userExperience: number;
  opacityAnimation: Animated.Value;
  scaleAnimation: Animated.Value;
  onAnimationComplete?: () => void;
}

const ExperienceAnimation: React.FC<ExperienceAnimationProps> = ({
  visible,
  experienceGained,
  userLevel,
  userExperience,
  opacityAnimation,
  scaleAnimation,
  onAnimationComplete
}) => {
  if (!visible) {
    return null;
  }

  // 检查是否升级
  const isLevelUp = userLevel < Math.floor((userExperience + experienceGained) / 100) + 1;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacityAnimation,
          transform: [{ scale: scaleAnimation }]
        }
      ]}
    >
      <LinearGradient
        colors={['#7C3AED', '#8B5CF6']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Ionicons name="star" size={32} color="#FFF" />
          <Text style={styles.mainText}>
            +{experienceGained} 经验值
          </Text>
          <Text style={styles.subText}>
            恭喜获得经验！
          </Text>
          {/* 升级时显示额外的恭喜信息 */}
          {isLevelUp && (
            <View style={styles.levelUpContainer}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.levelUpText}>
                恭喜升级！
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  gradient: {
    width: 280,
    height: 160,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(124, 58, 237, 0.3)',
      },
      default: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  content: {
    alignItems: 'center',
  },
  mainText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
    ...Platform.select({
      web: {
        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
      },
      default: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  subText: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 8,
    opacity: 0.9,
    ...Platform.select({
      web: {
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      },
      default: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  levelUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  levelUpText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 6,
    ...Platform.select({
      web: {
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      },
      default: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
});

export default ExperienceAnimation;
