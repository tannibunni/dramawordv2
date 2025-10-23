import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { t } from '../../../constants/translations';

interface CandidateSectionProps {
  type: 'enToCh' | 'chToJa' | 'enToJa' | 'pinyin' | 'chToEn';
  query: string;
  candidates: string[];
  onCandidateSelect: (candidate: string) => void;
  onClose: () => void;
  isLoading: boolean;
  appLanguage: string;
  pinyinCache?: Record<string, Array<{chinese: string, english: string}>>;
}

const CandidateSection: React.FC<CandidateSectionProps> = ({
  type,
  query,
  candidates,
  onCandidateSelect,
  onClose,
  isLoading,
  appLanguage,
  pinyinCache,
}) => {
  const getTitle = () => {
    switch (type) {
      case 'enToCh':
        return `"${query}"${t('english_to_chinese', appLanguage)}`;
      case 'chToJa':
        return `"${query}" 的日语翻译`;
      case 'enToJa':
        return `"${query}" 的日语翻译`;
      case 'pinyin':
        return `"${query}" 的中文候选词`;
      case 'chToEn':
        return `"${query}"${t('chinese_to_target', appLanguage, { target: 'English' })}`;
      default:
        return `"${query}" 的候选词`;
    }
  };

  const getCandidateDisplay = (candidate: string, index: number) => {
    if (type === 'pinyin' && pinyinCache && pinyinCache[query.toLowerCase()]) {
      const candidateObj = pinyinCache[query.toLowerCase()].find(item => item.chinese === candidate);
      const englishMeaning = candidateObj ? candidateObj.english : '';
      
      return (
        <TouchableOpacity 
          key={candidate} 
          onPress={() => onCandidateSelect(candidate)}
          style={styles.candidateItem}
        >
          <Text style={styles.candidateText}>{candidate}</Text>
          {englishMeaning && (
            <Text style={styles.candidateSubtext}>{englishMeaning}</Text>
          )}
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity 
        key={candidate} 
        onPress={() => onCandidateSelect(candidate)}
        style={styles.candidateItem}
      >
        <Text style={styles.candidateText}>{candidate}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wordCardWrapper}>
      <View style={[styles.wordCardCustom, styles.fixedCandidateCard]}>
        {/* 关闭按钮 */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={26} color={colors.text.secondary} />
        </TouchableOpacity>
        
        <Text style={styles.title}>{getTitle()}</Text>
        
        {candidates.map((candidate, index) => getCandidateDisplay(candidate, index))}
      </View>
    </View>
  );
};

const styles = {
  wordCardWrapper: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 0,
    paddingBottom: 24,
  },
  wordCardCustom: {
    width: '92%',
    minHeight: 220,
    maxWidth: 500,
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    padding: 28,
    marginVertical: 12,
  },
  fixedCandidateCard: {
    width: 340,
    minHeight: 260,
    maxWidth: 360,
    alignSelf: 'center' as const,
    paddingTop: 18,
    paddingBottom: 32,
    position: 'relative' as const,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: colors.text.primary,
    marginBottom: 16,
    marginTop: 8,
  },
  candidateItem: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    marginBottom: 10,
  },
  candidateText: {
    fontSize: 18,
    color: colors.primary[700],
    fontWeight: '500' as const,
  },
  candidateSubtext: {
    fontSize: 14,
    color: colors.primary[600],
    fontStyle: 'italic' as const,
    marginTop: 2,
  },
};

export default CandidateSection;
