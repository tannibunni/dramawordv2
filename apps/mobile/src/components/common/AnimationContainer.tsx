import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { eventManager, EVENT_TYPES } from '../../services/eventManager';

export const AnimationContainer: React.FC = () => {
  const [currentAnimation, setCurrentAnimation] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    const handleShowAnimation = ({ component }: { component: () => React.ReactNode }) => {
      setCurrentAnimation(component());
    };

    const handleHideAnimation = () => {
      setCurrentAnimation(null);
    };

    eventManager.on(EVENT_TYPES.SHOW_EXPERIENCE_ANIMATION, handleShowAnimation);
    eventManager.on(EVENT_TYPES.HIDE_EXPERIENCE_ANIMATION, handleHideAnimation);

    return () => {
      eventManager.off(EVENT_TYPES.SHOW_EXPERIENCE_ANIMATION, handleShowAnimation);
      eventManager.off(EVENT_TYPES.HIDE_EXPERIENCE_ANIMATION, handleHideAnimation);
    };
  }, []);

  if (!currentAnimation) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {currentAnimation}
    </View>
  );
};

export default AnimationContainer;
