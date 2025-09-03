import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { user: authUser, getAuthToken, loginType } = useAuth();
  const userService = UserService.getInstance();

  // 获取默认头像
  const getDefaultAvatar = () => {
    if (!loginType) {
      return require('../../../assets/images/guest-avatar.png');
    }

    // 根据登录类型返回对应的默认头像
    switch (loginType) {
      case 'apple':
        return require('../../../assets/images/apple-avatar.png');
      case 'phone':
        return require('../../../assets/images/phone-avatar.png');
      case 'wechat':
        return require('../../../assets/images/wechat-avatar.png');
      default:
        return require('../../../assets/images/guest-avatar.png');
    }
  };

  // 当用户数据更新时，同步更新表单
  useEffect(() => {
    setNickname(user.nickname);
    setAvatar(user.avatar);
  }, [user]);

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
        console.log('📸 选择图片成功:', result.assets[0].uri);
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ 选择图片失败:', error);
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
        console.log('📸 拍照成功:', result.assets[0].uri);
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ 拍照失败:', error);
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

  const uploadAvatarToServer = async (imageUri: string): Promise<string | null> => {
    try {
      setUploadingAvatar(true);
      console.log('📤 开始上传头像到服务器...');

      // 获取认证token
      console.log('🔍 [EditProfileModal] 开始获取认证token...');
      const token = await getAuthToken();
      console.log('🔍 [EditProfileModal] 获取到的token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (!token) {
        console.error('❌ [EditProfileModal] 未找到认证token');
        // 尝试从AsyncStorage直接获取
        try {
          const directToken = await AsyncStorage.getItem('authToken');
          console.log('🔍 [EditProfileModal] 直接从AsyncStorage获取的token:', directToken ? `${directToken.substring(0, 20)}...` : 'null');
          
          if (directToken) {
            console.log('✅ [EditProfileModal] 使用直接获取的token');
            // 使用直接获取的token
            const formData = new FormData();
            formData.append('avatar', {
              uri: imageUri,
              type: 'image/jpeg',
              name: `avatar_${Date.now()}.jpg`,
            } as any);

            const uploadResult = await userService.uploadAvatar(directToken, formData);
            if (uploadResult.success && uploadResult.data) {
              console.log('✅ 头像上传成功:', uploadResult.data.avatar);
              return uploadResult.data.avatar;
            } else {
              throw new Error(uploadResult.error || '头像上传失败');
            }
          }
        } catch (directError) {
          console.error('❌ [EditProfileModal] 直接获取token也失败:', directError);
        }
        
        throw new Error('未找到认证token，请重新登录');
      }

      // 准备FormData
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `avatar_${Date.now()}.jpg`,
      } as any);

      // 上传头像
      const uploadResult = await userService.uploadAvatar(token, formData);
      if (uploadResult.success && uploadResult.data) {
        console.log('✅ 头像上传成功:', uploadResult.data.avatar);
        return uploadResult.data.avatar;
      } else {
        throw new Error(uploadResult.error || '头像上传失败');
      }
    } catch (error) {
      console.error('❌ 头像上传失败:', error);
      throw error;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '昵称不能为空');
      return;
    }

    if (nickname.trim().length > 30) {
      Alert.alert('提示', '昵称不能超过30个字符');
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = avatar;

      // 检查是否为游客模式
      const isGuestMode = authUser?.loginType === 'guest';
      
      if (isGuestMode) {
        // 游客模式：直接更新本地存储
        console.log('👤 游客模式：直接更新本地用户信息');
        
        const updatedUserData = {
          ...user,
          nickname: nickname.trim(),
          avatar: avatarUrl
        };
        
        // 更新本地存储
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        console.log('✅ 游客模式用户资料更新成功:', updatedUserData);
        onUpdate(updatedUserData);
        onClose();
        Alert.alert('成功', '个人信息更新成功');
        return;
      }

      // 注册用户模式：需要认证token
      if (avatar && avatar !== user.avatar && (avatar.startsWith('file://') || avatar.startsWith('content://'))) {
        console.log('📤 检测到新头像，开始上传...');
        const uploadedAvatarUrl = await uploadAvatarToServer(avatar);
        if (uploadedAvatarUrl) {
          avatarUrl = uploadedAvatarUrl;
        } else {
          throw new Error('头像上传失败');
        }
      }

      // 获取认证token
      console.log('🔍 [EditProfileModal] 开始获取认证token用于更新用户资料...');
      const token = await getAuthToken();
      console.log('🔍 [EditProfileModal] 获取到的token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (!token) {
        console.error('❌ [EditProfileModal] 未找到认证token用于更新用户资料');
        // 尝试从AsyncStorage直接获取
        try {
          const directToken = await AsyncStorage.getItem('authToken');
          console.log('🔍 [EditProfileModal] 直接从AsyncStorage获取的token:', directToken ? `${directToken.substring(0, 20)}...` : 'null');
          
          if (directToken) {
            console.log('✅ [EditProfileModal] 使用直接获取的token更新用户资料');
            // 使用直接获取的token
            const updateData: any = { nickname: nickname.trim() };
            if (avatarUrl && avatarUrl !== user.avatar) {
              updateData.avatar = avatarUrl;
            }

            const updateResult = await userService.updateProfile(directToken, updateData);
            if (updateResult.success) {
              console.log('✅ 用户资料更新成功');
              onUpdate(updateResult.data);
              onClose();
            } else {
              throw new Error(updateResult.error || '用户资料更新失败');
            }
            return;
          }
        } catch (directError) {
          console.error('❌ [EditProfileModal] 直接获取token也失败:', directError);
        }
        
        throw new Error('未找到认证token，请重新登录');
      }

      // 准备更新数据
      const updateData: any = { nickname: nickname.trim() };
      if (avatarUrl && avatarUrl !== user.avatar) {
        updateData.avatar = avatarUrl;
      }

      console.log('📝 更新用户资料:', updateData);

      // 更新用户信息
      const result = await userService.updateProfile(token, updateData);
      if (result.success && result.data) {
        console.log('✅ 用户资料更新成功:', result.data);
        onUpdate(result.data);
        onClose();
        Alert.alert('成功', '个人信息更新成功');
      } else {
        throw new Error(result.error || '更新失败');
      }
    } catch (error) {
      console.error('❌ 更新用户资料失败:', error);
      Alert.alert('更新失败', (error as Error).message || '请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // 重置表单数据
    setNickname(user.nickname);
    setAvatar(user.avatar);
    onClose();
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
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>编辑资料</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, loading || uploadingAvatar ? styles.saveButtonDisabled : null]}
            disabled={loading || uploadingAvatar}
          >
            {loading || uploadingAvatar ? (
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
            <TouchableOpacity 
              onPress={showImagePicker} 
              style={styles.avatarContainer}
              disabled={uploadingAvatar}
            >
              {avatar ? (
                <Image 
                  source={{ uri: avatar }} 
                  style={styles.avatar}
                  onError={() => {
                    console.log('⚠️ 头像加载失败，使用默认头像');
                    setAvatar(undefined);
                  }}
                />
              ) : (
                <Image 
                  source={getDefaultAvatar()} 
                  style={styles.avatar}
                />
              )}
              <View style={styles.avatarEditIcon}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Ionicons name="camera" size={16} color={colors.text.inverse} />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>
              {uploadingAvatar ? '正在上传头像...' : '点击更换头像'}
            </Text>
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
              autoFocus={false}
            />
            <Text style={styles.charCount}>{nickname.length}/30</Text>
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
  charCount: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
    alignSelf: 'flex-end',
  },
}); 