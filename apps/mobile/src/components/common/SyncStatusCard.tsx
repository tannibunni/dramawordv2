import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NewDeviceDataDownloadService } from '../../services/newDeviceDataDownloadService';
import { DataDownloadProgress } from './DataDownloadProgress';
import { DownloadProgress } from '../../services/newDeviceDataDownloadService';

interface SyncStatusCardProps {
  appleId: string;
  deviceId: string;
  onSyncComplete?: () => void;
}

export const SyncStatusCard: React.FC<SyncStatusCardProps> = ({
  appleId,
  deviceId,
  onSyncComplete
}) => {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress>({
    stage: 'detecting',
    progress: 0,
    message: '准备开始...',
    currentStep: '设备检测',
    totalSteps: 4
  });

  // 加载同步状态
  useEffect(() => {
    loadSyncStatus();
  }, [appleId, deviceId]);

  // 加载同步状态
  const loadSyncStatus = async () => {
    try {
      setIsLoading(true);
      const downloadService = NewDeviceDataDownloadService.getInstance();
      const status = await downloadService.getDeviceStatusSummary(appleId);
      setSyncStatus(status);
    } catch (error) {
      console.error('❌ 加载同步状态失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 开始数据同步
  const startDataSync = async () => {
    try {
      setShowProgress(true);
      setProgress({
        stage: 'detecting',
        progress: 0,
        message: '正在检测设备状态...',
        currentStep: '设备检测',
        totalSteps: 4
      });

      const downloadService = NewDeviceDataDownloadService.getInstance();
      
      // 监听进度更新
      const progressInterval = setInterval(() => {
        const currentProgress = downloadService.getCurrentProgress();
        if (currentProgress) {
          setProgress(currentProgress);
        }
      }, 500);

      // 执行同步
      const result = await downloadService.processNewDeviceDataDownload(appleId);
      
      clearInterval(progressInterval);

      if (result.success) {
        setProgress({
          stage: 'completed',
          progress: 100,
          message: result.message,
          currentStep: '完成',
          totalSteps: 4
        });

        // 延迟关闭进度条
        setTimeout(() => {
          setShowProgress(false);
          loadSyncStatus(); // 重新加载状态
          if (onSyncComplete) {
            onSyncComplete();
          }
        }, 2000);
      } else {
        setProgress({
          stage: 'failed',
          progress: 0,
          message: result.error || '同步失败',
          currentStep: '失败',
          totalSteps: 4
        });
      }
    } catch (error) {
      console.error('❌ 数据同步失败:', error);
      setProgress({
        stage: 'failed',
        progress: 0,
        message: '同步过程中发生错误',
        currentStep: '失败',
        totalSteps: 4
      });
    }
  };

  // 手动触发同步
  const handleManualSync = () => {
    Alert.alert(
      '手动同步',
      '确定要手动触发数据同步吗？',
      [
        { text: '取消', style: 'cancel' },
        { text: '确定', onPress: startDataSync }
      ]
    );
  };

  // 重置同步状态
  const handleResetSync = () => {
    Alert.alert(
      '重置同步状态',
      '这将清除所有同步状态，确定要继续吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          style: 'destructive',
          onPress: async () => {
            try {
              const downloadService = NewDeviceDataDownloadService.getInstance();
              await downloadService.resetProgress();
              await loadSyncStatus();
            } catch (error) {
              console.error('❌ 重置同步状态失败:', error);
            }
          }
        }
      ]
    );
  };

  // 获取状态图标
  const getStatusIcon = () => {
    if (!syncStatus) return 'help-circle-outline';
    
    if (syncStatus.isNewDevice) {
      return 'cloud-download-outline';
    } else if (syncStatus.initStatus?.isInitialized) {
      return 'checkmark-circle-outline';
    } else {
      return 'sync-outline';
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    if (!syncStatus) return '#6B7280';
    
    if (syncStatus.isNewDevice) {
      return '#F59E0B'; // 黄色 - 需要同步
    } else if (syncStatus.initStatus?.isInitialized) {
      return '#10B981'; // 绿色 - 已同步
    } else {
      return '#3B82F6'; // 蓝色 - 同步中
    }
  };

  // 获取状态文本
  const getStatusText = () => {
    if (!syncStatus) return '未知状态';
    
    if (syncStatus.isNewDevice) {
      return '需要同步数据';
    } else if (syncStatus.initStatus?.isInitialized) {
      return '数据已同步';
    } else {
      return '同步状态未知';
    }
  };

  // 获取状态描述
  const getStatusDescription = () => {
    if (!syncStatus) return '无法获取同步状态';
    
    if (syncStatus.isNewDevice) {
      return '检测到新设备或APP重装，需要下载云端数据';
    } else if (syncStatus.initStatus?.isInitialized) {
      const lastSync = syncStatus.lastSyncTime;
      if (lastSync) {
        const daysAgo = Math.floor((Date.now() - lastSync) / (1000 * 60 * 60 * 24));
        return `上次同步: ${daysAgo === 0 ? '今天' : `${daysAgo}天前`}`;
      }
      return '设备已初始化，数据同步正常';
    } else {
      return '同步状态不明确，建议手动检查';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingText}>加载同步状态...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {/* 状态图标和文本 */}
        <View style={styles.statusSection}>
          <Ionicons 
            name={getStatusIcon()} 
            size={32} 
            color={getStatusColor()} 
          />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{getStatusText()}</Text>
            <Text style={styles.statusDescription}>{getStatusDescription()}</Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          {syncStatus?.isNewDevice ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]} 
              onPress={startDataSync}
            >
              <Ionicons name="cloud-download" size={20} color="white" />
              <Text style={styles.primaryButtonText}>开始同步</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]} 
              onPress={handleManualSync}
            >
              <Ionicons name="refresh" size={20} color="#3B82F6" />
              <Text style={styles.secondaryButtonText}>手动同步</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.resetButton]} 
            onPress={handleResetSync}
          >
            <Ionicons name="refresh-circle" size={20} color="#6B7280" />
            <Text style={styles.resetButtonText}>重置状态</Text>
          </TouchableOpacity>
        </View>

        {/* 设备信息 */}
        {syncStatus?.deviceInfo && (
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceInfoTitle}>设备信息</Text>
            <Text style={styles.deviceInfoText}>
              设备ID: {syncStatus.deviceInfo.deviceId.substring(0, 8)}...
            </Text>
            <Text style={styles.deviceInfoText}>
              设备名称: {syncStatus.deviceInfo.deviceName}
            </Text>
            <Text style={styles.deviceInfoText}>
              设备类型: {syncStatus.deviceInfo.deviceType}
            </Text>
          </View>
        )}
      </View>

      {/* 进度条弹窗 */}
      <DataDownloadProgress
        visible={showProgress}
        progress={progress}
        onCancel={() => setShowProgress(false)}
        onRetry={startDataSync}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 8,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  resetButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  deviceInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  deviceInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  deviceInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
});
