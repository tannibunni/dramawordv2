import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import ExperienceAnimationManager from './ExperienceAnimationManager';

// 使用示例：如何在 ReviewIntroScreen 中使用经验动画
const ExperienceAnimationExample: React.FC = () => {
  const animationManagerRef = useRef<any>(null);

  const handleShowExperienceAnimation = () => {
    // 模拟从 ReviewCompleteScreen 返回后的经验动画
    animationManagerRef.current?.startExperienceAnimation(
      25, // 获得的经验值
      5,  // 用户等级
      450  // 用户当前经验值
    );
  };

  return (
    <View style={styles.container}>
      {/* 测试按钮 */}
      <TouchableOpacity 
        style={styles.testButton} 
        onPress={handleShowExperienceAnimation}
      >
        <Text style={styles.buttonText}>测试经验动画</Text>
      </TouchableOpacity>

      {/* 经验动画组件 */}
      <ExperienceAnimationManager
        ref={animationManagerRef}
        onAnimationComplete={() => {
          console.log('🎉 经验动画完成！');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ExperienceAnimationExample;
