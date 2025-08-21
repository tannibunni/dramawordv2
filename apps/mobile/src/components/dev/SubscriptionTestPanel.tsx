import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import SubscriptionTestService, { TestSubscriptionState } from '../../services/subscriptionTestService';
import { subscriptionService } from '../../services/subscriptionService';

interface SubscriptionTestPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const SubscriptionTestPanel: React.FC<SubscriptionTestPanelProps> = ({
  visible,
  onClose,
}) => {
  const [currentState, setCurrentState] = useState<TestSubscriptionState | null>(null);
  const [currentSubscriptionStatus, setCurrentSubscriptionStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCurrentState();
    }
  }, [visible]);

  const loadCurrentState = async () => {
    try {
      const testState = await SubscriptionTestService.getCurrentTestState();
      setCurrentState(testState);
      
      const status = await subscriptionService.checkSubscriptionStatus();
      setCurrentSubscriptionStatus(status);
    } catch (error) {
      console.error('加载当前状态失败:', error);
    }
  };

  const handleStateChange = async (state: TestSubscriptionState) => {
    try {
      setIsLoading(true);
      await SubscriptionTestService.setTestState(state);
      
      // 重新加载状态
      await loadCurrentState();
      
      Alert.alert(
        '测试状态已更新',
        `已切换到: ${SubscriptionTestService.getAvailableTestStates().find(s => s.state === state)?.label}`,
        [{ text: '确定' }]
      );
    } catch (error) {
      console.error('设置测试状态失败:', error);
      Alert.alert('错误', '设置测试状态失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTestState = async () => {
    Alert.alert(
      '清除测试状态',
      '确定要清除测试状态并恢复正常模式吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await SubscriptionTestService.clearTestState();
              await loadCurrentState();
              Alert.alert('成功', '已清除测试状态');
            } catch (error) {
              console.error('清除测试状态失败:', error);
              Alert.alert('错误', '清除测试状态失败');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (state: TestSubscriptionState) => {
    switch (state) {
      case 'trial_active':
        return colors.warning[500];
      case 'trial_expired':
        return colors.error[500];
      case 'premium_monthly':
      case 'premium_yearly':
        return colors.success[500];
      case 'free_user':
        return colors.neutral[500];
      default:
        return colors.text.secondary;
    }
  };

  const getStatusIcon = (state: TestSubscriptionState) => {
    switch (state) {
      case 'trial_active':
        return 'time';
      case 'trial_expired':
        return 'close-circle';
      case 'premium_monthly':
      case 'premium_yearly':
        return 'diamond';
      case 'free_user':
        return 'person';
      default:
        return 'help-circle';
    }
  };

  if (!__DEV__) {
    return null; // 仅在开发模式下显示
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>🧪 订阅状态测试工具</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* 当前状态显示 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>当前状态</Text>
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <Ionicons 
                    name={currentState ? getStatusIcon(currentState) : 'help-circle'} 
                    size={24} 
                    color={currentState ? getStatusColor(currentState) : colors.text.secondary} 
                  />
                  <Text style={styles.statusTitle}>
                    {currentState 
                      ? SubscriptionTestService.getAvailableTestStates().find(s => s.state === currentState)?.label
                      : '正常模式'
                    }
                  </Text>
                </View>
                
                {currentSubscriptionStatus && (
                  <View style={styles.statusDetails}>
                    <Text style={styles.statusDetail}>
                      是否激活: {currentSubscriptionStatus.isActive ? '是' : '否'}
                    </Text>
                    <Text style={styles.statusDetail}>
                      试用期: {currentSubscriptionStatus.isTrial ? '是' : '否'}
                    </Text>
                    {currentSubscriptionStatus.trialEndsAt && (
                      <Text style={styles.statusDetail}>
                        试用结束: {new Date(currentSubscriptionStatus.trialEndsAt).toLocaleDateString()}
                      </Text>
                    )}
                    {currentSubscriptionStatus.expiresAt && (
                      <Text style={styles.statusDetail}>
                        订阅到期: {new Date(currentSubscriptionStatus.expiresAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* 测试状态选择 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>切换测试状态</Text>
              {SubscriptionTestService.getAvailableTestStates().map((item) => (
                <TouchableOpacity
                  key={item.state}
                  style={[
                    styles.stateButton,
                    currentState === item.state && styles.activeStateButton
                  ]}
                  onPress={() => handleStateChange(item.state)}
                  disabled={isLoading}
                >
                  <View style={styles.stateButtonContent}>
                    <View style={styles.stateButtonLeft}>
                      <Ionicons 
                        name={getStatusIcon(item.state)} 
                        size={20} 
                        color={getStatusColor(item.state)} 
                      />
                      <View style={styles.stateButtonText}>
                        <Text style={styles.stateButtonTitle}>{item.label}</Text>
                        <Text style={styles.stateButtonDescription}>{item.description}</Text>
                      </View>
                    </View>
                    {currentState === item.state && (
                      <Ionicons name="checkmark" size={20} color={colors.success[500]} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* 快捷操作 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>快捷操作</Text>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.expireButton]}
                onPress={() => handleStateChange('trial_expired')}
                disabled={isLoading}
              >
                <Ionicons name="time" size={20} color={colors.white} />
                <Text style={styles.actionButtonText}>模拟试用期到期</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.purchaseButton]}
                onPress={() => handleStateChange('premium_monthly')}
                disabled={isLoading}
              >
                <Ionicons name="diamond" size={20} color={colors.white} />
                <Text style={styles.actionButtonText}>模拟购买月度订阅</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.resetButton]}
                onPress={() => handleStateChange('trial_active')}
                disabled={isLoading}
              >
                <Ionicons name="refresh" size={20} color={colors.white} />
                <Text style={styles.actionButtonText}>重置为试用期</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={handleClearTestState}
                disabled={isLoading}
              >
                <Ionicons name="trash" size={20} color={colors.white} />
                <Text style={styles.actionButtonText}>清除测试状态</Text>
              </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 12,
  },
  statusDetails: {
    gap: 4,
  },
  statusDetail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  stateButton: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  activeStateButton: {
    borderColor: colors.success[500],
    backgroundColor: colors.success[50],
  },
  stateButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stateButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stateButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  stateButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  stateButtonDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  expireButton: {
    backgroundColor: colors.error[500],
  },
  purchaseButton: {
    backgroundColor: colors.success[500],
  },
  resetButton: {
    backgroundColor: colors.warning[500],
  },
  clearButton: {
    backgroundColor: colors.neutral[500],
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
