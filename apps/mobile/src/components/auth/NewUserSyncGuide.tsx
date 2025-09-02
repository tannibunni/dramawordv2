import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';

interface NewUserSyncGuideProps {
  visible: boolean;
  onClose: () => void;
  onStartSync: () => void;
  appleId: string;
}

export const NewUserSyncGuide: React.FC<NewUserSyncGuideProps> = ({
  visible,
  onClose,
  onStartSync,
  appleId
}) => {
  const { appLanguage } = useAppLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: appLanguage === 'zh-CN' ? '欢迎使用剧词记！' : 'Welcome to DramaWord!',
      description: appLanguage === 'zh-CN' 
        ? '我们检测到您可能在新设备上使用APP，或者APP被重新安装。让我们帮您恢复学习进度。'
        : 'We detected that you may be using the app on a new device, or the app has been reinstalled. Let us help you restore your learning progress.',
      icon: 'cloud-download-outline',
      color: colors.primary[500]
    },
    {
      title: appLanguage === 'zh-CN' ? '数据同步内容' : 'Data Sync Content',
      description: appLanguage === 'zh-CN'
        ? '我们将同步您的词汇学习记录、剧单、学习进度、经验值和徽章等所有数据。'
        : 'We will sync all your data including vocabulary learning records, show lists, learning progress, experience points, and badges.',
      icon: 'library-outline',
      color: colors.success[500]
    },
    {
      title: appLanguage === 'zh-CN' ? '同步过程' : 'Sync Process',
      description: appLanguage === 'zh-CN'
        ? '同步过程包括：检测设备状态 → 下载云端数据 → 覆盖本地数据 → 完成初始化。整个过程通常需要1-2分钟。'
        : 'The sync process includes: detecting device status → downloading cloud data → overwriting local data → completing initialization. The entire process usually takes 1-2 minutes.',
      icon: 'sync-outline',
      color: colors.warning[500]
    },
    {
      title: appLanguage === 'zh-CN' ? '开始同步' : 'Start Sync',
      description: appLanguage === 'zh-CN'
        ? '准备好开始同步了吗？点击下方按钮开始恢复您的学习数据。'
        : 'Ready to start syncing? Click the button below to begin restoring your learning data.',
      icon: 'play-circle-outline',
      color: colors.success[500]
    }
  ];

  // 处理开始同步
  const handleStartSync = () => {
    Alert.alert(
      appLanguage === 'zh-CN' ? '确认开始同步' : 'Confirm Sync Start',
      appLanguage === 'zh-CN'
        ? '确定要开始数据同步吗？同步过程会覆盖本地数据。'
        : 'Are you sure you want to start data sync? The sync process will overwrite local data.',
      [
        { text: appLanguage === 'zh-CN' ? '取消' : 'Cancel', style: 'cancel' },
        { 
          text: appLanguage === 'zh-CN' ? '开始同步' : 'Start Sync', 
          onPress: () => {
            onStartSync();
            onClose();
          }
        }
      ]
    );
  };

  // 处理下一步
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 处理上一步
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 处理跳过
  const handleSkip = () => {
    Alert.alert(
      appLanguage === 'zh-CN' ? '跳过同步' : 'Skip Sync',
      appLanguage === 'zh-CN'
        ? '跳过同步意味着您将无法恢复云端的学习数据。确定要跳过吗？'
        : 'Skipping sync means you won\'t be able to restore your cloud learning data. Are you sure you want to skip?',
      [
        { text: appLanguage === 'zh-CN' ? '取消' : 'Cancel', style: 'cancel' },
        { 
          text: appLanguage === 'zh-CN' ? '确定跳过' : 'Skip Anyway', 
          style: 'destructive',
          onPress: onClose
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 头部 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {appLanguage === 'zh-CN' ? '新设备数据同步' : 'New Device Data Sync'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* 进度指示器 */}
          <View style={styles.progressIndicator}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.progressDotActive,
                  index < currentStep && styles.progressDotCompleted
                ]}
              >
                {index < currentStep && (
                  <Ionicons name="checkmark" size={12} color="white" />
                )}
              </View>
            ))}
          </View>

          {/* 内容区域 */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.stepContainer}>
              {/* 步骤图标 */}
              <View style={[styles.stepIcon, { backgroundColor: steps[currentStep].color + '20' }]}>
                <Ionicons 
                  name={steps[currentStep].icon as any} 
                  size={48} 
                  color={steps[currentStep].color} 
                />
              </View>

              {/* 步骤标题 */}
              <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>

              {/* 步骤描述 */}
              <Text style={styles.stepDescription}>{steps[currentStep].description}</Text>

              {/* 额外信息 */}
              {currentStep === 0 && (
                <View style={styles.infoCard}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.primary[500]} />
                  <Text style={styles.infoText}>
                    {appLanguage === 'zh-CN' 
                      ? `检测到Apple ID: ${appleId}`
                      : `Detected Apple ID: ${appleId}`
                    }
                  </Text>
                </View>
              )}

              {currentStep === 1 && (
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="book-outline" size={16} color={colors.success[500]} />
                    <Text style={styles.featureText}>
                      {appLanguage === 'zh-CN' ? '词汇学习记录' : 'Vocabulary learning records'}
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="tv-outline" size={16} color={colors.success[500]} />
                    <Text style={styles.featureText}>
                      {appLanguage === 'zh-CN' ? '剧单和单词本' : 'Show lists and wordbooks'}
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="trophy-outline" size={16} color={colors.success[500]} />
                    <Text style={styles.featureText}>
                      {appLanguage === 'zh-CN' ? '学习进度和经验值' : 'Learning progress and experience'}
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="ribbon-outline" size={16} color={colors.success[500]} />
                    <Text style={styles.featureText}>
                      {appLanguage === 'zh-CN' ? '徽章和成就' : 'Badges and achievements'}
                    </Text>
                  </View>
                </View>
              )}

              {currentStep === 2 && (
                <View style={styles.processSteps}>
                  <View style={styles.processStep}>
                    <View style={[styles.processStepNumber, { backgroundColor: colors.primary[500] }]}>
                      <Text style={styles.processStepNumberText}>1</Text>
                    </View>
                    <Text style={styles.processStepText}>
                      {appLanguage === 'zh-CN' ? '检测设备状态' : 'Detect device status'}
                    </Text>
                  </View>
                  <View style={styles.processStep}>
                    <View style={[styles.processStepNumber, { backgroundColor: colors.success[500] }]}>
                      <Text style={styles.processStepNumberText}>2</Text>
                    </View>
                    <Text style={styles.processStepText}>
                      {appLanguage === 'zh-CN' ? '下载云端数据' : 'Download cloud data'}
                    </Text>
                  </View>
                  <View style={styles.processStep}>
                    <View style={[styles.processStepNumber, { backgroundColor: colors.warning[500] }]}>
                      <Text style={styles.processStepNumberText}>3</Text>
                    </View>
                    <Text style={styles.processStepText}>
                      {appLanguage === 'zh-CN' ? '覆盖本地数据' : 'Overwrite local data'}
                    </Text>
                  </View>
                  <View style={styles.processStep}>
                    <View style={[styles.processStepNumber, { backgroundColor: colors.success[500] }]}>
                      <Text style={styles.processStepNumberText}>4</Text>
                    </View>
                    <Text style={styles.processStepText}>
                      {appLanguage === 'zh-CN' ? '完成初始化' : 'Complete initialization'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* 底部按钮 */}
          <View style={styles.bottomButtons}>
            {/* 跳过按钮 */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>
                {appLanguage === 'zh-CN' ? '跳过' : 'Skip'}
              </Text>
            </TouchableOpacity>

            {/* 导航按钮 */}
            <View style={styles.navigationButtons}>
              {currentStep > 0 && (
                <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                  <Ionicons name="chevron-back" size={20} color={colors.primary[500]} />
                  <Text style={styles.navButtonText}>
                    {appLanguage === 'zh-CN' ? '上一步' : 'Previous'}
                  </Text>
                </TouchableOpacity>
              )}

              {currentStep < steps.length - 1 ? (
                <TouchableOpacity style={styles.navButton} onPress={handleNext}>
                  <Text style={styles.navButtonText}>
                    {appLanguage === 'zh-CN' ? '下一步' : 'Next'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.primary[500]} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.startButton} onPress={handleStartSync}>
                  <Ionicons name="play" size={20} color="white" />
                  <Text style={styles.startButtonText}>
                    {appLanguage === 'zh-CN' ? '开始同步' : 'Start Sync'}
                  </Text>
                </TouchableOpacity>
              )}
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
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    marginTop: 80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: colors.primary[500],
  },
  progressDotCompleted: {
    backgroundColor: colors.success[500],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  stepIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 12,
  },
  featuresList: {
    width: '100%',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 12,
  },
  processSteps: {
    width: '100%',
    marginBottom: 20,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  processStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  processStepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  processStepText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  bottomButtons: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  skipButtonText: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  navButtonText: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});
