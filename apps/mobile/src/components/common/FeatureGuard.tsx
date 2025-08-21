import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { FeatureType } from '../../services/featureAccessService';
import FeatureAccessService from '../../services/featureAccessService';
import { UpgradeModal } from './UpgradeModal';

interface FeatureGuardProps {
  feature: FeatureType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean; // 是否显示升级提示
  onAccessDenied?: () => void; // 访问被拒绝时的回调
  style?: any;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  onAccessDenied,
  style,
}) => {
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const { appLanguage } = useAppLanguage();

  useEffect(() => {
    checkAccess();
  }, [feature]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const hasAccess = await FeatureAccessService.canAccessFeature(feature);
      setCanAccess(hasAccess);
      
      if (!hasAccess && onAccessDenied) {
        onAccessDenied();
      }
    } catch (error) {
      console.error(`[FeatureGuard] 检查功能 ${feature} 权限失败:`, error);
      // 出错时默认允许访问，避免阻塞用户体验
      setCanAccess(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePress = () => {
    setUpgradeModalVisible(true);
  };

  const handleUpgradeModalClose = () => {
    setUpgradeModalVisible(false);
  };

  const handleUpgrade = () => {
    setUpgradeModalVisible(false);
    // 这里可以添加导航到订阅页面的逻辑
    // 或者触发其他升级流程
    console.log(`[FeatureGuard] 用户点击升级功能: ${feature}`);
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.secondary} />
      </View>
    );
  }

  // 如果有访问权限，直接显示子组件
  if (canAccess) {
    return <>{children}</>;
  }

  // 如果没有访问权限且提供了fallback，显示fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // 如果没有访问权限且启用了升级提示，显示升级提示
  if (showUpgradePrompt) {
    return (
      <>
        <View style={[styles.accessDeniedContainer, style]}>
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={24} color={colors.warning[500]} />
          </View>
          <Text style={styles.accessDeniedTitle}>
            {appLanguage === 'zh-CN' ? '功能已锁定' : 'Feature Locked'}
          </Text>
          <Text style={styles.accessDeniedDescription}>
            {FeatureAccessService.getFeatureRestrictionMessage(feature)}
          </Text>
          <TouchableOpacity 
            style={styles.upgradeButton} 
            onPress={handleUpgradePress}
            activeOpacity={0.8}
          >
            <Ionicons name="diamond" size={16} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>
              {appLanguage === 'zh-CN' ? '升级解锁' : 'Upgrade to Unlock'}
            </Text>
          </TouchableOpacity>
        </View>

        <UpgradeModal
          visible={upgradeModalVisible}
          onClose={handleUpgradeModalClose}
          feature={feature}
          onUpgrade={handleUpgrade}
        />
      </>
    );
  }

  // 如果都不满足，返回null
  return null;
};

// 创建一个简化的权限检查Hook
export const useFeatureAccess = (feature: FeatureType) => {
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        const hasAccess = await FeatureAccessService.canAccessFeature(feature);
        setCanAccess(hasAccess);
      } catch (error) {
        console.error(`[useFeatureAccess] 检查功能 ${feature} 权限失败:`, error);
        setCanAccess(true); // 出错时默认允许访问
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [feature]);

  return { canAccess, loading };
};

// 创建一个权限检查按钮组件
export const FeatureGuardButton: React.FC<{
  feature: FeatureType;
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  disabledStyle?: any;
}> = ({ feature, onPress, children, style, disabledStyle }) => {
  const { canAccess, loading } = useFeatureAccess(feature);

  const handlePress = async () => {
    if (loading) return;
    
    if (canAccess) {
      onPress();
    } else {
      // 触发升级弹窗
      FeatureAccessService.triggerUpgradeModal(feature);
    }
  };

  if (loading) {
    return (
      <View style={[style, styles.loadingButton]}>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.secondary} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        style,
        !canAccess && disabledStyle,
        !canAccess && styles.disabledButton
      ]}
      onPress={handlePress}
      activeOpacity={canAccess ? 0.8 : 1}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    margin: 16,
    shadowColor: colors.neutral[300],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warning[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  accessDeniedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  accessDeniedDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingButton: {
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
