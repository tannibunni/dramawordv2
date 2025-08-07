import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Vibration,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';

// 粒子系统
const ParticleSystem = ({ count = 20, colors = ['#FFD700', '#FFA500', '#FF6347'] }) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      animation: new Animated.ValueXY({ x: 0, y: 0 }),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [count, colors]);

  const startParticleAnimation = useCallback((particle: any) => {
    const angle = (Math.random() * Math.PI * 2);
    const power = Math.random() * 200 + 100;
    const endX = Math.cos(angle) * power;
    const endY = Math.sin(angle) * power;

    Animated.parallel([
      Animated.timing(particle.animation, {
        toValue: { x: endX, y: endY },
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(particle.scale, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(particle.opacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  React.useEffect(() => {
    particles.forEach(startParticleAnimation);
  }, [particles, startParticleAnimation]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.animation.x },
                { translateY: particle.animation.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
              backgroundColor: particle.color,
            },
          ]}
        />
      ))}
    </View>
  );
};

interface ExperienceGainAnimationProps {
  gainedExp: number;
  currentExp: number;
  targetExp: number;
  level: number;
  isLevelUp: boolean;
  onComplete: () => void;
  duration?: number;
  canSkip?: boolean;
}

export const ExperienceGainAnimation: React.FC<ExperienceGainAnimationProps> = ({
  gainedExp,
  currentExp,
  targetExp,
  level,
  isLevelUp,
  onComplete,
  duration = 2000,
  canSkip = true,
}) => {
  const { appLanguage } = useAppLanguage();
  const [sound, setSound] = useState<Audio.Sound>();
  const [hasSkipped, setHasSkipped] = useState(false);

  // 使用 useMemo 优化动画值创建
  const animations = useMemo(() => ({
    scale: new Animated.Value(1),
    opacity: new Animated.Value(0),
    number: new Animated.Value(currentExp),
    sparkle: new Animated.Value(0),
  }), [currentExp]);

  // 缓存动画配置
  const animationConfig = useMemo(() => ({
    scale: {
      toValue: 1.2,
      duration: duration * 0.2,
      useNativeDriver: true,
    },
    opacity: {
      toValue: 1,
      duration: duration * 0.15,
      useNativeDriver: true,
    },
    number: {
      toValue: targetExp,
      duration: duration * 0.6,
      useNativeDriver: false,
    },
  }), [duration, targetExp]);

  // 播放音效
  const playSound = useCallback(async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/experience-gain.mp3'),
        { shouldPlay: true }
      );
      setSound(sound);
    } catch (error) {
      console.error('Failed to play sound', error);
    }
  }, []);

  // 触发震动
  const triggerVibration = useCallback(() => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 50, 30, 50]);
    } else {
      Vibration.vibrate(100);
    }
  }, []);

  // 开始动画
  const startAnimation = useCallback(() => {
    playSound();
    triggerVibration();

    Animated.sequence([
      // 淡入动画
      Animated.timing(animations.opacity, animationConfig.opacity),
      // 缩放动画
      Animated.sequence([
        Animated.timing(animations.scale, {
          ...animationConfig.scale,
          easing: Animated.Easing.elastic(1),
        }),
        Animated.timing(animations.scale, {
          toValue: 1,
          duration: duration * 0.2,
          useNativeDriver: true,
          easing: Animated.Easing.bounce,
        }),
      ]),
      // 数字增长动画
      Animated.timing(animations.number, {
        ...animationConfig.number,
        easing: Animated.Easing.out(Animated.Easing.exp),
      }),
      // 等待动画
      Animated.delay(duration * 0.2),
      // 淡出动画
      Animated.timing(animations.opacity, {
        toValue: 0,
        duration: duration * 0.15,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (sound) {
        sound.unloadAsync();
      }
      onComplete();
    });
  }, [animations, animationConfig, duration, sound, onComplete, playSound, triggerVibration]);

  // 跳过动画
  const handleSkip = useCallback(() => {
    if (!canSkip || hasSkipped) return;
    
    setHasSkipped(true);
    animations.number.setValue(targetExp);
    if (sound) {
      sound.unloadAsync();
    }
    onComplete();
  }, [canSkip, hasSkipped, animations.number, targetExp, sound, onComplete]);

  // 开始动画
  React.useEffect(() => {
    startAnimation();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [startAnimation, sound]);

  const animatedNumber = animations.number.interpolate({
    inputRange: [currentExp, targetExp],
    outputRange: [currentExp, targetExp],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animations.opacity,
          transform: [{ scale: animations.scale }],
        },
      ]}
    >
      <LinearGradient
        colors={['#7C3AED', '#8B5CF6']}
        style={styles.content}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ParticleSystem />
        <View style={styles.experienceContent}>
          <Ionicons name="star" size={32} color="#FFF" />
          <Animated.Text style={styles.experienceText}>
            +{gainedExp} {appLanguage === 'zh-CN' ? '经验值' : 'XP'}
          </Animated.Text>
          <Text style={styles.congratsText}>
            {appLanguage === 'zh-CN' ? '太棒了！继续保持' : 'Great! Keep it up'}
          </Text>
          
          {isLevelUp && (
            <View style={styles.levelUpContainer}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.levelUpText}>
                {appLanguage === 'zh-CN' 
                  ? `升级到 ${level} 级！` 
                  : `Level up to ${level}!`}
              </Text>
            </View>
          )}
          
          <Animated.Text style={styles.totalExperience}>
            {Math.round(animatedNumber)} XP
          </Animated.Text>
        </View>

        {canSkip && !hasSkipped && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>
              {appLanguage === 'zh-CN' ? '跳过' : 'Skip'}
            </Text>
          </TouchableOpacity>
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  experienceContent: {
    alignItems: 'center',
  },
  experienceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
  },
  congratsText: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 8,
    opacity: 0.9,
  },
  levelUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelUpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
  },
  totalExperience: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    opacity: 0.8,
  },
  skipButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  skipText: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.8,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
