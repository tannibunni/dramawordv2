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

export type LoginButtonType = 'phone' | 'wechat' | 'apple' | 'guest';

interface LoginButtonProps {
  type: LoginButtonType;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const LoginButton: React.FC<LoginButtonProps> = ({
  type,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const { appLanguage } = useAppLanguage();
  
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