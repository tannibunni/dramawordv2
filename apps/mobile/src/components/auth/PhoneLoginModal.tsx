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
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    setLoading(true);
    try {
      // TODO: 调用发送验证码API
      console.log('发送验证码到:', phone);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCountdown(60);
      setStep('code');
      Alert.alert('提示', '验证码已发送');
    } catch (error) {
      Alert.alert('错误', '发送验证码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('提示', '请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      // TODO: 调用验证码验证API
      console.log('验证码:', verificationCode);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onLoginSuccess(phone);
      onClose();
    } catch (error) {
      Alert.alert('错误', '验证码错误，请重试');
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
            {step === 'phone' ? '手机号登录' : '输入验证码'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {step === 'phone' ? (
            <View style={styles.phoneStep}>
              <Text style={styles.label}>手机号</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder="请输入手机号"
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
              <Text style={styles.label}>验证码</Text>
              <Text style={styles.subtitle}>
                验证码已发送至 {phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color={colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder="请输入6位验证码"
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
                  <Text style={styles.verifyButtonText}>验证</Text>
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
                    {countdown > 0 ? `${countdown}s后重发` : '重新发送'}
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