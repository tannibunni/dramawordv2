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
import { colors } from '../../constants/colors';
import { t } from '../../constants/translations';
import { useAppLanguage } from '../../context/AppLanguageContext';

export type LoginButtonType = 'phone' | 'wechat' | 'apple' | 'guest' | 'email';

interface LoginButtonProps {
  type: LoginButtonType;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  customText?: string;
}

export const LoginButton: React.FC<LoginButtonProps> = ({
  type,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  customText,
}) => {
  const { appLanguage } = useAppLanguage();
  
  // 添加登录按钮的初始化日志
  React.useEffect(() => {
    console.log(`[LoginButton] ${type} 按钮组件初始化`);
    console.log(`[LoginButton] 按钮配置:`, {
      type,
      loading,
      disabled,
      appLanguage
    });
  }, [type, loading, disabled, appLanguage]);
  
  const getButtonConfig = (type: LoginButtonType) => {
    switch (type) {
      case 'phone':
        return {
          backgroundColor: colors.primary[500],
          textColor: colors.text.inverse,
          icon: 'call-outline' as const,
          text: t('phone_login', appLanguage),
        };
      case 'wechat':
        return {
          backgroundColor: colors.success[500],
          textColor: colors.text.inverse,
          icon: 'chatbubble-outline' as const,
          text: t('wechat_login', appLanguage),
        };
      case 'apple':
        return {
          backgroundColor: colors.neutral[900],
          textColor: colors.text.inverse,
          icon: 'logo-apple' as const,
          text: t('apple_login', appLanguage),
        };
      case 'guest':
        return {
          backgroundColor: colors.accent[500],
          textColor: colors.text.inverse,
          icon: 'eye-outline' as const,
          text: t('guest_mode_experience', appLanguage),
        };
      case 'email':
        return {
          backgroundColor: colors.primary[600],
          textColor: colors.text.inverse,
          icon: 'mail-outline' as const,
          text: t('email_login', appLanguage),
        };
      default:
        return {
          backgroundColor: colors.primary[500],
          textColor: colors.text.inverse,
          icon: 'call-outline' as const,
          text: t('phone_login', appLanguage),
        };
    }
  };

  const config = getButtonConfig(type);
  const displayText = customText || config.text;

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
      onPress={() => {
        if (type === 'wechat') {
          console.log('💬 微信登录按钮被点击');
          console.log('💬 按钮状态:', {
            loading,
            disabled,
            timestamp: new Date().toISOString()
          });
        }
        onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={config.textColor} size="small" />
      ) : (
        <>
          <Ionicons
            name={config.icon}
            size={18}
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
            {displayText}
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 6,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.02,
  },
}); 