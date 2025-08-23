import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { BottomTabBar, TabType } from './BottomTabBar';
import { HomeScreen } from '../../screens/Home/HomeScreen';
import VocabularyScreen from '../../screens/Vocabulary/VocabularyScreen';
import ReviewScreen from '../../screens/Review/ReviewScreen';
import ReviewIntroScreen from '../../screens/Review/ReviewIntroScreen';
import ShowsScreen from '../../screens/Shows/ShowsScreen';
import { ProfileScreen } from '../../screens/Profile/ProfileScreen';
import { LoginScreen } from '../../screens/Auth/LoginScreen';
import SubscriptionScreen from '../../screens/Profile/SubscriptionScreen';
import { BadgeWallScreen } from '../../features/badges';
import ShowWordPreviewScreen from '../../screens/Shows/ShowWordPreviewScreen';
import { colors } from '../../constants/colors';
import { useNavigation } from './NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useVocabulary } from '../../context/VocabularyContext';
import { useShowList } from '../../context/ShowListContext';

interface MainLayoutProps {
  initialTab?: TabType;
}

const MainContent: React.FC<MainLayoutProps> = ({ initialTab = 'search' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isContextsReady, setIsContextsReady] = useState(false);
  const { currentScreen, params, navigate, isReady: isNavigationReady } = useNavigation();
  const { login } = useAuth();
  const vocabularyContext = useVocabulary();
  const showListContext = useShowList();

  // 检查所有上下文是否准备就绪
  useEffect(() => {
    if (isNavigationReady && vocabularyContext && showListContext) {
      // 延迟一点时间确保其他上下文也完全初始化
      const timer = setTimeout(() => {
        setIsContextsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isNavigationReady, vocabularyContext, showListContext]);

  // 监听 params.tab，自动切换 tab
  useEffect(() => {
    if (currentScreen === 'main' && params.tab && params.tab !== activeTab) {
      console.log('🔄 MainLayout - 自动切换tab:', { from: activeTab, to: params.tab });
      setActiveTab(params.tab);
    }
  }, [params.tab, currentScreen]);

  const renderCurrentPage = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLoginSuccess={handleLoginSuccess} onGuestLogin={handleGuestLogin} />;
      case 'wordCard':
        // TODO: 实现单词卡片页面
        return <HomeScreen />;
      case 'Subscription':
        return <SubscriptionScreen />;
      case 'ReviewScreen':
        return <ReviewScreen {...params} />;
      case 'badgeWall':
        return <BadgeWallScreen />;
      case 'showWordPreview':
        return <ShowWordPreviewScreen route={{ params }} />;
      case 'main':
      default:
        return (
          <>
            <View style={styles.content}>
              {renderMainContent(activeTab)}
            </View>
            <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
          </>
        );
    }
  };

  const renderMainContent = (tab: TabType) => {
    // 如果上下文还没准备好，显示加载状态
    if (!isContextsReady) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      );
    }

    switch (tab) {
      case 'search':
        return <HomeScreen navigation={{ navigate }} />;
      case 'vocabulary':
        return <VocabularyScreen />;
      case 'review':
        return <ReviewIntroScreen />;
      case 'shows':
        return <ShowsScreen />;
      case 'profile':
        return <ProfileScreen openLanguageSettings={params.openLanguageSettings} />;
      default:
        return <HomeScreen />;
    }
  };

  const handleLoginSuccess = async (userData: any) => {
    try {
      // 调用AuthContext的login方法更新认证状态
      await login(userData, userData.loginType);
      console.log('✅ AuthContext登录状态已更新');
      
      // 检查是否需要跳转到购买页面
      if (userData.redirectToPurchase) {
        console.log('🔄 用户从游客升级，跳转到订阅页面');
        navigate('Subscription');
      } else {
        // 正常登录成功后返回主页面
        navigate('main');
      }
      
      console.log('登录成功:', userData);
    } catch (error) {
      console.error('❌ 登录状态更新失败:', error);
      // 即使状态更新失败，也返回主页面
      navigate('main');
    }
  };

  const handleGuestLogin = () => {
    // 游客登录后返回主页面
    navigate('main');
    console.log('游客登录');
  };

  return (
    <View style={styles.container}>
        {renderCurrentPage()}
    </View>
  );
};

const MainLayout: React.FC<MainLayoutProps> = (props) => {
  return <MainContent {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.primary,
  },
});

export default MainLayout; 