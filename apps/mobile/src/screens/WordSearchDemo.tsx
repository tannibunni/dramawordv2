import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../packages/ui/src/tokens';
import { MainLayout } from '../components/navigation/MainLayout';

const WordSearchDemo: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>剧词记 - 查词功能演示</Text>
        <Text style={styles.subtitle}>首页（查词页）和单词卡片页</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能特性</Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="search" size={20} color={colors.primary[500]} />
              <Text style={styles.featureText}>智能搜索框，支持实时输入</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="time" size={20} color={colors.primary[500]} />
              <Text style={styles.featureText}>最近查词记录，快速访问</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="card" size={20} color={colors.primary[500]} />
              <Text style={styles.featureText}>卡片式单词展示，支持展开/收起</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="heart" size={20} color={colors.primary[500]} />
              <Text style={styles.featureText}>收藏功能，支持选择剧集</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="volume-high" size={20} color={colors.primary[500]} />
              <Text style={styles.featureText}>发音功能（开发中）</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>交互说明</Text>
          
          <View style={styles.interactionList}>
            <View style={styles.interactionItem}>
              <Text style={styles.interactionTitle}>首页操作：</Text>
              <Text style={styles.interactionText}>• 在搜索框输入单词，按回车或点击搜索</Text>
              <Text style={styles.interactionText}>• 点击最近查词记录中的任意单词</Text>
              <Text style={styles.interactionText}>• 点击右上角设置按钮</Text>
            </View>
            
            <View style={styles.interactionItem}>
              <Text style={styles.interactionTitle}>单词卡片页操作：</Text>
              <Text style={styles.interactionText}>• 点击"点击展开查看更多"查看详细释义</Text>
              <Text style={styles.interactionText}>• 点击发音按钮（功能开发中）</Text>
              <Text style={styles.interactionText}>• 点击收藏按钮选择剧集</Text>
              <Text style={styles.interactionText}>• 点击忽略按钮删除单词</Text>
              <Text style={styles.interactionText}>• 点击返回按钮回到首页</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设计亮点</Text>
          
          <View style={styles.designList}>
            <View style={styles.designItem}>
              <Text style={styles.designTitle}>🎨 设计系统</Text>
              <Text style={styles.designText}>使用统一的设计系统，包括颜色、字体、间距等</Text>
            </View>
            
            <View style={styles.designItem}>
              <Text style={styles.designTitle}>📱 响应式布局</Text>
              <Text style={styles.designText}>适配不同屏幕尺寸，提供良好的用户体验</Text>
            </View>
            
            <View style={styles.designItem}>
              <Text style={styles.designTitle}>🎭 动画效果</Text>
              <Text style={styles.designText}>流畅的展开/收起动画，提升交互体验</Text>
            </View>
            
            <View style={styles.designItem}>
              <Text style={styles.designTitle}>🔍 直观导航</Text>
              <Text style={styles.designText}>清晰的导航结构，用户可以轻松找到所需功能</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>点击下方按钮开始体验</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: 24,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  featureText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
  },
  interactionList: {
    gap: 16,
  },
  interactionItem: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  interactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  interactionText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  designList: {
    gap: 16,
  },
  designItem: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  designTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  designText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  footer: {
    padding: 24,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});

export default WordSearchDemo; 