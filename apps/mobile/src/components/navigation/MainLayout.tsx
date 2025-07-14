import React, { useState } from 'react';
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

interface MainLayoutProps {
  initialTab?: TabType;
}

const MainContent: React.FC<MainLayoutProps> = ({ initialTab = 'search' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const { currentScreen, params, navigate } = useNavigation();

  const renderCurrentPage = () => {
    switch (currentScreen) {
      case 'main':
        return (
          <>
            <View style={styles.content}>
              {renderMainContent(activeTab)}
            </View>
            <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
          </>
        );
      case 'login':
        return <LoginScreen onLoginSuccess={handleLoginSuccess} onGuestLogin={handleGuestLogin} />;
      case 'wordCard':
        // TODO: 实现单词卡片页面
        return <HomeScreen />;
      case 'Subscription':
        return <SubscriptionScreen />;
      case 'ReviewScreen':
        return <ReviewScreen {...params} />;
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
        return <HomeScreen />;
      case 'vocabulary':
        return <VocabularyScreen />;
      case 'review':
        return <ReviewIntroScreen />;
      case 'shows':
        return <ShowsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const handleLoginSuccess = (userData: any) => {
    // 登录成功后返回主页面
    navigate('main');
    console.log('登录成功:', userData);
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