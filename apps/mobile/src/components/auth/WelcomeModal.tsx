import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { t } from '../../constants/translations';
import { useAppLanguage } from '../../context/AppLanguageContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
  onStartTrial: () => void;
  userData?: {
    id: string;
    nickname: string;
    loginType: string;
  };
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  visible,
  onClose,
  onStartTrial,
  userData,
}) => {
  const { appLanguage } = useAppLanguage();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 关闭按钮 */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* 主要内容 */}
          <View style={styles.content}>
            {/* 标题 */}
            <Text style={styles.title}>
              {t('welcome_to_dramaword', appLanguage)}
            </Text>

            {/* 副标题 */}
            <Text style={styles.subtitle}>
              {t('free_trial_description', appLanguage)}
            </Text>

            {/* 试用按钮 */}
            <TouchableOpacity
              style={styles.trialButton}
              onPress={onStartTrial}
              activeOpacity={0.8}
            >
              <Text style={styles.trialButtonText}>
                {t('try_for_free', appLanguage)}
              </Text>
            </TouchableOpacity>

            {/* 插图区域 */}
            <View style={styles.illustrationContainer}>
              <View style={styles.illustration}>
                {/* 人物图标 */}
                <View style={styles.personIcon}>
                  <Ionicons name="person" size={40} color={colors.primary[500]} />
                </View>
                
                {/* 手机图标 */}
                <View style={styles.phoneIcon}>
                  <Ionicons name="phone-portrait" size={24} color={colors.text.primary} />
                </View>
                
                {/* 小狗图标 */}
                <View style={styles.dogIcon}>
                  <Ionicons name="paw" size={20} color={colors.accent[500]} />
                </View>
              </View>
            </View>

            {/* 用户信息（可选显示） */}
            {userData && (
              <View style={styles.userInfo}>
                <Text style={styles.userInfoText}>
                  {t('welcome_user', appLanguage, { username: userData.nickname })}
                </Text>
              </View>
            )}
          </View>
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
    backgroundColor: colors.background.primary,
    borderRadius: 24,
    padding: 24,
    margin: 20,
    width: screenWidth - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  content: {
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  trialButton: {
    width: '100%',
    marginBottom: 40,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trialButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  illustration: {
    position: 'relative',
    width: 120,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personIcon: {
    position: 'absolute',
    left: 20,
    top: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneIcon: {
    position: 'absolute',
    left: 35,
    top: 25,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dogIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  userInfoText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
}); 