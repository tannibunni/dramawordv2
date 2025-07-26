import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBar, TabType } from './BottomTabBar';
import { HomeScreen } from '../../screens/Home/HomeScreen';
import VocabularyScreen from '../../screens/Vocabulary/VocabularyScreen';
import ReviewScreen from '../../screens/Review/ReviewScreen';
import ReviewIntroScreen from '../../screens/Review/ReviewIntroScreen';
import ShowsScreen from '../../screens/Shows/ShowsScreen';
import { ProfileScreen } from '../../screens/Profile/ProfileScreen';
import { LoginScreen } from '../../screens/Auth/LoginScreen';
import SubscriptionScreen from '../../screens/Profile/SubscriptionScreen';
import { colors } from '../../constants/colors';
import { NavigationProvider, useNavigation } from './NavigationContext';
import { useAuth } from '../../context/AuthContext';

interface MainLayoutProps {
  initialTab?: TabType;
}

const MainContent: React.FC<MainLayoutProps> = ({ initialTab = 'search' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const { currentScreen, params, navigate } = useNavigation();
  const { login } = useAuth();

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
      
      // 登录成功后返回主页面
      navigate('main');
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
  return (
    <NavigationProvider>
      <MainContent {...props} />
    </NavigationProvider>
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
});

export default MainLayout; 