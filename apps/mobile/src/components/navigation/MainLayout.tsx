import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBar, TabType } from './BottomTabBar';
import { HomeScreen } from '../../screens/Home/HomeScreen';
import VocabularyScreen from '../../screens/Vocabulary/VocabularyScreen';
import ReviewScreen from '../../screens/Review/ReviewScreen';
import ShowsScreen from '../../screens/Shows/ShowsScreen';
import { ProfileScreen } from '../../screens/Profile/ProfileScreen';
import { LoginScreen } from '../../screens/Auth/LoginScreen';
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
        return <ReviewScreen />;
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