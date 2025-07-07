import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 内联颜色定义
const colors = {
  primary: '#4F6DFF',
  success: '#6BCF7A',
  background: '#F9F9FB',
  backgroundSecondary: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#888888',
  border: '#E5E5EC',
};

const DemoScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>剧词记</Text>
        <Text style={styles.subtitle}>英语学习APP演示</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>已完成功能</Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.featureText}>设计系统 - 颜色、字体、间距规范</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.featureText}>登录页面 - 多方式登录支持</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.featureText}>底部导航 - 5个主要页面</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.featureText}>查词页面 - 搜索和最近查词</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.featureText}>单词卡片 - 详细释义和收藏功能</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>技术栈</Text>
          
          <View style={styles.techList}>
            <View style={styles.techItem}>
              <Text style={styles.techTitle}>React Native</Text>
              <Text style={styles.techDesc}>跨平台移动应用开发</Text>
            </View>
            
            <View style={styles.techItem}>
              <Text style={styles.techTitle}>TypeScript</Text>
              <Text style={styles.techDesc}>类型安全的JavaScript</Text>
            </View>
            
            <View style={styles.techItem}>
              <Text style={styles.techTitle}>Expo</Text>
              <Text style={styles.techDesc}>快速开发和部署工具</Text>
            </View>
            
            <View style={styles.techItem}>
              <Text style={styles.techTitle}>MongoDB</Text>
              <Text style={styles.techDesc}>灵活的文档数据库</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>如何使用</Text>
          
          <View style={styles.usageList}>
            <Text style={styles.usageText}>1. 安装依赖：npm install</Text>
            <Text style={styles.usageText}>2. 启动开发服务器：npm start</Text>
            <Text style={styles.usageText}>3. 使用Expo Go扫描二维码</Text>
            <Text style={styles.usageText}>4. 或在模拟器中运行</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>开始您的英语学习之旅！</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  techList: {
    gap: 12,
  },
  techItem: {
    padding: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  techTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  techDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  usageList: {
    padding: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  usageText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  footer: {
    padding: 24,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default DemoScreen; 