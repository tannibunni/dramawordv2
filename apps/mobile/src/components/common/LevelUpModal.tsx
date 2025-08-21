import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface LevelUpModalProps {
  visible: boolean;
  levelUpInfo: {
    oldLevel: number;
    newLevel: number;
    levelsGained: number;
    oldExperience: number;
    newExperience: number;
  } | null;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  visible,
  levelUpInfo,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const shieldScaleAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && levelUpInfo) {
      // 重置动画值
      slideAnim.setValue(height);
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.8);
      shieldScaleAnim.setValue(0);
      sparkleAnim.setValue(0);

      // 开始动画序列
      Animated.sequence([
        // Modal滑入
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // 盾牌图标弹出
        Animated.spring(shieldScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 6,
        }),
        // 星光闪烁效果
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 }
        ),
      ]).start();
    }
  }, [visible, levelUpInfo]);

  if (!visible || !levelUpInfo) {
    return null;
  }

  const { newLevel } = levelUpInfo;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />
      
      {/* 全屏蓝色渐变背景 */}
      <LinearGradient
        colors={['#4A90E2', '#7B68EE', '#9370DB']}
        style={styles.gradientBackground}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* 星光装饰 */}
          <Animated.View
            style={[
              styles.sparkleContainer,
              {
                opacity: sparkleAnim,
              },
            ]}
          >
            {[...Array(12)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.sparkle,
                  {
                    top: Math.random() * height * 0.6,
                    left: Math.random() * width,
                  },
                ]}
              >
                <MaterialIcons name="star" size={16} color="rgba(255,255,255,0.8)" />
              </View>
            ))}
          </Animated.View>

          {/* 主要内容区域 */}
          <View style={styles.contentContainer}>
            {/* 盾牌图标 */}
            <Animated.View
              style={[
                styles.shieldContainer,
                {
                  transform: [{ scale: shieldScaleAnim }],
                },
              ]}
            >
              <View style={styles.shieldOuter}>
                <View style={styles.shieldMiddle}>
                  <View style={styles.shieldInner}>
                    <MaterialIcons name="star" size={48} color="white" />
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* 祝贺文字 */}
            <Text style={styles.congratulationsText}>Congratulations, you</Text>
            <Text style={styles.promotedText}>have been promoted to</Text>

            {/* 等级显示 */}
            <View style={styles.levelDisplay}>
              <Text style={styles.levelNumber}>{newLevel}</Text>
              <Text style={styles.levelSuffix}>th</Text>
            </View>
            <Text style={styles.levelText}>Level</Text>
          </View>

          {/* 底部按钮区域 */}
          <View style={styles.buttonContainer}>
            {/* View Journey 按钮 */}
            <TouchableOpacity style={styles.journeyButton} onPress={onClose}>
              <Text style={styles.journeyButtonText}>View Journey</Text>
            </TouchableOpacity>

            {/* Continue 按钮 */}
            <TouchableOpacity style={styles.continueButton} onPress={onClose}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  sparkle: {
    position: 'absolute',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    zIndex: 2,
  },
  shieldContainer: {
    marginBottom: 40,
  },
  shieldOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  shieldMiddle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  shieldInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  congratulationsText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.9,
  },
  promotedText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  levelDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  levelNumber: {
    fontSize: 120,
    color: 'white',
    fontWeight: '300',
    lineHeight: 120,
  },
  levelSuffix: {
    fontSize: 32,
    color: 'white',
    fontWeight: '300',
    marginLeft: 4,
    marginBottom: 20,
  },
  levelText: {
    fontSize: 32,
    color: 'white',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 60,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  journeyButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 16,
    alignItems: 'center',
  },
  journeyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    fontWeight: '400',
  },
});
