import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { Show } from '../../context/ShowListContext';

const { width } = Dimensions.get('window');

interface WordbookEditModalProps {
  visible: boolean;
  wordbook: Show | null;
  onClose: () => void;
  onSave: (updatedWordbook: Show) => void;
}

// 预定义的ICON选项 - 确保所有图标都是有效的Ionicons
const ICON_OPTIONS = [
  { name: 'book', label: '书本' },
  { name: 'library', label: '图书馆' },
  { name: 'school', label: '学校' },
  { name: 'graduation', label: '毕业帽' },
  { name: 'pencil', label: '铅笔' },
  { name: 'document-text', label: '文档' },
  { name: 'newspaper', label: '报纸' },
  { name: 'globe', label: '地球' },
  { name: 'language', label: '语言' },
  { name: 'chatbubbles', label: '对话' },
  { name: 'bulb', label: '灯泡' },
  { name: 'star', label: '星星' },
  { name: 'heart', label: '爱心' },
  { name: 'flower', label: '花朵' },
  { name: 'leaf', label: '叶子' },
  { name: 'sunny', label: '太阳' },
  { name: 'moon', label: '月亮' },
  { name: 'cloud', label: '云朵' },
  { name: 'rainy', label: '雨天' },
  { name: 'snow', label: '雪花' },
  { name: 'umbrella', label: '雨伞' },
  { name: 'bicycle', label: '自行车' },
  { name: 'car', label: '汽车' },
  { name: 'airplane', label: '飞机' },
  { name: 'boat', label: '船' },
  { name: 'train', label: '火车' },
  { name: 'bus', label: '公交车' },
  { name: 'walk', label: '步行' },
  { name: 'fitness', label: '健身' },
  { name: 'basketball', label: '篮球' },
  { name: 'football', label: '足球' },
  { name: 'baseball', label: '棒球' },
  { name: 'golf', label: '高尔夫' },
  { name: 'game-controller', label: '游戏' },
  { name: 'musical-notes', label: '音乐' },
  { name: 'mic', label: '麦克风' },
  { name: 'headset', label: '耳机' },
  { name: 'radio', label: '收音机' },
  { name: 'tv', label: '电视' },
  { name: 'film', label: '电影' },
  { name: 'camera', label: '相机' },
  { name: 'images', label: '图片' },
  { name: 'videocam', label: '视频' },
  { name: 'phone-portrait', label: '手机' },
  { name: 'laptop', label: '笔记本' },
  { name: 'desktop', label: '台式机' },
  { name: 'tablet-portrait', label: '平板' },
  { name: 'watch', label: '手表' },
  { name: 'calculator', label: '计算器' },
  { name: 'keypad', label: '键盘' },
  { name: 'construct', label: '工具' },
  { name: 'hammer', label: '锤子' },
  { name: 'settings', label: '设置' },
  { name: 'options', label: '选项' },
  { name: 'menu', label: '菜单' },
  { name: 'grid', label: '网格' },
  { name: 'list', label: '列表' },
  { name: 'folder', label: '文件夹' },
  { name: 'folder-open', label: '打开文件夹' },
  { name: 'document', label: '文档' },
  { name: 'documents', label: '文档集' },
  { name: 'archive', label: '归档' },
  { name: 'trash', label: '垃圾桶' },
  { name: 'reload', label: '刷新' },
  { name: 'refresh', label: '更新' },
  { name: 'sync', label: '同步' },
  { name: 'download', label: '下载' },
  { name: 'share', label: '分享' },
  { name: 'mail', label: '邮件' },
  { name: 'call', label: '电话' },
  { name: 'location', label: '位置' },
  { name: 'map', label: '地图' },
  { name: 'compass', label: '指南针' },
  { name: 'navigate', label: '导航' },
  { name: 'flag', label: '旗帜' },
  { name: 'home', label: '家' },
  { name: 'business', label: '商业' },
  { name: 'storefront', label: '商店' },
  { name: 'cart', label: '购物车' },
  { name: 'bag', label: '包' },
  { name: 'gift', label: '礼物' },
  { name: 'ribbon', label: '丝带' },
  { name: 'trophy', label: '奖杯' },
  { name: 'medal', label: '奖牌' },
  { name: 'diamond', label: '钻石' },
  { name: 'sparkles', label: '闪光' },
  { name: 'flash', label: '闪电' },
  { name: 'flame', label: '火焰' },
  { name: 'water', label: '水' },
  { name: 'wine', label: '酒' },
  { name: 'beer', label: '啤酒' },
  { name: 'cafe', label: '咖啡' },
  { name: 'restaurant', label: '餐厅' },
  { name: 'fast-food', label: '快餐' },
  { name: 'pizza', label: '披萨' },
  { name: 'ice-cream', label: '冰淇淋' },
  { name: 'medical', label: '医疗' },
  { name: 'body', label: '身体' },
  { name: 'eye', label: '眼睛' },
  { name: 'ear', label: '耳朵' },
  { name: 'hand-left', label: '左手' },
  { name: 'hand-right', label: '右手' },
];

const WordbookEditModal: React.FC<WordbookEditModalProps> = ({
  visible,
  wordbook,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('book');

  // 当模态框打开时，初始化数据
  React.useEffect(() => {
    if (visible && wordbook) {
      setTitle(wordbook.name || '');
      setDescription(wordbook.overview || '');
      setSelectedIcon(wordbook.icon || 'book');
    }
  }, [visible, wordbook]);

  const handleSave = () => {
    if (!wordbook) return;
    
    if (!title.trim()) {
      Alert.alert('请输入单词本名称');
      return;
    }

    const updatedWordbook: Show = {
      ...wordbook,
      name: title.trim(),
      original_name: title.trim(),
      overview: description.trim(),
      icon: selectedIcon,
    };

    onSave(updatedWordbook);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!wordbook) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* 头部 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>编辑单词本</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 当前选中的ICON预览 */}
            <View style={styles.iconPreview}>
              <View style={styles.iconContainer}>
                <Ionicons name={selectedIcon as any} size={48} color={colors.primary[500]} />
              </View>
              <Text style={styles.iconPreviewText}>当前封面</Text>
            </View>

            {/* 标题输入 */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>单词本名称</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="请输入单词本名称"
                placeholderTextColor={colors.text.tertiary}
                maxLength={50}
              />
            </View>

            {/* 描述输入 */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>描述（可选）</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="请输入单词本描述"
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            {/* ICON选择 */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>选择封面图标</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((icon) => (
                  <TouchableOpacity
                    key={icon.name}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon.name && styles.iconOptionSelected
                    ]}
                    onPress={() => setSelectedIcon(icon.name)}
                  >
                    <Ionicons 
                      name={icon.name as any} 
                      size={24} 
                      color={selectedIcon === icon.name ? colors.text.inverse : colors.text.primary} 
                    />
                    <Text style={[
                      styles.iconLabel,
                      selectedIcon === icon.name && styles.iconLabelSelected
                    ]}>
                      {icon.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* 底部按钮 */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconPreview: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconPreviewText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: (width - 80) / 4,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  iconOptionSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  iconLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  iconLabelSelected: {
    color: colors.text.inverse,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.text.inverse,
    fontWeight: '500',
  },
});

export default WordbookEditModal; 