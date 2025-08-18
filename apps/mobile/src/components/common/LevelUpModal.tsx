import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
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
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const levelScaleAnim = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && levelUpInfo) {
      // 重置动画值
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      levelScaleAnim.setValue(1);
      confettiAnim.setValue(0);

      // 开始动画序列
      Animated.sequence([
        // 弹窗出现
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // 等级数字缩放动画
        Animated.sequence([
          Animated.timing(levelScaleAnim, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(levelScaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // 彩带动画
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, levelUpInfo]);

  if (!visible || !levelUpInfo) {
    return null;
  }

  const { oldLevel, newLevel, levelsGained } = levelUpInfo;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* 背景遮罩 */}
        <Animated.View
          style={[
            styles.background,
            {
              opacity: opacityAnim,
            },
          ]}
        />

        {/* 弹窗内容 */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* 升级标题 */}
          <View style={styles.header}>
            <Text style={styles.congratsText}>🎉 恭喜升级！</Text>
          </View>

          {/* 等级信息 */}
          <View style={styles.levelContainer}>
            <Text style={styles.levelLabel}>从</Text>
            <Animated.Text
              style={[
                styles.levelNumber,
                {
                  transform: [{ scale: levelScaleAnim }],
                },
              ]}
            >
              Level {oldLevel}
            </Animated.Text>
            <Text style={styles.levelLabel}>升级到</Text>
            <Animated.Text
              style={[
                styles.levelNumber,
                {
                  transform: [{ scale: levelScaleAnim }],
                },
              ]}
            >
              Level {newLevel}
            </Animated.Text>
          </View>

          {/* 升级数量 */}
          {levelsGained > 1 && (
            <View style={styles.multipleLevels}>
              <Text style={styles.multipleLevelsText}>
                一次性升级 {levelsGained} 个等级！
              </Text>
            </View>
          )}

          {/* 彩带效果 */}
          <Animated.View
            style={[
              styles.confetti,
              {
                opacity: confettiAnim,
              },
            ]}
          >
            <Text style={styles.confettiText}>✨</Text>
            <Text style={styles.confettiText}>🎊</Text>
            <Text style={styles.confettiText}>🎉</Text>
          </Animated.View>

          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>太棒了！</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: width * 0.85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    marginBottom: 20,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[500],
    textAlign: 'center',
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  levelLabel: {
    fontSize: 18,
    color: '#666',
    marginHorizontal: 10,
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary[500],
    marginHorizontal: 5,
  },
  multipleLevels: {
    marginBottom: 20,
  },
  multipleLevelsText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
    textAlign: 'center',
  },
  confetti: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  confettiText: {
    fontSize: 24,
    marginHorizontal: 5,
  },
  closeButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
