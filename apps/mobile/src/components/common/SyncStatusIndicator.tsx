import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import optimizedDataSyncService from '../../services/optimizedDataSyncService';

interface SyncStatusIndicatorProps {
  visible?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ visible = true }) => {
  const [syncStatus, setSyncStatus] = useState<{
    queueLength: number;
    lastSyncTime: number | null;
    isProcessing: boolean;
  }>({
    queueLength: 0,
    lastSyncTime: null,
    isProcessing: false,
  });

  const [statusText, setStatusText] = useState('');
  const [statusColor, setStatusColor] = useState('#4CAF50');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const pulseAnimation = new Animated.Value(1);

  useEffect(() => {
    // 检查是否为游客模式
    const checkGuestMode = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        setIsGuestMode(!token);
      } catch (error) {
        setIsGuestMode(true);
      }
    };
    
    checkGuestMode();
  }, []);

  useEffect(() => {
    if (!visible || isGuestMode) return;

    const updateSyncStatus = async () => {
      try {
        const status = await optimizedDataSyncService.getSyncStatus();
        setSyncStatus(status);
        
        // 更新状态文本和颜色
        if (status.isProcessing) {
          setStatusText('同步中...');
          setStatusColor('#FF9800');
          startPulseAnimation();
        } else if (status.queueLength > 0) {
          setStatusText(`待同步: ${status.queueLength} 项`);
          setStatusColor('#2196F3');
          startPulseAnimation();
        } else if (status.lastSyncTime) {
          const timeDiff = Date.now() - status.lastSyncTime;
          const minutes = Math.floor(timeDiff / (1000 * 60));
          
          if (minutes < 5) {
            setStatusText('已同步');
            setStatusColor('#4CAF50');
          } else {
            setStatusText(`${minutes}分钟前同步`);
            setStatusColor('#FF9800');
          }
          stopPulseAnimation();
        } else {
          setStatusText('未同步');
          setStatusColor('#F44336');
          stopPulseAnimation();
        }
      } catch (error) {
        console.error('获取同步状态失败:', error);
        setStatusText('同步错误');
        setStatusColor('#F44336');
        stopPulseAnimation();
      }
    };

    // 初始更新
    updateSyncStatus();

    // 定期更新状态
    const interval = setInterval(updateSyncStatus, 5000);

    return () => clearInterval(interval);
  }, [visible, isGuestMode]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  // 游客模式或不需要显示时隐藏
  if (!visible || isGuestMode || (!syncStatus.isProcessing && syncStatus.queueLength === 0 && syncStatus.lastSyncTime)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, { opacity: pulseAnimation }]}>
        <Ionicons 
          name={syncStatus.isProcessing ? "sync" : "cloud-upload"} 
          size={16} 
          color={statusColor} 
        />
        <Text style={[styles.text, { color: statusColor }]}>
          {statusText}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
}); 