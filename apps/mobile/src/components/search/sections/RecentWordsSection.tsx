import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { t } from '../../../constants/translations';
import { RecentWord } from '../../../services/wordService';

interface RecentWordsSectionProps {
  recentWords: RecentWord[];
  isLoadingRecent: boolean;
  hasMoreRecentWords: boolean;
  isLoadingMoreRecent: boolean;
  onRecentWordPress: (word: RecentWord) => void;
  onLoadMoreRecent: () => void;
  onClearHistory: () => void;
  appLanguage: string;
}

const RecentWordsSection: React.FC<RecentWordsSectionProps> = ({
  recentWords,
  isLoadingRecent,
  hasMoreRecentWords,
  isLoadingMoreRecent,
  onRecentWordPress,
  onLoadMoreRecent,
  onClearHistory,
  appLanguage,
}) => {
  return (
    <ScrollView style={styles.recentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>{t('recent_searches', appLanguage)}</Text>
          {recentWords.length > 0 && (
            <TouchableOpacity 
              style={styles.clearHistoryButton}
              onPress={onClearHistory}
            >
              <Ionicons name="trash-outline" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.wordsContainer}>
          {isLoadingRecent ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>{t('loading', appLanguage)}</Text>
            </View>
          ) : recentWords.length > 0 ? (
            recentWords.map((word) => (
              <TouchableOpacity
                key={word.id}
                style={styles.recentWordItem}
                onPress={() => onRecentWordPress(word)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="time-outline" size={18} color={colors.neutral[400]} style={{ marginRight: 8 }} />
                  <Text style={styles.recentWordText} numberOfLines={1} ellipsizeMode="tail">
                    <Text style={{ fontWeight: 'bold', color: colors.text.primary }}>
                      {String(word.translation || word.word)}
                    </Text>
                    {word.pinyin && (
                      <Text style={{ fontWeight: 'normal', color: colors.text.secondary }}>
                        {' - '}{String(word.pinyin)}
                      </Text>
                    )}
                    {word.englishDefinition && (
                      <Text style={{ fontWeight: 'normal', color: colors.text.tertiary }}>
                        {' - '}{String(word.englishDefinition)}
                      </Text>
                    )}
                    {!word.pinyin && !word.englishDefinition && word.word !== word.translation && (
                      <Text style={{ fontWeight: 'normal', color: colors.text.secondary }}>
                        {' - '}{String(word.word)}
                      </Text>
                    )}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyStateText}>{t('no_recent_searches', appLanguage)}</Text>
            </View>
          )}
          
          {/* Load More 按钮 */}
          {recentWords.length > 0 && hasMoreRecentWords && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={onLoadMoreRecent}
              disabled={isLoadingMoreRecent}
            >
              {isLoadingMoreRecent ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : (
                <Text style={styles.loadMoreText}>
                  {appLanguage === 'zh-CN' ? '加载更多' : 'Load More'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = {
  recentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  recentHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  clearHistoryButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
  },
  recentSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: 16,
  },
  wordsContainer: {
    gap: 12,
  },
  loadingContainer: {
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.tertiary,
    marginTop: 16,
  },
  recentWordItem: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 2,
  },
  recentWordText: {
    fontSize: 17,
    color: colors.text.primary,
    marginBottom: 0,
    flex: 1,
  },
  loadMoreButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  loadMoreText: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '500' as const,
  },
};

export default RecentWordsSection;
