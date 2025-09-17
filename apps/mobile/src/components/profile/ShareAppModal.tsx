import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { useNavigation } from '../navigation/NavigationContext';
import { t } from '../../constants/translations';
import * as Clipboard from 'expo-clipboard';
import { DeepLinkService } from '../../services/deepLinkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ShareAppModalProps {
  visible: boolean;
  onClose: () => void;
}

// 获取用户token
async function getUserToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('userToken');
    return token;
  } catch (error) {
    console.error('获取用户token失败:', error);
    return null;
  }
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  visible,
  onClose,
}) => {
  const { appLanguage } = useAppLanguage();
  const { navigate } = useNavigation();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isRegisteredUser, setIsRegisteredUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 检查用户注册状态
  useEffect(() => {
    if (visible) {
      checkUserRegistrationStatus();
    }
  }, [visible]);

  // 检查用户注册状态
  const checkUserRegistrationStatus = async () => {
    try {
      setIsLoading(true);
      const token = await getUserToken();
      
      if (!token) {
        setIsRegisteredUser(false);
        return;
      }

      // 调用后端API检查用户状态
      const response = await fetch(`${process.env.API_BASE_URL || 'https://dramawordv2.onrender.com/api'}/invite/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'free_trial',
          freeTrialDays: 30,
          maxUses: 1,
          expiresInDays: 30
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setIsRegisteredUser(true);
        setInviteCode(result.data.code);
        console.log('✅ 注册用户，邀请码生成成功:', result.data.code);
      } else if (result.code === 'GUEST_USER_NOT_ALLOWED') {
        setIsRegisteredUser(false);
        console.log('⚠️ 游客用户，需要注册');
      } else {
        setIsRegisteredUser(false);
        console.log('❌ 用户状态检查失败');
      }
    } catch (error) {
      console.error('❌ 检查用户注册状态失败:', error);
      setIsRegisteredUser(false);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInviteCode = async () => {
    try {
      // 调用后端API生成邀请码
      const response = await fetch(`${process.env.API_BASE_URL || 'https://dramawordv2.onrender.com/api'}/invite/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getUserToken()}`,
        },
        body: JSON.stringify({
          type: 'free_trial',
          freeTrialDays: 30,
          maxUses: 1,
          expiresInDays: 30
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setInviteCode(result.data.code);
        console.log('✅ 邀请码生成成功:', result.data.code);
      } else if (result.code === 'GUEST_USER_NOT_ALLOWED') {
        // 游客用户需要注册
        console.log('⚠️ 游客用户需要注册才能生成邀请码');
        Alert.alert(
          appLanguage === 'zh-CN' ? '需要注册' : 'Registration Required',
          appLanguage === 'zh-CN' 
            ? '只有注册用户才能生成邀请码。请先注册成为正式用户。'
            : 'Only registered users can generate invite codes. Please register first.',
          [
            { text: appLanguage === 'zh-CN' ? '取消' : 'Cancel', style: 'cancel' },
            { 
              text: appLanguage === 'zh-CN' ? '去注册' : 'Register', 
              onPress: () => {
                // 这里可以导航到注册页面
                console.log('导航到注册页面');
                onClose(); // 关闭分享弹窗
              }
            }
          ]
        );
        return;
      } else {
        // 其他错误，使用本地生成作为备用
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        const code = `DW${timestamp}${random}`.toUpperCase();
        setInviteCode(code);
        console.log('⚠️ 使用本地生成的邀请码:', code);
      }
    } catch (error) {
      console.error('❌ 生成邀请码失败:', error);
      // 使用本地生成作为备用
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      const code = `DW${timestamp}${random}`.toUpperCase();
      setInviteCode(code);
    }
  };

  const copyInviteCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert(
        t('copy_success', appLanguage),
        t('invite_code', appLanguage) + ': ' + inviteCode,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ 复制失败:', error);
      Alert.alert('错误', '复制失败，请重试');
    }
  };

  const shareApp = async () => {
    try {
      const inviteLink = DeepLinkService.getInstance().generateInviteLink(inviteCode);
      const shareMessage = `${t('share_app_message', appLanguage)}\n\n${t('invite_code', appLanguage)}: ${inviteCode}\n\n邀请链接: ${inviteLink}`;
      
      const result = await Share.share({
        message: shareMessage,
        title: t('share_app_title', appLanguage),
      });

      if (result.action === Share.sharedAction) {
        // 分享成功，可以调用后端API记录分享行为
        console.log('✅ 应用分享成功');
      }
    } catch (error) {
      console.error('❌ 分享失败:', error);
      Alert.alert('错误', '分享失败，请重试');
    }
  };

  const shareOptions = [
    {
      name: 'Messages',
      icon: 'chatbubble-outline',
      action: () => shareApp(),
    },
    {
      name: 'Mail',
      icon: 'mail-outline',
      action: () => shareApp(),
    },
    {
      name: 'Copy Link',
      icon: 'copy-outline',
      action: async () => {
        try {
          const inviteLink = DeepLinkService.getInstance().generateInviteLink(inviteCode);
          await Clipboard.setStringAsync(inviteLink);
          Alert.alert('成功', '邀请链接已复制');
        } catch (error) {
          console.error('❌ 复制邀请链接失败:', error);
          Alert.alert('错误', '复制失败，请重试');
        }
      },
    },
  ];

  // 导航到登录页面
  const goToRegistration = () => {
    console.log('导航到登录页面');
    onClose(); // 关闭分享弹窗
    // 导航到登录页面
    navigate('login');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 头部 */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('share_app_title', appLanguage)}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              // 加载状态
              <View style={styles.loadingContainer}>
                <Ionicons name="hourglass-outline" size={48} color={colors.primary[500]} />
                <Text style={styles.loadingText}>
                  {appLanguage === 'zh-CN' ? '检查用户状态...' : 'Checking user status...'}
                </Text>
              </View>
            ) : isRegisteredUser ? (
              // 注册用户 - 显示邀请码
              <>
                {/* 分享说明 */}
                <View style={styles.descriptionSection}>
                  <Ionicons 
                    name="gift-outline" 
                    size={48} 
                    color={colors.primary[500]} 
                    style={styles.giftIcon}
                  />
                  <Text style={styles.description}>
                    {t('share_app_message', appLanguage)}
                  </Text>
                  <Text style={styles.rewardText}>
                    {t('share_app_reward', appLanguage)}
                  </Text>
                </View>

                {/* 邀请码区域 */}
                <View style={styles.inviteCodeSection}>
                  <Text style={styles.sectionTitle}>{t('invite_code', appLanguage)}</Text>
                  <View style={styles.inviteCodeContainer}>
                    <Text style={styles.inviteCode}>{inviteCode}</Text>
                    <TouchableOpacity onPress={copyInviteCode} style={styles.copyButton}>
                      <Ionicons name="copy-outline" size={20} color={colors.primary[500]} />
                      <Text style={styles.copyButtonText}>
                        {t('copy_invite_code', appLanguage)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 分享方式 */}
                <View style={styles.shareOptionsSection}>
                  <Text style={styles.sectionTitle}>{t('share_via', appLanguage)}</Text>
                  <View style={styles.shareOptionsGrid}>
                    {shareOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.shareOption}
                        onPress={option.action}
                      >
                        <Ionicons name={option.icon as any} size={32} color={colors.primary[500]} />
                        <Text style={styles.shareOptionText}>{option.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 分享按钮 */}
                <TouchableOpacity style={styles.shareButton} onPress={shareApp}>
                  <Ionicons name="share-social-outline" size={24} color="white" />
                  <Text style={styles.shareButtonText}>
                    {t('share_app', appLanguage)}
                  </Text>
                </TouchableOpacity>

                {/* 开发模式：深度链接测试 */}
                {__DEV__ && (
                  <TouchableOpacity 
                    style={[styles.shareButton, styles.testButton]} 
                    onPress={() => {
                      const testUrl = `https://dramaword.com/invite/${inviteCode}`;
                      DeepLinkService.getInstance().testDeepLink(testUrl);
                    }}
                  >
                    <Ionicons name="bug-outline" size={24} color="white" />
                    <Text style={styles.shareButtonText}>
                      测试深度链接
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              // 游客用户 - 显示注册引导
              <>
                {/* 注册引导 */}
                <View style={styles.registrationSection}>
                  <View style={styles.lockIconContainer}>
                    <Ionicons name="lock-closed-outline" size={48} color={colors.primary[500]} />
                  </View>
                  
                  <Text style={styles.registrationTitle}>
                    {appLanguage === 'zh-CN' ? '需要登录' : 'Login Required'}
                  </Text>
                  
                  <Text style={styles.registrationDescription}>
                    {appLanguage === 'zh-CN' 
                      ? '只有注册用户才能生成邀请码。请先登录成为正式用户，然后就可以邀请好友一起学习！'
                      : 'Only registered users can generate invite codes. Please login first to invite friends and learn together!'
                    }
                  </Text>
                  
                  <View style={styles.rewardsContainer}>
                    <Text style={styles.rewardsTitle}>
                      {appLanguage === 'zh-CN' ? '登录后即可获得：' : 'After login you will get:'}
                    </Text>
                    
                    <View style={styles.benefitsList}>
                      <View style={styles.benefitItem}>
                        <Ionicons name="gift-outline" size={18} color={colors.primary[500]} />
                        <Text style={styles.benefitText}>
                          {appLanguage === 'zh-CN' ? '30天免费试用' : '30 days free trial'}
                        </Text>
                      </View>
                      
                      <View style={styles.benefitItem}>
                        <Ionicons name="people-outline" size={18} color={colors.primary[500]} />
                        <Text style={styles.benefitText}>
                          {appLanguage === 'zh-CN' ? '邀请好友功能' : 'Invite friends feature'}
                        </Text>
                      </View>
                      
                      <View style={styles.benefitItem}>
                        <Ionicons name="cloud-outline" size={18} color={colors.primary[500]} />
                        <Text style={styles.benefitText}>
                          {appLanguage === 'zh-CN' ? '云端数据同步' : 'Cloud data sync'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 注册按钮 */}
                <View style={styles.registrationButtons}>
                  <TouchableOpacity 
                    style={styles.registerButton}
                    onPress={goToRegistration}
                  >
                    <Ionicons name="log-in-outline" size={20} color="white" />
                    <Text style={styles.registerButtonText}>
                      {appLanguage === 'zh-CN' ? '立即登录' : 'Login Now'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={onClose}
                  >
                    <Text style={styles.cancelButtonText}>
                      {appLanguage === 'zh-CN' ? '稍后再说' : 'Maybe Later'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
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
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  descriptionSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  giftIcon: {
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[500],
    textAlign: 'center',
  },
  inviteCodeSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
  },
  inviteCodeContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[500],
    marginBottom: 15,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  copyButtonText: {
    color: colors.primary[500],
    fontWeight: '600',
    marginLeft: 8,
  },
  shareOptionsSection: {
    marginBottom: 30,
  },
  shareOptionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareOption: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    minWidth: 80,
  },
  shareOptionText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  shareButton: {
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  testButton: {
    backgroundColor: colors.neutral[600],
    marginTop: 10,
  },
  // 注册引导样式
  registrationSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  registrationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 12,
    textAlign: 'center',
  },
  registrationDescription: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  rewardsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 12,
    textAlign: 'center',
  },
  benefitsList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
    minWidth: '30%',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 12,
    color: colors.gray[600],
    marginLeft: 6,
    textAlign: 'center',
  },
  registrationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  registerButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: colors.primary[500],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  cancelButtonText: {
    color: colors.gray[600],
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray[600],
    marginTop: 12,
  },
});
