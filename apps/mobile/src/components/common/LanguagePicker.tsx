import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../packages/ui/src/tokens';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from '../../constants/config';

interface LanguagePickerProps {
  onLanguageChange?: (language: string) => void;
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({ onLanguageChange }) => {
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const currentLanguage = SUPPORTED_LANGUAGES[selectedLanguage];

  const handleLanguageSwitch = (languageCode: SupportedLanguageCode) => {
    setSelectedLanguage(languageCode);
    onLanguageChange?.(languageCode);
    setIsModalVisible(false);
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
              <Text style={styles.modalTitle}>切换语言环境</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, language]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageItem,
                    code === selectedLanguage && styles.selectedLanguageItem
                  ]}
                  onPress={() => handleLanguageSwitch(code as SupportedLanguageCode)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <View style={styles.languageText}>
                      <Text style={styles.languageName}>{language.name}</Text>
                      <Text style={styles.languageCode}>{language.code.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.selectionIndicator}>
                    {code === selectedLanguage && (
                      <>
                        <Ionicons 
                          name="checkmark-circle" 
                          size={24} 
                          color={colors.primary[500]} 
                        />
                        <View style={styles.currentIndicator}>
                          <Text style={styles.currentText}>当前</Text>
                        </View>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.footerText}>
                当前环境：{currentLanguage.name}
              </Text>
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
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
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
});

export default LanguagePicker; 