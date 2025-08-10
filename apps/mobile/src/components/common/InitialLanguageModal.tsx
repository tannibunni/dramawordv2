import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode, APP_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface InitialLanguageModalProps {
  visible: boolean;
  onComplete: () => void;
}

const INITIAL_LANGUAGE_SETUP_KEY = 'initialLanguageSetup';

export const InitialLanguageModal: React.FC<InitialLanguageModalProps> = ({
  visible,
  onComplete,
}) => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const { appLanguage } = useAppLanguage();

  const toggleLanguage = (languageCode: string) => {
    console.log('🔄 切换语言:', languageCode);
    setSelectedLanguages(prev => {
      const newSelection = prev.includes(languageCode) 
        ? prev.filter(lang => lang !== languageCode)
        : [...prev, languageCode];
      console.log('📝 更新后的选择:', newSelection);
      return newSelection;
    });
  };

  // 根据language.code找到对应的SupportedLanguageCode
  const getLanguageKeyByCode = (code: string): SupportedLanguageCode => {
    const entry = Object.entries(SUPPORTED_LANGUAGES).find(([key, lang]) => lang.code === code);
    return entry ? (entry[0] as SupportedLanguageCode) : 'ENGLISH';
  };

  const handleComplete = async () => {
    if (selectedLanguages.length === 0) {
      Alert.alert(
        appLanguage === 'zh-CN' ? '请选择学习语言' : 'Please select learning languages',
        appLanguage === 'zh-CN' ? '至少需要选择一种学习语言' : 'You need to select at least one learning language',
        [{ text: t('ok', appLanguage) }]
      );
      return;
    }

    try {
      // 保存学习语言设置
      await AsyncStorage.setItem('learningLanguages', JSON.stringify(selectedLanguages));
      console.log('✅ 已保存学习语言:', selectedLanguages);
      
      // 将第一个选择的语言设为默认语言
      const firstLanguageCode = selectedLanguages[0];
      const languageKey = getLanguageKeyByCode(firstLanguageCode);
      if (languageKey) {
        await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.SELECTED_LANGUAGE, languageKey);
        console.log('✅ 已设置默认语言:', firstLanguageCode, languageKey);
      }
      
      // 强制刷新AsyncStorage
      await AsyncStorage.flushGetRequests();
      console.log('✅ 已强制刷新AsyncStorage');
      
      // 标记初始设置已完成
      await AsyncStorage.setItem(INITIAL_LANGUAGE_SETUP_KEY, 'true');
      console.log('✅ 已标记初始设置完成');
      
      onComplete();
    } catch (error) {
      console.error('保存学习语言失败:', error);
      Alert.alert(
        appLanguage === 'zh-CN' ? '保存失败' : 'Save Failed',
        appLanguage === 'zh-CN' ? '请稍后重试' : 'Please try again later',
        [{ text: t('ok', appLanguage) }]
      );
    }
  };

  const renderLanguageItem = (code: string, language: any) => {
    console.log('渲染语言项', code, language);
    const isSelected = selectedLanguages.includes(code);
    // 打印Text内容
    console.log('flag:', language.flag, 'name:', language.name, 'nativeName:', language.nativeName, 'code:', language.code);
    
    return (
      <TouchableOpacity
        key={code}
        style={{ 
          borderWidth: 3, 
          borderColor: isSelected ? '#4CAF50' : '#E0E0E0', 
          backgroundColor: isSelected ? '#E8F5E8' : 'white', 
          margin: 10, 
          padding: 20,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 100,
          position: 'relative'
        }}
        onPress={() => toggleLanguage(code)}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 28, color: 'black', fontWeight: 'bold', textAlign: 'center' }}>
          {language.flag} {language.name}
        </Text>
        <Text style={{ fontSize: 20, color: 'black', marginTop: 8 }}>
          {language.nativeName} ({language.code.toUpperCase()})
        </Text>
        
        {/* 选中状态显示打钩图标 */}
        {isSelected && (
          <View style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: '#4CAF50',
            borderRadius: 12,
            width: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 调试日志
  useEffect(() => {
    console.log('SUPPORTED_LANGUAGES:', SUPPORTED_LANGUAGES);
    console.log('LANGUAGES ARRAY:', Object.values(SUPPORTED_LANGUAGES));
  }, []);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={() => {}} // 不允许关闭，必须完成设置
    >
      <View style={[styles.overlay, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.modalContainer, { 
          height: '100%', 
          width: '100%', 
          borderRadius: 0,
          padding: 0,
          margin: 0
        }]}>
          <View style={[styles.header, { padding: 0, paddingTop: 80 }]}>
            {/* <Text style={styles.title}>
              {appLanguage === 'zh-CN' ? '欢迎使用剧词记！' : 'Welcome to Dramaword!'}
            </Text> */}
            <Text style={styles.title}>
              {appLanguage === 'zh-CN' 
                ? '请选择你正在学习的语言' 
                : 'Please select the languages you want to learn. This will determine the available options in the home page language picker.'
              }
            </Text>
          </View>

          <View style={[styles.content, { flex: 1, padding: 10 }]}>
            

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {Object.values(SUPPORTED_LANGUAGES)
                .filter(language => {
                  // 根据UI语言过滤学习语言选项
                  if (appLanguage === 'zh-CN' && language.code === 'zh') {
                    console.log('❌ 中文UI界面，过滤掉中文学习选项');
                    return false;
                  }
                  
                  if (appLanguage === 'en-US' && language.code === 'en') {
                    console.log('❌ 英文UI界面，过滤掉英文学习选项');
                    return false;
                  }
                  
                  // 移除界面语言过滤规则，显示所有语言选项
                  return true;
                })
                .map(language => {
                  // 当UI语言是英语时，显示英文名称，但保持原文字符
                  const displayLanguage = {
                    ...language,
                    name: appLanguage === 'en-US' ? language.englishName : language.name,
                    // 保持原文字符不变
                    nativeName: language.nativeName
                  };
                  return renderLanguageItem(language.code, displayLanguage);
                })
              }
            </ScrollView>

            <Text style={styles.selectedCount}>
              {appLanguage === 'zh-CN' 
                ? `已选择 ${selectedLanguages.length} 种语言` 
                : `${selectedLanguages.length} languages selected`
              }
            </Text>
          </View>

          <View style={[styles.footer, { padding: 20, paddingBottom: 40 }]}>
            <TouchableOpacity
              style={[styles.button, styles.completeButton]}
              onPress={handleComplete}
            >
              <Text style={styles.completeButtonText}>
                {appLanguage === 'zh-CN' ? '开始学习' : 'Start Learning'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalContainer: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  languageList: {
    flex: 1,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  selectedLanguageItem: {
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  languageCode: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  selectionIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.medium,
  },
  selectedCount: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: colors.primary[500],
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 