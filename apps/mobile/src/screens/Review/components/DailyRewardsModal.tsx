import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { DailyReward } from '../../../types/dailyRewards';
import { DailyRewardItem } from './DailyRewardItem';
import { ExperienceParticles } from '../../../components/common/ExperienceParticles';
import { useAppLanguage } from '../../../context/AppLanguageContext';
import { t } from '../../../constants/translations';

interface DailyRewardsModalProps {
  visible: boolean;
  onClose: () => void;
  rewards: DailyReward[];
  onClaimReward: (rewardId: string) => Promise<any>;
  onClaimAll: () => Promise<any>;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  visible,
  onClose,
  rewards,
  onClaimReward,
  onClaimAll,
  onRefresh,
  isLoading = false
}) => {
  const { appLanguage } = useAppLanguage();
  const [claimingReward, setClaimingReward] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [particleXp, setParticleXp] = useState(0);
  const [localRewards, setLocalRewards] = useState<DailyReward[]>([]);

  // 当rewards prop更新时，同步本地状态
  useEffect(() => {
    if (rewards && rewards.length > 0) {
      setLocalRewards(rewards);
    } else {
      // 如果没有奖励数据，创建默认的5个奖励项目
      const defaultRewards = [
        {
          id: 'newWords',
          name: t('collect_new_words', appLanguage),
          description: t('collect_words_description', appLanguage),
          xpAmount: 10,
          icon: '📚',
          status: 'locked' as const,
          condition: t('collect_words_condition', appLanguage),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        {
          id: 'dailyReview',
          name: t('daily_review', appLanguage),
          description: t('daily_review_description', appLanguage),
          xpAmount: 5,
          icon: '✅',
          status: 'locked' as const,
          condition: t('daily_review_condition', appLanguage),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        {
          id: 'studyTime',
          name: t('study_time', appLanguage),
          description: t('study_time_description', appLanguage),
          xpAmount: 3,
          icon: '⏰',
          status: 'locked' as const,
          condition: t('study_time_condition', appLanguage),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        {
          id: 'continuousLearning',
          name: t('continuous_learning', appLanguage),
          description: t('continuous_learning_description', appLanguage),
          xpAmount: 8,
          icon: '🔥',
          status: 'locked' as const,
          condition: t('continuous_learning_condition', appLanguage),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        {
          id: 'perfectReview',
          name: t('perfect_review', appLanguage),
          description: t('perfect_review_description', appLanguage),
          xpAmount: 15,
          icon: '⭐',
          status: 'locked' as const,
          condition: t('perfect_review_condition', appLanguage),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      ];
      setLocalRewards(defaultRewards);
    }
  }, [rewards, appLanguage]);

  // 当弹窗打开时，确保数据是最新的
  useEffect(() => {
    if (visible && rewards && rewards.length > 0) {
      setLocalRewards(rewards);
    }
  }, [visible, rewards]);

  const availableRewards = localRewards.filter(r => r.status === 'available');
  const totalAvailableXP = availableRewards.reduce((sum, r) => sum + r.xpAmount, 0);

  // 处理单个奖励领取
  const handleClaimReward = async (rewardId: string) => {
    if (claimingReward) return; // 防止重复点击
    
    setClaimingReward(rewardId);
    try {
      const result = await onClaimReward(rewardId);
      if (result && result.success) {
        // 更新本地状态，立即显示"已领取"
        setLocalRewards(prev => prev.map(reward => 
          reward.id === rewardId 
            ? { ...reward, status: 'claimed' as const, claimedAt: new Date() }
            : reward
        ));
        
        // 显示粒子效果
        setParticleXp(result.xpGained || 0);
        setShowParticles(true);
        
        // 3秒后隐藏粒子效果
        setTimeout(() => {
          setShowParticles(false);
        }, 3000);
      }
    } catch (error) {
      Alert.alert(t('reward_claim_failed', appLanguage), t('reward_claim_retry', appLanguage));
    } finally {
      setClaimingReward(null);
    }
  };

  // 处理批量领取
  const handleClaimAll = async () => {
    if (availableRewards.length === 0) {
      Alert.alert(t('tip', appLanguage), t('no_rewards_available', appLanguage));
      return;
    }

    Alert.alert(
      t('one_click_claim', appLanguage),
      t('confirm_claim_all', appLanguage, { count: availableRewards.length, xp: totalAvailableXP }),
      [
        { text: t('cancel', appLanguage), style: 'cancel' },
        {
          text: t('confirm', appLanguage),
          onPress: async () => {
            try {
              const result = await onClaimAll();
              if (result && result.success) {
                // 更新本地状态，立即显示所有奖励为"已领取"
                setLocalRewards(prev => prev.map(reward => 
                  reward.status === 'available'
                    ? { ...reward, status: 'claimed' as const, claimedAt: new Date() }
                    : reward
                ));
                
                // 显示粒子效果
                setParticleXp(result.xpGained || 0);
                setShowParticles(true);
                
                // 3秒后隐藏粒子效果
                setTimeout(() => {
                  setShowParticles(false);
                }, 3000);
              }
            } catch (error) {
              Alert.alert(t('reward_claim_failed', appLanguage), t('reward_claim_retry', appLanguage));
            }
          }
        }
      ]
    );
  };

  // 刷新奖励状态
  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 标题栏 */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('daily_rewards_title', appLanguage)}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* 奖励列表 - 使用flex: 1确保占据剩余空间 */}
          <View style={styles.rewardsContainer}>
            <FlatList 
              data={localRewards}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🎯</Text>
                  <Text style={styles.emptyTitle}>{t('no_rewards_title', appLanguage)}</Text>
                  <Text style={styles.emptySubtitle}>{t('no_rewards_subtitle', appLanguage)}</Text>
                </View>
              )}
              ListFooterComponent={() => (
                null
              )}
              renderItem={({ item, index }) => (
                <DailyRewardItem
                  key={item.id}
                  reward={item}
                  onClaim={handleClaimReward}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.rewardsContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
              alwaysBounceVertical={false}
            />
          </View>

          {/* 底部操作区域 - 悬浮固定 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.claimAllButton}
              onPress={handleClaimAll}
              disabled={isLoading}
            >
              <Ionicons name="gift" size={18} color={colors.white} />
              <Text style={styles.claimAllText}>{t('one_click_claim', appLanguage)}</Text>
            </TouchableOpacity>
          </View>

          {/* 粒子效果 */}
          {showParticles && (
            <ExperienceParticles
              startPosition={{ x: 100, y: 100 }}
              endPosition={{ x: 200, y: 200 }}
              onComplete={() => setShowParticles(false)}
              color={colors.primary[500]}
            />
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
  modalContainer: {
    width: '90%',
    height: '66%', // 从85%减少到75%，减少底部空白
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden', // 防止内容溢出
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.background.tertiary,
    backgroundColor: colors.background.primary,
    position: 'relative',
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 2,
  },
  rewardsList: {
    flex: 1,
    height: '100%', // 使用100%高度
  },
  rewardsContent: {
    padding: 10,
    paddingBottom: 8, // 进一步减少底部间距
    flexGrow: 1, // 确保内容可以扩展
  },
  rewardsContainer: {
    flex: 1, // 确保容器占据剩余空间
    minHeight: 0, // 重要：允许flex子项收缩
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    paddingVertical: 20,
    borderTopWidth: 0.5,
    borderTopColor: colors.background.tertiary,
    backgroundColor: colors.background.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  claimAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  claimAllText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
});
