import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';

interface InputTypeModalProps {
  visible: boolean;
  input: string;
  onSelectPinyin: () => void;
  onSelectEnglish: () => void;
  onClose: () => void;
}

export const InputTypeModal: React.FC<InputTypeModalProps> = ({
  visible,
  input,
  onSelectPinyin,
  onSelectEnglish,
  onClose
}) => {
  const { appLanguage } = useAppLanguage();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>选择输入类型</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.inputText}>"{input}"</Text>
            <Text style={styles.description}>
              请选择您的输入类型，以便我们提供最准确的翻译结果
            </Text>
            
            <View style={styles.options}>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={onSelectPinyin}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="language" size={24} color={colors.primary[500]} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>拼音输入</Text>
                  <Text style={styles.optionDescription}>
                    将拼音转换为中文词汇
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={onSelectEnglish}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="globe" size={24} color={colors.primary[500]} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>英文输入</Text>
                  <Text style={styles.optionDescription}>
                    将英文翻译为中文
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  inputText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: colors.background.secondary,
    padding: 12,
    borderRadius: 8,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  options: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});
