import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { unifiedSyncService } from '../../services/unifiedSyncService';

interface DataSyncIndicatorProps {
  visible?: boolean;
  showDetails?: boolean;
}

export const DataSyncIndicator: React.FC<DataSyncIndicatorProps> = ({ 
  visible = true, 
  showDetails = false 
}) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    if (!visible) return;

    // 定期检查同步状态
    const checkSyncStatus = () => {
      const status = unifiedSyncService.getSyncStatus();
      setQueueLength(status.queueLength);
      
      if (status.isSyncing) {
        setSyncStatus('syncing');
      } else if (status.queueLength > 0) {
        setSyncStatus('error');
      } else if (status.lastSyncTime > 0) {
        setSyncStatus('success');
        setLastSyncTime(new Date(status.lastSyncTime));
      } else {
        setSyncStatus('idle');
      }
    };

    // 初始检查
    checkSyncStatus();

    // 每30秒检查一次状态
    const interval = setInterval(checkSyncStatus, 30000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Ionicons name="sync" size={14} color={colors.primary[500]} />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={14} color={colors.success[500]} />;
      case 'error':
        return <Ionicons name="alert-circle" size={14} color={colors.error[500]} />;
      default:
        return <Ionicons name="cloud-outline" size={14} color={colors.text.tertiary} />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return '同步中';
      case 'success':
        return lastSyncTime ? '已同步' : '同步完成';
      case 'error':
        return queueLength > 0 ? `${queueLength}项待同步` : '同步异常';
      default:
        return '未同步';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return colors.primary[500];
      case 'success':
        return colors.success[500];
      case 'error':
        return colors.error[500];
      default:
        return colors.text.tertiary;
    }
  };

  const handleManualSync = async () => {
    if (syncStatus === 'syncing') return;
    
    setSyncStatus('syncing');
    try {
      await unifiedSyncService.forceSync();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleManualSync}
      disabled={syncStatus === 'syncing'}
    >
      <View style={styles.indicator}>
        {getStatusIcon()}
        {showDetails && (
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.background.tertiary,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default DataSyncIndicator; 