import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { emailAuthService, EmailAuthResult } from '../../services/emailAuthService';
import { colors } from '../../constants/colors';
import { t } from '../../constants/translations';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { StyleSheet } from 'react-native';

interface EmailAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess: (userData: any) => void;
  initialMode?: 'login' | 'register';
}

export const EmailAuthModal: React.FC<EmailAuthModalProps> = ({
  visible,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const { appLanguage } = useAppLanguage();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState(false);
  
  // 表单状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  
  // 输入框引用
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const nicknameRef = useRef<TextInput>(null);

  // 表单验证
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    nickname?: string;
  }>({});

  // 重置表单
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNickname('');
    setErrors({});
    setLoading(false);
  };

  // 关闭Modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // 验证邮箱
    if (!email.trim()) {
      newErrors.email = t('email_required', appLanguage);
    } else if (!emailAuthService.validateEmail(email)) {
      newErrors.email = t('invalid_email', appLanguage);
    }

    // 验证密码
    if (mode !== 'forgot') {
      if (!password) {
        newErrors.password = t('password_required', appLanguage);
      } else {
        const passwordValidation = emailAuthService.validatePassword(password);
        if (!passwordValidation.valid) {
          newErrors.password = t('password_too_short', appLanguage);
        }
      }
    }

    // 注册模式额外验证
    if (mode === 'register') {
      // 验证确认密码
      if (!confirmPassword) {
        newErrors.confirmPassword = t('confirm_password_required', appLanguage);
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = t('passwords_not_match', appLanguage);
      }

      // 验证昵称
      if (!nickname.trim()) {
        newErrors.nickname = t('nickname_required', appLanguage);
      } else {
        const nicknameValidation = emailAuthService.validateNickname(nickname);
        if (!nicknameValidation.valid) {
          newErrors.nickname = nicknameValidation.message || t('nickname_required', appLanguage);
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理注册
  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('[EmailAuthModal] 开始注册流程');
      const result = await emailAuthService.register(email, password, nickname);

      if (result.success && result.user && result.token) {
        Alert.alert(
          t('registration_success', appLanguage),
          t('check_email', appLanguage),
          [
            {
              text: t('ok', appLanguage),
              onPress: () => {
                handleClose();
                onLoginSuccess({
                  id: result.user!.id,
                  nickname: result.user!.nickname,
                  email: result.user!.email,
                  loginType: 'email',
                  token: result.token,
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          t('registration_failed', appLanguage),
          result.error || t('registration_failed', appLanguage)
        );
      }
    } catch (error) {
      console.error('[EmailAuthModal] 注册失败:', error);
      Alert.alert(
        t('registration_failed', appLanguage),
        t('network_error', appLanguage)
      );
    } finally {
      setLoading(false);
    }
  };

  // 处理登录
  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('[EmailAuthModal] 开始登录流程');
      const result = await emailAuthService.login(email, password);

      if (result.success && result.user && result.token) {
        Alert.alert(
          t('login_success', appLanguage),
          '',
          [
            {
              text: t('ok', appLanguage),
              onPress: () => {
                handleClose();
                onLoginSuccess({
                  id: result.user!.id,
                  nickname: result.user!.nickname,
                  email: result.user!.email,
                  loginType: 'email',
                  token: result.token,
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          t('login_failed', appLanguage),
          result.error || t('invalid_credentials', appLanguage)
        );
      }
    } catch (error) {
      console.error('[EmailAuthModal] 登录失败:', error);
      Alert.alert(
        t('login_failed', appLanguage),
        t('network_error', appLanguage)
      );
    } finally {
      setLoading(false);
    }
  };

  // 处理忘记密码
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors({ email: t('email_required', appLanguage) });
      return;
    }

    if (!emailAuthService.validateEmail(email)) {
      setErrors({ email: t('invalid_email', appLanguage) });
      return;
    }

    setLoading(true);
    try {
      console.log('[EmailAuthModal] 发送密码重置邮件');
      const result = await emailAuthService.forgotPassword(email);

      if (result.success) {
        Alert.alert(
          t('email_sent', appLanguage),
          t('check_email', appLanguage),
          [
            {
              text: t('ok', appLanguage),
              onPress: () => setMode('login'),
            },
          ]
        );
      } else {
        Alert.alert(
          t('send_failed', appLanguage),
          result.error || t('send_failed', appLanguage)
        );
      }
    } catch (error) {
      console.error('[EmailAuthModal] 发送密码重置邮件失败:', error);
      Alert.alert(
        t('send_failed', appLanguage),
        t('network_error', appLanguage)
      );
    } finally {
      setLoading(false);
    }
  };

  // 获取标题
  const getTitle = () => {
    switch (mode) {
      case 'register':
        return t('create_account', appLanguage);
      case 'forgot':
        return t('reset_password', appLanguage);
      default:
        return t('login_to_account', appLanguage);
    }
  };

  // 获取主按钮文本
  const getMainButtonText = () => {
    if (loading) return t('processing', appLanguage);
    
    switch (mode) {
      case 'register':
        return t('register_now', appLanguage);
      case 'forgot':
        return t('send_verification_email', appLanguage);
      default:
        return t('login', appLanguage);
    }
  };

  // 获取主按钮处理函数
  const getMainButtonHandler = () => {
    switch (mode) {
      case 'register':
        return handleRegister;
      case 'forgot':
        return handleForgotPassword;
      default:
        return handleLogin;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{getTitle()}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('email', appLanguage)}</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                placeholder={appLanguage === 'zh-CN' ? '请输入邮箱地址' : 'Enter your email'}
                placeholderTextColor={colors.text.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => {
                  if (mode === 'forgot') {
                    handleForgotPassword();
                  } else {
                    passwordRef.current?.focus();
                  }
                }}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            {mode !== 'forgot' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('password', appLanguage)}</Text>
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, errors.password && styles.inputError]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined });
                    }
                  }}
                  placeholder={appLanguage === 'zh-CN' ? '请输入密码' : 'Enter your password'}
                  placeholderTextColor={colors.text.secondary}
                  secureTextEntry
                  returnKeyType={mode === 'register' ? 'next' : 'done'}
                  onSubmitEditing={() => {
                    if (mode === 'register') {
                      confirmPasswordRef.current?.focus();
                    } else {
                      handleLogin();
                    }
                  }}
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>
            )}

            {/* Confirm Password Input */}
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('confirm_password', appLanguage)}</Text>
                <TextInput
                  ref={confirmPasswordRef}
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: undefined });
                    }
                  }}
                  placeholder={appLanguage === 'zh-CN' ? '请再次输入密码' : 'Confirm your password'}
                  placeholderTextColor={colors.text.secondary}
                  secureTextEntry
                  returnKeyType="next"
                  onSubmitEditing={() => nicknameRef.current?.focus()}
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>
            )}

            {/* Nickname Input */}
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('nickname', appLanguage)}</Text>
                <TextInput
                  ref={nicknameRef}
                  style={[styles.input, errors.nickname && styles.inputError]}
                  value={nickname}
                  onChangeText={(text) => {
                    setNickname(text);
                    if (errors.nickname) {
                      setErrors({ ...errors, nickname: undefined });
                    }
                  }}
                  placeholder={appLanguage === 'zh-CN' ? '请输入昵称' : 'Enter your nickname'}
                  placeholderTextColor={colors.text.secondary}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                {errors.nickname && (
                  <Text style={styles.errorText}>{errors.nickname}</Text>
                )}
              </View>
            )}

            {/* Main Button */}
            <TouchableOpacity
              style={[styles.mainButton, loading && styles.mainButtonDisabled]}
              onPress={getMainButtonHandler()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text.inverse} size="small" />
              ) : (
                <Text style={styles.mainButtonText}>{getMainButtonText()}</Text>
              )}
            </TouchableOpacity>

            {/* Secondary Actions */}
            <View style={styles.secondaryActions}>
              {mode === 'login' && (
                <>
                  <TouchableOpacity onPress={() => setMode('forgot')}>
                    <Text style={styles.linkText}>{t('forgot_password', appLanguage)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMode('register')} style={styles.secondaryButton}>
                    <Text style={styles.linkText}>{t('dont_have_account', appLanguage)}</Text>
                  </TouchableOpacity>
                </>
              )}

              {mode === 'register' && (
                <TouchableOpacity onPress={() => setMode('login')} style={styles.secondaryButton}>
                  <Text style={styles.linkText}>{t('already_have_account', appLanguage)}</Text>
                </TouchableOpacity>
              )}

              {mode === 'forgot' && (
                <TouchableOpacity onPress={() => setMode('login')} style={styles.secondaryButton}>
                  <Text style={styles.linkText}>{t('back_to_login', appLanguage)}</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  errorText: {
    fontSize: 14,
    color: colors.error[500],
    marginTop: 4,
  },
  mainButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  mainButtonDisabled: {
    opacity: 0.6,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  secondaryActions: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  secondaryButton: {
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    color: colors.primary[500],
    textDecorationLine: 'underline',
  },
});
