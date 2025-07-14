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

const SubscriptionScreen = () => {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [selectedPay, setSelectedPay] = useState('wechat');
  const [timer, setTimer] = useState(3600); // 1小时倒计时
  const [ctaStep, setCtaStep] = useState<'select' | 'pay'>('select');
  const [paySectionY, setPaySectionY] = useState(0);
  const { goBack, navigate } = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);

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
        {/* 纵向大卡片方案选择区 */}
        <View style={styles.verticalPlanList}>
          {plans.map(plan => (
            <TouchableOpacity
              key={plan.key}
              style={[
                styles.verticalPlanCard,
                selectedPlan === plan.key && styles.verticalPlanCardSelected,
              ]}
              activeOpacity={0.92}
              onPress={() => setSelectedPlan(plan.key)}
            >
              {/* 选中对勾 */}
              {selectedPlan === plan.key && (
                <View style={styles.verticalPlanCheck}>
                  <Ionicons name="checkmark-circle" size={28} color="#3A8DFF" />
                </View>
              )}
              {/* 名称+标签 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.verticalPlanName}>{plan.name}</Text>
                {!!plan.tag && (
                  <View style={[styles.inlinePlanTag, { backgroundColor: plan.tagColor }]}> 
                    <Text style={styles.inlinePlanTagText}>{plan.tag}</Text>
                  </View>
                )}
              </View>
              {/* 节省/限时倒计时 */}
              {plan.save ? <Text style={styles.verticalPlanSave}>{plan.save}</Text> : null}
              {plan.timer ? (
                <Text style={styles.verticalPlanTimer}>限时价 剩余 {formatTimer(timer)}</Text>
              ) : null}
              {/* 权益列表 */}
              <View style={styles.verticalPlanFeatures}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.verticalPlanFeatureItem}>
                    <FontAwesome name="check-circle" size={16} color="#3A8DFF" style={{ marginRight: 6 }} />
                    <Text style={styles.verticalPlanFeatureText}>{f}</Text>
                  </View>
                ))}
              </View>
              {/* 推荐语 */}
              {plan.recommend ? <Text style={styles.verticalPlanRecommend}>{plan.recommend}</Text> : null}
              {/* 价格区块（右下角绝对定位） */}
              <View style={styles.verticalPlanPriceBox}>
                {plan.originalPrice ? (
                  <Text style={styles.verticalPlanOriginalPrice}>{plan.originalPrice}</Text>
                ) : null}
                <Text style={styles.verticalPlanPrice}>{plan.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {/* 支付方式与安全提示 */}
        <View
          style={styles.paySection}
          onLayout={e => setPaySectionY(e.nativeEvent.layout.y)}
        >
          <Text style={styles.payTitle}>支付方式：</Text>
          <View style={styles.payRow}>
            {paymentMethods.map(pm => (
              <TouchableOpacity
                key={pm.key}
                style={[styles.payIconBox, selectedPay === pm.key && styles.payIconBoxSelected]}
                onPress={() => setSelectedPay(pm.key)}
              >
                <Image source={pm.icon} style={styles.payIcon} />
                <Text style={styles.payName}>{pm.name}</Text>
                {selectedPay === pm.key && <Ionicons name="checkmark-circle" size={18} color="#3A8DFF" style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.safeTip}>已接入微信/支付宝官方支付，安全无忧，支持7天无理由退款</Text>
        </View>
      </ScrollView>
      {/* 主按钮吸底 */}
      <View style={styles.ctaFixedWrapNew}>
        <TouchableOpacity activeOpacity={0.9} style={styles.ctaWrapNew} onPress={handleCtaPress}>
          <LinearGradient colors={["#FF9800", "#FF3B30"]} style={styles.ctaBtnNew}>
            <Text style={styles.ctaTextNew}>{ctaStep === 'select' ? '🔓 立即解锁全部功能' : '立即支付'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
});

export default SubscriptionScreen; 