import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface InviteCodeInputProps {
  onCodeApplied?: (code: string, discount: number) => void;
  onCodeRemoved?: () => void;
  initialCode?: string;
  disabled?: boolean;
}

export const InviteCodeInput: React.FC<InviteCodeInputProps> = ({
  onCodeApplied,
  onCodeRemoved,
  initialCode = '',
  disabled = false
}) => {
  const { appLanguage } = useAppLanguage();
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // 检查是否有待处理的邀请码
    checkPendingInviteCode();
  }, []);

  const checkPendingInviteCode = async () => {
    try {
      const pendingCode = await AsyncStorage.getItem('pendingInviteCode');
      if (pendingCode) {
        setInviteCode(pendingCode);
        await validateInviteCode(pendingCode);
      }
    } catch (error) {
      console.error('检查待处理邀请码失败:', error);
    }
  };

  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      setErrorMessage('');
      setIsValid(false);
      setDiscount(0);
      return;
    }

    setIsValidating(true);
    setErrorMessage('');

    try {
      const response = await fetch(`https://dramawordv2.onrender.com/api/invite/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setIsValid(true);
        // 根据邀请码类型设置不同的奖励值
        const rewardValue = result.data?.type === 'free_trial' 
          ? result.data.reward?.freeTrialDays || 0
          : result.data?.reward?.discountPercent || 0;
        setDiscount(rewardValue);
        setErrorMessage('');
        
        // 清除待处理的邀请码
        await AsyncStorage.removeItem('pendingInviteCode');
        
        if (onCodeApplied) {
          onCodeApplied(code.trim(), rewardValue);
        }
      } else {
        setIsValid(false);
        setDiscount(0);
        setErrorMessage(result.message || '邀请码无效');
      }
    } catch (error) {
      console.error('验证邀请码失败:', error);
      setIsValid(false);
      setDiscount(0);
      setErrorMessage('网络错误，请重试');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCodeChange = (text: string) => {
    setInviteCode(text);
    setErrorMessage('');
    setIsValid(false);
    setDiscount(0);
  };

  const handleApplyCode = () => {
    if (inviteCode.trim()) {
      validateInviteCode(inviteCode);
    }
  };

  const handleRemoveCode = () => {
    setInviteCode('');
    setIsValid(false);
    setDiscount(0);
    setErrorMessage('');
    
    if (onCodeRemoved) {
      onCodeRemoved();
    }
  };

  const getDiscountText = () => {
    if (discount > 0) {
      // 根据邀请码类型显示不同的文本
      if (discount >= 30) { // 假设30天以上是免费试用
        return appLanguage === 'zh-CN' 
          ? `免费试用 ${discount} 天` 
          : `Free Trial ${discount} Days`;
      } else {
        return appLanguage === 'zh-CN' 
          ? `立减 ${discount}%` 
          : `${discount}% OFF`;
      }
    }
    return '';
  };

  return (
    <View style={styles.container}>
      {/* 只显示折扣徽章，不显示标题 */}
      {isValid && (
        <View style={styles.discountBadgeContainer}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {getDiscountText()}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            isValid && styles.inputValid,
            errorMessage && styles.inputError,
            disabled && styles.inputDisabled
          ]}
          value={inviteCode}
          onChangeText={handleCodeChange}
          placeholder={t('enter_invite_code', appLanguage)}
          placeholderTextColor={colors.text.secondary}
          editable={!disabled}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        
        {inviteCode.trim() && !isValid && !isValidating && (
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyCode}
            disabled={disabled}
          >
            <Text style={styles.applyButtonText}>
              {t('apply', appLanguage)}
            </Text>
          </TouchableOpacity>
        )}

        {isValid && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemoveCode}
            disabled={disabled}
          >
            <Ionicons name="close-circle" size={20} color={colors.success[500]} />
          </TouchableOpacity>
        )}

        {isValidating && (
          <View style={styles.loadingContainer}>
            <Ionicons name="refresh" size={20} color={colors.primary[500]} />
          </View>
        )}
      </View>

      {errorMessage && (
        <Text style={styles.errorText}>
          {errorMessage}
        </Text>
      )}

      {isValid && (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
          <Text style={styles.successText}>
            {appLanguage === 'zh-CN' 
              ? `邀请码已应用，享受 ${discount}% 折扣！` 
              : `Invite code applied! Enjoy ${discount}% discount!`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    marginHorizontal: -8, // 负边距，让组件超出父容器的padding
    width: '100%', // 确保占满宽度
  },
  discountBadgeContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  discountBadge: {
    backgroundColor: colors.success[100],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success[600],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: 20, // 增加水平内边距
    paddingVertical: 14, // 增加垂直内边距
    minHeight: 52, // 增加最小高度
    marginHorizontal: 8, // 添加水平边距，抵消容器的负边距
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  inputValid: {
    borderColor: colors.success[500],
    backgroundColor: colors.success[50],
  },
  inputError: {
    borderColor: colors.error[500],
    backgroundColor: colors.error[50],
  },
  inputDisabled: {
    backgroundColor: colors.background.tertiary,
    color: colors.text.tertiary,
  },
  applyButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 80, // 设置最小宽度
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    marginLeft: 12,
    padding: 6,
  },
  loadingContainer: {
    marginLeft: 12,
    padding: 6,
  },
  errorText: {
    color: colors.error[500],
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  successText: {
    color: colors.success[600],
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});
