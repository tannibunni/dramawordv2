import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

interface ParticleProps {
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  onComplete: () => void;
  color?: string;
  initialScale?: number; // 初始大小
}

const NUM_PARTICLES = 8; // 粒子数量
const PARTICLE_SIZE = 4; // 粒子大小

export const ExperienceParticles: React.FC<ParticleProps> = ({
  startPosition,
  endPosition,
  onComplete,
  color = '#7C3AED'
}) => {
  const particles = useRef(Array(NUM_PARTICLES).fill(0).map(() => ({
    position: new Animated.ValueXY({ x: startPosition.x, y: startPosition.y }),
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1)
  }))).current;

  useEffect(() => {
    // 为每个粒子创建随机的中间点
    const animations = particles.map((particle, index) => {
      const angle = (2 * Math.PI * index) / NUM_PARTICLES; // 均匀分布的角度
      const radius = 50 + Math.random() * 30; // 随机半径
      const midX = startPosition.x + radius * Math.cos(angle);
      const midY = startPosition.y + radius * Math.sin(angle);

      return Animated.sequence([
        // 第一阶段：向外扩散
        Animated.parallel([
          Animated.timing(particle.position, {
            toValue: { x: midX, y: midY },
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 1.5,
            duration: 300,
            useNativeDriver: true,
          })
        ]),
        // 第二阶段：聚集到目标点
        Animated.parallel([
          Animated.timing(particle.position, {
            toValue: { x: endPosition.x, y: endPosition.y },
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0.5,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          })
        ])
      ]);
    });

    // 同时执行所有粒子动画
    Animated.parallel(animations).start(onComplete);
  }, [startPosition, endPosition]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              backgroundColor: color,
              transform: [
                { translateX: particle.position.x },
                { translateY: particle.position.y },
                { scale: particle.scale }
              ],
              opacity: particle.opacity
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    borderRadius: PARTICLE_SIZE / 2,
  }
});
