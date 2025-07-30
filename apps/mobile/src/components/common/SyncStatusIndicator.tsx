import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { API_BASE_URL } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error' | 'offline';
  message: string;
  lastSyncTime?: Date;
  errorDetails?: string;
}

interface SyncStatusIndicatorProps {
  visible?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ visible = true }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    message: '准备同步'
  });

  // 检查网络连接
  const checkNetworkStatus = async (): Promise<boolean> => {
    try {
      // 使用传统的setTimeout方式替代AbortSignal.timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('网络连接检查失败:', error);
      return false;
    }
  };

  // 检查同步状态
  const checkSyncStatus = async () => {
    try {
      setSyncStatus({
        status: 'syncing',
        message: '检查同步状态...'
      });

      const isOnline = await checkNetworkStatus();
      if (!isOnline) {
        setSyncStatus({
          status: 'offline',
          message: '网络连接异常'
        });
        return;
      }

      // 从userData中获取令牌
      const userDataString = await AsyncStorage.getItem('userData');
      let token = null;
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          token = userData.token;
        } catch (error) {
          console.error('解析用户数据失败:', error);
        }
      }
      
      if (!token) {
        setSyncStatus({
          status: 'idle',
          message: '游客模式，仅本地存储'
        });
        return;
      }

      // 检查最后同步时间
      const lastSyncTime = await AsyncStorage.getItem('lastSyncTime');
      if (lastSyncTime) {
        const lastSync = new Date(parseInt(lastSyncTime));
        const now = new Date();
        const timeDiff = now.getTime() - lastSync.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 1) {
          setSyncStatus({
            status: 'success',
            message: '数据已同步',
            lastSyncTime: lastSync
          });
        } else {
          setSyncStatus({
            status: 'error',
            message: `上次同步: ${Math.round(hoursDiff)}小时前`,
            lastSyncTime: lastSync,
            errorDetails: '建议重新同步数据'
          });
        }
      } else {
        setSyncStatus({
          status: 'error',
          message: '从未同步过',
          errorDetails: '建议进行首次同步'
        });
      }
    } catch (error) {
      console.error('检查同步状态失败:', error);
      setSyncStatus({
        status: 'error',
        message: '同步状态检查失败',
        errorDetails: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 手动同步
  const handleManualSync = async () => {
    try {
      setSyncStatus({
        status: 'syncing',
        message: '正在同步...'
      });

      // 从userData中获取令牌
      const userDataString = await AsyncStorage.getItem('userData');
      let token = null;
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          token = userData.token;
        } catch (error) {
          console.error('解析用户数据失败:', error);
        }
      }
      
      if (!token) {
        Alert.alert('同步失败', '游客模式无法同步，请登录后重试');
        setSyncStatus({
          status: 'error',
          message: '游客模式',
          errorDetails: '请登录后同步数据'
        });
        return;
      }

      // 这里可以触发实际的同步操作
      // 暂时模拟同步过程
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 更新同步时间
      await AsyncStorage.setItem('lastSyncTime', Date.now().toString());

      setSyncStatus({
        status: 'success',
        message: '同步成功',
        lastSyncTime: new Date()
      });

      // 3秒后恢复到idle状态
      setTimeout(() => {
        setSyncStatus({
          status: 'idle',
          message: '准备同步'
        });
      }, 3000);

    } catch (error) {
      console.error('手动同步失败:', error);
      setSyncStatus({
        status: 'error',
        message: '同步失败',
        errorDetails: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 获取状态图标
  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <Ionicons name="sync" size={16} color={colors.primary[500]} />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />;
      case 'error':
        return <Ionicons name="alert-circle" size={16} color={colors.error[500]} />;
      case 'offline':
        return <Ionicons name="cloud-offline" size={16} color={colors.primary[500]} />;
      default:
        return <Ionicons name="cloud" size={16} color={colors.text.secondary} />;
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return colors.primary[500];
      case 'success':
        return colors.success[500];
      case 'error':
        return colors.error[500];
      case 'offline':
        return colors.primary[500];
      default:
        return colors.text.secondary;
    }
  };

  useEffect(() => {
    if (visible) {
      checkSyncStatus();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <TouchableOpacity 
      style={[styles.container, { borderColor: getStatusColor() }]} 
      onPress={handleManualSync}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {getStatusIcon()}
        <Text style={[styles.message, { color: getStatusColor() }]}>
          {syncStatus.message}
        </Text>
      </View>
      
      {syncStatus.errorDetails && (
        <Text style={styles.errorDetails}>
          {syncStatus.errorDetails}
        </Text>
      )}
      
      {syncStatus.lastSyncTime && (
        <Text style={styles.lastSyncTime}>
          {syncStatus.lastSyncTime.toLocaleTimeString()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorDetails: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  lastSyncTime: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
    textAlign: 'center',
  },
}); 