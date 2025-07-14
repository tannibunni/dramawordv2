import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { colors, spacing, borderRadius, textStyles, shadows } from '../tokens';
import { Button, Card, Input } from './index';

export const DesignSystemDemo: React.FC = () => {
  const [inputValue, setInputValue] = React.useState('');
  const [passwordValue, setPasswordValue] = React.useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 头部 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>剧词记设计系统</Text>
          <Text style={styles.headerSubtitle}>Design System Demo</Text>
        </View>

        {/* 颜色系统 */}
        <Card variant="elevated" padding="large" style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 颜色系统</Text>
          
          <View style={styles.colorGrid}>
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: colors.primary[500] }]} />
              <Text style={styles.colorLabel}>主色</Text>
              <Text style={styles.colorValue}>#4F6DFF</Text>
            </View>
            
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: colors.accent[500] }]} />
              <Text style={styles.colorLabel}>辅助色</Text>
              <Text style={styles.colorValue}>#FFCB57</Text>
            </View>
            
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: colors.success[500] }]} />
              <Text style={styles.colorLabel}>成功色</Text>
              <Text style={styles.colorValue}>#7AD28D</Text>
            </View>
            
            <View style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: colors.error[500] }]} />
              <Text style={styles.colorLabel}>错误色</Text>
              <Text style={styles.colorValue}>#F76C6C</Text>
            </View>
          </View>
        </Card>

        {/* 字体系统 */}
        <Card variant="elevated" padding="large" style={styles.section}>
          <Text style={styles.sectionTitle}>📝 字体系统</Text>
          
          <Text style={[textStyles.h1, styles.textSample]}>标题 H1 - 36px Bold</Text>
          <Text style={[textStyles.h2, styles.textSample]}>标题 H2 - 30px Bold</Text>
          <Text style={[textStyles.h3, styles.textSample]}>标题 H3 - 24px Semibold</Text>
          <Text style={[textStyles.h4, styles.textSample]}>标题 H4 - 20px Semibold</Text>
          <Text style={[textStyles.bodyLarge, styles.textSample]}>正文大 - 18px Regular</Text>
          <Text style={[textStyles.body, styles.textSample]}>正文 - 16px Regular</Text>
          <Text style={[textStyles.bodySmall, styles.textSample]}>正文小 - 14px Regular</Text>
          <Text style={[textStyles.caption, styles.textSample]}>说明文字 - 12px Regular</Text>
        </Card>

        {/* 按钮组件 */}
        <Card variant="elevated" padding="large" style={styles.section}>
          <Text style={styles.sectionTitle}>🔘 按钮组件</Text>
          
          <View style={styles.buttonGroup}>
            <Button title="主按钮" onPress={() => alert('主按钮点击')} variant="primary" />
            <Button title="次按钮" onPress={() => alert('次按钮点击')} variant="secondary" />
            <Button title="危险按钮" onPress={() => alert('危险按钮点击')} variant="danger" />
            <Button title="幽灵按钮" onPress={() => alert('幽灵按钮点击')} variant="ghost" />
          </View>
          
          <View style={styles.buttonGroup}>
            <Button title="小按钮" onPress={() => {}} size="small" />
            <Button title="中按钮" onPress={() => {}} size="medium" />
            <Button title="大按钮" onPress={() => {}} size="large" />
          </View>
          
          <View style={styles.buttonGroup}>
            <Button title="加载中" onPress={() => {}} loading />
            <Button title="禁用" onPress={() => {}} disabled />
          </View>
        </Card>

        {/* 输入框组件 */}
        <Card variant="elevated" padding="large" style={styles.section}>
          <Text style={styles.sectionTitle}>📝 输入框组件</Text>
          
          <Input
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="请输入内容"
            label="普通输入框"
          />
          
          <Input
            value={passwordValue}
            onChangeText={setPasswordValue}
            placeholder="请输入密码"
            label="密码输入框"
            secureTextEntry
          />
          
          <Input
            value=""
            onChangeText={() => {}}
            placeholder="请输入邮箱"
            label="错误状态"
            error="请输入有效的邮箱地址"
          />
          
          <Input
            value=""
            onChangeText={() => {}}
            placeholder="禁用状态"
            label="禁用输入框"
            disabled
          />
        </Card>

        {/* 卡片组件 */}
        <Card variant="elevated" padding="large" style={styles.section}>
          <Text style={styles.sectionTitle}>🃏 卡片组件</Text>
          
          <View style={styles.cardGroup}>
            <Card variant="default" padding="medium" style={styles.demoCard}>
              <Text style={styles.cardTitle}>默认卡片</Text>
              <Text style={styles.cardContent}>轻微阴影，适合一般内容展示</Text>
            </Card>
            
            <Card variant="elevated" padding="medium" style={styles.demoCard}>
              <Text style={styles.cardTitle}>高亮卡片</Text>
              <Text style={styles.cardContent}>更明显的阴影，适合重要内容</Text>
            </Card>
            
            <Card variant="outlined" padding="medium" style={styles.demoCard}>
              <Text style={styles.cardTitle}>轮廓卡片</Text>
              <Text style={styles.cardContent}>边框样式，适合次要内容</Text>
            </Card>
          </View>
        </Card>

        {/* 间距展示 */}
        <Card variant="elevated" padding="large" style={styles.section}>
          <Text style={styles.sectionTitle}>📏 间距系统</Text>
          
          <View style={styles.spacingDemo}>
            <View style={[styles.spacingItem, { marginBottom: spacing[2] }]}>
              <Text style={styles.spacingLabel}>间距 8px</Text>
            </View>
            <View style={[styles.spacingItem, { marginBottom: spacing[4] }]}>
              <Text style={styles.spacingLabel}>间距 16px</Text>
            </View>
            <View style={[styles.spacingItem, { marginBottom: spacing[6] }]}>
              <Text style={styles.spacingLabel}>间距 24px</Text>
            </View>
            <View style={[styles.spacingItem, { marginBottom: spacing[8] }]}>
              <Text style={styles.spacingLabel}>间距 32px</Text>
            </View>
          </View>
        </Card>

        {/* 底部间距 */}
        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing[6],
    alignItems: 'center',
    backgroundColor: colors.primary[500],
  },
  headerTitle: {
    ...textStyles.h2,
    color: colors.text.inverse,
    marginBottom: spacing[2],
  },
  headerSubtitle: {
    ...textStyles.body,
    color: colors.primary[100],
  },
  section: {
    margin: spacing[4],
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorItem: {
    alignItems: 'center',
    marginBottom: spacing[4],
    width: '48%',
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
    ...shadows.sm,
  },
  colorLabel: {
    ...textStyles.label,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  colorValue: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  textSample: {
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  cardGroup: {
    gap: spacing[4],
  },
  demoCard: {
    marginBottom: spacing[3],
  },
  cardTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  cardContent: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  spacingDemo: {
    marginTop: spacing[2],
  },
  spacingItem: {
    backgroundColor: colors.primary[100],
    padding: spacing[3],
    borderRadius: borderRadius.md,
  },
  spacingLabel: {
    ...textStyles.body,
    color: colors.primary[700],
    textAlign: 'center',
  },
}); 