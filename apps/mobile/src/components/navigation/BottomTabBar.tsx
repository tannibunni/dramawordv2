import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
    icon: 'search', // 使用实心搜索图标，更苹果风格
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
                    <MaterialIcons
                      name="search"
                      size={isSearchTab ? 36 : 24}
                      color={isActive ? colors.primary[500] : colors.neutral[500]}
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
    borderRadius: 28, // 增加圆角，更现代
    marginHorizontal: 20, // 增加左右边距
    marginBottom: 16, // 增加底部边距
    paddingBottom: Platform.OS === 'ios' ? 16 : 8, // 增加内边距
    paddingTop: 8, // 增加顶部内边距
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // 增加阴影偏移
    shadowOpacity: 0.08, // 增加阴影透明度
    shadowRadius: 12, // 增加阴影半径
    elevation: 8, // 增加Android阴影
    borderWidth: 0.5, // 添加细边框
    borderColor: 'rgba(0, 0, 0, 0.05)', // 淡色边框
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
    width: 72, // 减小尺寸，更协调
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff', // 纯白色背景
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIconContainerActive: {
    backgroundColor: '#ffffff', // 激活时保持白色
    transform: [{ scale: 1.05 }], // 轻微放大效果
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
    backgroundColor: 'transparent', // 透明背景
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInnerContainerActive: {
    backgroundColor: 'transparent', // 激活时也保持透明
  },
}); 