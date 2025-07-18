import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '../../components/navigation/NavigationContext';
import { FontAwesome } from '@expo/vector-icons';

const plans = [
  {
    key: 'monthly',
    name: '月度订阅',
    price: '¥9.9/月',
    features: ['无限查词', 'AI造句', '奖章系统'],
    tag: '推荐',
    tagColor: '#3A8DFF',
    highlight: false,
    recommend: '👉 推荐新手尝鲜',
    save: '',
    originalPrice: '',
    timer: false,
  },
  {
    key: 'yearly',
    name: '年度订阅',
    price: '¥88/年',
    features: ['最受欢迎', '长期学习更划算'],
    tag: '最受欢迎',
    tagColor: '#FF9800',
    highlight: true,
    recommend: '',
    save: '节省 26%',
    originalPrice: '',
    timer: false,
  },
  {
    key: 'lifetime',
    name: '终身买断',
    price: '¥99',
    features: ['一次买断', '永久使用', '送尊贵徽章'],
    tag: '限时优惠',
    tagColor: '#FF3B30',
    highlight: false,
    recommend: '',
    save: '',
    originalPrice: '¥199',
    timer: true,
  },
];

const paymentMethods = [
  { key: 'wechat', name: '微信支付', icon: require('../../../assets/images/wechat-pay.png') },
  { key: 'alipay', name: '支付宝', icon: require('../../../assets/images/alipay.png') },
];

const reviews = [
  { user: '小明', text: '用了剧词记，单词记得快多了！' },
  { user: '小红', text: 'AI例句超实用，背单词不枯燥！' },
  { user: '小李', text: '客服很贴心，退款也很快。' },
];

const benefitList = [
  '30% Discount at the Bar',
  '20% Discount on In-Room Dining',
  '25% Discount on Health Club/SPA',
];

const userAvatars = [
  require('../../../assets/images/avatar1.png'),
  require('../../../assets/images/avatar2.png'),
  require('../../../assets/images/avatar3.png'),
];

const featureTable = [
  { label: '实时查词', free: true, vip: true },
  { label: '存入词表', free: false, vip: true },
  { label: '复习卡片', free: false, vip: true },
  { label: '剧集标注来源', free: false, vip: true },
  { label: '无广告体验', free: false, vip: true, freeText: '含广告', vipText: '无广告' },
  { label: '自定义例句/笔记', free: false, vip: true },
];

const renderFeatureTable = () => (
  <View style={styles.featureTableWrap}>
    <View style={styles.featureTableHeader}>
      <Text style={[styles.featureTableHeaderCell, styles.featureTableHeaderCellFirst]}>功能</Text>
      <Text style={styles.featureTableHeaderCell}>免费用户</Text>
      <Text style={styles.featureTableHeaderCell}>高级会员</Text>
    </View>
    {featureTable.map((row, idx) => (
      <View key={row.label} style={[styles.featureTableRow, idx === featureTable.length - 1 && { borderBottomWidth: 0 }]}> 
        <Text style={[styles.featureTableCell, styles.featureTableCellFirst]}>{row.label}</Text>
        <View style={styles.featureTableCellMid}>
          {row.free ? (
            <FontAwesome name="check-square" size={18} color="#43C463" />
          ) : (
            <FontAwesome name="close" size={18} color="#FF3B30" />
          )}
          <Text style={styles.featureTableCellText}>
            {row.freeText ? row.freeText : row.free ? '支持' : '不支持'}
          </Text>
        </View>
        <View style={styles.featureTableCellMid}>
          {row.vip ? (
            <FontAwesome name="check-square" size={18} color="#43C463" />
          ) : (
            <FontAwesome name="close" size={18} color="#FF3B30" />
          )}
          <Text style={styles.featureTableCellText}>
            {row.vipText ? row.vipText : row.vip ? '支持' : '不支持'}
          </Text>
        </View>
      </View>
    ))}
  </View>
);

// mock: 首月优惠是否可见（后续可用 context/props/后端控制）
const showFirstMonthTab = true;

const tabPlans = [
  { key: 'first', name: '首月优惠', price: '¥6', desc: '仅限首次订阅，享受全部会员权益', tag: '限时', cta: '立即享首月优惠', onlyShowOnFirst: true },
  { key: 'monthly', name: '月订阅', price: '¥12/月', desc: '一杯奶茶钱，按月付费，随时可取消', cta: '订阅月度会员' },
  { key: 'yearly', name: '年订阅', price: '¥88/年', desc: '两杯咖啡钱用一年，最划算，坚持长期学习', tag: '最划算', save: '省下¥56', cta: '订阅年度会员' },
];

const SubscriptionScreen = () => {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [selectedPay, setSelectedPay] = useState('wechat');
  const [timer, setTimer] = useState(3600); // 1小时倒计时
  const [ctaStep, setCtaStep] = useState<'select' | 'pay'>('select');
  const [paySectionY, setPaySectionY] = useState(0);
  const { goBack, navigate } = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);

  // tab 切换状态
  const [selectedTab, setSelectedTab] = useState(showFirstMonthTab ? 'first' : 'yearly');

  // 过滤可见 tab
  const visibleTabs = tabPlans.filter(tab => !tab.onlyShowOnFirst || showFirstMonthTab);
  const selectedPlanFromTabs = tabPlans.find(tab => tab.key === selectedTab) || visibleTabs[0];

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = (t: number) => {
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
    const s = String(t % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // 滚动到支付方式区
  const scrollToPaySection = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: paySectionY - 24, animated: true });
    }
  };

  // 按钮点击逻辑
  const handleCtaPress = () => {
    if (ctaStep === 'select') {
      scrollToPaySection();
      setCtaStep('pay');
    } else {
      // 这里可接入支付逻辑
      // alert('支付功能开发中');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 顶部返回按钮 */}
      <TouchableOpacity style={styles.backBtnNew} onPress={() => navigate('main', { tab: 'profile' })} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={26} color="#222" />
      </TouchableOpacity>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 180 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 套餐 tab 区 */}
        <View style={styles.tabBarWrap}>
          {visibleTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBarItem, selectedTab === tab.key && styles.tabBarItemActive]}
              onPress={() => setSelectedTab(tab.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabBarText, selectedTab === tab.key && styles.tabBarTextActive]}>{tab.name}</Text>
              {!!tab.tag && <Text style={styles.tabBarTag}>{tab.tag}</Text>}
            </TouchableOpacity>
          ))}
        </View>
        {/* 选中套餐详情 */}
        <View style={styles.planDetailWrap}>
          <Text style={styles.planPrice}>{selectedPlanFromTabs.price}</Text>
          {selectedPlanFromTabs.save && (
            <Text style={styles.planSave}>{selectedPlanFromTabs.save}</Text>
          )}
          <Text style={styles.planDesc}>{selectedPlanFromTabs.desc}</Text>
          <TouchableOpacity style={styles.planCtaBtn} activeOpacity={0.9}>
            <Text style={styles.planCtaText}>{selectedPlanFromTabs.cta}</Text>
          </TouchableOpacity>
        </View>
        {/* 权益对比表格 */}
        {renderFeatureTable()}
      </ScrollView>
      {/* 主按钮吸底已移至 tab 内容区 */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F6FA' },
  backBtnNew: { position: 'absolute', top: 40, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#3A8DFF', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  container: { flex: 1, backgroundColor: 'transparent' },
  verticalPlanList: { marginTop: 60, marginHorizontal: 18 },
  verticalPlanCard: { backgroundColor: '#fff', borderRadius: 22, padding: 22, paddingBottom: 48, marginBottom: 22, shadowColor: '#23223A', shadowOpacity: 0.10, shadowRadius: 10, elevation: 3, position: 'relative', borderWidth: 2, borderColor: 'transparent' },
  verticalPlanCardSelected: { borderColor: '#3A8DFF', shadowOpacity: 0.18 },
  verticalPlanCheck: { position: 'absolute', top: 16, right: 16, zIndex: 2 },
  verticalPlanName: { color: '#23223A', fontSize: 18, fontWeight: '700' },
  inlinePlanTag: { marginLeft: 8, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  inlinePlanTagText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  verticalPlanPriceBox: { position: 'absolute', right: 22, bottom: 22, flexDirection: 'row', alignItems: 'flex-end' },
  verticalPlanPrice: { color: '#3A8DFF', fontSize: 26, fontWeight: '900', marginLeft: 6 },
  verticalPlanOriginalPrice: { color: '#B0BEC5', fontSize: 16, textDecorationLine: 'line-through', marginRight: 4 },
  verticalPlanSave: { color: '#FF9800', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  verticalPlanTimer: { color: '#FF3B30', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  verticalPlanFeatures: { marginTop: 8 },
  verticalPlanFeatureItem: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  verticalPlanFeatureText: { color: '#23223A', fontSize: 15 },
  verticalPlanRecommend: { color: '#FFD600', fontSize: 15, fontWeight: '700', marginTop: 10 },
  paySection: { marginTop: 36, marginHorizontal: 24, backgroundColor: '#fff', borderRadius: 18, padding: 18, alignItems: 'flex-start', shadowColor: '#3A8DFF', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  payTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 10 },
  payRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  payIconBox: { alignItems: 'center', flexDirection: 'row', marginRight: 28, padding: 10, borderRadius: 16, backgroundColor: '#fff', shadowColor: '#3A8DFF', shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  payIconBoxSelected: { borderWidth: 2, borderColor: '#3A8DFF', shadowOpacity: 0.18 },
  payIcon: { width: 32, height: 32, marginRight: 6 },
  payName: { fontSize: 15, color: '#222', fontWeight: '500' },
  safeTip: { color: '#1976D2', fontSize: 13, fontWeight: '700', marginTop: 14 },
  ctaFixedWrapNew: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', paddingBottom: 24, alignItems: 'center' },
  ctaWrapNew: { width: '90%' },
  ctaBtnNew: { borderRadius: 30, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF9800', shadowOpacity: 0.18, shadowRadius: 12, elevation: 3 },
  ctaTextNew: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'System' },
  featureTableWrap: {
    marginHorizontal: 12,
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: '#F7F8FA',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E6EB',
  },
  featureTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F0F2F5',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6EB',
  },
  featureTableHeaderCell: {
    flex: 1,
    fontWeight: '700',
    fontSize: 16,
    color: '#23223A',
    textAlign: 'center',
  },
  featureTableHeaderCellFirst: {
    textAlign: 'left',
    paddingLeft: 18,
  },
  featureTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6EB',
    backgroundColor: 'transparent',
  },
  featureTableCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // 第一列左对齐
  },
  featureTableCellFirst: {
    justifyContent: 'flex-start',
    paddingLeft: 18,
  },
  featureTableCellMid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTableCellText: {
    marginLeft: 6,
    fontSize: 15,
    color: '#23223A',
  },
  tabBarWrap: {
    flexDirection: 'row',
    marginTop: 60,
    marginHorizontal: 18,
    marginBottom: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabBarItem: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  tabBarItemActive: {
    backgroundColor: '#3A8DFF11',
  },
  tabBarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#23223A',
  },
  tabBarTextActive: {
    color: '#3A8DFF',
  },
  tabBarTag: {
    marginTop: 4,
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '700',
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  planDetailWrap: {
    marginHorizontal: 18,
    marginTop: 24,
    marginBottom: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#23223A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#3A8DFF',
    marginBottom: 8,
  },
  planSave: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  planDesc: {
    fontSize: 15,
    color: '#23223A',
    marginBottom: 18,
    textAlign: 'center',
  },
  planCtaBtn: {
    backgroundColor: '#3A8DFF',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 36,
    marginTop: 6,
  },
  planCtaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default SubscriptionScreen; 