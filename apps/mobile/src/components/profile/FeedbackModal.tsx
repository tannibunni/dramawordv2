import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
}) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { appLanguage } = useAppLanguage();

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        appLanguage === 'zh-CN' ? '请选择评分' : 'Please select a rating',
        appLanguage === 'zh-CN' ? '请至少给一星评分' : 'Please give at least one star',
        [{ text: t('ok', appLanguage) }]
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('https://dramaword-api.onrender.com/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedback,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        Alert.alert(
          appLanguage === 'zh-CN' ? '感谢您的反馈！' : 'Thank you for your feedback!',
          appLanguage === 'zh-CN' ? '我们会认真考虑您的建议，让剧词记变得更好。' : 'We will carefully consider your suggestions to make Dramaword better.',
          [
            {
              text: t('ok', appLanguage),
              onPress: () => {
                setRating(0);
                setFeedback('');
                onClose();
              },
            },
          ]
        );
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('提交反馈失败:', error);
      Alert.alert(
        appLanguage === 'zh-CN' ? '提交失败' : 'Submission Failed',
        appLanguage === 'zh-CN' ? '网络连接失败，请稍后重试' : 'Network connection failed, please try again later',
        [{ text: t('ok', appLanguage) }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? colors.primary[500] : colors.neutral[400]}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {appLanguage === 'zh-CN' ? '反馈问题' : 'Feedback'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>
              {appLanguage === 'zh-CN' ? '请为剧词记评分：' : 'Please rate Dramaword:'}
            </Text>
            {renderStars()}

            <Text style={styles.label}>
              {appLanguage === 'zh-CN' ? '您的意见（可选）：' : 'Your feedback (optional):'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                appLanguage === 'zh-CN'
                  ? '请告诉我们您的建议或遇到的问题...'
                  : 'Please tell us your suggestions or issues...'
              }
              placeholderTextColor={colors.text.tertiary}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>
                {appLanguage === 'zh-CN' ? '取消' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {appLanguage === 'zh-CN' ? '提交' : 'Submit'}
                </Text>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starButton: {
    padding: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    minHeight: 80,
    maxHeight: 120,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[400],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
}); 