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
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';

const { width } = Dimensions.get('window');

interface WordbookEditModalProps {
  visible: boolean;
  wordbook: Show | null;
  isCreating?: boolean;
  onClose: () => void;
  onSave: (updatedWordbook: Show) => void;
}

// 预定义的ICON选项 - 精简为16个最常用的图标
const ICON_OPTIONS = [
  { name: 'book', label: { zh: '书本', en: 'Book' } },
  { name: 'library', label: { zh: '图书馆', en: 'Library' } },
  { name: 'school', label: { zh: '学校', en: 'School' } },
  { name: 'graduation', label: { zh: '毕业帽', en: 'Graduation' } },
  { name: 'globe', label: { zh: '地球', en: 'Globe' } },
  { name: 'language', label: { zh: '语言', en: 'Language' } },
  { name: 'star', label: { zh: '星星', en: 'Star' } },
  { name: 'heart', label: { zh: '爱心', en: 'Heart' } },
  { name: 'bulb', label: { zh: '灯泡', en: 'Bulb' } },
  { name: 'musical-notes', label: { zh: '音乐', en: 'Music' } },
  { name: 'tv', label: { zh: '电视', en: 'TV' } },
  { name: 'film', label: { zh: '电影', en: 'Film' } },
  { name: 'game-controller', label: { zh: '游戏', en: 'Game' } },
  { name: 'fitness', label: { zh: '健身', en: 'Fitness' } },
  { name: 'cafe', label: { zh: '咖啡', en: 'Cafe' } },
  { name: 'home', label: { zh: '家', en: 'Home' } },
];

const WordbookEditModal: React.FC<WordbookEditModalProps> = ({
  visible,
  wordbook,
  isCreating,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('book');
  const { appLanguage } = useAppLanguage();

  // 使用统一的翻译函数

  // 当模态框打开时，初始化数据
  React.useEffect(() => {
    if (visible) {
      if (wordbook) {
        // 编辑模式：加载现有数据
        setName(wordbook.name || '');
        setDescription(wordbook.overview || '');
        setIcon(wordbook.icon || 'book');
      } else if (isCreating) {
        // 创建模式：重置为默认值
        setName('');
        setDescription('');
        setIcon('book');
      }
    }
  }, [visible, wordbook, isCreating]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('name_required', appLanguage));
      return;
    }

    if (isCreating) {
      // 创建新单词本
      const newWordbook: Show = {
        id: Date.now(), // 临时ID，会在ShowsScreen中被重新分配
        name: name.trim(),
        original_name: name.trim(),
        overview: description.trim(),
        icon: icon,
        type: 'wordbook',
        status: 'completed',
        wordCount: 0,
        poster_path: '',
        backdrop_path: '',
        vote_average: 0,
        vote_count: 0,
        first_air_date: new Date().toISOString().split('T')[0],
        last_air_date: new Date().toISOString().split('T')[0],
        genre_ids: [],
        popularity: 0,
        original_language: 'zh',
        origin_country: ['CN'],
        description: description.trim(),
      } as Show;
      
      onSave(newWordbook);
    } else if (wordbook) {
      // 编辑现有单词本
      const updatedWordbook: Show = {
        ...wordbook,
        name: name.trim(),
        original_name: name.trim(),
        overview: description.trim(),
        icon: icon,
      };

      onSave(updatedWordbook);
    }
    
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

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
            <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.text.secondary} />
                              <Text style={styles.backButtonText}>{t('cancel', appLanguage)}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
                              {isCreating ? t('create_wordbook', appLanguage) : t('edit_wordbook', appLanguage)}
            </Text>
            <TouchableOpacity onPress={handleSave} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>
                {isCreating ? t('create', appLanguage) : t('save', appLanguage)}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 当前选中的ICON预览 */}
            <View style={styles.iconPreview}>
              <View style={styles.iconContainer}>
                <Ionicons name={icon as any} size={48} color={colors.primary[500]} />
              </View>
                              <Text style={styles.iconPreviewText}>{t('icon', appLanguage)}</Text>
            </View>

            {/* 标题输入 */}
            <View style={styles.inputSection}>
                              <Text style={styles.inputLabel}>{t('name', appLanguage)}</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                                  placeholder={t('name_required', appLanguage)}
                placeholderTextColor={colors.text.tertiary}
                maxLength={50}
              />
            </View>

            {/* 描述输入 */}
            <View style={styles.inputSection}>
                              <Text style={styles.inputLabel}>{t('description', appLanguage)}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                                  placeholder={t('description', appLanguage)}
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            {/* ICON选择 */}
            <View style={styles.inputSection}>
                              <Text style={styles.inputLabel}>{t('icon', appLanguage)}</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((iconOption) => (
                  <TouchableOpacity
                    key={iconOption.name}
                    style={[
                      styles.iconOption,
                      icon === iconOption.name && styles.iconOptionSelected
                    ]}
                    onPress={() => setIcon(iconOption.name)}
                  >
                    <Ionicons 
                      name={iconOption.name as any} 
                      size={24} 
                      color={icon === iconOption.name ? colors.text.inverse : colors.text.primary} 
                    />
                    <Text style={[
                      styles.iconLabel,
                      icon === iconOption.name && styles.iconLabelSelected
                    ]}>
                      {typeof iconOption.label === 'string' ? iconOption.label : (appLanguage === 'zh-CN' ? iconOption.label.zh : iconOption.label.en)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
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
    flex: 1,
    textAlign: 'center',
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    marginLeft: 4,
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '600',
  },
});

export default WordbookEditModal; 