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
    key: 'search',
    titleKey: 'home',
    icon: 'search-outline',
    iconActive: 'search',
  },
  {
    key: 'vocabulary',
    titleKey: 'vocabulary',
    icon: 'library-outline',
    iconActive: 'library',
  },
  {
    key: 'review',
    titleKey: 'review',
    icon: 'refresh-outline',
    iconActive: 'refresh',
  },
  {
    key: 'shows',
    titleKey: 'shows',
    icon: 'film-outline',
    iconActive: 'film',
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
        {TAB_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tabItem}
              onPress={() => onTabPress(item.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? item.iconActive : item.icon}
                size={24}
                color={isActive ? colors.primary[500] : colors.neutral[500]}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.primary[500] : colors.neutral[500] },
                ]}
              >
                {t(item.titleKey as any, appLanguage)}
              </Text>
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
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  icon: {
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 