// 离线词库下载组件
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ProgressBarAndroid,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { DictionaryManager } from '../../services/dictionaryManager/DictionaryManager';

interface OfflineDictionarySectionProps {
  selectedLanguages: string[];
  onDictionaryStatusChange?: (language: string, status: DictionaryStatus) => void;
}

interface DictionaryStatus {
  available: boolean;
  downloading: boolean;
  progress: number;
  size: number;
  lastUpdated?: Date;
  error?: string;
}

const OfflineDictionarySection: React.FC<OfflineDictionarySectionProps> = ({
  selectedLanguages,
  onDictionaryStatusChange,
}) => {
  const { appLanguage } = useAppLanguage();
  const [dictionaryStatuses, setDictionaryStatuses] = useState<Record<string, DictionaryStatus>>({});
  const [loading, setLoading] = useState(false);
  const dictionaryManager = DictionaryManager.getInstance();

  // 语言到词库名称的映射
  const languageToDictionaryMap: Record<string, string> = {
    'zh': 'CC-CEDICT',
    'ja': 'JMdict',
    'ko': 'Korean Dictionary',
  };

  // 加载词库状态
  useEffect(() => {
    loadDictionaryStatuses();
  }, [selectedLanguages]);

  const loadDictionaryStatuses = async () => {
    try {
      setLoading(true);
      const status = await dictionaryManager.getDictionaryStatus();
      
      if (status) {
        const newStatuses: Record<string, DictionaryStatus> = {};
        
        selectedLanguages.forEach(langCode => {
          const dictionaryName = languageToDictionaryMap[langCode];
          if (dictionaryName) {
            const dictInfo = status.dictionaries.find((d: any) => d.language === langCode);
            newStatuses[langCode] = {
              available: dictInfo?.available || false,
              downloading: false,
              progress: 0,
              size: dictInfo?.fileSize || 0,
              lastUpdated: dictInfo?.lastModified ? new Date(dictInfo.lastModified) : undefined,
            };
          }
        });
        
        setDictionaryStatuses(newStatuses);
      }
    } catch (error) {
      console.error('加载词库状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDictionary = async (languageCode: string) => {
    const dictionaryName = languageToDictionaryMap[languageCode];
    if (!dictionaryName) return;

    try {
      // 更新状态为下载中
      setDictionaryStatuses(prev => ({
        ...prev,
        [languageCode]: {
          ...prev[languageCode],
          downloading: true,
          progress: 0,
          error: undefined,
        }
      }));

      // 开始下载
      const success = await dictionaryManager.downloadDictionary(dictionaryName);
      
      if (success) {
        // 下载成功，更新状态
        setDictionaryStatuses(prev => ({
          ...prev,
          [languageCode]: {
            ...prev[languageCode],
            available: true,
            downloading: false,
            progress: 100,
            error: undefined,
          }
        }));
        
        Alert.alert(
          appLanguage === 'zh-CN' ? '下载成功' : 'Download Successful',
          appLanguage === 'zh-CN' 
            ? `${dictionaryName} 词库下载完成` 
            : `${dictionaryName} dictionary downloaded successfully`,
          [{ text: appLanguage === 'zh-CN' ? '确定' : 'OK' }]
        );
      } else {
        // 下载失败
        setDictionaryStatuses(prev => ({
          ...prev,
          [languageCode]: {
            ...prev[languageCode],
            downloading: false,
            error: appLanguage === 'zh-CN' ? '下载失败' : 'Download failed',
          }
        }));
        
        Alert.alert(
          appLanguage === 'zh-CN' ? '下载失败' : 'Download Failed',
          appLanguage === 'zh-CN' 
            ? '请检查网络连接后重试' 
            : 'Please check your internet connection and try again',
          [{ text: appLanguage === 'zh-CN' ? '确定' : 'OK' }]
        );
      }
    } catch (error) {
      console.error('下载词库失败:', error);
      setDictionaryStatuses(prev => ({
        ...prev,
        [languageCode]: {
          ...prev[languageCode],
          downloading: false,
          error: appLanguage === 'zh-CN' ? '下载出错' : 'Download error',
        }
      }));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderDictionaryItem = (languageCode: string) => {
    const dictionaryName = languageToDictionaryMap[languageCode];
    if (!dictionaryName) return null;

    const status = dictionaryStatuses[languageCode];
    if (!status) return null;

    return (
      <View key={languageCode} style={styles.dictionaryItem}>
        <View style={styles.dictionaryHeader}>
          <View style={styles.dictionaryInfo}>
            <Ionicons 
              name={status.available ? "library" : "library-outline"} 
              size={20} 
              color={status.available ? colors.primary[500] : colors.text.secondary} 
            />
            <Text style={styles.dictionaryName}>{dictionaryName}</Text>
            {status.available && (
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>
                  {appLanguage === 'zh-CN' ? '已下载' : 'Downloaded'}
                </Text>
              </View>
            )}
          </View>
          
          {status.size > 0 && (
            <Text style={styles.fileSize}>
              {formatFileSize(status.size)}
            </Text>
          )}
        </View>

        {status.downloading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {appLanguage === 'zh-CN' ? '下载中...' : 'Downloading...'}
            </Text>
            {Platform.OS === 'android' ? (
              <ProgressBarAndroid
                styleAttr="Horizontal"
                indeterminate={false}
                progress={status.progress / 100}
                color={colors.primary[500]}
              />
            ) : (
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${status.progress}%` }
                  ]} 
                />
              </View>
            )}
          </View>
        )}

        {status.error && (
          <Text style={styles.errorText}>{status.error}</Text>
        )}

        {!status.available && !status.downloading && (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => handleDownloadDictionary(languageCode)}
            disabled={loading}
          >
            <Ionicons name="download-outline" size={16} color={colors.background.secondary} />
            <Text style={styles.downloadButtonText}>
              {appLanguage === 'zh-CN' ? '下载离线词库' : 'Download Offline Dictionary'}
            </Text>
          </TouchableOpacity>
        )}

        {status.available && status.lastUpdated && (
          <Text style={styles.lastUpdatedText}>
            {appLanguage === 'zh-CN' 
              ? `最后更新: ${status.lastUpdated.toLocaleDateString()}`
              : `Last updated: ${status.lastUpdated.toLocaleDateString()}`
            }
          </Text>
        )}
      </View>
    );
  };

  if (selectedLanguages.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cloud-download-outline" size={20} color={colors.primary[500]} />
        <Text style={styles.title}>
          {appLanguage === 'zh-CN' ? '离线词库' : 'Offline Dictionaries'}
        </Text>
      </View>
      
      <Text style={styles.description}>
        {appLanguage === 'zh-CN' 
          ? '下载离线词库以获得更快的查询速度和离线使用体验'
          : 'Download offline dictionaries for faster queries and offline usage'
        }
      </Text>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <Text style={styles.loadingText}>
            {appLanguage === 'zh-CN' ? '加载中...' : 'Loading...'}
          </Text>
        </View>
      )}

      <View style={styles.dictionaryList}>
        {selectedLanguages
          .filter(lang => languageToDictionaryMap[lang])
          .map(renderDictionaryItem)
        }
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.secondary,
  },
  dictionaryList: {
    gap: 12,
  },
  dictionaryItem: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dictionaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dictionaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dictionaryName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginLeft: 8,
  },
  availableBadge: {
    backgroundColor: colors.success[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  availableText: {
    fontSize: 12,
    color: colors.success[600],
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  errorText: {
    fontSize: 12,
    color: colors.error[500],
    marginTop: 4,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  downloadButtonText: {
    color: colors.background.secondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
});

export default OfflineDictionarySection;
