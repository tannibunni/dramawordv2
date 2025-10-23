import React from 'react';
import { View } from 'react-native';
import WordCard from '../../cards/WordCard';
import SentenceCollectButton from '../../buttons/SentenceCollectButton';

interface SearchResultSectionProps {
  searchResult: any;
  onIgnore: () => void;
  onCollect: () => void;
  onPlayAudio: (word: string) => void;
}

const SearchResultSection: React.FC<SearchResultSectionProps> = ({
  searchResult,
  onIgnore,
  onCollect,
  onPlayAudio,
}) => {
  // 判断是否是句子（包含空格或标点符号）
  const isSentence = searchResult?.word && (
    searchResult.word.includes(' ') || 
    searchResult.word.includes('.') || 
    searchResult.word.includes('!') || 
    searchResult.word.includes('?')
  );

  return (
    <View style={styles.wordCardWrapper}>
      <WordCard
        wordData={searchResult}
        onIgnore={onIgnore}
        onCollect={onCollect}
        onPlayAudio={onPlayAudio}
      />
      
      {/* 如果是句子，显示句子收藏按钮 */}
      {isSentence && (
        <View style={styles.sentenceCollectContainer}>
          <SentenceCollectButton
            wordData={searchResult}
            style={styles.sentenceCollectButton}
            showText={true}
          />
        </View>
      )}
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
  sentenceCollectContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sentenceCollectButton: {
    alignSelf: 'center' as const,
  },
};

export default SearchResultSection;
