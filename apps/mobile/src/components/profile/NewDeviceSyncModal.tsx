import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { SyncStatusCard } from '../common/SyncStatusCard';
import { NewDeviceDataDownloadService } from '../../services/newDeviceDataDownloadService';
import { useAppLanguage } from '../../context/AppLanguageContext';

interface NewDeviceSyncModalProps {
  visible: boolean;
  onClose: () => void;
  appleId: string;
}

export const NewDeviceSyncModal: React.FC<NewDeviceSyncModalProps> = ({
  visible,
  onClose,
  appleId
}) => {
  const { appLanguage } = useAppLanguage();
  const [deviceId, setDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 获取设备ID
  useEffect(() => {
    if (visible && appleId) {
      loadDeviceInfo();
    }
  }, [visible, appleId]);

  // 加载设备信息
  const loadDeviceInfo = async () => {
    try {
      setIsLoading(true);
      const downloadService = NewDeviceDataDownloadService.getInstance();
      const status = await downloadService.getDeviceStatusSummary(appleId);
      
      if (status?.deviceInfo?.deviceId) {
        setDeviceId(status.deviceInfo.deviceId);
      }
    } catch (error) {
      console.error('❌ 加载设备信息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理同步完成
  const handleSyncComplete = () => {
    Alert.alert(
      appLanguage === 'zh-CN' ? '同步完成' : 'Sync Complete',
      appLanguage === 'zh-CN' 
        ? '数据同步已完成！您的学习进度已恢复到最新状态。' 
        : 'Data sync completed! Your learning progress has been restored to the latest state.',
      [
        {
          text: appLanguage === 'zh-CN' ? '确定' : 'OK',
          onPress: onClose
        }
      ]
    );
  };

  // 处理关闭模态框
  const handleClose = () => {
    if (isLoading) {
      Alert.alert(
        appLanguage === 'zh-CN' ? '同步进行中' : 'Sync in Progress',
        appLanguage === 'zh-CN' 
          ? '数据同步正在进行中，确定要关闭吗？' 
          : 'Data sync is in progress. Are you sure you want to close?',
        [
          { text: appLanguage === 'zh-CN' ? '取消' : 'Cancel', style: 'cancel' },
          { text: appLanguage === 'zh-CN' ? '确定' : 'OK', onPress: onClose }
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 头部 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {appLanguage === 'zh-CN' ? '新设备数据同步' : 'New Device Data Sync'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* 内容区域 */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 说明文字 */}
            <View style={styles.descriptionSection}>
              <Ionicons name="information-circle-outline" size={24} color={colors.primary[500]} />
              <Text style={styles.descriptionText}>
                {appLanguage === 'zh-CN' 
                  ? '检测到您可能在新设备上使用APP，或者APP被重新安装。点击下方按钮开始同步您的学习数据。'
                  : 'Detected that you may be using the app on a new device, or the app has been reinstalled. Click the button below to start syncing your learning data.'
                }
              </Text>
            </View>

            {/* 同步状态卡片 */}
            {deviceId && (
              <SyncStatusCard
                appleId={appleId}
                deviceId={deviceId}
                onSyncComplete={handleSyncComplete}
              />
            )}

            {/* 功能说明 */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>
                {appLanguage === 'zh-CN' ? '同步内容包括' : 'Sync includes'}
              </Text>
              
              <View style={styles.featureItem}>
                <Ionicons name="book-outline" size={20} color={colors.success[500]} />
                <Text style={styles.featureText}>
                  {appLanguage === 'zh-CN' ? '词汇学习记录' : 'Vocabulary learning records'}
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <Ionicons name="tv-outline" size={20} color={colors.success[500]} />
                <Text style={styles.featureText}>
                  {appLanguage === 'zh-CN' ? '剧单和单词本' : 'Show lists and wordbooks'}
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <Ionicons name="trophy-outline" size={20} color={colors.success[500]} />
                <Text style={styles.featureText}>
                  {appLanguage === 'zh-CN' ? '学习进度和经验值' : 'Learning progress and experience'}
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <Ionicons name="ribbon-outline" size={20} color={colors.success[500]} />
                <Text style={styles.featureText}>
                  {appLanguage === 'zh-CN' ? '徽章和成就' : 'Badges and achievements'}
                </Text>
              </View>
            </View>

            {/* 注意事项 */}
            <View style={styles.noticeSection}>
              <Ionicons name="warning-outline" size={20} color={colors.warning[500]} />
              <Text style={styles.noticeText}>
                {appLanguage === 'zh-CN' 
                  ? '注意：同步过程会覆盖本地数据，请确保您想要恢复云端数据。'
                  : 'Note: The sync process will overwrite local data. Please ensure you want to restore cloud data.'
                }
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  descriptionSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginLeft: 12,
  },
  featuresSection: {
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 12,
  },
  noticeSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning[700],
    lineHeight: 20,
    marginLeft: 12,
  },
});
