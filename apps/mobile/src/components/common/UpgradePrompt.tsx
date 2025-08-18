import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  feature: string;
  title?: string;
  message?: string;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  onClose,
  onUpgrade,
  feature,
  title = '功能已锁定',
  message,
}) => {
  // 根据功能类型获取对应的图标和描述
  const getFeatureInfo = (featureType: string) => {
    switch (featureType) {
      case 'other_languages':
        return {
          icon: '🌍',
          name: '多语言支持',
          description: '解锁日语、韩语、西班牙语等更多语言',
        };
      case 'word_storage':
        return {
          icon: '💾',
          name: '无限储存',
          description: '突破3个单词限制，无限添加单词到词库',
        };
      case 'review_system':
        return {
          icon: '🔄',
          name: '智能复习',
          description: '完整的复习系统和记忆算法',
        };
      case 'ai_definition':
        return {
          icon: '🤖',
          name: 'AI智能释义',
          description: 'OpenAI提供的个性化单词解释',
        };
      case 'offline_learning':
        return {
          icon: '📱',
          name: '离线学习',
          description: '无网络时也能继续学习',
        };
      case 'multi_device':
        return {
          icon: '🔄',
          name: '多设备同步',
          description: '数据在多个设备间自动同步',
        };
      default:
        return {
          icon: '⭐',
          name: '高级功能',
          description: '解锁更多高级功能',
        };
    }
  };

  const featureInfo = getFeatureInfo(feature);
  const displayMessage = message || `此功能需要高级版订阅。升级后您可以享受${featureInfo.name}等更多功能！`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 头部 */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{featureInfo.icon}</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          {/* 内容 */}
          <View style={styles.content}>
            <Text style={styles.featureName}>{featureInfo.name}</Text>
            <Text style={styles.description}>{featureInfo.description}</Text>
            <Text style={styles.message}>{displayMessage}</Text>
          </View>

          {/* 功能对比 */}
          <View style={styles.comparison}>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>免费版</Text>
                <Text style={styles.comparisonValue}>❌ 不支持</Text>
              </View>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>高级版</Text>
                <Text style={styles.comparisonValue}>✅ 完整支持</Text>
              </View>
            </View>
          </View>

          {/* 按钮 */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>稍后再说</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
              <Text style={styles.upgradeButtonText}>立即升级</Text>
            </TouchableOpacity>
          </View>

          {/* 底部提示 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 升级后立即解锁所有高级功能，支持随时取消
            </Text>
          </View>
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
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 16,
  },
  featureName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  message: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  comparison: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  comparisonRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  comparisonItem: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  upgradeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default UpgradePrompt;
