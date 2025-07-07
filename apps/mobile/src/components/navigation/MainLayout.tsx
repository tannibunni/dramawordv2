import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBar, TabType } from './BottomTabBar';
import HomeScreen from '../../screens/Home/HomeScreen';
import VocabularyScreen from '../../screens/Vocabulary/VocabularyScreen';
import ReviewScreen from '../../screens/Review/ReviewScreen';
import ShowsScreen from '../../screens/Shows/ShowsScreen';
import { ProfileScreen } from '../../screens/Profile/ProfileScreen';

interface MainLayoutProps {
  initialTab?: TabType;
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialTab = 'search' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const renderCurrentPage = () => {
    switch (activeTab) {
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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderCurrentPage()}
      </View>
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  content: {
    flex: 1,
  },
});

export default MainLayout; 