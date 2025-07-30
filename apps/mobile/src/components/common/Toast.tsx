import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { colors } from '../../constants/colors';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onHide?: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onHide 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const gestureAnim = useRef(new Animated.Value(0)).current;
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 显示动画
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 自动隐藏
    autoHideTimer.current = setTimeout(() => {
      hideToast();
    }, duration);

    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
    };
  }, []); // 只在组件挂载时执行一次

  // 隐藏Toast的函数
  const hideToast = useCallback(() => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  }, [fadeAnim, slideAnim, onHide]);

  // 手势处理
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: gestureAnim } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY } = event.nativeEvent;
      
      // 如果向上滑动超过20px，则关闭Toast（更敏感）
      if (translationY < -20) {
        hideToast();
      } else {
        // 否则回到原位
        Animated.spring(gestureAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: colors.success[500] };
      case 'warning':
        return { backgroundColor: colors.error[500] };
      case 'error':
        return { backgroundColor: colors.error[600] };
      default:
        return { backgroundColor: colors.primary[500] };
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={[
          styles.container,
          getToastStyle(),
          {
            opacity: fadeAnim,
            transform: [
              { translateY: Animated.add(slideAnim, gestureAnim) }
            ],
          },
        ]}
      >
        <Text style={styles.text}>{message}</Text>
        <Text style={styles.hint}>↑ 向上滑动关闭</Text>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default Toast; 