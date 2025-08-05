import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface ShowSyncIndicatorProps {
  isSyncing: boolean;
  lastSyncTime?: number;
  showCount?: number;
}

export const ShowSyncIndicator: React.FC<ShowSyncIndicatorProps> = ({
  isSyncing,
  lastSyncTime,
  showCount = 0
}) => {
  const getSyncStatusText = () => {
    if (isSyncing) {
      return '同步中...';
    }
    
    if (lastSyncTime) {
      const timeDiff = Date.now() - lastSyncTime;
      const minutes = Math.floor(timeDiff / (1000 * 60));
      
      if (minutes < 1) {
        return '刚刚同步';
      } else if (minutes < 60) {
        return `${minutes}分钟前同步`;
      } else {
        const hours = Math.floor(minutes / 60);
        return `${hours}小时前同步`;
      }
    }
    
    return '未同步';
  };

  const getSyncIcon = () => {
    if (isSyncing) {
      return 'sync';
    }
    
    if (lastSyncTime) {
      const timeDiff = Date.now() - lastSyncTime;
      const minutes = Math.floor(timeDiff / (1000 * 60));
      
      if (minutes < 5) {
        return 'checkmark-circle';
      } else if (minutes < 60) {
        return 'time';
      } else {
        return 'warning';
      }
    }
    
    return 'cloud-offline';
  };

  const getSyncColor = () => {
    if (isSyncing) {
      return colors.primary[500];
    }
    
    if (lastSyncTime) {
      const timeDiff = Date.now() - lastSyncTime;
      const minutes = Math.floor(timeDiff / (1000 * 60));
      
      if (minutes < 5) {
        return colors.success[500];
      } else if (minutes < 60) {
        return colors.warning[500];
      } else {
        return colors.error[500];
      }
    }
    
    return colors.text.secondary;
  };

  return (
    <View style={styles.container}>
      <Ionicons 
        name={getSyncIcon() as any} 
        size={16} 
        color={getSyncColor()} 
        style={isSyncing ? styles.rotating : undefined}
      />
      <Text style={[styles.text, { color: getSyncColor() }]}>
        {getSyncStatusText()}
      </Text>
      {showCount > 0 && (
        <Text style={styles.count}>
          {showCount} 个剧集
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  text: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  count: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 8,
    fontWeight: '400',
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
}); 