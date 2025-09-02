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
import { t } from '../../constants/translations';
import * as Clipboard from 'expo-clipboard';
import { DeepLinkService } from '../../services/deepLinkService';

interface ShareAppModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  visible,
  onClose,
}) => {
  const { appLanguage } = useAppLanguage();
  const [inviteCode, setInviteCode] = useState<string>('');

  // 生成邀请码（这里可以调用后端API生成）
  useEffect(() => {
    if (visible) {
      generateInviteCode();
    }
  }, [visible]);

  const generateInviteCode = () => {
    // 简单的邀请码生成逻辑，实际应该调用后端API
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const code = `DW${timestamp}${random}`.toUpperCase();
    setInviteCode(code);
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
});
