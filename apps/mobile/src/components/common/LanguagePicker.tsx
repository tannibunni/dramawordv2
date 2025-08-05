import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from '../../constants/config';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguagePickerProps {
  onLanguageChange?: (language: string) => void;
  onNavigateToLanguageSettings?: () => void;
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({ onLanguageChange, onNavigateToLanguageSettings }) => {
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const { appLanguage } = useAppLanguage();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [learningLanguages, setLearningLanguages] = useState<string[]>([]);

  // 计算当前语言，确保在selectedLanguage更新后重新计算
  const currentLanguage = SUPPORTED_LANGUAGES[selectedLanguage];
  
  // 添加图标显示调试日志
  console.log('🎯 LanguagePicker图标调试 - selectedLanguage:', selectedLanguage);
  console.log('🎯 LanguagePicker图标调试 - currentLanguage:', currentLanguage);
  console.log('🎯 LanguagePicker图标调试 - 图标显示:', currentLanguage.flag, currentLanguage.name);

  // 加载学习语言设置
  useEffect(() => {
    loadLearningLanguages();
  }, []); // 只在组件挂载时加载一次

  // 监听学习语言变化，重新加载
  useEffect(() => {
    const checkLearningLanguages = async () => {
      // 强制刷新AsyncStorage
      await AsyncStorage.flushGetRequests();
      const saved = await AsyncStorage.getItem('learningLanguages');
      console.log('LanguagePicker - 重新检查学习语言 (强制刷新):', saved);
      
      if (saved) {
        const languages = JSON.parse(saved);
        console.log('LanguagePicker - 解析后的学习语言:', languages);
        setLearningLanguages(languages);
        
        // 重新计算当前语言
        const currentLang = SUPPORTED_LANGUAGES[selectedLanguage];
        console.log('LanguagePicker - 重新检查：当前语言:', currentLang.code);
        
        // 如果当前选择的语言不在学习语言列表中，自动切换到第一个可用的语言
        if (languages.length > 0 && !languages.includes(currentLang.code)) {
          console.log('LanguagePicker - 重新检查：当前语言不在学习列表中，切换到:', languages[0]);
          const newLanguageKey = getLanguageKeyByCode(languages[0]);
          console.log('LanguagePicker - 重新检查：切换到语言键:', newLanguageKey);
          if (newLanguageKey) {
            setSelectedLanguage(newLanguageKey);
          }
        }
      }
    };

    // 延迟检查，确保首次启动弹窗完成后执行
    const timer = setTimeout(checkLearningLanguages, 1000);
    return () => clearTimeout(timer);
  }, [selectedLanguage]); // 添加selectedLanguage作为依赖

  // 添加实时监听AsyncStorage变化
  useEffect(() => {
    const interval = setInterval(async () => {
      const saved = await AsyncStorage.getItem('learningLanguages');
      if (saved) {
        const languages = JSON.parse(saved);
        setLearningLanguages(prev => {
          // 只有当数据真正发生变化时才更新
          if (JSON.stringify(prev) !== JSON.stringify(languages)) {
            console.log('LanguagePicker - 检测到学习语言变化:', languages);
            return languages;
          }
          return prev;
        });
      }
    }, 500); // 每500ms检查一次

    return () => clearInterval(interval);
  }, []);

  const loadLearningLanguages = async () => {
    try {
      const saved = await AsyncStorage.getItem('learningLanguages');
      console.log('LanguagePicker - 加载的学习语言:', saved);
      
      if (saved) {
        const languages = JSON.parse(saved);
        console.log('LanguagePicker - 解析后的学习语言:', languages);
        
        // 重新计算当前语言
        const currentLang = SUPPORTED_LANGUAGES[selectedLanguage];
        console.log('LanguagePicker - 当前语言:', currentLang.code);
        
        setLearningLanguages(languages);
        
        // 如果当前选择的语言不在学习语言列表中，自动切换到第一个可用的语言
        if (languages.length > 0 && !languages.includes(currentLang.code)) {
          console.log('LanguagePicker - 当前语言不在学习列表中，切换到:', languages[0]);
          const newLanguageKey = getLanguageKeyByCode(languages[0]);
          console.log('LanguagePicker - 切换到语言键:', newLanguageKey);
          if (newLanguageKey) {
            setSelectedLanguage(newLanguageKey);
          }
        }
      } else {
        // 如果没有设置学习语言，默认显示所有语言
        console.log('LanguagePicker - 没有学习语言设置，显示所有语言');
        setLearningLanguages(Object.values(SUPPORTED_LANGUAGES).map(lang => lang.code));
      }
    } catch (error) {
      console.error('加载学习语言失败:', error);
      // 出错时显示所有语言
      setLearningLanguages(Object.values(SUPPORTED_LANGUAGES).map(lang => lang.code));
    }
  };

  const handleLanguageSwitch = (languageCode: SupportedLanguageCode) => {
    console.log('🎯 LanguagePicker - handleLanguageSwitch被调用:', languageCode);
    console.log('🎯 LanguagePicker - 切换前selectedLanguage:', selectedLanguage);
    setSelectedLanguage(languageCode);
    // 传递实际的语言代码而不是SupportedLanguageCode
    const actualLanguageCode = SUPPORTED_LANGUAGES[languageCode].code;
    console.log('🎯 LanguagePicker - 实际语言代码:', actualLanguageCode);
    onLanguageChange?.(actualLanguageCode);
    setIsModalVisible(false);
  };

  // 根据language.code找到对应的SupportedLanguageCode
  const getLanguageKeyByCode = (code: string): SupportedLanguageCode => {
    const entry = Object.entries(SUPPORTED_LANGUAGES).find(([key, lang]) => lang.code === code);
    return entry ? (entry[0] as SupportedLanguageCode) : 'ENGLISH';
  };

  return (
    <View style={styles.container}>
      {/* 语言环境切换按钮 */}
      <TouchableOpacity
        style={styles.flagButton}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.flagText}>{currentLanguage.flag}</Text>
        <Ionicons 
          name="chevron-down" 
          size={14} 
          color={colors.neutral[600]} 
          style={styles.chevron}
        />
      </TouchableOpacity>

      {/* 语言选择模态框 */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('switch_language_environment', appLanguage)}</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {(() => {
                console.log('🎯 LanguagePicker渲染 - learningLanguages状态:', learningLanguages);
                console.log('🎯 LanguagePicker渲染 - appLanguage状态:', appLanguage);
                console.log('🎯 LanguagePicker渲染 - 过滤前语言数量:', Object.entries(SUPPORTED_LANGUAGES).length);
                
                const filteredLanguages = Object.entries(SUPPORTED_LANGUAGES)
                  .filter(([key, language]) => {
                    // 首先检查是否在学习语言列表中
                    const isIncluded = learningLanguages.includes(language.code);
                    
                    // 然后检查界面语言过滤规则
                    let shouldShow = isIncluded;
                    
                    // 当界面语言是英文时，隐藏English选项
                    if (appLanguage === 'en-US' && language.code === 'en') {
                      shouldShow = false;
                      console.log(`🔍 过滤语言 ${language.code}: ❌ 隐藏 (界面语言为英文)`);
                    }
                    // 当界面语言是中文时，隐藏Chinese选项
                    else if (appLanguage === 'zh-CN' && language.code === 'zh') {
                      shouldShow = false;
                      console.log(`🔍 过滤语言 ${language.code}: ❌ 隐藏 (界面语言为中文)`);
                    }
                    else {
                      console.log(`🔍 过滤语言 ${language.code}: ${isIncluded ? '✅ 包含' : '❌ 不包含'} (学习语言: ${learningLanguages.join(', ')})`);
                    }
                    
                    return shouldShow;
                  });
                
                console.log('🎯 LanguagePicker渲染 - 过滤后语言数量:', filteredLanguages.length);
                
                                return filteredLanguages.map(([key, language]) => (
                <TouchableOpacity
                      key={language.code}
                  style={[
                    styles.languageItem,
                      language.code === currentLanguage.code && styles.selectedLanguageItem
                  ]}
                    onPress={() => handleLanguageSwitch(getLanguageKeyByCode(language.code))}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <View style={styles.languageText}>
                      <Text style={styles.languageName}>
                        {appLanguage === 'en-US' ? language.nativeName : language.name}
                      </Text>
                      <Text style={styles.languageCode}>
                        {appLanguage === 'en-US' ? language.englishName : language.code.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.selectionIndicator}>
                      {language.code === currentLanguage.code && (
                      <>
                        <Ionicons 
                          name="checkmark-circle" 
                          size={24} 
                          color={colors.primary[500]} 
                        />
                        <View style={styles.currentIndicator}>
                          <Text style={styles.currentText}>{t('current_language', appLanguage)}</Text>
                        </View>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              ));
              })()}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.footerText}>
                {t('current_environment', appLanguage)}{appLanguage === 'en-US' ? currentLanguage.nativeName : currentLanguage.name}
              </Text>
              <TouchableOpacity
                style={styles.addMoreLink}
                onPress={() => {
                  setIsModalVisible(false);
                  onNavigateToLanguageSettings?.();
                }}
              >
                <Text style={styles.addMoreText}>
                  {appLanguage === 'zh-CN' ? '添加更多语言 >>' : 'Add more languages >>'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  flagText: {
    fontSize: 18,
    marginRight: 4,
  },
  chevron: {
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: colors.neutral[900],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    paddingHorizontal: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  selectedLanguageItem: {
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentIndicator: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  currentText: {
    fontSize: 10,
    color: colors.text.inverse,
    fontWeight: '500',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  addMoreLink: {
    marginTop: 8,
    paddingVertical: 4,
  },
  addMoreText: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '500',
  },
});

export default LanguagePicker; 