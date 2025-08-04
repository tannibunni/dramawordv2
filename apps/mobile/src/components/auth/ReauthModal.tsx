import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';
import { colors } from '../../constants/colors';

interface ReauthModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  reason?: string;
}

export const ReauthModal: React.FC<ReauthModalProps> = ({
  visible,
  onClose,
  onLoginSuccess,
  reason = '登录已过期，请重新登录'
}) => {
  const [loading, setLoading] = useState(false);
  const { appLanguage } = useAppLanguage();
  const { login } = useAuth();

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      
      // 生成游客ID
      const guestId = `guest_${Date.now()}`;
      const username = `t_guest_${Date.now()}`.slice(0, 20);
      
      // 调用后端注册API
      const response = await fetch('https://dramawordv2.onrender.com/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginType: 'guest',
          username,
          nickname: guestId,
          guestId: guestId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`注册失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // 保存用户信息到本地存储
        const userData = {
          id: result.data.user.id,
          nickname: result.data.user.nickname,
          avatar: result.data.user.avatar,
          loginType: 'guest',
          token: result.data.token,
        };

        // 使用AuthContext的login方法
        await login(userData, 'guest');
        
        onLoginSuccess();
        onClose();
      } else {
        throw new Error(result.message || '注册失败');
      }
    } catch (error) {
      console.error('❌ 游客登录失败:', error);
      Alert.alert(
        t('login_failed', appLanguage),
        error instanceof Error ? error.message : '未知错误'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWechatLogin = () => {
    Alert.alert(
      t('coming_soon', appLanguage),
      t('wechat_login_coming_soon', appLanguage)
    );
  };

  const handleAppleLogin = () => {
    Alert.alert(
      t('coming_soon', appLanguage),
      t('apple_login_coming_soon', appLanguage)
    );
  };

  const handlePhoneLogin = () => {
    Alert.alert(
      t('coming_soon', appLanguage),
      t('phone_login_coming_soon', appLanguage)
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Ionicons name="warning" size={24} color={colors.warning} />
            <Text style={styles.title}>{t('reauth_required', appLanguage)}</Text>
          </View>
          
          <Text style={styles.message}>
            {reason}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.guestButton]}
              onPress={handleGuestLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="person" size={20} color={colors.white} />
                  <Text style={styles.buttonText}>{t('guest_login', appLanguage)}</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.wechatButton]}
              onPress={handleWechatLogin}
              disabled={loading}
            >
              <Ionicons name="logo-wechat" size={20} color={colors.white} />
              <Text style={styles.buttonText}>{t('wechat_login', appLanguage)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.appleButton]}
              onPress={handleAppleLogin}
              disabled={loading}
            >
              <Ionicons name="logo-apple" size={20} color={colors.white} />
              <Text style={styles.buttonText}>{t('apple_login', appLanguage)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.phoneButton]}
              onPress={handlePhoneLogin}
              disabled={loading}
            >
              <Ionicons name="call" size={20} color={colors.white} />
              <Text style={styles.buttonText}>{t('phone_login', appLanguage)}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{t('cancel', appLanguage)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: colors.text,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  guestButton: {
    backgroundColor: colors.primary,
  },
  wechatButton: {
    backgroundColor: '#07C160',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  phoneButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
}); 