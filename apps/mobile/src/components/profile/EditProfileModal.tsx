import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { UserService } from '../../services/userService';
import { colors } from '../../constants/colors';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (userData: any) => void;
  user: {
    id: string;
    nickname: string;
    avatar?: string;
    email?: string;
  };
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onUpdate,
  user,
}) => {
  const [nickname, setNickname] = useState(user.nickname);
  const [avatar, setAvatar] = useState(user.avatar);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限被拒绝', '需要相册权限来选择头像');
        return;
      }

      // 选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('选择图片失败', '请重试');
    }
  };

  const takePhoto = async () => {
    try {
      // 请求权限
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限被拒绝', '需要相机权限来拍摄头像');
        return;
      }

      // 拍照
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('拍照失败', '请重试');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      '选择头像',
      '请选择获取头像的方式',
      [
        { text: '取消', style: 'cancel' },
        { text: '拍照', onPress: takePhoto },
        { text: '从相册选择', onPress: pickImage },
      ]
    );
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '昵称不能为空');
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = avatar;

      // 如果头像有变化且是本地文件，先上传头像
      if (avatar && avatar !== user.avatar && avatar.startsWith('file://')) {
        const formData = new FormData();
        formData.append('avatar', {
          uri: avatar,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        // TODO: 从本地存储或全局状态获取token
        const token = 'your-token-here';
        const uploadResult = await UserService.uploadAvatar(token, formData);
        if (uploadResult.success) {
          avatarUrl = uploadResult.data.avatar;
        } else {
          throw new Error(uploadResult.message);
        }
      }

      // 更新用户信息
      const updateData: any = { nickname };
      if (avatarUrl !== user.avatar) {
        updateData.avatar = avatarUrl;
      }

      // TODO: 从本地存储或全局状态获取token
      const token = 'your-token-here';
      const result = await UserService.updateProfile(token, updateData);
      if (result.success) {
        onUpdate(result.data.user);
        onClose();
        Alert.alert('成功', '个人信息更新成功');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Alert.alert('更新失败', (error as Error).message || '请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>编辑资料</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <Text style={styles.saveText}>保存</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 内容 */}
        <View style={styles.content}>
          {/* 头像 */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={showImagePicker} style={styles.avatarContainer}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color={colors.neutral[500]} />
                </View>
              )}
              <View style={styles.avatarEditIcon}>
                <Ionicons name="camera" size={16} color={colors.text.inverse} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>点击更换头像</Text>
          </View>

          {/* 昵称 */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>昵称</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="请输入昵称"
              maxLength={30}
            />
          </View>
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveButton: {
    padding: 10,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.secondary,
  },
  avatarHint: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
}); 