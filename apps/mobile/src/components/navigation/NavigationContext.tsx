import React, { createContext, useContext, useState, ReactNode } from 'react';

// 页面类型定义
export type ScreenType = 'main' | 'wordCard' | 'login' | 'Subscription' | 'ReviewScreen';

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
  const [screenHistory, setScreenHistory] = useState<Array<{ screen: ScreenType; params: NavigationParams }>>([
    { screen: 'main', params: {} }
  ]);

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
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

// 使用导航的Hook
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}; 