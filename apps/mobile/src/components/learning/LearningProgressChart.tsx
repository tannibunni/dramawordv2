import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import { LearningRecord } from '../../services/learningAlgorithm';

interface LearningProgressChartProps {
  records: LearningRecord[];
  title?: string;
  type?: 'mastery' | 'forgetting' | 'progress';
  days?: number;
}

const { width } = Dimensions.get('window');

export const LearningProgressChart: React.FC<LearningProgressChartProps> = ({
  records,
  title = '学习进度',
  type = 'mastery',
  days = 30,
}) => {
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3b82f6',
    },
  };

  // 生成掌握度分布数据
  const generateMasteryData = () => {
    const masteryRanges = [
      { min: 0, max: 25, label: '0-25%' },
      { min: 25, max: 50, label: '25-50%' },
      { min: 50, max: 75, label: '50-75%' },
      { min: 75, max: 90, label: '75-90%' },
      { min: 90, max: 100, label: '90-100%' },
    ];

    const data = masteryRanges.map(range => {
      const count = records.filter(r => 
        r.masteryLevel >= range.min && r.masteryLevel < range.max
      ).length;
      return count;
    });

    return {
      labels: masteryRanges.map(r => r.label),
      datasets: [{ data }],
    };
  };

  // 生成遗忘曲线数据
  const generateForgettingData = () => {
    if (records.length === 0) return { labels: [], datasets: [{ data: [] }] };

    const averageMastery = records.reduce((sum, r) => sum + r.masteryLevel, 0) / records.length;
    const retentionRate = Math.max(0.1, averageMastery / 100);
    
    const data = [];
    const labels = [];
    
    for (let day = 1; day <= days; day += Math.ceil(days / 10)) {
      const retention = retentionRate * Math.exp(-day / 30);
      data.push(Math.max(0, Math.min(100, retention * 100)));
      labels.push(`第${day}天`);
    }

    return {
      labels,
      datasets: [{ data }],
    };
  };

  // 生成学习进度数据
  const generateProgressData = () => {
    const totalWords = records.length;
    const masteredWords = records.filter(r => r.masteryLevel >= 90).length;
    const learningWords = records.filter(r => r.masteryLevel >= 25 && r.masteryLevel < 90).length;
    const forgottenWords = records.filter(r => r.masteryLevel < 25).length;

    return {
      data: [
        masteredWords / Math.max(totalWords, 1),
        learningWords / Math.max(totalWords, 1),
        forgottenWords / Math.max(totalWords, 1),
      ],
    };
  };

  const renderChart = () => {
    switch (type) {
      case 'mastery':
        const masteryData = generateMasteryData();
        return (
          <BarChart
            data={masteryData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            fromZero
            showBarTops
            showValuesOnTopOfBars
            yAxisLabel=""
            yAxisSuffix=""
          />
        );

      case 'forgetting':
        const forgettingData = generateForgettingData();
        return (
          <LineChart
            data={forgettingData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            withDots={false}
            withShadow={false}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
          />
        );

      case 'progress':
        const progressData = generateProgressData();
        return (
          <ProgressChart
            data={progressData}
            width={width - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            }}
            strokeWidth={16}
            radius={32}
            hideLegend={false}
          />
        );

      default:
        return null;
    }
  };

  const getChartDescription = () => {
    switch (type) {
      case 'mastery':
        return '显示不同掌握度水平的单词分布';
      case 'forgetting':
        return '基于艾宾浩斯遗忘曲线的记忆预测';
      case 'progress':
        return '已掌握、学习中、遗忘单词的比例';
      default:
        return '';
    }
  };

  if (records.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>暂无学习数据</Text>
          <Text style={styles.emptySubtext}>开始学习后这里会显示你的进度</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{getChartDescription()}</Text>
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>
      
      {type === 'progress' && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.legendText}>已掌握</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>学习中</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>需复习</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
  },
});

export default LearningProgressChart; 