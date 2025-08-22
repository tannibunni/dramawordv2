import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  feature,
  onUpgrade,
}) => {
  const { appLanguage } = useAppLanguage();
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, slideAnim]);

  if (!feature) return null;

  const featureConfig = FeatureAccessService.getFeatureConfig(feature);
  if (!featureConfig) return null;

  // 根据用户地区显示价格（这里使用示例价格，实际应该从订阅服务获取）
  const getLocalizedPrice = () => {
    // 这里应该根据用户地区获取实际价格
    return appLanguage === 'zh-CN' ? '¥19.99/月' : '$2.99/month';
  };

  const getUpgradeBenefits = () => {
    return [
      {
        icon: 'search',
        title: appLanguage === 'zh-CN' ? 'AI 查词' : 'AI Word Lookup',
        description: appLanguage === 'zh-CN' ? '最新语境释义，地道例句，不再死板' : 'Latest contextual definitions, authentic examples, no more rigid translations'
      },
      {
        icon: 'refresh',
        title: appLanguage === 'zh-CN' ? '智能复习' : 'Smart Review',
        description: appLanguage === 'zh-CN' ? '遗忘曲线提醒，高效巩固单词' : 'Forgetting curve reminders, efficient word consolidation'
      },
      {
        icon: 'globe',
        title: appLanguage === 'zh-CN' ? '多语言支持' : 'Multi-language Support',
        description: appLanguage === 'zh-CN' ? '英语 / 日语 / 韩语剧都能用' : 'English / Japanese / Korean dramas all supported'
      },
      {
        icon: 'book',
        title: appLanguage === 'zh-CN' ? '剧单 & 单词本' : 'Show List & Wordbooks',
        description: appLanguage === 'zh-CN' ? '无限收藏剧集和自建词库' : 'Unlimited show collection and custom word libraries'
      }
    ];
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* 背景遮罩 */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        {/* 从下往上的Modal内容 */}
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* 顶部拖拽指示器 */}
          <View style={styles.dragIndicator} />
          
          {/* 标题区域 */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>
              {appLanguage === 'zh-CN' ? '升级到 Pro 会员' : 'Upgrade to Pro'}
            </Text>
            <Text style={styles.price}>
              {getLocalizedPrice()}
            </Text>
          </View>

          {/* 卖点列表 */}
          <View style={styles.benefitsSection}>
            {getUpgradeBenefits().map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.checkIconContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>
                    {benefit.title}
                  </Text>
                  <Text style={styles.benefitDescription}>
                    {benefit.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* 按钮区域 */}
          <View style={styles.buttonSection}>
            <TouchableOpacity 
              style={styles.upgradeButton} 
              onPress={() => {
                console.log('[UpgradeModal] 用户点击立即升级按钮');
                onUpgrade();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeButtonText}>
                {appLanguage === 'zh-CN' ? '立即升级' : 'Upgrade Now'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.cancelText}>
              {appLanguage === 'zh-CN' ? '随时取消' : 'Cancel anytime'}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 40,
    minHeight: screenHeight * 0.6,
    maxHeight: screenHeight * 0.8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C3AED',
    textAlign: 'center',
  },
  benefitsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkIconContainer: {
    marginRight: 16,
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  buttonSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default UpgradeModal;
