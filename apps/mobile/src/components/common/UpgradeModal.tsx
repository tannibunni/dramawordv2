import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';
import { FeatureType } from '../../services/featureAccessService';
import FeatureAccessService from '../../services/featureAccessService';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  feature: FeatureType | null;
  onUpgrade: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  feature,
  onUpgrade,
}) => {
  const { appLanguage } = useAppLanguage();

  if (!feature) return null;

  const featureConfig = FeatureAccessService.getFeatureConfig(feature);
  if (!featureConfig) return null;

  const getFeatureIcon = (featureName: FeatureType) => {
    switch (featureName) {
      case 'vocabulary':
        return 'book-outline';
      case 'showList':
        return 'film-outline';
      case 'review':
        return 'refresh-outline';
      case 'dailyRewards':
        return 'gift-outline';
      case 'advancedSearch':
        return 'search-outline';
      case 'learningStats':
        return 'analytics-outline';
      case 'dataSync':
        return 'cloud-upload-outline';
      case 'customSettings':
        return 'settings-outline';
      default:
        return 'star-outline';
    }
  };

  const getFeatureColor = (featureName: FeatureType) => {
    switch (featureName) {
      case 'vocabulary':
        return '#4CAF50';
      case 'showList':
        return '#2196F3';
      case 'review':
        return '#FF9800';
      case 'dailyRewards':
        return '#E91E63';
      case 'advancedSearch':
        return '#9C27B0';
      case 'learningStats':
        return '#607D8B';
      case 'dataSync':
        return '#00BCD4';
      case 'customSettings':
        return '#795548';
      default:
        return colors.primary[500];
    }
  };

  const getUpgradeBenefits = () => {
    const benefits = [
      {
        icon: 'infinite-outline',
        title: appLanguage === 'zh-CN' ? '无限功能访问' : 'Unlimited Feature Access',
        description: appLanguage === 'zh-CN' ? '解锁所有高级功能，无限制使用' : 'Unlock all premium features without restrictions'
      },
      {
        icon: 'cloud-outline',
        title: appLanguage === 'zh-CN' ? '云端数据同步' : 'Cloud Data Sync',
        description: appLanguage === 'zh-CN' ? '多设备数据同步，永不丢失' : 'Sync data across devices, never lose progress'
      },
      {
        icon: 'analytics-outline',
        title: appLanguage === 'zh-CN' ? '详细学习统计' : 'Detailed Learning Stats',
        description: appLanguage === 'zh-CN' ? '深入了解学习进度和效果' : 'Deep insights into your learning progress'
      },
      {
        icon: 'gift-outline',
        title: appLanguage === 'zh-CN' ? '专属学习奖励' : 'Exclusive Learning Rewards',
        description: appLanguage === 'zh-CN' ? '获得更多经验值和学习激励' : 'Earn more experience and learning motivation'
      }
    ];

    return benefits;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 功能图标和标题 */}
            <View style={styles.featureHeader}>
              <View style={[styles.featureIconContainer, { backgroundColor: getFeatureColor(feature) }]}>
                <Ionicons 
                  name={getFeatureIcon(feature)} 
                  size={32} 
                  color="#FFFFFF" 
                />
              </View>
              <Text style={styles.featureTitle}>
                {featureConfig.displayName}
              </Text>
              <Text style={styles.featureDescription}>
                {featureConfig.description}
              </Text>
            </View>

            {/* 升级提示 */}
            <View style={styles.upgradePrompt}>
              <View style={styles.lockIconContainer}>
                <Ionicons name="lock-closed" size={24} color={colors.warning[500]} />
              </View>
              <Text style={styles.upgradeTitle}>
                {appLanguage === 'zh-CN' ? '功能已锁定' : 'Feature Locked'}
              </Text>
              <Text style={styles.upgradeSubtitle}>
                {appLanguage === 'zh-CN' 
                  ? '试用期结束后，此功能需要升级到付费版才能使用'
                  : 'After trial period, this feature requires a premium subscription'
                }
              </Text>
            </View>

            {/* 功能说明 */}
            <View style={styles.featureExplanation}>
              <Text style={styles.explanationTitle}>
                {appLanguage === 'zh-CN' ? '为什么需要升级？' : 'Why Upgrade?'}
              </Text>
              <Text style={styles.explanationText}>
                {appLanguage === 'zh-CN' 
                  ? '我们提供14天免费试用期，让您体验所有高级功能。试用期结束后，为了持续提供优质服务，部分功能需要订阅才能使用。'
                  : 'We offer a 14-day free trial so you can experience all premium features. After the trial period, to continue providing quality service, some features require a subscription.'
                }
              </Text>
            </View>

            {/* 升级好处 */}
            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>
                {appLanguage === 'zh-CN' ? '升级后您将获得' : 'Upgrade to unlock'}
              </Text>
              <Text style={styles.benefitsSubtitle}>
                {appLanguage === 'zh-CN' 
                  ? '解锁所有高级功能，享受完整的学习体验'
                  : 'Unlock all premium features and enjoy the complete learning experience'
                }
              </Text>
              {getUpgradeBenefits().map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.benefitIconContainer}>
                    <Ionicons 
                      name={benefit.icon as any} 
                      size={20} 
                      color={colors.primary[500]} 
                    />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* 升级激励 */}
            <View style={styles.upgradeMotivation}>
              <Text style={styles.motivationTitle}>
                {appLanguage === 'zh-CN' ? '现在升级，享受优惠' : 'Upgrade Now & Save'}
              </Text>
              <Text style={styles.motivationText}>
                {appLanguage === 'zh-CN' 
                  ? '选择年度订阅可享受更多折扣，平均每月仅需几元，比一杯咖啡还便宜！'
                  : 'Choose annual subscription for more savings. Average monthly cost is just a few dollars, cheaper than a cup of coffee!'
                }
              </Text>
            </View>
          </ScrollView>

          {/* 升级按钮 */}
          <View style={styles.buttonContainer}>
            {/* 按钮上方提示 */}
            <View style={styles.buttonPrompt}>
              <Text style={styles.buttonPromptText}>
                {appLanguage === 'zh-CN' 
                  ? '💎 升级后立即解锁所有功能，开始您的学习之旅！'
                  : '💎 Unlock all features immediately after upgrade and start your learning journey!'
                }
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.upgradeButton} 
              onPress={() => {
                console.log('[UpgradeModal] 用户点击立即升级按钮');
                onUpgrade();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#7C3AED', '#8B5CF6']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="diamond" size={20} color="#FFFFFF" />
                <Text style={styles.upgradeButtonText}>
                  {appLanguage === 'zh-CN' ? '立即升级' : 'Upgrade Now'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={() => {
              console.log('[UpgradeModal] 用户点击稍后再说按钮');
              onClose();
            }}>
              <Text style={styles.cancelButtonText}>
                {appLanguage === 'zh-CN' ? '稍后再说' : 'Maybe Later'}
              </Text>
            </TouchableOpacity>

            {/* 按钮下方提示 */}
            <View style={styles.buttonFooter}>
              <Text style={styles.buttonFooterText}>
                {appLanguage === 'zh-CN' 
                  ? '🔒 试用期结束后，基础查词功能仍可免费使用'
                  : '🔒 Basic word lookup remains free after trial period'
                }
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxHeight: '85%',
    minHeight: 600,
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  featureHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradePrompt: {
    backgroundColor: colors.warning[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warning[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.warning[700],
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: colors.warning[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  featureExplanation: {
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: 8,
    textAlign: 'center',
  },
  explanationText: {
    fontSize: 14,
    color: colors.primary[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitsSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  upgradeMotivation: {
    backgroundColor: colors.success[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success[700],
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 14,
    color: colors.success[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
    paddingTop: 0,
  },
  buttonPrompt: {
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonPromptText: {
    fontSize: 14,
    color: colors.primary[600],
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  buttonFooter: {
    marginTop: 16,
    alignItems: 'center',
  },
  buttonFooterText: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  upgradeButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
});
