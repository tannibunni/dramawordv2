import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LearningStatsSection } from './LearningStatsSection';
import { colors } from '../../constants/colors';

export const TestLearningStats: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>学习统计测试</Text>
          <Text style={styles.subtitle}>测试新的学习统计组件</Text>
        </View>
        
        <LearningStatsSection
          onBadgePress={(badge) => {
            console.log('奖章被点击:', badge);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
}); 