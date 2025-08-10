import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from '../../constants/config';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageSelectorProps {
  onLanguageChange?: (language: SupportedLanguageCode) => void;
  showProgress?: boolean;
  compact?: boolean;
  selectedLanguage: SupportedLanguageCode;
  appLanguage: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  showProgress = false,
  compact = false,
  appLanguage,
}) => {
  const { setSelectedLanguage, languageProgress } = useLanguage();

  const handleLanguageSelect = (language: SupportedLanguageCode) => {
    setSelectedLanguage(language);
    onLanguageChange?.(language);
  };

  const renderLanguageButton = (languageCode: SupportedLanguageCode) => {
    const language = SUPPORTED_LANGUAGES[languageCode];
    const progress = languageProgress[languageCode];
    const isSelected = selectedLanguage === languageCode;

    return (
      <TouchableOpacity
        key={languageCode}
        style={[
          styles.languageButton,
          isSelected && styles.selectedLanguageButton,
          compact && styles.compactButton,
        ]}
        onPress={() => handleLanguageSelect(languageCode)}
        activeOpacity={0.7}
      >
        <View style={styles.languageContent}>
          <Text style={styles.languageFlag}>{language.flag}</Text>
          <View style={styles.languageInfo}>
            <Text style={[
              styles.languageName,
              isSelected && styles.selectedLanguageName,
            ]}>
              {language.name}
            </Text>
            {showProgress && (
              <Text style={styles.progressText}>
                {progress.totalWords} 个单词
              </Text>
            )}
          </View>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.primary[500]}
              style={styles.checkIcon}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>学习语言</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.keys(SUPPORTED_LANGUAGES)
          .filter(languageCode => {
            // 根据UI语言过滤学习语言选项
            if (appLanguage === 'zh-CN' && languageCode === 'CHINESE') {
              return false; // 中文UI界面，过滤掉中文学习选项
            }
            
            if (appLanguage === 'en-US' && languageCode === 'ENGLISH') {
              return false; // 英文UI界面，过滤掉英文学习选项
            }
            
            return true;
          })
          .map((languageCode) =>
            renderLanguageButton(languageCode as SupportedLanguageCode)
          )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  languageButton: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLanguageButton: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  compactButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  selectedLanguageName: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  progressText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  checkIcon: {
    marginLeft: 4,
  },
});

export default LanguageSelector; 