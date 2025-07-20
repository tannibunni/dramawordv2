import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { detectSystemLanguage, isChineseSystem } from '../../utils/languageDetector';
import * as Localization from 'expo-localization';

interface LanguageDebugInfoProps {
  show?: boolean;
}

export const LanguageDebugInfo: React.FC<LanguageDebugInfoProps> = ({ show = false }) => {
  const { appLanguage, systemLanguage } = useAppLanguage();
  
  if (!show) {
    return null;
  }

  const systemLocales = Localization.getLocales();
  const detectedLanguage = detectSystemLanguage();
  const isChinese = isChineseSystem();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌍 语言调试信息</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>当前应用语言:</Text>
        <Text style={styles.value}>{appLanguage}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>系统语言:</Text>
        <Text style={styles.value}>{systemLanguage}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>检测到的语言:</Text>
        <Text style={styles.value}>{detectedLanguage}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>是否为中文系统:</Text>
        <Text style={styles.value}>{isChinese ? '是' : '否'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>系统语言列表:</Text>
        <Text style={styles.value}>
          {systemLocales.map((locale, index) => 
            `${locale.languageCode}${locale.regionCode ? `-${locale.regionCode}` : ''}`
          ).join(', ')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
}); 