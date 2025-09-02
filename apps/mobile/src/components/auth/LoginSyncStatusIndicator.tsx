import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { LoginFlowState } from '../../services/appleLoginAutoDetectionService';
import { useAppLanguage } from '../../context/AppLanguageContext';

interface LoginSyncStatusIndicatorProps {
  visible: boolean;
  state: LoginFlowState;
  onShowSyncModal?: () => void;
  onDismiss?: () => void;
}

export const LoginSyncStatusIndicator: React.FC<LoginSyncStatusIndicatorProps> = ({
  visible,
  state,
  onShowSyncModal,
  onDismiss
}) => {
  const { appLanguage } = useAppLanguage();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));

  useEffect(() => {
    if (visible) {
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
        })
      ]).start();
    } else {
      // 隐藏动画
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!visible) return null;

  // 获取状态图标
  const getStatusIcon = () => {
    switch (state.stage) {
      case 'detecting':
        return 'search-outline';
      case 'downloading':
        return 'cloud-download-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'failed':
        return 'close-circle-outline';
      case 'skipped':
        return 'information-circle-outline';
      default:
        return 'information-circle-outline';
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    switch (state.stage) {
      case 'detecting':
        return colors.primary[500];
      case 'downloading':
        return colors.success[500];
      case 'completed':
        return colors.success[500];
      case 'failed':
        return colors.error[500];
      case 'skipped':
        return colors.warning[500];
      default:
        return colors.text.tertiary;
    }
  };

  // 获取状态文本
  const getStatusText = () => {
    switch (state.stage) {
      case 'detecting':
        return appLanguage === 'zh-CN' ? '检测设备状态' : 'Detecting device status';
      case 'downloading':
        return appLanguage === 'zh-CN' ? '同步数据中' : 'Syncing data';
      case 'completed':
        return appLanguage === 'zh-CN' ? '检测完成' : 'Detection completed';
      case 'failed':
        return appLanguage === 'zh-CN' ? '检测失败' : 'Detection failed';
      case 'skipped':
        return appLanguage === 'zh-CN' ? '跳过检测' : 'Detection skipped';
      default:
        return appLanguage === 'zh-CN' ? '准备检测' : 'Preparing detection';
    }
  };

  // 获取操作按钮文本
  const getActionButtonText = () => {
    if (state.stage === 'completed' && state.showSyncModal) {
      return appLanguage === 'zh-CN' ? '查看同步选项' : 'View sync options';
    } else if (state.stage === 'failed') {
      return appLanguage === 'zh-CN' ? '重试检测' : 'Retry detection';
    } else if (state.stage === 'skipped') {
      return appLanguage === 'zh-CN' ? '手动检测' : 'Manual detection';
    }
    return '';
  };

  // 处理操作按钮点击
  const handleActionButtonPress = () => {
    if (state.stage === 'completed' && state.showSyncModal && onShowSyncModal) {
      onShowSyncModal();
    } else if (state.stage === 'failed' || state.stage === 'skipped') {
      // 可以在这里添加重试逻辑
      console.log('🔄 用户点击重试/手动检测');
    }
  };

  // 处理关闭
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* 状态指示器 */}
      <View style={styles.statusSection}>
        <View style={styles.statusIcon}>
          {state.stage === 'detecting' || state.stage === 'downloading' ? (
            <ActivityIndicator size="small" color={getStatusColor()} />
          ) : (
            <Ionicons name={getStatusIcon()} size={20} color={getStatusColor()} />
          )}
        </View>
        
        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>{getStatusText()}</Text>
          <Text style={styles.statusMessage}>{state.message}</Text>
        </View>

        {/* 关闭按钮 */}
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={16} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* 进度条 */}
      {state.stage === 'detecting' && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${state.progress}%`,
                  backgroundColor: getStatusColor()
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{state.progress}%</Text>
        </View>
      )}

      {/* 操作按钮 */}
      {getActionButtonText() && (
        <TouchableOpacity 
          style={[styles.actionButton, { borderColor: getStatusColor() }]} 
          onPress={handleActionButtonPress}
        >
          <Text style={[styles.actionButtonText, { color: getStatusColor() }]}>
            {getActionButtonText()}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={getStatusColor()} />
        </TouchableOpacity>
      )}

      {/* 提示信息 */}
      {state.stage === 'completed' && !state.showSyncModal && (
        <View style={styles.infoSection}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.success[500]} />
          <Text style={styles.infoText}>
            {appLanguage === 'zh-CN' 
              ? '设备状态正常，无需同步数据' 
              : 'Device status normal, no sync needed'
            }
          </Text>
        </View>
      )}

      {state.stage === 'failed' && (
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={16} color={colors.warning[500]} />
          <Text style={styles.infoText}>
            {appLanguage === 'zh-CN' 
              ? '检测失败，您可以在设置中手动检查同步状态' 
              : 'Detection failed, you can manually check sync status in settings'
            }
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: colors.text.tertiary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  statusMessage: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.text.tertiary,
    minWidth: 30,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.primary,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
    marginLeft: 8,
  },
});
