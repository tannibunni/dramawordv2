import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FeatureGuard, FeatureGuardButton, useFeatureAccess } from './FeatureGuard';
import { FeatureType } from '../../services/featureAccessService';

/**
 * FeatureGuard 使用示例
 * 展示如何在不同场景下使用功能权限控制
 */

// 示例1：使用 FeatureGuard 包装整个功能区域
export const VocabularySectionExample: React.FC = () => {
  return (
    <FeatureGuard feature="vocabulary">
      {/* 如果用户有权限，显示完整的词汇本功能 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>我的词汇本</Text>
        {/* 词汇本的具体内容 */}
        <Text>词汇本功能内容...</Text>
      </View>
    </FeatureGuard>
  );
};

// 示例2：使用 FeatureGuard 包装功能，并提供自定义的fallback
export const ReviewSectionExample: React.FC = () => {
  const customFallback = (
    <View style={styles.limitedSection}>
      <Text style={styles.limitedTitle}>复习功能已锁定</Text>
      <Text style={styles.limitedDescription}>
        试用期结束后，复习功能需要升级到付费版才能使用
      </Text>
    </View>
  );

  return (
    <FeatureGuard 
      feature="review" 
      fallback={customFallback}
      showUpgradePrompt={false} // 不显示默认的升级提示
    >
      {/* 复习功能的完整内容 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>智能复习</Text>
        {/* 复习功能的具体内容 */}
        <Text>复习功能内容...</Text>
      </View>
    </FeatureGuard>
  );
};

// 示例3：使用 FeatureGuardButton 包装按钮
export const DailyRewardsButtonExample: React.FC = () => {
  const handlePress = () => {
    console.log('每日奖励按钮被点击');
    // 处理每日奖励逻辑
  };

  return (
    <FeatureGuardButton
      feature="dailyRewards"
      onPress={handlePress}
      style={styles.button}
      disabledStyle={styles.disabledButton}
    >
      <Text style={styles.buttonText}>领取每日奖励</Text>
    </FeatureGuardButton>
  );
};

// 示例4：使用 useFeatureAccess Hook 进行条件渲染
export const ConditionalFeatureExample: React.FC = () => {
  const { canAccess, loading } = useFeatureAccess('showList');

  if (loading) {
    return <Text>检查权限中...</Text>;
  }

  if (!canAccess) {
    return (
      <View style={styles.limitedSection}>
        <Text>剧集列表功能需要升级才能使用</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>我的剧集</Text>
      {/* 剧集列表功能内容 */}
      <Text>剧集列表内容...</Text>
    </View>
  );
};

// 示例5：在 ProfileScreen 中设置升级弹窗回调
export const ProfileScreenUpgradeSetup: React.FC = () => {
  React.useEffect(() => {
    // 设置升级弹窗回调，这样 FeatureAccessService 就能触发弹窗了
    const featureAccessService = require('../../services/featureAccessService').default;
    
    featureAccessService.setUpgradeModalCallback((feature: FeatureType) => {
      console.log(`需要升级功能: ${feature}`);
      // 这里可以显示升级弹窗或导航到订阅页面
    });

    return () => {
      // 清理回调
      featureAccessService.setUpgradeModalCallback(undefined);
    };
  }, []);

  return null; // 这个组件只是用来设置回调，不渲染任何内容
};

// 示例6：在主要功能入口处添加权限检查
export const MainFeatureEntryExample: React.FC = () => {
  const handleFeaturePress = (feature: FeatureType) => {
    console.log(`用户点击了功能: ${feature}`);
    // 这里可以添加具体的功能逻辑
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>主要功能</Text>
      
      {/* 查单词 - 基础功能，始终可用 */}
      <TouchableOpacity 
        style={styles.featureButton}
        onPress={() => handleFeaturePress('wordLookup')}
      >
        <Text style={styles.featureButtonText}>查单词</Text>
      </TouchableOpacity>

      {/* 词汇本 - 需要权限检查 */}
      <FeatureGuardButton
        feature="vocabulary"
        onPress={() => handleFeaturePress('vocabulary')}
        style={styles.featureButton}
      >
        <Text style={styles.featureButtonText}>词汇本</Text>
      </FeatureGuardButton>

      {/* 复习功能 - 需要权限检查 */}
      <FeatureGuardButton
        feature="review"
        onPress={() => handleFeaturePress('review')}
        style={styles.featureButton}
      >
        <Text style={styles.featureButtonText}>复习功能</Text>
      </FeatureGuardButton>

      {/* 每日奖励 - 需要权限检查 */}
      <FeatureGuardButton
        feature="dailyRewards"
        onPress={() => handleFeaturePress('dailyRewards')}
        style={styles.featureButton}
      >
        <Text style={styles.featureButtonText}>每日奖励</Text>
      </FeatureGuardButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  limitedSection: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  limitedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  limitedDescription: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  featureButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  featureButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
