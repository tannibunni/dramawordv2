import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { APP_LANGUAGES, AppLanguage, t, TranslationKey } from '../../constants/translations';

interface AppLanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const AppLanguageSelector: React.FC<AppLanguageSelectorProps> = ({
  visible,
  onClose,
}) => {
  const { appLanguage, setAppLanguage } = useAppLanguage();

  const handleLanguageSelect = async (language: AppLanguage) => {
    await setAppLanguage(language);
    onClose();
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
              {t('switch_language' as TranslationKey, appLanguage)}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

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
});

export default AppLanguageSelector; 