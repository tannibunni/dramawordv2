import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = colors.primary[500],
  text,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();

    return () => spinAnimation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
        <Ionicons name="refresh" size={size === 'large' ? 32 : 24} color={color} />
      </Animated.View>
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface LoadingCardProps {
  title?: string;
  subtitle?: string;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = '加载中...',
  subtitle,
  showProgress = false,
  progress = 0,
}) => {
  return (
    <View style={styles.card}>
      <LoadingSpinner size="large" text={title} />
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );
};

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-text',
  title,
  subtitle,
  actionText,
  onAction,
}) => {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name={icon} size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {actionText && onAction && (
        <Text style={styles.actionText} onPress={onAction}>
          {actionText}
        </Text>
      )}
    </View>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  retryText?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = '出错了',
  message = '加载失败，请稍后重试',
  retryText = '重试',
  onRetry,
}) => {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={64} color={colors.error[500]} />
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry && (
        <Text style={styles.retryText} onPress={onRetry}>
          {retryText}
        </Text>
      )}
    </View>
  );
};

interface PullToRefreshIndicatorProps {
  refreshing: boolean;
  progress: number;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  refreshing,
  progress,
}) => {
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      const spinAnimation = Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    } else {
      rotateValue.setValue(0);
    }
  }, [refreshing, rotateValue]);

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.pullToRefreshContainer}>
      <Animated.View style={[styles.pullToRefreshIcon, { transform: [{ rotate: spin }] }]}>
        <Ionicons 
          name={refreshing ? "refresh" : "arrow-down"} 
          size={24} 
          color={colors.primary[500]} 
        />
      </Animated.View>
      <Text style={styles.pullToRefreshText}>
        {refreshing ? '刷新中...' : '下拉刷新'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  spinner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  skeleton: {
    backgroundColor: colors.background.tertiary,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 16,
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryText: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '600',
  },
  pullToRefreshContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  pullToRefreshIcon: {
    marginRight: 8,
  },
  pullToRefreshText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default {
  LoadingSpinner,
  SkeletonLoader,
  LoadingCard,
  EmptyState,
  ErrorState,
  PullToRefreshIndicator,
}; 