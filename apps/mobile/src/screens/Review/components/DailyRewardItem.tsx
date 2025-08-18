import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { DailyReward } from '../../../types/dailyRewards';
import { useAppLanguage } from '../../../context/AppLanguageContext';
import { t } from '../../../constants/translations';

interface DailyRewardItemProps {
  reward: DailyReward;
  onClaim: (rewardId: string) => void;
}

export const DailyRewardItem: React.FC<DailyRewardItemProps> = ({
  reward,
  onClaim
}) => {
  const { appLanguage } = useAppLanguage();
  const isAvailable = reward.status === 'available';
  const isClaimed = reward.status === 'claimed';
  const isLocked = reward.status === 'locked';

  const handlePress = () => {
    if (isAvailable) {
      onClaim(reward.id);
    }
  };

  const getStatusColor = () => {
    if (isClaimed) return colors.gray[300];
    if (isAvailable) return colors.success[400];
    return colors.primary[400]; // 更亮的颜色
  };

  const getStatusText = () => {
    if (isClaimed) return t('reward_claimed', appLanguage);
    if (isAvailable) return `+${reward.xpAmount} XP`;
    return t('reward_locked', appLanguage);
  };

  const getRewardIcon = (rewardId: string) => {
    switch (rewardId) {
      case 'newWords':
        return 'book-outline';
      case 'dailyReview':
        return 'checkmark-circle-outline';
      case 'studyTime':
        return 'time-outline';
      case 'continuousLearning':
        return 'flame-outline';
      case 'perfectReview':
        return 'star-outline';
      default:
        return 'gift-outline';
    }
  };

  const getTranslatedRewardName = () => {
    switch (reward.id) {
      case 'newWords':
        return t('collect_new_words', appLanguage);
      case 'dailyReview':
        return t('daily_review', appLanguage);
      case 'studyTime':
        return t('study_time', appLanguage);
      case 'continuousLearning':
        return t('continuous_learning', appLanguage);
      case 'perfectReview':
        return t('perfect_review', appLanguage);
      default:
        return reward.name; // fallback to original name
    }
  };

  const getTranslatedCondition = () => {
    // 如果reward.condition已经是翻译后的（来自dailyRewardsManager），直接使用
    // 否则根据状态和ID生成翻译
    if (reward.condition && reward.condition !== reward.description) {
      return reward.condition; // 使用从manager传来的翻译后条件
    }
    
    // fallback: 根据状态和ID生成基本翻译
    switch (reward.id) {
      case 'newWords':
        return isAvailable ? 
          t('collect_words_description', appLanguage) : 
          t('collect_words_condition', appLanguage);
      case 'dailyReview':
        return isAvailable ? 
          t('daily_review_description', appLanguage) : 
          t('daily_review_condition', appLanguage);
      case 'studyTime':
        return isAvailable ? 
          t('study_time_description', appLanguage) : 
          t('study_time_condition', appLanguage);
      case 'continuousLearning':
        return isAvailable ? 
          t('continuous_learning_description', appLanguage) : 
          t('continuous_learning_condition', appLanguage);
      case 'perfectReview':
        return isAvailable ? 
          t('perfect_review_description', appLanguage) : 
          t('perfect_review_condition', appLanguage);
      default:
        return reward.condition || reward.description;
    }
  };

  const getStatusIcon = () => {
    if (isClaimed) return 'checkmark-circle';
    if (isAvailable) return 'gift';
    return 'lock-closed';
  };

  const getButtonStyle = () => {
    if (isAvailable) return styles.availableButton;
    if (isClaimed) return styles.claimedButton;
    return styles.lockedButton;
  };

  const getButtonTextStyle = () => {
    if (isAvailable) return styles.availableButtonText;
    if (isClaimed) return styles.claimedButtonText;
    return styles.lockedButtonText;
  };

  return (
    <View style={[
      styles.container,
      isClaimed && styles.claimedContainer
    ]}>
      {/* 左侧：图标和名称 */}
      <View style={styles.leftSection}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getStatusColor() }
        ]}>
          <Ionicons 
            name={getRewardIcon(reward.id)} 
            size={18} 
            color={colors.white} 
          />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={[
            styles.name,
            isClaimed && styles.claimedText
          ]}>
            {getTranslatedRewardName()}
          </Text>
          <Text style={[
            styles.condition,
            isClaimed && styles.claimedText
          ]}>
            {getTranslatedCondition()}
          </Text>
        </View>
      </View>

      {/* 右侧：状态按钮 */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={[
            styles.claimButton,
            getButtonStyle()
          ]}
          onPress={handlePress}
          disabled={!isAvailable}
          activeOpacity={isAvailable ? 0.8 : 1}
        >
          <Ionicons 
            name={getStatusIcon() as any} 
            size={16} 
            color={isAvailable ? colors.white : colors.gray[500]} 
          />
          <Text style={[
            styles.claimButtonText,
            getButtonTextStyle()
          ]}>
            {getStatusText()}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 6,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  claimedContainer: {
    opacity: 0.6,
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[300],
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  condition: {
    fontSize: 11,
    color: colors.text.secondary,
    lineHeight: 14,
  },
  claimedText: {
    color: colors.gray[500],
  },
  rightSection: {
    alignItems: 'flex-end',
  },

  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 56,
    justifyContent: 'center',
  },
  availableButton: {
    backgroundColor: colors.success[400],
    borderColor: colors.success[500],
  },
  claimedButton: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
  },
  lockedButton: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.primary[400],
    borderWidth: 1.5,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  availableButtonText: {
    color: colors.white,
  },
  claimedButtonText: {
    color: colors.gray[500],
  },
  lockedButtonText: {
    color: colors.text.secondary,
  },

});
