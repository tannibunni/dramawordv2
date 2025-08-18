import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { guestModeService } from '../../services/guestModeService';
import { guestDataAdapter } from '../../services/guestDataAdapter';

interface GuestModeIndicatorProps {
  visible?: boolean;
  showStats?: boolean;
  onPress?: () => void;
}

export const GuestModeIndicator: React.FC<GuestModeIndicatorProps> = ({ 
  visible = true, 
  showStats = false,
  onPress 
}) => {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestData, setGuestData] = useState<any>(null);
  const [dataStats, setDataStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkGuestMode();
  }, []);

  const checkGuestMode = async () => {
    try {
      setIsLoading(true);
      const guestMode = await guestModeService.isGuestMode();
      setIsGuestMode(guestMode);

      if (guestMode) {
        const data = await guestModeService.getGuestInfo();
        setGuestData(data);

        if (showStats) {
          const stats = await guestModeService.getGuestDataStats();
          setDataStats(stats);
        }
      }
    } catch (error) {
      console.error('检查游客模式失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!isGuestMode) return;

    Alert.alert(
      '游客模式',
      '您当前处于游客模式，所有数据仅保存在本地设备上，不会上传到云端。',
      [
        { text: '了解', style: 'default' },
        {
          text: '查看数据统计',
          onPress: async () => {
            try {
              const stats = await guestModeService.getGuestDataStats();
              const storageInfo = await guestDataAdapter.getStorageModeInfo();
              
              Alert.alert(
                '游客数据统计',
                `📊 数据统计\n` +
                `本地数据项: ${stats.totalKeys}\n` +
                `数据大小: ${Math.round(stats.totalSize / 1024)}KB\n` +
                `数据类型: ${stats.dataTypes.join(', ')}\n\n` +
                `🔒 存储模式\n` +
                `存储类型: ${storageInfo.storageType}\n` +
                `数据隔离: ${storageInfo.dataIsolation ? '是' : '否'}\n` +
                `游客ID: ${storageInfo.guestId || '未知'}`
              );
            } catch (error) {
              Alert.alert('错误', '获取数据统计失败');
            }
          }
        },
        {
          text: '备份数据',
          onPress: async () => {
            try {
              const result = await guestDataAdapter.backupGuestData();
              Alert.alert(
                '备份成功',
                `备份大小: ${Math.round(result.backupSize / 1024)}KB\n` +
                `数据类型: ${result.dataTypes.join(', ')}\n` +
                `时间: ${new Date(result.timestamp).toLocaleString()}`
              );
            } catch (error) {
              Alert.alert('备份失败', '备份数据时发生错误');
            }
          }
        },
        {
          text: '重置游客模式',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '确认重置',
              '重置游客模式将清除所有本地数据，此操作不可恢复。确定要继续吗？',
              [
                { text: '取消', style: 'cancel' },
                {
                  text: '确认重置',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await guestModeService.resetGuestMode();
                      Alert.alert('重置成功', '游客模式已重置，请重新启动应用');
                    } catch (error) {
                      Alert.alert('重置失败', '重置游客模式时发生错误');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  if (!visible || !isGuestMode) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      disabled={isLoading}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="person-outline" size={16} color={colors.primary[500]} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>游客模式</Text>
        <Text style={styles.subtitle}>
          {isLoading ? '检查中...' : '数据仅保存本地'}
        </Text>
        
        {showStats && dataStats && (
          <Text style={styles.stats}>
            {dataStats.totalKeys} 项数据 • {Math.round(dataStats.totalSize / 1024)}KB
          </Text>
        )}
      </View>
      
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightPurple as string,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.primary[500] + '20',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500] + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[500],
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.gray[400],
    marginBottom: 2,
  },
  stats: {
    fontSize: 11,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
  arrowContainer: {
    marginLeft: 8,
  },
}); 