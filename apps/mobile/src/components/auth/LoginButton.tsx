import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type LoginButtonType = 'phone' | 'wechat' | 'apple' | 'guest';

interface LoginButtonProps {
  type: LoginButtonType;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const getButtonConfig = (type: LoginButtonType) => {
  switch (type) {
    case 'phone':
      return {
        backgroundColor: '#4F6DFF',
        textColor: '#FFFFFF',
        icon: 'call-outline' as const,
        text: '使用手机号登录',
      };
    case 'wechat':
      return {
        backgroundColor: '#6BCF7A',
        textColor: '#FFFFFF',
        icon: 'chatbubble-outline' as const,
        text: '使用微信登录',
      };
    case 'apple':
      return {
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        icon: 'logo-apple' as const,
        text: '使用 Apple 登录',
      };
    case 'guest':
      return {
        backgroundColor: '#F4B942',
        textColor: '#FFFFFF',
        icon: 'eye-outline' as const,
        text: '游客模式立即体验',
      };
    default:
      return {
        backgroundColor: '#4F6DFF',
        textColor: '#FFFFFF',
        icon: 'call-outline' as const,
        text: '登录',
      };
  }
};

export const LoginButton: React.FC<LoginButtonProps> = ({
  type,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const config = getButtonConfig(type);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: config.backgroundColor,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={config.textColor} size="small" />
      ) : (
        <>
          <Ionicons
            name={config.icon}
            size={20}
            color={config.textColor}
            style={styles.icon}
          />
          <Text
            style={[
              styles.text,
              {
                color: config.textColor,
              },
              textStyle,
            ]}
          >
            {config.text}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 8,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.025,
  },
}); 