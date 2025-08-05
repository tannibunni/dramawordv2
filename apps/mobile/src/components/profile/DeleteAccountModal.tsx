import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { UserService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onAccountDeleted: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onAccountDeleted,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { getAuthToken } = useAuth();
  const userService = UserService.getInstance();

  const handleDeleteAccount = async () => {
    if (confirmText !== '删除') {
      Alert.alert('确认文本错误', '请输入正确的确认文本：删除');
      return;
    }

    // 最终确认
    Alert.alert(
      '确认注销账户',
      '此操作将永久删除您的账户和所有数据，包括：\n\n• 所有学习记录\n• 收藏的单词\n• 个人设置\n• 学习统计\n\n此操作不可撤销，确定要继续吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确认注销',
          style: 'destructive',
          onPress: async () => {
            await performDeleteAccount();
          },
        },
      ]
    );
  };

  const performDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('未找到认证token，请重新登录');
      }

      const result = await userService.deleteAccount(token, confirmText);
      
      if (result.success) {
        Alert.alert(
          '账户已注销',
          '您的账户和所有数据已成功删除。感谢您使用剧词记！',
          [
            {
              text: '确定',
              onPress: () => {
                onAccountDeleted();
                onClose();
              },
            },
          ]
        );
      } else {
        throw new Error(result.error || '注销失败');
      }
    } catch (error) {
      console.error('❌ 注销账户失败:', error);
      Alert.alert('注销失败', (error as Error).message || '请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>注销账户</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 内容 */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 警告图标 */}
          <View style={styles.warningIcon}>
            <Ionicons name="warning" size={60} color={colors.error[500]} />
          </View>

          {/* 警告文本 */}
          <Text style={styles.warningTitle}>⚠️ 此操作不可撤销</Text>
          <Text style={styles.warningText}>
            注销账户将永久删除您的所有数据，包括：
          </Text>

          {/* 删除内容列表 */}
          <View style={styles.deleteList}>
            <View style={styles.deleteItem}>
              <Ionicons name="book-outline" size={20} color={colors.error[500]} />
              <Text style={styles.deleteItemText}>所有学习记录和进度</Text>
            </View>
            <View style={styles.deleteItem}>
              <Ionicons name="star-outline" size={20} color={colors.error[500]} />
              <Text style={styles.deleteItemText}>收藏的单词和剧集</Text>
            </View>
            <View style={styles.deleteItem}>
              <Ionicons name="settings-outline" size={20} color={colors.error[500]} />
              <Text style={styles.deleteItemText}>个人设置和偏好</Text>
            </View>
            <View style={styles.deleteItem}>
              <Ionicons name="stats-chart-outline" size={20} color={colors.error[500]} />
              <Text style={styles.deleteItemText}>学习统计和成就</Text>
            </View>
          </View>

          {/* 确认输入 */}
          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>
              请输入 "删除" 确认注销账户：
            </Text>
            <TextInput
              style={styles.confirmInput}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="输入 删除"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* 注销按钮 */}
          <TouchableOpacity
            style={[
              styles.deleteButton,
              (confirmText !== '删除' || isDeleting) && styles.deleteButtonDisabled,
            ]}
            onPress={handleDeleteAccount}
            disabled={confirmText !== '删除' || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <>
                <Ionicons name="trash" size={20} color={colors.text.inverse} />
                <Text style={styles.deleteButtonText}>注销账户</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  cancelButton: {
    padding: 5,
  },
  cancelText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningIcon: {
    alignItems: 'center',
    marginVertical: 20,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.error[500],
    textAlign: 'center',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  deleteList: {
    marginBottom: 30,
  },
  deleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  deleteItemText: {
    fontSize: 15,
    color: colors.text.primary,
    marginLeft: 10,
  },
  confirmSection: {
    marginBottom: 30,
  },
  confirmLabel: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    backgroundColor: colors.background.secondary,
  },
  deleteButton: {
    backgroundColor: colors.error[500],
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  deleteButtonDisabled: {
    backgroundColor: colors.error[300],
  },
  deleteButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 