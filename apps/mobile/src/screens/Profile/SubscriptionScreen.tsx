import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, SafeAreaView, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '../../components/navigation/NavigationContext';
import { FontAwesome } from '@expo/vector-icons';
import { subscriptionService } from '../../services/subscriptionService';
import { SUBSCRIPTION_PLANS, ProductId, getTranslatedSubscriptionPlans } from '../../types/subscription';
import { localizationService, LocalizedProduct } from '../../services/localizationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';

const renderFeatureTable = (subscriptionStatus: any, appLanguage: 'zh-CN' | 'en-US') => {
  const featureTable = getFeatureTable(subscriptionStatus, appLanguage);
  
  return (
  <View style={styles.featureTableWrap}>
    <View style={styles.featureTableHeader}>
      <Text style={[styles.featureTableHeaderCell, styles.featureTableHeaderCellFirst]}>{t('feature_comparison', appLanguage)}</Text>
        <Text style={styles.featureTableHeaderCell}>{t('free_version', appLanguage)}</Text>
        <Text style={styles.featureTableHeaderCell}>{t('premium_version', appLanguage)}</Text>
    </View>
      {featureTable.map((row: any, idx: number) => (
      <View key={row.label} style={[styles.featureTableRow, idx === featureTable.length - 1 && { borderBottomWidth: 0 }]}> 
        <Text style={[styles.featureTableCell, styles.featureTableCellFirst]}>{row.label}</Text>
        <View style={styles.featureTableCellMid}>
          {row.free ? (
            <FontAwesome name="check-square" size={18} color="#43C463" />
          ) : (
            <FontAwesome name="close" size={18} color="#FF3B30" />
          )}
        </View>
        <View style={styles.featureTableCellMid}>
          {row.vip ? (
            <FontAwesome name="check-square" size={18} color="#43C463" />
          ) : (
            <FontAwesome name="close" size={18} color="#FF3B30" />
          )}
        </View>
      </View>
    ))}
  </View>
);
};

// 功能对比表格 - 简化版本，只显示打钩打叉
const getFeatureTable = (subscriptionStatus: any, appLanguage: 'zh-CN' | 'en-US') => {
  return [
    { 
      label: t('chinese_english_search', appLanguage), 
      free: true, 
      vip: true
    },
    { 
      label: t('multilingual_search', appLanguage), 
      free: false, 
      vip: true
    },
    { 
      label: t('wordbook_function', appLanguage), 
      free: false, 
      vip: true
    },
    { 
      label: t('review_function', appLanguage), 
      free: false, 
      vip: true
    },
    { 
      label: t('learning_statistics', appLanguage), 
      free: false, 
      vip: true
    },
    { 
      label: t('show_management', appLanguage), 
      free: false, 
      vip: true
    },
    { 
      label: t('ai_smart_interpretation', appLanguage), 
      free: false, 
      vip: true
    },
    { 
      label: t('offline_learning', appLanguage), 
      free: false, 
      vip: true
    },
    { 
      label: t('multi_device_sync', appLanguage), 
      free: false, 
      vip: true
    },
  ];
};

const SubscriptionScreen = () => {
  const [selectedTab, setSelectedTab] = useState('yearly');
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBottomCta, setShowBottomCta] = useState(false);
  const [localizedProducts, setLocalizedProducts] = useState<LocalizedProduct[]>([]);
  const { goBack, navigate } = useNavigation();
  const { appLanguage } = useAppLanguage();
  const scrollViewRef = useRef<ScrollView>(null);

  // 过滤可见 tab - 使用翻译后的订阅计划
  const visibleTabs = getTranslatedSubscriptionPlans(appLanguage);
  const selectedPlanFromTabs = visibleTabs.find(tab => tab.id === selectedTab) || visibleTabs[0];
  
  // 获取本地化价格
  const getLocalizedPrice = (productId: string): string => {
    const localizedProduct = localizedProducts.find(p => p.productId === productId);
    if (localizedProduct) {
      return localizedProduct.price;
    }
    // 备用：使用默认价格
    const plan = visibleTabs.find(p => p.id === productId);
    return plan?.price || '$0.00';
  };

  // 获取本地化介绍价格（首月优惠）
  const getLocalizedIntroPrice = (productId: string): string | null => {
    const localizedProduct = localizedProducts.find(p => p.productId === productId);
    return localizedProduct?.introductoryPrice || null;
  };

  // 初始化订阅服务
  useEffect(() => {
    const initializeSubscription = async () => {
      try {
        await subscriptionService.initialize();
        const status = await subscriptionService.checkSubscriptionStatus();
        setSubscriptionStatus(status);
        
        // 加载本地化产品价格
        console.log(`[SubscriptionScreen] 加载本地化产品，地区: ${localizationService.getCurrentRegion()}`);
        const products = await localizationService.getLocalizedProducts();
        setLocalizedProducts(products);
        console.log(`[SubscriptionScreen] 加载了 ${products.length} 个本地化产品`, products);
        
        // 调试信息：显示从App Store获取的价格
        if (products.length > 0) {
          console.log('\n=== App Store Connect 价格信息 ===');
          products.forEach(product => {
            console.log(`${product.title}: ${product.price} (${product.currency})`);
            if (product.introductoryPrice) {
              console.log(`  └─ 首月优惠: ${product.introductoryPrice}`);
            }
          });
          console.log('================================\n');
        }
        
        // 注册状态变化回调
        const unsubscribe = subscriptionService.registerStateCallback((newStatus) => {
          setSubscriptionStatus(newStatus);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('[SubscriptionScreen] 初始化失败:', error);
      }
    };

    initializeSubscription();
  }, []);

  // 订阅按钮点击逻辑
  const handleSubscribe = async () => {
    if (subscriptionStatus?.isActive) {
      Alert.alert(
        t('subscribed', appLanguage),
        t('subscription_success', appLanguage),
        [{ text: t('ok', appLanguage), style: 'default' }]
      );
      return;
    }

    // 检查是否为游客模式，引导用户登录苹果ID
    try {
      const userData = await AsyncStorage.getItem('userData');
      const isGuest = userData ? JSON.parse(userData).loginType === 'guest' : true;
      
      if (isGuest) {
        Alert.alert(
          appLanguage === 'zh-CN' ? '账户提示' : 'Account Notice',
          appLanguage === 'zh-CN' 
            ? '为了更好地管理您的订阅和数据，建议您先登录苹果ID：\n\n• 数据云端同步\n• 跨设备访问\n• 完整功能支持\n• 安全的订阅管理\n\n是否前往登录苹果ID？'
            : 'For better subscription and data management, we recommend logging in with Apple ID first:\n\n• Cloud data sync\n• Cross-device access\n• Full feature support\n• Secure subscription management\n\nWould you like to proceed to Apple ID login?',
          [
            { 
              text: appLanguage === 'zh-CN' ? '取消' : 'Cancel', 
              style: 'cancel' 
            },
            { 
              text: appLanguage === 'zh-CN' ? '登录苹果ID' : 'Login with Apple ID', 
              onPress: () => handleAppleLoginRedirect()
            }
          ]
        );
        return;
      }
    } catch (error) {
      console.error('检查用户状态失败:', error);
    }

    // 非游客用户直接购买
    proceedWithPurchase();
  };

  // 游客数据迁移到苹果账户
  const migrateGuestDataToApple = async (userData: any) => {
    try {
      console.log('🔄 开始迁移游客数据到苹果账户...');
      
      // 获取游客数据
      const guestData = await getGuestData();
      
      if (!guestData || Object.keys(guestData).length === 0) {
        console.log('ℹ️ 没有找到游客数据，跳过迁移');
        return;
      }
      
      console.log('📊 找到游客数据:', Object.keys(guestData));
      
      // 迁移学习记录
      if (guestData.learningRecords) {
        await AsyncStorage.setItem('learningRecords', JSON.stringify(guestData.learningRecords));
        console.log('✅ 学习记录迁移成功');
      }
      
      // 迁移词汇数据
      if (guestData.vocabulary) {
        await AsyncStorage.setItem('vocabulary', JSON.stringify(guestData.vocabulary));
        console.log('✅ 词汇数据迁移成功');
      }
      
      // 迁移剧单数据
      if (guestData.shows) {
        await AsyncStorage.setItem('user_shows', JSON.stringify(guestData.shows));
        console.log('✅ 剧单数据迁移成功');
      }
      
      // 迁移用户设置
      if (guestData.userSettings) {
        await AsyncStorage.setItem('userSettings', JSON.stringify(guestData.userSettings));
        console.log('✅ 用户设置迁移成功');
      }
      
      // 迁移学习统计
      if (guestData.userStats) {
        await AsyncStorage.setItem('userStats', JSON.stringify(guestData.userStats));
        console.log('✅ 学习统计迁移成功');
      }
      
      // 迁移错词数据
      if (guestData.wrongWords) {
        await AsyncStorage.setItem('wrongWords', JSON.stringify(guestData.wrongWords));
        console.log('✅ 错词数据迁移成功');
      }
      
      // 清除游客数据
      await clearGuestData();
      console.log('🧹 游客数据清除完成');
      
      console.log('🎉 游客数据迁移完成！');
      
    } catch (error) {
      console.error('❌ 游客数据迁移失败:', error);
      // 不显示错误提示，避免影响用户体验
    }
  };

  // 获取游客数据
  const getGuestData = async () => {
    try {
      const guestId = await AsyncStorage.getItem('guestId');
      if (!guestId) return null;
      
      const data: Record<string, any> = {};
      
      // 获取各种游客数据
      const keys = [
        'learningRecords',
        'vocabulary', 
        'user_shows',
        'userSettings',
        'userStats',
        'wrongWords',
        'searchHistory',
        'bookmarks'
      ];
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value && value !== 'null') {
            data[key] = JSON.parse(value);
          }
        } catch (error) {
          console.log(`获取${key}失败:`, error);
        }
      }
      
      return data;
    } catch (error) {
      console.error('获取游客数据失败:', error);
      return null;
    }
  };

  // 清除游客数据
  const clearGuestData = async () => {
    try {
      const keys = [
        'guestId',
        'learningRecords',
        'vocabulary', 
        'user_shows',
        'userSettings',
        'userStats',
        'wrongWords',
        'searchHistory',
        'bookmarks'
      ];
      
      for (const key of keys) {
        await AsyncStorage.removeItem(key);
      }
      
      console.log('游客数据清除完成');
    } catch (error) {
      console.error('清除游客数据失败:', error);
    }
  };

  // 处理苹果ID登录（直接在当前页面执行）
  const handleAppleLoginRedirect = async () => {
    try {
      setIsLoading(true);
      
      // 检查苹果登录是否可用
      const AppleAuthentication = require('expo-apple-authentication');
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          appLanguage === 'zh-CN' ? '提示' : 'Notice',
          appLanguage === 'zh-CN' ? '您的设备不支持苹果登录' : 'Apple Login is not available on your device'
        );
        return;
      }

      console.log('🍎 开始苹果登录流程...');
      
      // 执行苹果登录
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('🍎 苹果登录成功，获取到凭证:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        hasIdentityToken: !!credential.identityToken
      });

      if (!credential.identityToken) {
        throw new Error('未获取到身份令牌');
      }

      // 调用后端登录API
      const AppleService = require('../../services/appleService').AppleService;
      const loginData = {
        idToken: credential.identityToken,
        email: credential.email || undefined,
        fullName: credential.fullName ? {
          givenName: credential.fullName.givenName || undefined,
          familyName: credential.fullName.familyName || undefined,
        } : undefined,
      };
      const result = await AppleService.login(loginData);
      
      console.log('🍎 Apple登录API响应:', result);
      
      if (result.success && result.data) {
        console.log('🍎 Apple登录成功，获取到token:', result.data.token ? '有token' : '无token');
        
        // 保存用户信息到本地存储
        const userData = {
          id: result.data.user.id,
          nickname: result.data.user.nickname,
          email: result.data.user.email,
          avatar: result.data.user.avatar,
          loginType: 'apple',
          token: result.data.token,
        };
        
        console.log('🍎 准备保存的用户数据:', {
          id: userData.id,
          nickname: userData.nickname,
          loginType: userData.loginType,
          hasToken: !!userData.token
        });
        
        // 清除旧缓存和迁移游客数据
        const unifiedSyncService = require('../../services/unifiedSyncService').unifiedSyncService;
        await unifiedSyncService.clearSyncQueue();
        
        // 迁移游客数据到苹果账户
        await migrateGuestDataToApple(userData);
        
        // 更新认证状态
        const { useAuth } = require('../../context/AuthContext');
        // 这里需要通过其他方式更新认证状态，因为我们在组件内部
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        Alert.alert(
          appLanguage === 'zh-CN' ? '登录成功' : 'Login Success',
          appLanguage === 'zh-CN' 
            ? '您的游客数据已成功迁移到苹果账户！现在可以继续购买订阅。'
            : 'Your guest data has been successfully migrated to your Apple account! You can now proceed with the subscription.',
          [
            { 
              text: appLanguage === 'zh-CN' ? '继续购买' : 'Continue Purchase', 
              onPress: () => {
                // 登录成功后直接执行购买
                setTimeout(() => {
                  proceedWithPurchase();
                }, 500);
              }
            }
          ]
        );
      } else {
        throw new Error(result.message || '苹果登录失败');
      }
    } catch (error: any) {
      console.error('❌ 苹果登录失败:', error);
      
      if (error.code === 'ERR_CANCELED') {
        console.log('用户取消了苹果登录');
        return;
      }
      
      Alert.alert(
        appLanguage === 'zh-CN' ? '登录失败' : 'Login Failed', 
        error instanceof Error ? error.message : (appLanguage === 'zh-CN' ? '苹果登录失败，请重试' : 'Apple login failed, please try again')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 处理创建账户
  const handleCreateAccount = () => {
    Alert.alert(
      appLanguage === 'zh-CN' ? '创建账户' : 'Create Account',
      appLanguage === 'zh-CN' 
        ? '创建邮箱账户以获得更好的体验：\n\n• 数据云端同步\n• 跨设备访问\n• 完整功能支持\n\n是否前往创建账户？'
        : 'Create an email account for a better experience:\n\n• Cloud data sync\n• Cross-device access\n• Full feature support\n\nWould you like to create an account?',
      [
        { 
          text: appLanguage === 'zh-CN' ? '取消' : 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: appLanguage === 'zh-CN' ? '创建账户' : 'Create Account', 
          onPress: () => {
            // 导航回主页面，让用户通过邮箱登录按钮注册
            navigate('main', { tab: 'profile' });
            Alert.alert(
              appLanguage === 'zh-CN' ? '提示' : 'Notice',
              appLanguage === 'zh-CN' 
                ? '请点击"邮箱登录"按钮创建账户'
                : 'Please click "Email Login" button to create account'
            );
          }
        }
      ]
    );
  };

  // 执行购买流程
  const proceedWithPurchase = async () => {
    setIsLoading(true);
    try {
      const result = await subscriptionService.subscribeToPlan(selectedPlanFromTabs.id);
      
      if (result.success) {
        Alert.alert(
          t('subscription_success', appLanguage).split('！')[0] + '！',
          t('subscription_success', appLanguage),
          [
            { 
              text: t('ok', appLanguage), 
            onPress: () => navigate('main', { tab: 'profile' })
          }
        ]
      );
      } else {
        Alert.alert(
          t('subscription_failed', appLanguage).split('，')[0],
          result.error || t('subscription_failed', appLanguage),
          [{ text: t('retry', appLanguage), style: 'default' }]
        );
      }
    } catch (error) {
      Alert.alert(
        t('subscription_failed', appLanguage).split('，')[0],
        t('subscription_failed', appLanguage),
        [{ text: t('retry', appLanguage), style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 恢复购买
  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      const results = await subscriptionService.restorePurchases();
      
      if (results.some(r => r.success)) {
        Alert.alert(
          t('restore_success', appLanguage).split('，')[0],
          t('restore_success', appLanguage),
          [{ text: t('ok', appLanguage), style: 'default' }]
        );
      } else {
        Alert.alert(
          t('restore_failed', appLanguage).split('，')[0],
          t('no_purchases_found', appLanguage),
          [{ text: t('ok', appLanguage), style: 'default' }]
        );
      }
    } catch (error) {
      Alert.alert(
        t('restore_failed', appLanguage).split('，')[0],
        t('restore_failed', appLanguage),
        [{ text: t('retry', appLanguage), style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 顶部返回按钮 */}
      <TouchableOpacity style={styles.backBtnNew} onPress={() => navigate('main', { tab: 'profile' })} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={26} color="#222" />
      </TouchableOpacity>
      




      {/* 用户状态提示条 */}
      {subscriptionStatus && (
        <View style={styles.statusBanner}>
          {subscriptionStatus.isActive ? (
            <>
              <View style={styles.statusBannerTitleContainer}>
                <Ionicons name="diamond" size={18} color="#4CAF50" style={styles.statusBannerIcon} />
                <Text style={styles.statusBannerTitle}>{t('premium_user', appLanguage)}</Text>
              </View>
              <Text style={styles.statusBannerSubtitle}>
                {t('subscription_active', appLanguage, {
                  plan: subscriptionStatus.productId?.includes('monthly') ? t('monthly_plan', appLanguage) : 
                        subscriptionStatus.productId?.includes('yearly') ? t('yearly_plan', appLanguage) : 
                        t('lifetime_plan', appLanguage)
                })}
              </Text>
            </>
          ) : subscriptionStatus.isTrial ? (
            <>
              <View style={styles.statusBannerTitleContainer}>
                <Ionicons name="time" size={18} color="#FF9500" style={styles.statusBannerIcon} />
                <Text style={styles.statusBannerTitle}>{t('trial_user', appLanguage)}</Text>
              </View>
              <Text style={styles.statusBannerSubtitle}>
                {t('trial_countdown', appLanguage, {
                  days: Math.ceil((new Date(subscriptionStatus.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                })}, {t('enjoy_all_features', appLanguage)}
              </Text>
            </>
          ) : (
            <>
              <View style={styles.statusBannerTitleContainer}>
                <Ionicons name="phone-portrait" size={18} color="#666666" style={styles.statusBannerIcon} />
                <Text style={styles.statusBannerTitle}>{t('free_user', appLanguage)}</Text>
              </View>
              <Text style={styles.statusBannerSubtitle}>
                {t('trial_ended_limitations', appLanguage)}
              </Text>
            </>
          )}
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          const screenHeight = Dimensions.get('window').height;
          // 当滚动超过一定距离时显示底部CTA按钮
          setShowBottomCta(scrollY > 300);
        }}
        scrollEventThrottle={16}
      >

        {/* 计划切换器 - 胶囊分段控件 */}
        <View style={styles.planSwitcherContainer}>
          <View style={styles.planSwitcher}>
          {visibleTabs.map(tab => (
            <TouchableOpacity
                key={tab.id}
                style={[styles.planSwitcherItem, selectedTab === tab.id && styles.planSwitcherItemActive]}
                onPress={() => setSelectedTab(tab.id)}
              activeOpacity={0.85}
            >
                <Text style={[styles.planSwitcherText, selectedTab === tab.id && styles.planSwitcherTextActive]}>
                  {tab.name}
                </Text>
                {tab.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>{t('best_value', appLanguage)}</Text>
                  </View>
                )}
                {tab.id.includes('lifetime') && (
                  <View style={styles.lifetimeBadge}>
                    <Text style={styles.lifetimeBadgeText}>{t('one_time_payment_badge', appLanguage)}</Text>
                  </View>
                )}
            </TouchableOpacity>
          ))}
          </View>
        </View>

        {/* 价格卡片区 - 主推计划突出 */}
        <View style={styles.planDetailWrap}>
          <View style={styles.priceContainer}>
          <Text style={styles.planPrice}>{getLocalizedPrice(selectedPlanFromTabs.id)}</Text>
          {/* 首月优惠价格显示 */}
          {selectedPlanFromTabs.id === 'com.tannibunni.dramawordmobile.premium_monthly' && getLocalizedIntroPrice(selectedPlanFromTabs.id) && (
            <Text style={styles.introPriceText}>
              {appLanguage === 'zh-CN' ? 
                `首月${getLocalizedIntroPrice(selectedPlanFromTabs.id)}` : 
                `First month ${getLocalizedIntroPrice(selectedPlanFromTabs.id)}`}
            </Text>
          )}
          </View>
          
          {selectedPlanFromTabs.originalPrice && (
            <Text style={styles.planOriginalPrice}>{selectedPlanFromTabs.originalPrice}</Text>
          )}
          
          <Text style={styles.planDesc}>{selectedPlanFromTabs.description}</Text>
          
          {/* 主CTA按钮 */}
          <TouchableOpacity
            style={styles.mainCtaButton}
            onPress={handleSubscribe}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#3A8DFF', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.mainCtaButtonText}>
                {isLoading ? t('processing', appLanguage) : t('subscribe_button', appLanguage, {
                  price: getLocalizedPrice(selectedPlanFromTabs.id)
                })}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>



        {/* 权益对比表格 */}
        {renderFeatureTable(subscriptionStatus, appLanguage)}
        

        
        {/* 功能说明区域 */}
        <View style={styles.freeVersionInfo}>
          <Text style={styles.freeVersionTitle}>
            {subscriptionStatus?.isActive 
              ? t('premium_privileges', appLanguage)
              : subscriptionStatus?.isTrial 
                ? t('trial_description', appLanguage).split('，')[0]
                : t('free_description', appLanguage).split('，')[0]
            }
          </Text>
          <Text style={styles.freeVersionDesc}>
            {subscriptionStatus?.isActive 
              ? t('premium_feature_list', appLanguage)
              : subscriptionStatus?.isTrial 
                ? t('trial_description', appLanguage)
                : t('free_description', appLanguage)
            }
          </Text>
          <View style={styles.freeVersionFeatures}>
            {(subscriptionStatus?.isActive 
              ? t('premium_feature_list', appLanguage) 
              : subscriptionStatus?.isTrial 
                ? t('trial_feature_list', appLanguage)
                : t('free_feature_list', appLanguage)
            ).split('\n').map((feature, index) => (
              <Text key={index} style={styles.freeVersionFeature}>• {feature}</Text>
            ))}
          </View>
          <Text style={styles.freeVersionUpgrade}>
            {subscriptionStatus?.isActive
              ? t('subscription_thank_you', appLanguage)
              : subscriptionStatus?.isTrial
                ? t('trial_ending_warning', appLanguage)
                : t('upgrade_to_unlock', appLanguage)
            }
          </Text>
        </View>





        {/* 开发测试按钮 */}
        {__DEV__ && (
          <View style={styles.testSection}>
            <Text style={styles.testSectionTitle}>🧪 开发测试</Text>
            
            {/* 测试订阅状态 */}
            <TouchableOpacity 
              style={styles.testButton} 
                             onPress={async () => {
                 try {
                   const status = await subscriptionService.checkSubscriptionStatus();
                   Alert.alert('订阅状态', JSON.stringify(status, null, 2));
                 } catch (error) {
                   Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
                 }
               }}
            >
              <Text style={styles.testButtonText}>测试订阅状态</Text>
            </TouchableOpacity>
            
            {/* 测试功能权限 */}
            <TouchableOpacity 
              style={styles.testButton} 
                             onPress={() => {
                 try {
                   const permissions = subscriptionService.getFeaturePermissions();
                   Alert.alert('功能权限', JSON.stringify(permissions, null, 2));
                 } catch (error) {
                   Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
                 }
               }}
            >
              <Text style={styles.testButtonText}>测试功能权限</Text>
            </TouchableOpacity>
            
            {/* 测试语言权限 */}
            <TouchableOpacity 
              style={styles.testButton} 
                             onPress={() => {
                 try {
                   const languages = ['zh', 'en', 'ja', 'ko', 'es'];
                   const results = languages.map(lang => ({
                     language: lang,
                     canAccess: subscriptionService.canAccessLanguage(lang)
                   }));
                   Alert.alert('语言权限', JSON.stringify(results, null, 2));
                 } catch (error) {
                   Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
                 }
               }}
            >
              <Text style={styles.testButtonText}>测试语言权限</Text>
            </TouchableOpacity>
            
            {/* 测试模拟订阅 */}
            <TouchableOpacity 
              style={styles.testButton} 
                             onPress={async () => {
                 try {
                   const result = await subscriptionService.subscribeToPlan('com.tannibunni.dramawordmobile.premium_monthly');
                   Alert.alert('模拟订阅结果', JSON.stringify(result, null, 2));
                   
                   // 刷新状态
                   const newStatus = await subscriptionService.checkSubscriptionStatus();
                   setSubscriptionStatus(newStatus);
                 } catch (error) {
                   Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
                 }
               }}
            >
              <Text style={styles.testButtonText}>测试模拟订阅</Text>
            </TouchableOpacity>
            
            {/* 开始14天试用期 */}
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={async () => {
                try {
                  // 清除现有状态
                  await AsyncStorage.removeItem('subscription_status');
                  await AsyncStorage.removeItem('subscription_record');
                  
                  // 重新初始化，这会自动启动试用期
                  await subscriptionService.initialize();
                  
                  // 刷新状态
                  const newStatus = await subscriptionService.checkSubscriptionStatus();
                  setSubscriptionStatus(newStatus);
                  
                  Alert.alert('成功', '14天试用期已启动！');
                } catch (error) {
                  Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
                }
              }}
            >
              <Text style={styles.testButtonText}>开始14天试用期</Text>
            </TouchableOpacity>

            {/* 清除用户数据（保留经验和学习数据） */}
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={async () => {
                try {
                  Alert.alert(
                    '确认清除',
                    '这将删除：\n• 历史搜索数据\n• 剧单\n• 单词本\n• 已储存的单词\n\n但会保留：\n• 经验数据\n• 学习数据\n\n确定要继续吗？',
                    [
                      { text: '取消', style: 'cancel' },
                      { 
                        text: '确认清除', 
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            // 清除用户数据但保留经验和学习数据
                            const keysToRemove = [
                              'searchHistory',
                              'user_shows', 
                              'vocabulary',
                              'bookmarks',
                              'wrongWords'
                            ];
                            
                            for (const key of keysToRemove) {
                              await AsyncStorage.removeItem(key);
                            }
                            
                            Alert.alert('成功', '用户数据已清除（经验数据和学习数据已保留）');
                          } catch (error) {
                            Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
                          }
                        }
                      }
                    ]
                  );
                } catch (error) {
                  Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
                }
              }}
            >
              <Text style={styles.testButtonText}>清除用户数据（保留经验）</Text>
            </TouchableOpacity>

            {/* 完全清除所有数据（仅开发模式可见） */}
            {__DEV__ && (
              <TouchableOpacity 
                style={[styles.testButton, { backgroundColor: '#FF3B3011' }]} 
                onPress={async () => {
                  try {
                    Alert.alert(
                      '⚠️ 完全清除确认',
                      '这将删除该用户ID下的所有数据：\n• 历史搜索数据\n• 剧单\n• 单词本\n• 已储存的单词\n• 经验数据\n• 学习数据\n• 储存语言\n\n⚠️ 此操作不可逆！确定要继续吗？',
                      [
                        { text: '取消', style: 'cancel' },
                        { 
                          text: '完全清除', 
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              // 完全清除所有用户数据
                              const allKeys = [
                                'searchHistory',
                                'user_shows', 
                                'vocabulary',
                                'bookmarks',
                                'wrongWords',
                                'learningRecords',
                                'userStats',
                                'userSettings',
                                'appLanguage',
                                'guestId'
                              ];
                              
                              for (const key of allKeys) {
                                await AsyncStorage.removeItem(key);
                              }
                              
                              Alert.alert('成功', '所有用户数据已完全清除');
                            } catch (error) {
                              Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
                            }
                          }
                        }
                      ]
                    );
                  } catch (error) {
                    Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
                  }
                }}
              >
                <Text style={[styles.testButtonText, { color: '#FF3B30' }]}>完全清除所有数据</Text>
              </TouchableOpacity>
            )}

            {/* 清除订阅状态 */}
            <TouchableOpacity
              style={styles.testButton} 
              onPress={async () => {
                try {
                  await AsyncStorage.removeItem('subscription_status');
                  await AsyncStorage.removeItem('subscription_record');
                  
                  // 重新初始化服务以重置状态
                  await subscriptionService.initialize();
                  
                  // 刷新状态
                  const newStatus = await subscriptionService.checkSubscriptionStatus();
                  setSubscriptionStatus(newStatus);
                  
                  Alert.alert('成功', '订阅状态已清除，页面已刷新');
                } catch (error) {
                  Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
                }
              }}
            >
              <Text style={styles.testButtonText}>清除订阅状态</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
              {/* 底部吸底CTA按钮 - 只在主按钮滚动消失时显示 */}
        {showBottomCta && (
          <View style={styles.bottomCtaContainer}>
          <TouchableOpacity
              style={styles.bottomCtaButton}
              onPress={handleSubscribe}
              activeOpacity={0.8}
              disabled={isLoading || subscriptionStatus?.isActive}
            >
              <LinearGradient
                colors={['#3A8DFF', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bottomCtaGradient}
              >
                <Text style={styles.bottomCtaButtonText}>
                  {isLoading ? t('processing', appLanguage) : 
                   subscriptionStatus?.isActive ? t('subscribed', appLanguage) : 
                   t('subscribe_button', appLanguage, {
                     price: getLocalizedPrice(selectedPlanFromTabs.id)
                   })}
            </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {/* 恢复购买链接 */}
            <TouchableOpacity 
              style={styles.bottomRestoreLink}
              onPress={handleRestorePurchases}
              disabled={isLoading}
            >
              <Text style={styles.bottomRestoreLinkText}>{t('restore_purchases', appLanguage)}</Text>
          </TouchableOpacity>
        </View>
        )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F6FA' },
  backBtnNew: { position: 'absolute', top: 40, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#3A8DFF', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  statusBanner: {
    marginHorizontal: 18,
    marginTop: 60,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3A8DFF',
  },
  statusBannerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBannerIcon: {
    marginRight: 8,
  },
  statusBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
  },
  statusBannerSubtitle: {
    fontSize: 14,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 18,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusMainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 4,
  },
  statusSubText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  container: { flex: 1, backgroundColor: 'transparent' },
  statusSection: {
    marginHorizontal: 18,
    marginTop: 60,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#23223A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#23223A',
    marginBottom: 8,
  },
  statusDesc: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusExpiry: {
    fontSize: 14,
    color: '#3A8DFF',
    fontWeight: '600',
  },
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
  planSwitcherContainer: {
    marginHorizontal: 18,
    marginTop: 24,
    marginBottom: 32,
  },
  planSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planSwitcherItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  planSwitcherItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#3A8DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  planSwitcherText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  planSwitcherTextActive: {
    color: '#3A8DFF',
    fontWeight: '700',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B8860B',
  },
  lifetimeBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#3A8DFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: '#3A8DFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  lifetimeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planDetailWrap: {
    marginHorizontal: 18,
    marginTop: 0,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#23223A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  priceGradientContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#3A8DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  priceContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  coreBenefits: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  benefitItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginLeft: 8,
  },
  anchorPrice: {
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  anchorPriceText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
  },
  mainCtaButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3A8DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCtaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  valueProofSection: {
    marginHorizontal: 18,
    marginTop: 24,
    marginBottom: 20,
  },
  valueProofTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#23223A',
    textAlign: 'center',
    marginBottom: 20,
  },
  valueProofGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  valueProofCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  valueProofIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  valueProofText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    textAlign: 'center',
    lineHeight: 18,
  },
  guaranteeSection: {
    marginHorizontal: 18,
    marginTop: 24,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  guaranteeItem: {
    alignItems: 'center',
    flex: 1,
  },
  guaranteeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  bottomCtaContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomCtaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3A8DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  bottomCtaGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCtaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bottomRestoreLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomRestoreLinkText: {
    fontSize: 14,
    color: '#3A8DFF',
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  introPriceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    textAlign: 'center',
    marginTop: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  debugPanel: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: 'Courier',
  },
  debugRegion: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  planSave: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  planOriginalPrice: {
    color: '#B0BEC5',
    fontSize: 16,
    textDecorationLine: 'line-through',
    marginBottom: 8,
  },
  planDesc: {
    fontSize: 15,
    color: '#23223A',
    marginBottom: 18,
    textAlign: 'center',
  },
  planFeatures: {
    width: '100%',
    alignItems: 'flex-start',
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  trialInfoSection: {
    marginHorizontal: 18,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#23223A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  trialInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#23223A',
    marginBottom: 12,
    textAlign: 'center',
  },
  trialStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trialStatusText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
    marginLeft: 6,
  },
  trialExpiredText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
    textAlign: 'center',
  },
  freeVersionInfo: {
    marginHorizontal: 18,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#23223A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  freeVersionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#23223A',
    marginBottom: 12,
    textAlign: 'center',
  },
  freeVersionDesc: {
    fontSize: 15,
    color: '#23223A',
    marginBottom: 12,
    lineHeight: 22,
  },
  freeVersionFeatures: {
    marginBottom: 16,
  },
  freeVersionFeature: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  freeVersionUpgrade: {
    fontSize: 14,
    color: '#3A8DFF',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 18,
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  restoreButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  ctaFixedWrapNew: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', paddingBottom: 24, alignItems: 'center' },
  ctaWrapNew: { width: '90%' },
  ctaBtnNew: { 
    borderRadius: 30, 
    paddingVertical: 18, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#FF9800', 
    shadowOpacity: 0.18, 
    shadowRadius: 12, 
    elevation: 3,
    backgroundColor: '#3A8DFF'
  },
  ctaBtnSubscribed: {
    backgroundColor: '#43C463',
  },
  ctaTextNew: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'System' },
  testSection: {
    marginHorizontal: 18,
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#23223A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  testSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#23223A',
    marginBottom: 12,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#3A8DFF11',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3A8DFF',
  },
});

export default SubscriptionScreen; 