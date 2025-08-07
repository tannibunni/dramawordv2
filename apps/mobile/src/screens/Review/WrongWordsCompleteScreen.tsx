import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useNavigation } from '../../components/navigation/NavigationContext';
import { useAppLanguage } from '../../context/AppLanguageContext';

// 错词复习统计接口
export interface WrongWordsReviewStats {
  totalWords: number;
  rememberedWords: number;
  forgottenWords: number;
  experience: number;
  accuracy: number;
  wrongWordsRemoved: number; // 从错词集合中移除的单词数
  wrongWordsRemaining: number; // 错词集合中剩余的单词数
}

// 错词复习动作接口
export interface WrongWordsReviewAction {
  word: string;
  remembered: boolean;
  translation?: string;
  wasWrongWord: boolean; // 是否原本是错词
  consecutiveCorrect: number; // 连续答对次数
}

interface WrongWordsCompleteScreenProps {
  stats: WrongWordsReviewStats;
  actions: WrongWordsReviewAction[];
  onBack: () => void;
}

const WrongWordsCompleteScreen: React.FC<WrongWordsCompleteScreenProps> = ({ 
  stats, 
  actions, 
  onBack 
}) => {
  const { navigate } = useNavigation();
  const { appLanguage } = useAppLanguage();

  const handleBackToReview = () => {
    navigate('main', { tab: 'review' });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 错词挑战完成标题 */}
      <View style={styles.headerSection}>
        <Ionicons name="checkmark-circle" size={48} color={colors.success[500]} />
        <Text style={styles.headerTitle}>
          {appLanguage === 'zh-CN' ? '错词挑战完成！' : 'Wrong Words Challenge Complete!'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {appLanguage === 'zh-CN' ? '继续努力，巩固记忆' : 'Keep working hard to strengthen your memory'}
        </Text>
      </View>

      {/* 主要统计 */}
      <View style={styles.mainStatsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            {appLanguage === 'zh-CN' ? '记住的单词' : 'Words Remembered'}
          </Text>
          <Text style={styles.statValue}>
            {stats.rememberedWords} / {stats.totalWords}
          </Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            {appLanguage === 'zh-CN' ? '成功率' : 'Accuracy'}
          </Text>
          <Text style={styles.statValue}>
            {stats.accuracy}%
          </Text>
        </View>
      </View>

      {/* 错词集合统计 */}
      <View style={styles.wrongWordsStatsSection}>
        <Text style={styles.sectionTitle}>
          {appLanguage === 'zh-CN' ? '错词集合状态' : 'Wrong Words Collection Status'}
        </Text>
        <View style={styles.wrongWordsStats}>
          <View style={styles.wrongWordsStat}>
            <Ionicons name="remove-circle" size={24} color={colors.success[500]} />
            <Text style={styles.wrongWordsStatText}>
              {appLanguage === 'zh-CN' ? '已移除' : 'Removed'}: {stats.wrongWordsRemoved}
            </Text>
          </View>
          <View style={styles.wrongWordsStat}>
            <Ionicons name="alert-circle" size={24} color={colors.warning[500]} />
            <Text style={styles.wrongWordsStatText}>
              {appLanguage === 'zh-CN' ? '仍需复习' : 'Still Need Review'}: {stats.wrongWordsRemaining}
            </Text>
          </View>
        </View>
      </View>

      {/* 单词列表 */}
      <View style={styles.wordListContainer}>
        <Text style={styles.sectionTitle}>
          {appLanguage === 'zh-CN' ? '本次复习单词' : 'Words Reviewed'}
        </Text>
        <ScrollView style={styles.wordList} showsVerticalScrollIndicator={false}>
          {actions.map((item, idx) => (
            <View key={item.word + idx} style={styles.wordItem}>
              <View style={styles.wordInfo}>
                <Text style={styles.wordText}>{item.word}</Text>
                {item.translation && (
                  <Text 
                    style={styles.translationText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    - {item.translation.length > 20 
                      ? item.translation.substring(0, 20) + '...' 
                      : item.translation}
                  </Text>
                )}
                {item.wasWrongWord && (
                  <View style={styles.wrongWordBadge}>
                    <Ionicons name="alert-circle" size={12} color={colors.warning[500]} />
                    <Text style={styles.wrongWordBadgeText}>
                      {appLanguage === 'zh-CN' ? '错词' : 'Wrong Word'}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.resultInfo}>
                {item.remembered ? (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} />
                    <Text style={styles.xpText}>+2XP</Text>
                    {item.consecutiveCorrect >= 3 && (
                      <View style={styles.consecutiveBadge}>
                        <Ionicons name="star" size={12} color={colors.success[500]} />
                        <Text style={styles.consecutiveBadgeText}>
                          {item.consecutiveCorrect}次
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <Ionicons name="close-circle" size={24} color={colors.error[500]} />
                    <Text style={[styles.xpText, { color: colors.error[500] }]}>+1XP</Text>
                  </>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 总经验值 */}
      <View style={styles.experienceSection}>
        <Text style={styles.experienceLabel}>
          {appLanguage === 'zh-CN' ? '本次复习获得' : 'Experience Gained'}
        </Text>
        <Text style={styles.experienceValue}>+{stats.experience} XP</Text>
      </View>

      {/* 按钮区域 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleBackToReview}>
          <Text style={styles.primaryButtonText}>
            {appLanguage === 'zh-CN' ? '继续复习' : 'Continue Review'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>
            {appLanguage === 'zh-CN' ? '完成' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.background.secondary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  mainStatsSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  wrongWordsStatsSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  wrongWordsStats: {
    flexDirection: 'row',
    gap: 16,
  },
  wrongWordsStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  wrongWordsStatText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  wordListContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  wordList: {
    maxHeight: 300,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  wordInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  wordText: {
    fontSize: 16,
    color: colors.text.primary,
    marginRight: 8,
    fontWeight: '500',
  },
  translationText: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  wrongWordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    gap: 2,
  },
  wrongWordBadgeText: {
    fontSize: 10,
    color: colors.warning[600],
    fontWeight: '500',
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: {
    fontSize: 12,
    color: colors.success[500],
    fontWeight: 'bold',
    marginLeft: 4,
  },
  consecutiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[100],
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  consecutiveBadgeText: {
    fontSize: 10,
    color: colors.success[600],
    fontWeight: '500',
  },
  experienceSection: {
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.secondary,
    marginHorizontal: 24,
    borderRadius: 12,
  },
  experienceLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  experienceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  secondaryButtonText: {
    color: colors.primary[500],
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WrongWordsCompleteScreen;
