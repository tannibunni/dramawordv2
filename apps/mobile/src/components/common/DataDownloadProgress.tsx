import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DownloadProgress } from '../../services/newDeviceDataDownloadService';

interface DataDownloadProgressProps {
  visible: boolean;
  progress: DownloadProgress;
  onCancel?: () => void;
  onRetry?: () => void;
}

export const DataDownloadProgress: React.FC<DataDownloadProgressProps> = ({
  visible,
  progress,
  onCancel,
  onRetry
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // 获取阶段图标
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'detecting':
        return 'search-outline';
      case 'downloading':
        return 'cloud-download-outline';
      case 'overwriting':
        return 'document-text-outline';
      case 'initializing':
        return 'settings-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'failed':
        return 'close-circle-outline';
      default:
        return 'information-circle-outline';
    }
  };

  // 获取阶段颜色
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'detecting':
        return '#3B82F6'; // 蓝色
      case 'downloading':
        return '#10B981'; // 绿色
      case 'overwriting':
        return '#F59E0B'; // 黄色
      case 'initializing':
        return '#8B5CF6'; // 紫色
      case 'completed':
        return '#10B981'; // 绿色
      case 'failed':
        return '#EF4444'; // 红色
      default:
        return '#6B7280'; // 灰色
    }
  };

  // 获取阶段描述
  const getStageDescription = (stage: string) => {
    switch (stage) {
      case 'detecting':
        return '正在检测设备状态...';
      case 'downloading':
        return '正在下载云端数据...';
      case 'overwriting':
        return '正在覆盖本地数据...';
      case 'initializing':
        return '正在初始化设备...';
      case 'completed':
        return '数据下载完成！';
      case 'failed':
        return '数据下载失败';
      default:
        return '准备开始...';
    }
  };

  // 处理取消操作
  const handleCancel = () => {
    Alert.alert(
      '确认取消',
      '确定要取消数据下载吗？这可能会导致数据不完整。',
      [
        { text: '继续下载', style: 'cancel' },
        { text: '确认取消', style: 'destructive', onPress: onCancel }
      ]
    );
  };

  // 处理重试操作
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 标题 */}
          <View style={styles.header}>
            <Text style={styles.title}>数据同步</Text>
            <TouchableOpacity onPress={() => setShowDetails(!showDetails)}>
              <Ionicons 
                name={showDetails ? 'chevron-up' : 'chevron-down'} 
                size={24} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>

          {/* 进度显示 */}
          <View style={styles.progressSection}>
            <View style={styles.stageInfo}>
              <Ionicons 
                name={getStageIcon(progress.stage)} 
                size={24} 
                color={getStageColor(progress.stage)} 
              />
              <Text style={styles.stageText}>{progress.currentStep}</Text>
            </View>
            
            <Text style={styles.message}>{progress.message}</Text>
            
            {/* 进度条 */}
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progress.progress}%`,
                    backgroundColor: getStageColor(progress.stage)
                  }
                ]} 
              />
            </View>
            
            <Text style={styles.progressText}>
              {progress.progress}% ({progress.currentStep} / {progress.totalSteps})
            </Text>
          </View>

          {/* 详细信息 */}
          {showDetails && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsTitle}>详细信息</Text>
              <Text style={styles.detailsText}>
                当前阶段: {progress.stage}
              </Text>
              <Text style={styles.detailsText}>
                进度: {progress.progress}%
              </Text>
              <Text style={styles.detailsText}>
                状态: {progress.message}
              </Text>
            </View>
          )}

          {/* 操作按钮 */}
          <View style={styles.actions}>
            {progress.stage === 'failed' ? (
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.retryButtonText}>重试</Text>
              </TouchableOpacity>
            ) : progress.stage !== 'completed' ? (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Ionicons name="close" size={20} color="#EF4444" />
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* 加载指示器 */}
          {progress.stage !== 'completed' && progress.stage !== 'failed' && (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="small" color={getStageColor(progress.stage)} />
              <Text style={styles.loadingText}>请稍候...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressSection: {
    marginBottom: 20,
  },
  stageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  detailsSection: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
});
