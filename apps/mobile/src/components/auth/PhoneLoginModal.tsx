import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoginButton } from './LoginButton';
import { colors } from '../../constants/colors';
import { t } from '../../constants/translations';
import { useAppLanguage } from '../../context/AppLanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/config';

interface PhoneLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess: (phone: string) => void;
}

export const PhoneLoginModal: React.FC<PhoneLoginModalProps> = ({
  visible,
  onClose,
  onLoginSuccess,
}) => {
  const { appLanguage } = useAppLanguage();
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      Alert.alert(t('tip', appLanguage), t('invalid_phone_number', appLanguage));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '发送验证码失败');
      }
      
      setCountdown(60);
      setStep('code');
      Alert.alert(t('tip', appLanguage), t('code_sent', appLanguage));
    } catch (error) {
      console.error('发送验证码失败:', error);
      Alert.alert(t('error', appLanguage), t('code_send_failed', appLanguage));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert(t('tip', appLanguage), t('invalid_verification_code', appLanguage));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/phone-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber: phone, 
          code: verificationCode 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '登录失败');
      }

      if (data.success && data.data) {
        // 保存用户信息到本地存储
        await AsyncStorage.setItem('userToken', data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
      
      onLoginSuccess(phone);
      onClose();
      } else {
        throw new Error('登录响应格式错误');
      }
    } catch (error) {
      console.error('手机号登录失败:', error);
      Alert.alert(t('error', appLanguage), t('verification_failed', appLanguage));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhone('');
    setVerificationCode('');
    setStep('phone');
    setCountdown(0);
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {step === 'phone' ? t('phone_login', appLanguage) : t('enter_verification_code', appLanguage)}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {step === 'phone' ? (
            <View style={styles.phoneStep}>
              <Text style={styles.label}>{appLanguage === 'zh-CN' ? '手机号' : 'Phone Number'}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder={t('enter_phone_number', appLanguage)}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                  autoFocus
                />
              </View>
              <LoginButton
                type="phone"
                onPress={handleSendCode}
                loading={loading}
                disabled={!phone || phone.length !== 11}
                style={styles.sendButton}
              />
            </View>
          ) : (
            <View style={styles.codeStep}>
              <Text style={styles.label}>{appLanguage === 'zh-CN' ? '验证码' : 'Verification Code'}</Text>
              <Text style={styles.subtitle}>
                {appLanguage === 'zh-CN' ? '验证码已发送至' : 'Code sent to'} {phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color={colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder={t('enter_verification_code', appLanguage)}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>
              
              <View style={styles.codeActions}>
                <TouchableOpacity
                  onPress={handleVerifyCode}
                  disabled={loading}
                  style={[
                    styles.verifyButton,
                    { opacity: verificationCode.length === 6 ? 1 : 0.6 }
                  ]}
                >
                  <Text style={styles.verifyButtonText}>{t('verify_code', appLanguage)}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSendCode}
                  disabled={countdown > 0 || loading}
                  style={[
                    styles.resendButton,
                    { opacity: countdown > 0 ? 0.6 : 1 }
                  ]}
                >
                  <Text style={styles.resendButtonText}>
                    {countdown > 0 ? `${countdown}s${appLanguage === 'zh-CN' ? '后重发' : ' later'}` : t('resend_code', appLanguage)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  phoneStep: {
    flex: 1,
  },
  codeStep: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  sendButton: {
    marginTop: 'auto',
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  verifyButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flex: 1,
    marginRight: 12,
  },
  verifyButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '500',
  },
}); 