import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { t } from '../../constants/translations';
import { wordService, RecentWord } from '../../services/wordService';
import { unifiedQueryService } from '../../services/unifiedQueryService';
import { SUPPORTED_LANGUAGES } from '../../constants/config';
import { CCEDICTProvider } from '../../services/localDictionary/providers/CCEDICTProvider';
import { API_BASE_URL } from '../../constants/config';

// 导入各个Section组件
import AmbiguousChoiceSection from './sections/AmbiguousChoiceSection';
import CandidateSection from './sections/CandidateSection';
import SearchResultSection from './sections/SearchResultSection';
import SuggestionSection from './sections/SuggestionSection';
import PinyinSuggestionSection from './sections/PinyinSuggestionSection';
import RecentWordsSection from './sections/RecentWordsSection';

interface SearchResultsContainerProps {
  // 搜索相关状态
  searchText: string;
  searchResult: any;
  searchSuggestions: string[];
  isLoading: boolean;
  
  // 候选词状态
  enToChCandidates: string[];
  enToChQuery: string;
  chToJaCandidates: string[];
  chToJaQuery: string;
  enToJaCandidates: string[];
  enToJaQuery: string;
  pinyinCandidates: string[];
  pinyinQuery: string;
  chToEnCandidates: string[];
  chToEnQuery: string;
  
  // 歧义选择状态
  ambiguousOptions: any[];
  showAmbiguousChoice: boolean;
  ambiguousInput: string;
  
  // 拼音建议状态
  pinyinSuggestions: Array<{
    id: string;
    chinese: string;
    english: string;
    pinyin: string;
    audioUrl?: string;
  }>;
  showPinyinSuggestions: boolean;
  
  // 历史记录状态
  recentWords: RecentWord[];
  isLoadingRecent: boolean;
  recentWordsPage: number;
  hasMoreRecentWords: boolean;
  isLoadingMoreRecent: boolean;
  
  // 缓存状态
  pinyinCache: Record<string, Array<{chinese: string, english: string}>>;
  
  // 语言配置
  appLanguage: string;
  selectedLanguage: string;
  
  // 回调函数
  onSearchResult: (result: any) => void;
  onClearSearchResult: () => void;
  onSetCandidates: (type: string, candidates: string[], query: string) => void;
  onClearCandidates: (type: string) => void;
  onSetAmbiguousChoice: (options: any[], input: string) => void;
  onClearAmbiguousChoice: () => void;
  onSetPinyinSuggestions: (suggestions: any[], show: boolean) => void;
  onPinyinSuggestionSelect: (suggestion: {
    id: string;
    chinese: string;
    english: string;
    pinyin: string;
    audioUrl?: string;
  }) => void;
  onRecentWordPress: (word: RecentWord) => void;
  onLoadMoreRecent: () => void;
  onClearHistory: () => void;
  onPlayAudio: (word: string) => void;
  onCollect: () => void;
}

const SearchResultsContainer: React.FC<SearchResultsContainerProps> = ({
  // 搜索相关状态
  searchText,
  searchResult,
  searchSuggestions,
  isLoading,
  
  // 候选词状态
  enToChCandidates,
  enToChQuery,
  chToJaCandidates,
  chToJaQuery,
  enToJaCandidates,
  enToJaQuery,
  pinyinCandidates,
  pinyinQuery,
  chToEnCandidates,
  chToEnQuery,
  
  // 歧义选择状态
  ambiguousOptions,
  showAmbiguousChoice,
  ambiguousInput,
  
  // 拼音建议状态
  pinyinSuggestions,
  showPinyinSuggestions,
  
  // 历史记录状态
  recentWords,
  isLoadingRecent,
  recentWordsPage,
  hasMoreRecentWords,
  isLoadingMoreRecent,
  
  // 缓存状态
  pinyinCache,
  
  // 语言配置
  appLanguage,
  selectedLanguage,
  
  // 回调函数
  onSearchResult,
  onClearSearchResult,
  onSetCandidates,
  onClearCandidates,
  onSetAmbiguousChoice,
  onClearAmbiguousChoice,
  onSetPinyinSuggestions,
  onPinyinSuggestionSelect,
  onRecentWordPress,
  onLoadMoreRecent,
  onClearHistory,
  onPlayAudio,
  onCollect,
}) => {
  // 处理歧义选择
  const handleAmbiguousChoice = async (option: { type: 'dictionary' | 'translation'; data: any }) => {
    onClearAmbiguousChoice();
    
    try {
      if (option.type === 'dictionary') {
        // 词典结果：转换为WordData格式
        if (option.data && option.data.length > 0) {
          const firstResult = option.data[0];
          const wordData = {
            word: firstResult.kanji || firstResult.reading,
            language: 'ja',
            phonetic: firstResult.reading,
            kana: firstResult.reading,
            definitions: firstResult.senses.map((sense: any) => ({
              partOfSpeech: sense.pos[0] || 'n.',
              definition: sense.glosses[0] || 'No definition available',
              examples: []
            }))
          };
          onSearchResult(wordData);
        }
      } else if (option.type === 'translation') {
        // 翻译结果：直接查询被选中的词
        console.log(`🔍 处理翻译类型的歧义选择:`, option.data);
        
        // 检查option.data是否已经包含完整的wordData信息
        if (option.data && option.data.correctedWord && option.data.definitions) {
          // option.data已经是完整的wordData，直接使用
          console.log(`✅ 使用完整的词卡数据: ${option.data.correctedWord}`);
          
          // 移除candidates字段，避免显示候选词按钮
          const { candidates, ...wordDataWithoutCandidates } = option.data;
          onSearchResult(wordDataWithoutCandidates);
          
          // 保存搜索历史记录
          try {
            const translationResult = option.data.correctedWord || option.data.translation || '';
            const pinyin = option.data.pinyin || option.data.phonetic || '';
            const englishDefinition = option.data.definitions?.[0]?.definition || '';
            
            console.log(`💾 保存歧义选择搜索历史: ${ambiguousInput} -> ${translationResult}`);
            await wordService.saveSearchHistory(ambiguousInput, translationResult, undefined, pinyin, englishDefinition);
          } catch (error) {
            console.error('保存歧义选择搜索历史失败:', error);
          }
        } else if (option.data && typeof option.data === 'string') {
          // option.data是一个词，需要查询详细信息
          console.log(`🔍 查询被选中的词: ${option.data}`);
          const safeAppLanguage = appLanguage || 'en-US';
          const result = await wordService.getChineseWordDetails(option.data, safeAppLanguage);
          
          if (result.success && result.data) {
            onSearchResult(result.data);
            
            // 保存搜索历史记录
            try {
              const translationResult = result.data.correctedWord || result.data.translation || '';
              const pinyin = result.data.pinyin || result.data.phonetic || '';
              const englishDefinition = result.data.definitions?.[0]?.definition || '';
              
              console.log(`💾 保存歧义选择搜索历史: ${ambiguousInput} -> ${translationResult}`);
              await wordService.saveSearchHistory(ambiguousInput, translationResult, undefined, pinyin, englishDefinition);
            } catch (error) {
              console.error('保存歧义选择搜索历史失败:', error);
            }
          } else {
            console.log('查询失败，无法获取词汇详情');
          }
        }
      }
    } catch (error) {
      console.error('处理歧义选择失败:', error);
    }
  };

  // 处理候选词选择
  const handleCandidateSelect = async (type: string, candidate: string, originalQuery: string) => {
    console.log(`用户选择了${type}候选词: ${candidate}`);
    
    try {
      // 根据类型处理不同的候选词选择
      switch (type) {
        case 'enToCh':
          // 英文到中文候选词选择
          const chineseResult = await wordService.getChineseWordDetails(candidate, appLanguage || 'en-US');
          if (chineseResult.success && chineseResult.data) {
            onSearchResult(chineseResult.data);
            onClearCandidates('enToCh');
          }
          break;
          
        case 'chToJa':
          // 中文到日语候选词选择
          const japaneseResult = await wordService.searchWord(candidate, 'ja', appLanguage || 'en-US');
          if (japaneseResult.success && japaneseResult.data) {
            onSearchResult(japaneseResult.data);
            onClearCandidates('chToJa');
          }
          break;
          
        case 'enToJa':
          // 英文到日语候选词选择
          const enToJaResult = await wordService.searchWord(candidate, 'ja', appLanguage || 'en-US');
          if (enToJaResult.success && enToJaResult.data) {
            onSearchResult(enToJaResult.data);
            onClearCandidates('enToJa');
          }
          break;
          
        case 'pinyin':
          // 拼音候选词选择
          const pinyinResult = await wordService.getChineseWordDetails(candidate, appLanguage || 'en-US');
          if (pinyinResult.success && pinyinResult.data) {
            onSearchResult(pinyinResult.data);
            onClearCandidates('pinyin');
          }
          break;
          
        case 'chToEn':
          // 中文到英文候选词选择
          const currentLanguageConfig = SUPPORTED_LANGUAGES[selectedLanguage as keyof typeof SUPPORTED_LANGUAGES];
          if (currentLanguageConfig) {
            const chToEnResult = await wordService.searchWord(candidate.toLowerCase(), currentLanguageConfig.code, appLanguage);
            if (chToEnResult.success && chToEnResult.data) {
              onSearchResult(chToEnResult.data);
              onClearCandidates('chToEn');
            }
          }
          break;
      }
    } catch (error) {
      console.error('处理候选词选择失败:', error);
    }
  };

  // 处理拼音建议选择 - 直接调用传入的回调函数
  const handlePinyinSuggestionSelect = async (suggestion: {
    id: string;
    chinese: string;
    english: string;
    pinyin: string;
    audioUrl?: string;
  }) => {
    console.log('🎯 SearchResultsContainer: 调用onPinyinSuggestionSelect');
    onPinyinSuggestionSelect(suggestion);
  };

  // 渲染逻辑：按优先级显示不同的内容

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#666' }}>
          {appLanguage === 'zh-CN' ? '正在查询...' : 'Searching...'}
        </Text>
      </View>
    );
  }

  if (showAmbiguousChoice) {
    return (
      <AmbiguousChoiceSection
        ambiguousInput={ambiguousInput}
        ambiguousOptions={ambiguousOptions}
        onAmbiguousChoice={handleAmbiguousChoice}
        isLoading={isLoading}
      />
    );
  }

  if (enToChCandidates.length > 0) {
    return (
      <CandidateSection
        type="enToCh"
        query={enToChQuery}
        candidates={enToChCandidates}
        onCandidateSelect={(candidate) => handleCandidateSelect('enToCh', candidate, enToChQuery)}
        onClose={() => onClearCandidates('enToCh')}
        isLoading={isLoading}
        appLanguage={appLanguage}
      />
    );
  }

  if (chToJaCandidates.length > 0) {
    return (
      <CandidateSection
        type="chToJa"
        query={chToJaQuery}
        candidates={chToJaCandidates}
        onCandidateSelect={(candidate) => handleCandidateSelect('chToJa', candidate, chToJaQuery)}
        onClose={() => onClearCandidates('chToJa')}
        isLoading={isLoading}
        appLanguage={appLanguage}
      />
    );
  }

  if (enToJaCandidates.length > 0) {
    return (
      <CandidateSection
        type="enToJa"
        query={enToJaQuery}
        candidates={enToJaCandidates}
        onCandidateSelect={(candidate) => handleCandidateSelect('enToJa', candidate, enToJaQuery)}
        onClose={() => onClearCandidates('enToJa')}
        isLoading={isLoading}
        appLanguage={appLanguage}
      />
    );
  }

  if (pinyinCandidates.length > 0) {
    return (
      <CandidateSection
        type="pinyin"
        query={pinyinQuery}
        candidates={pinyinCandidates}
        onCandidateSelect={(candidate) => handleCandidateSelect('pinyin', candidate, pinyinQuery)}
        onClose={() => onClearCandidates('pinyin')}
        isLoading={isLoading}
        appLanguage={appLanguage}
        pinyinCache={pinyinCache}
      />
    );
  }

  if (chToEnCandidates.length > 0) {
    return (
      <CandidateSection
        type="chToEn"
        query={chToEnQuery}
        candidates={chToEnCandidates}
        onCandidateSelect={(candidate) => handleCandidateSelect('chToEn', candidate, chToEnQuery)}
        onClose={() => onClearCandidates('chToEn')}
        isLoading={isLoading}
        appLanguage={appLanguage}
      />
    );
  }

  if (searchResult) {
    return (
      <SearchResultSection
        searchResult={searchResult}
        onIgnore={onClearSearchResult}
        onCollect={onCollect}
        onPlayAudio={onPlayAudio}
      />
    );
  }

  if (searchSuggestions.length > 0) {
    return (
      <SuggestionSection
        suggestions={searchSuggestions}
        onSuggestionSelect={(suggestion) => {
          // 处理搜索建议选择
          console.log('选择搜索建议:', suggestion);
        }}
        appLanguage={appLanguage}
      />
    );
  }

  if (showPinyinSuggestions && pinyinSuggestions.length > 0) {
    return (
      <PinyinSuggestionSection
        suggestions={pinyinSuggestions}
        onSuggestionSelect={handlePinyinSuggestionSelect}
        isLoading={isLoading}
      />
    );
  }

  // 如果有搜索文本但没有候选词，显示在线查询提示
  if (searchText && searchText.trim().length > 0 && !isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="search-outline" size={48} color="#007AFF" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8, textAlign: 'center' }}>
          {appLanguage === 'zh-CN' ? '未找到本地候选词' : 'No local candidates found'}
        </Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 }}>
          {appLanguage === 'zh-CN' ? '点击搜索按钮进行在线查询' : 'Tap the search button for online query'}
        </Text>
        <View style={{ 
          backgroundColor: '#007AFF', 
          paddingHorizontal: 16, 
          paddingVertical: 8, 
          borderRadius: 8,
          opacity: 0.8
        }}>
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
            {appLanguage === 'zh-CN' ? '点击搜索' : 'Tap to Search'}
          </Text>
        </View>
      </View>
    );
  }

  // 默认显示历史记录
  return (
    <RecentWordsSection
      recentWords={recentWords}
      isLoadingRecent={isLoadingRecent}
      hasMoreRecentWords={hasMoreRecentWords}
      isLoadingMoreRecent={isLoadingMoreRecent}
      onRecentWordPress={onRecentWordPress}
      onLoadMoreRecent={onLoadMoreRecent}
      onClearHistory={onClearHistory}
      appLanguage={appLanguage}
    />
  );
};

export default SearchResultsContainer;
