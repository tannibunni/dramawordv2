import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

// 复习完成统计接口
export interface ReviewStats {
  totalWords: number;
  rememberedWords: number;
  forgottenWords: number;
  experience: number;
  accuracy: number;
}

// 复习动作接口
export interface ReviewAction {
  word: string;
  remembered: boolean;
  translation?: string;
}

interface ReviewCompleteScreenProps {
  stats: ReviewStats;
  actions: ReviewAction[];
  onBack: () => void;
  type?: string; // 添加复习类型参数
}

const ReviewCompleteScreen: React.FC<ReviewCompleteScreenProps> = ({ 
  stats, 
  actions, 
  onBack,
  type 
}) => {
  return (
    <View style={styles.container}>
      {/* 记住统计 */}
      <View style={styles.rememberedSection}>
        <Text style={styles.rememberedTitle}>你记住：</Text>
        <Text style={styles.rememberedCount}>
          {stats.rememberedWords} / {stats.totalWords}
        </Text>
      </View>
      
      {/* 成功率 */}
      <View style={styles.accuracySection}>
        <Text style={styles.accuracyLabel}>成功率</Text>
        <Text style={styles.accuracyPercentage}>{stats.accuracy}%</Text>
      </View>
      
      {/* 单词列表 */}
      <View style={styles.wordListContainer}>
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
              </View>
              <View style={styles.resultInfo}>
                {item.remembered ? (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} />
                    <Text style={styles.xpText}>+2XP</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="close-circle" size={24} color={colors.error[500]} />
                    <Text style={[
                      styles.xpText, 
                      { color: type === 'wrong_words' ? colors.text.secondary : colors.error[500] }
                    ]}>
                      {type === 'wrong_words' ? '+0XP' : '+1XP'}
                    </Text>
                  </>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      
      {/* 总经验值 */}
      <View style={styles.experienceSection}>
        <Text style={styles.experienceLabel}>本次复习获得</Text>
        <Text style={styles.experienceValue}>+{stats.experience} XP</Text>
      </View>
      
      {/* 完成按钮 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.completeButton} onPress={onBack}>
          <Text style={styles.completeButtonText}>完成</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
    backgroundColor: colors.background.primary,
  },
  rememberedSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  rememberedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  rememberedCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.success[500],
  },
  accuracySection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  accuracyLabel: {
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: 4,
  },
  accuracyPercentage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  wordListContainer: {
    flex: 1,
    marginBottom: 24,
  },
  wordList: {
    maxHeight: 1000,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  wordInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 18,
    color: colors.text.primary,
    marginRight: 8,
  },
  translationText: {
    fontSize: 16,
    color: colors.text.secondary,
    flex: 1,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    fontSize: 14,
    color: colors.success[500],
    fontWeight: 'bold',
    marginLeft: 4,
  },
  experienceSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  completeButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ReviewCompleteScreen; 