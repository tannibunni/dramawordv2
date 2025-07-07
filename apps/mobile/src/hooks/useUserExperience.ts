import { useState, useCallback, useRef, useEffect } from 'react';
import { Animated, InteractionManager } from 'react-native';

export interface UXState {
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  initializing: boolean;
  progress: number;
}

export interface UXActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRefreshing: (refreshing: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  setProgress: (progress: number) => void;
  reset: () => void;
  retry: () => void;
}

export interface UXCallbacks {
  onRetry?: () => void;
  onRefresh?: () => void;
  onError?: (error: string) => void;
}

export const useUserExperience = (callbacks?: UXCallbacks) => {
  const [state, setState] = useState<UXState>({
    loading: false,
    error: null,
    refreshing: false,
    initializing: true,
    progress: 0,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
    
    if (loading) {
      // 开始加载动画
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 结束加载动画
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, scaleAnim]);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
    if (error && callbacks?.onError) {
      callbacks.onError(error);
    }
  }, [callbacks]);

  const setRefreshing = useCallback((refreshing: boolean) => {
    setState(prev => ({ ...prev, refreshing }));
  }, []);

  const setInitializing = useCallback((initializing: boolean) => {
    setState(prev => ({ ...prev, initializing }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress: Math.max(0, Math.min(100, progress)) }));
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      refreshing: false,
      initializing: false,
      progress: 0,
    });
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
  }, [fadeAnim, scaleAnim]);

  const retry = useCallback(() => {
    setState(prev => ({ ...prev, error: null, loading: true }));
    if (callbacks?.onRetry) {
      InteractionManager.runAfterInteractions(() => {
        callbacks.onRetry!();
      });
    }
  }, [callbacks]);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, refreshing: true, error: null }));
    if (callbacks?.onRefresh) {
      InteractionManager.runAfterInteractions(() => {
        callbacks.onRefresh!();
      });
    }
  }, [callbacks]);

  const actions: UXActions = {
    setLoading,
    setError,
    setRefreshing,
    setInitializing,
    setProgress,
    reset,
    retry,
  };

  return {
    state,
    actions,
    refresh,
    animations: {
      fadeAnim,
      scaleAnim,
    },
  };
};

// 防抖Hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 节流Hook
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;
};

// 网络状态Hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    // 这里可以集成实际的网络状态检测
    // 目前使用模拟数据
    const checkNetworkStatus = () => {
      // 模拟网络状态检查
      setIsOnline(Math.random() > 0.1); // 90% 概率在线
      setConnectionType(['wifi', '4g', '3g'][Math.floor(Math.random() * 3)]);
    };

    checkNetworkStatus();
    const interval = setInterval(checkNetworkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return { isOnline, connectionType };
};

// 性能监控Hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    frameRate: 60,
  });

  const startTime = useRef<number>(0);

  const startMeasure = useCallback(() => {
    startTime.current = Date.now();
  }, []);

  const endMeasure = useCallback(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTime.current;
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
    }));
  }, []);

  const measureAsync = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    startMeasure();
    try {
      const result = await asyncFn();
      return result;
    } finally {
      endMeasure();
    }
  }, [startMeasure, endMeasure]);

  return {
    metrics,
    startMeasure,
    endMeasure,
    measureAsync,
  };
};

// 手势反馈Hook
export const useGestureFeedback = () => {
  const hapticFeedback = useCallback(() => {
    // 这里可以集成实际的触觉反馈
    // 目前使用模拟实现
    console.log('Haptic feedback triggered');
  }, []);

  const visualFeedback = useCallback(() => {
    // 这里可以触发视觉反馈动画
    console.log('Visual feedback triggered');
  }, []);

  return {
    hapticFeedback,
    visualFeedback,
  };
};

// 错误边界Hook
export const useErrorBoundary = () => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    setHasError(true);
    setError(error);
    
    // 这里可以集成错误上报服务
    console.error('Error caught by boundary:', error);
  }, []);

  const resetError = useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  return {
    hasError,
    error,
    handleError,
    resetError,
  };
};

// 缓存管理Hook
export const useCacheManager = () => {
  const [cacheSize, setCacheSize] = useState(0);
  const [cacheHitRate, setCacheHitRate] = useState(0);

  const clearCache = useCallback(() => {
    // 这里可以集成实际的缓存清理逻辑
    setCacheSize(0);
    setCacheHitRate(0);
    console.log('Cache cleared');
  }, []);

  const optimizeCache = useCallback(() => {
    // 这里可以集成缓存优化逻辑
    console.log('Cache optimized');
  }, []);

  return {
    cacheSize,
    cacheHitRate,
    clearCache,
    optimizeCache,
  };
};

export default {
  useUserExperience,
  useDebounce,
  useThrottle,
  useNetworkStatus,
  usePerformanceMonitor,
  useGestureFeedback,
  useErrorBoundary,
  useCacheManager,
}; 