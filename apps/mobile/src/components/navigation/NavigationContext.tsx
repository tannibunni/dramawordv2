import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 页面类型定义
export type ScreenType = 'main' | 'wordCard' | 'login' | 'Subscription' | 'ReviewScreen' | 'badgeWall';

// 导航参数
export interface NavigationParams {
  [key: string]: any;
}

// 导航上下文类型
interface NavigationContextType {
  currentScreen: ScreenType;
  params: NavigationParams;
  navigate: (screen: ScreenType, params?: NavigationParams) => void;
  goBack: () => void;
  isReady: boolean; // 添加就绪状态
}

// 创建上下文
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// 导航提供者组件
interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('main');
  const [params, setParams] = useState<NavigationParams>({});
  const [isReady, setIsReady] = useState(false);
  const [screenHistory, setScreenHistory] = useState<Array<{ screen: ScreenType; params: NavigationParams }>>([
    { screen: 'main', params: {} }
  ]);

  // 设置导航上下文为就绪状态
  useEffect(() => {
    setIsReady(true);
  }, []);

  const navigate = (screen: ScreenType, newParams: NavigationParams = {}) => {
    setScreenHistory(prev => [...prev, { screen, params: newParams }]);
    setCurrentScreen(screen);
    setParams(newParams);
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const newHistory = screenHistory.slice(0, -1);
      const previousScreen = newHistory[newHistory.length - 1];
      setScreenHistory(newHistory);
      setCurrentScreen(previousScreen.screen);
      setParams(previousScreen.params);
    }
  };

  return (
    <NavigationContext.Provider value={{
      currentScreen,
      params,
      navigate,
      goBack,
      isReady,
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

// 使用导航的Hook
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    // 返回一个安全的默认值，避免在初始化阶段崩溃
    console.warn('useNavigation: Navigation context not available, returning safe defaults');
    return {
      currentScreen: 'main' as ScreenType,
      params: {},
      navigate: (screen: ScreenType, params?: NavigationParams) => {
        console.warn('useNavigation: Navigation not available, cannot navigate to:', screen);
      },
      goBack: () => {
        console.warn('useNavigation: Navigation not available, cannot go back');
      },
      isReady: false
    };
  }
  return context;
}; 