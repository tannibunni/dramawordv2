import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { APP_LANGUAGES, AppLanguage, t, TranslationKey } from '../../constants/translations';
import { SUPPORTED_LANGUAGES } from '../../constants/config';

interface AppLanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  defaultTab?: 'app' | 'learning';
}

const AppLanguageSelector: React.FC<AppLanguageSelectorProps> = ({
  visible,
  onClose,
  defaultTab = 'app',
}) => {
  const { appLanguage, setAppLanguage } = useAppLanguage();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'app' | 'learning'>(defaultTab);

  // 加载学习语言设置
  useEffect(() => {
    if (visible) {
      loadLearningLanguages();
    }
  }, [visible]);

  const loadLearningLanguages = async () => {
    try {
      const saved = await AsyncStorage.getItem('learningLanguages');
      if (saved) {
        const languages = JSON.parse(saved);
        setSelectedLanguages(languages);
      } else {
        setSelectedLanguages([]);
      }
    } catch (error) {
      console.error('加载学习语言失败:', error);
      setSelectedLanguages([]);
    }
  };

  const handleLanguageSelect = async (language: AppLanguage) => {
    await setAppLanguage(language);
    onClose();
  };

  const toggleLearningLanguage = async (languageCode: string) => {
    console.log('🔄 切换学习语言:', languageCode);
    const newSelection = selectedLanguages.includes(languageCode) 
      ? selectedLanguages.filter(lang => lang !== languageCode)
      : [...selectedLanguages, languageCode];
    
    console.log('📝 更新后的学习语言选择:', newSelection);
    
    // 验证至少选择一种语言
    if (newSelection.length === 0) {
      Alert.alert(
        appLanguage === 'zh-CN' ? '请选择学习语言' : 'Please select learning languages',
        appLanguage === 'zh-CN' ? '至少需要选择一种学习语言' : 'You need to select at least one learning language',
        [{ text: t('ok', appLanguage) }]
      );
      return;
    }
    
    // 直接保存
    try {
      await AsyncStorage.setItem('learningLanguages', JSON.stringify(newSelection));
      console.log('✅ 已保存学习语言:', newSelection);
      setSelectedLanguages(newSelection);
    } catch (error) {
      console.error('保存学习语言失败:', error);
      Alert.alert(
        appLanguage === 'zh-CN' ? '保存失败' : 'Save Failed',
        appLanguage === 'zh-CN' ? '请稍后重试' : 'Please try again later',
        [{ text: t('ok', appLanguage) }]
      );
    }
  };



  const renderLanguageItem = (languageCode: AppLanguage) => {
    const language = APP_LANGUAGES[languageCode];
    const isSelected = appLanguage === languageCode;

    return (
      <TouchableOpacity
        key={languageCode}
        style={[
          styles.languageItem,
          isSelected && styles.selectedLanguageItem,
        ]}
        onPress={() => handleLanguageSelect(languageCode)}
        activeOpacity={0.7}
      >
        <View style={styles.languageInfo}>
          <Text style={styles.languageFlag}>{language.flag}</Text>
          <View style={styles.languageText}>
            <Text style={styles.languageName}>{language.name}</Text>
            <Text style={styles.languageNativeName}>{language.nativeName}</Text>
          </View>
        </View>
        
        <View style={styles.selectionIndicator}>
          {isSelected && (
            <>
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={colors.primary[500]} 
              />
              <View style={styles.currentIndicator}>
                <Text style={styles.currentText}>
                  {t('current_language' as TranslationKey, appLanguage)}
                </Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderLearningLanguageItem = (code: string, language: any) => {
    console.log('Profile渲染语言项', code, language);
    const isSelected = selectedLanguages.includes(code);
    
    return (
      <TouchableOpacity
        key={code}
        style={[
          styles.languageItem,
          isSelected && styles.selectedLanguageItem,
        ]}
        onPress={() => toggleLearningLanguage(code)}
        activeOpacity={0.7}
      >
        <View style={styles.languageInfo}>
          <Text style={styles.languageFlag}>{language.flag}</Text>
          <View style={styles.languageText}>
            <Text style={styles.languageName}>{language.name}</Text>
            <Text style={styles.languageNativeName}>{language.nativeName}</Text>
          </View>
        </View>
        
        <View style={styles.selectionIndicator}>
          {isSelected && (
            <>
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={colors.primary[500]} 
              />
              <View style={styles.currentIndicator}>
                <Text style={styles.currentText}>
                  {appLanguage === 'zh-CN' ? '已选择' : 'Selected'}
                </Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {appLanguage === 'zh-CN' ? '语言设置' : 'Language Settings'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* 标签页切换 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'app' && styles.activeTabButton]}
              onPress={() => setActiveTab('app')}
            >
              <Text style={[styles.tabText, activeTab === 'app' && styles.activeTabText]}>
                {appLanguage === 'zh-CN' ? '界面语言' : 'Interface Language'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'learning' && styles.activeTabButton]}
              onPress={() => setActiveTab('learning')}
            >
              <Text style={[styles.tabText, activeTab === 'learning' && styles.activeTabText]}>
                {appLanguage === 'zh-CN' ? '学习语言' : 'Learning Languages'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 界面语言设置 */}
          {activeTab === 'app' && (
            <>
          <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
            {Object.keys(APP_LANGUAGES).map((languageCode) =>
              renderLanguageItem(languageCode as AppLanguage)
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Text style={styles.footerText}>
              {t('current_language' as TranslationKey, appLanguage)}: {APP_LANGUAGES[appLanguage].name}
            </Text>
          </View>
            </>
          )}

          {/* 学习语言设置 */}
          {activeTab === 'learning' && (
            <>
              <View style={styles.learningContent}>
                <Text style={styles.learningDescription}>
                  {appLanguage === 'zh-CN' 
                    ? '选择你正在学习的语言' 
                    : 'Select the languages you want to learn. This will determine the available options in the home page language picker.'
                  }
                </Text>

                <ScrollView style={{ maxHeight: 400, minHeight: 120 }} showsVerticalScrollIndicator={true}>
                  {(() => {
                    console.log('🔍 开始渲染学习语言选项');
                    console.log('📋 SUPPORTED_LANGUAGES:', Object.values(SUPPORTED_LANGUAGES));
                    console.log('🌐 当前appLanguage:', appLanguage);
                    
                    const filteredLanguages = Object.values(SUPPORTED_LANGUAGES)
                      .filter(language => {
                        console.log('🔍 检查语言:', language.code, language.name);
                        // 当UI语言是英语时，隐藏英语选项
                        if (appLanguage === 'en-US' && language.code === 'en') {
                          console.log('❌ 隐藏英语选项');
                          return false;
                        }
                        // 当UI语言是中文时，隐藏中文选项
                        if (appLanguage === 'zh-CN' && language.code === 'zh') {
                          console.log('❌ 隐藏中文选项');
                          return false;
                        }
                        console.log('✅ 保留语言选项:', language.code);
                        return true;
                      });
                    
                    console.log('📝 过滤后的语言:', filteredLanguages);
                    
                    return filteredLanguages.map(language => {
                      // 当UI语言是英语时，将中文显示为"Chinese"
                      const displayLanguage = {
                        ...language,
                        name: appLanguage === 'en-US' && language.code === 'zh' ? 'Chinese' : language.name,
                        nativeName: appLanguage === 'en-US' && language.code === 'zh' ? '中文' : language.nativeName
                      };
                      console.log('🎨 渲染语言项:', language.code, displayLanguage);
                      return renderLearningLanguageItem(language.code, displayLanguage);
                    });
                  })()}
                </ScrollView>

                <Text style={styles.selectedCount}>
                  {appLanguage === 'zh-CN' 
                    ? `已选择 ${selectedLanguages.length} 种语言` 
                    : `${selectedLanguages.length} languages selected`
                  }
                </Text>
              </View>


            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  selectedLanguageItem: {
    backgroundColor: colors.primary[50],
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
  languageNativeName: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  selectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentIndicator: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  currentText: {
    fontSize: 12,
    color: colors.background.secondary,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  activeTabButton: {
    backgroundColor: colors.primary[50],
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  learningContent: {
    padding: 10,
  },
  learningDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 10,
    marginTop:10,
    lineHeight: 22,
    textAlign: 'center',
  },
  selectedCount: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },

});

export default AppLanguageSelector; 