import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';

export type TabType = 'search' | 'vocabulary' | 'review' | 'shows' | 'profile';

interface TabItem {
  key: TabType;
  titleKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

interface BottomTabBarProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}

const TAB_ITEMS: TabItem[] = [
  {
    key: 'shows',
    titleKey: 'shows',
    icon: 'film-outline',
    iconActive: 'film',
  },
  {
    key: 'vocabulary',
    titleKey: 'vocabulary',
    icon: 'book-outline',
    iconActive: 'book',
  },
  {
    key: 'search',
    titleKey: 'search',
    icon: 'search-outline',
    iconActive: 'search',
  },
  {
    key: 'review',
    titleKey: 'review',
    icon: 'refresh-outline',
    iconActive: 'refresh',
  },
  {
    key: 'profile',
    titleKey: 'profile',
    icon: 'person-outline',
    iconActive: 'person',
  },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  const { appLanguage } = useAppLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {TAB_ITEMS.map((item, index) => {
          const isActive = activeTab === item.key;
          const isSearchTab = item.key === 'search';
          
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.tabItem,
                isSearchTab && styles.searchTabItem
              ]}
              onPress={() => {
                console.log('🔄 BottomTabBar - 点击tab:', item.key, '当前activeTab:', activeTab);
                onTabPress(item.key);
              }}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                isSearchTab && styles.searchIconContainer,
                isActive && isSearchTab && styles.searchIconContainerActive
              ]}>
                {isSearchTab ? (
                  <View style={[
                    styles.searchInnerContainer,
                    isActive && styles.searchInnerContainerActive
                  ]}>
                    <Ionicons
                      name={isActive ? item.iconActive : item.icon}
                      size={isSearchTab ? 40 : 24}
                      color={isSearchTab ? colors.text.inverse : (isActive ? colors.primary[500] : colors.neutral[500])}
                      style={styles.icon}
                    />
                  </View>
                ) : (
                  <Ionicons
                    name={isActive ? item.iconActive : item.icon}
                    size={isSearchTab ? 32 : 24}
                    color={isSearchTab ? colors.text.inverse : (isActive ? colors.primary[500] : colors.neutral[500])}
                    style={styles.icon}
                  />
                )}
              </View>
              {!isSearchTab && (
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? colors.primary[500] : colors.neutral[500] },
                  ]}
                >
                  {t(item.titleKey as any, appLanguage)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 26,
    marginHorizontal: 16,
    marginBottom: 12, // 减少距离屏幕底部的距离，从16改为8
    paddingBottom: Platform.OS === 'ios' ? 12 : 6,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  searchTabItem: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20, // 浮出底部导航栏
  },
  searchIconContainer: {
    width: 80, // 64 + 4*2 = 72px to accommodate 4px stroke on each side
    height: 80,
    borderRadius: 50,
    backgroundColor: '#ffffff', // Match tab bar background exactly
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6, // 4px padding to create the stroke effect
  },
  searchIconContainerActive: {
    backgroundColor: '#ffffff', // Keep white stroke even when active
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 0,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  searchInnerContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInnerContainerActive: {
    backgroundColor: colors.primary[600],
  },
}); 